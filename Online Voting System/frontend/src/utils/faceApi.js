/**
 * Face-api.js wrapper: load models and extract 128-d face descriptor for verification.
 * Uses dynamic import so the app loads even if face-api.js has resolution issues.
 * Models from main face-api.js repo weights (jsdelivr; face-api.js-models CDN can return 403).
 */

const MODEL_BASE = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

let modelsLoaded = false;
let faceapiModule = null;

async function getFaceApi() {
  if (faceapiModule) return faceapiModule;
  try {
    const m = await import('face-api.js');
    faceapiModule = m.default || m;
    return faceapiModule;
  } catch (e) {
    throw new Error('Face verification library could not be loaded. Please refresh the page or try again.');
  }
}

export async function loadFaceModels() {
  if (modelsLoaded) return;
  const faceapi = await getFaceApi();
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE),
  ]);
  modelsLoaded = true;
}

/**
 * Wait for video to have a displayable frame (needed for reliable detection).
 * @param {HTMLVideoElement} video
 * @param {number} maxWaitMs
 */
function waitForVideoFrame(video, maxWaitMs = 1000) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      resolve();
      return;
    }
    const start = Date.now();
    const onLoadedData = () => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('error', onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('error', onError);
      reject(new Error('Video not ready'));
    };
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('error', onError);
    const t = setInterval(() => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        clearInterval(t);
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        resolve();
      } else if (Date.now() - start > maxWaitMs) {
        clearInterval(t);
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        resolve(); // continue anyway
      }
    }, 100);
  });
}

/**
 * Run detection on a single source; returns descriptor array or null.
 * @param {*} faceapi - loaded face-api module
 * @param {HTMLCanvasElement|HTMLImageElement} source - image or canvas (not video)
 * @returns {Promise<number[]|null>}
 */
async function detectOnce(faceapi, source) {
  // STRICTER face detection settings for better accuracy
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5, // Increased from 0.15 to 0.5 for stricter detection
  });
  const detection = await faceapi
    .detectSingleFace(source, options)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  
  // Additional validation: ensure detection confidence is high
  if (detection.detection && detection.detection.score < 0.7) {
    console.log('Face detection confidence too low:', detection.detection.score);
    return null;
  }
  
  return Array.from(detection.descriptor);
}

/**
 * Capture current video frame to a canvas (waits for a stable frame).
 * @param {HTMLVideoElement} video
 * @returns {Promise<HTMLCanvasElement>}
 */
function videoToCanvas(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  return canvas;
}

/**
 * Detect a single face and return 128-d descriptor array, or null if no face / error.
 * For video: waits for a frame, optionally retries to handle flaky frames.
 * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} input
 * @param {{ retries?: number }} opts - retries for video (default 3)
 * @returns {Promise<number[]|null>}
 */
export async function getFaceDescriptor(input, opts = {}) {
  const faceapi = await getFaceApi();
  await loadFaceModels();

  const retries = input instanceof HTMLVideoElement ? (opts.retries ?? 3) : 1;

  for (let attempt = 0; attempt < retries; attempt++) {
    let source = input;
    if (input instanceof HTMLVideoElement) {
      await waitForVideoFrame(input);
      // Request a fresh frame: rAF twice then optional requestVideoFrameCallback
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      if (typeof input.requestVideoFrameCallback === 'function') {
        await new Promise((resolve) => {
          input.requestVideoFrameCallback(() => resolve());
        });
      }
      source = videoToCanvas(input);
    }

    const descriptor = await detectOnce(faceapi, source);
    if (descriptor) return descriptor;
    // Brief pause before retry so next frame is different
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return null;
}
