import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFaceDescriptor, loadFaceModels } from '../utils/faceApi';

/** Capture current video frame as base64 JPEG (resized/compressed to stay under ~400KB). */
function captureFrameAsDataUrl(video, maxWidth = 400, quality = 0.6) {
  const canvas = document.createElement('canvas');
  let { videoWidth: w, videoHeight: h } = video;

  if (!w || !h) {
    throw new Error('Camera frame not available.');
  }

  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w);
    w = maxWidth;
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);

  let currentQuality = quality;
  let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

  while (dataUrl.length > 400000 && currentQuality > 0.2) {
    currentQuality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
  }

  return dataUrl;
}

/** Wait until the video element has a real frame available. */
function waitForVideoReady(video, maxWaitMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      if (
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        resolve();
        return;
      }

      if (Date.now() - start > maxWaitMs) {
        reject(new Error('Camera frame not ready. Wait a moment and try again.'));
        return;
      }

      setTimeout(check, 200);
    };

    check();
  });
}

/**
 * SelfieCapture: shows video stream, capture button, runs face-api to get descriptor.
 * onCapture({ descriptor, selfie_image }) when a face is detected; onError(message).
 */
export default function SelfieCapture({
  onCapture,
  onError,
  title = 'Capture your face',
  buttonLabel = 'Capture selfie',
  requireAuth = true,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const { user, loading: authLoading } = useAuth();

  const isUserAuthenticated = !requireAuth || (!authLoading && user);
  const shouldShowAuthError = requireAuth && !authLoading && !user;

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (requireAuth && authLoading) {
        return;
      }

      if (shouldShowAuthError) {
        const msg = 'Authentication required for face capture.';
        setCameraError(msg);
        onError?.(msg);
        setLoading(false);
        return;
      }

      try {
        loadFaceModels().catch(() => {});

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;
          video.autoplay = true;

          await video.play();
          await waitForVideoReady(video);

          console.log('Camera ready:', video.videoWidth, video.videoHeight);
        }

        setCameraError(null);
      } catch (e) {
        console.error('Camera start error:', e);

        let msg = 'Camera access denied or not available.';
        if (e?.name === 'NotAllowedError') {
          msg = 'Camera permission denied. Please allow camera access and refresh.';
        } else if (e?.name === 'NotFoundError') {
          msg = 'No camera found on this device.';
        } else if (e?.name === 'NotReadableError') {
          msg = 'Camera is being used by another application.';
        } else if (e?.message) {
          msg = e.message;
        }

        setCameraError(msg);
        onError?.(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [requireAuth, authLoading, shouldShowAuthError, onError]);

  const handleCapture = async () => {
    if (!videoRef.current || !streamRef.current) return;

    if (!isUserAuthenticated) {
      onError?.('Authentication required for face capture.');
      return;
    }

    setCapturing(true);
    onError?.(null);

    try {
      const video = videoRef.current;

      await waitForVideoReady(video, 4000);
      await new Promise((r) => setTimeout(r, 800));

      let bestDescriptor = null;
      let captureAttempts = 0;
      const maxAttempts = 3;

      while (captureAttempts < maxAttempts && !bestDescriptor) {
        await new Promise((r) => setTimeout(r, 300));
        if (!videoRef.current) break;

        const descriptor = await getFaceDescriptor(videoRef.current, { retries: 2 });

        if (descriptor && Array.isArray(descriptor) && descriptor.length === 128) {
          const hasValidNumbers = descriptor.every(
            (val) => typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)
          );

          if (hasValidNumbers) {
            bestDescriptor = descriptor;
            break;
          }
        }

        captureAttempts++;
      }

      if (bestDescriptor) {
        const selfie_image = captureFrameAsDataUrl(videoRef.current);
        onCapture({ descriptor: bestDescriptor, selfie_image });
      } else {
        onError?.(
          'Face detection failed. Please ensure: 1) Good lighting, 2) Face is clearly visible, 3) Look directly at camera, 4) Remove glasses/masks if possible.'
        );
      }
    } catch (e) {
      onError?.(e.message || 'Face detection failed. Try again.');
    } finally {
      setCapturing(false);
    }
  };

  if (loading || (requireAuth && authLoading)) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading...</p>;
  }

  if (shouldShowAuthError || cameraError) {
    return (
      <div className="alert alert-error">
        {shouldShowAuthError ? 'Authentication required for face capture.' : cameraError} Please refresh and try again.
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
        Look at the camera. Ensure good lighting and a clear view of your face.
        <br />
        <small style={{ color: 'var(--accent)', fontWeight: 500 }}>
          🔒 This verifies your identity as a registered voter
        </small>
      </p>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          marginBottom: '0.75rem',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            display: 'block',
            width: '100%',
            minHeight: '300px',
            objectFit: 'cover',
            backgroundColor: '#000',
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={handleCapture}
        disabled={capturing}
      >
        {capturing ? 'Detecting face...' : buttonLabel}
      </button>
    </div>
  );
}