import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFaceDescriptor, loadFaceModels } from '../utils/faceApi';

/** Capture current video frame as base64 JPEG (resized/compressed to stay under ~400KB). */
function captureFrameAsDataUrl(video, maxWidth = 400, quality = 0.6) {
  const canvas = document.createElement('canvas');
  let { videoWidth: w, videoHeight: h } = video;
  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w);
    w = maxWidth;
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 400000 && quality > 0.2) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
}

/**
 * SelfieCapture: shows video stream, capture button, runs face-api to get descriptor.
 * onCapture({ descriptor, selfie_image }) when a face is detected; onError(message).
 */
export default function SelfieCapture({ onCapture, onError, title = 'Capture your face', buttonLabel = 'Capture selfie', requireAuth = true }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const { user, loading: authLoading } = useAuth();

  // Check if user is authenticated (when required)
  const isUserAuthenticated = !requireAuth || (!authLoading && user);
  const shouldShowAuthError = requireAuth && !authLoading && !user;

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Wait for auth to load if required
      if (requireAuth && authLoading) {
        return;
      }
      
      // Check authentication
      if (shouldShowAuthError) {
        setCameraError('Authentication required for face capture.');
        onError?.('Authentication required for face capture.');
        setLoading(false);
        return;
      }

      try {
        // Preload face models in parallel with camera so detection is ready when user clicks
        loadFaceModels().catch(() => {});
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraError(null);
      } catch (e) {
        setCameraError('Camera access denied or not available.');
        onError?.('Camera access denied or not available.');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [requireAuth, authLoading, shouldShowAuthError]);

  const handleCapture = async () => {
    if (!videoRef.current || !streamRef.current) return;
    
    // Additional authentication check before capture
    if (!isUserAuthenticated) {
      onError?.('Authentication required for face capture.');
      return;
    }
    
    setCapturing(true);
    onError?.(null);
    try {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        onError?.('Camera frame not ready. Wait a moment and try again.');
        return;
      }
      // Give the video more time to produce a stable, high-quality frame
      await new Promise((r) => setTimeout(r, 800));
      if (!videoRef.current) return;
      
      // Try multiple captures and use the most consistent one
      let bestDescriptor = null;
      let captureAttempts = 0;
      const maxAttempts = 3;
      
      while (captureAttempts < maxAttempts && !bestDescriptor) {
        await new Promise((r) => setTimeout(r, 300)); // Wait between attempts
        if (!videoRef.current) break;
        
        const descriptor = await getFaceDescriptor(videoRef.current, { retries: 2 });
        if (descriptor && Array.isArray(descriptor) && descriptor.length === 128) {
          // Validate descriptor quality
          const hasValidNumbers = descriptor.every(val => typeof val === 'number' && !isNaN(val) && isFinite(val));
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
        onError?.('Face detection failed. Please ensure: 1) Good lighting, 2) Face is clearly visible, 3) Look directly at camera, 4) Remove glasses/masks if possible.');
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
        <br /><small style={{ color: 'var(--accent)', fontWeight: 500 }}>🔒 This verifies your identity as a registered voter</small>
      </p>
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, marginBottom: '0.75rem', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width="100%"
          height="auto"
          style={{ display: 'block' }}
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
