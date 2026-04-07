'use client';

import { useCallback, useEffect, useRef } from 'react';

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: 'user',
  width:  { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 15, max: 30 },
};

export interface CameraControls {
  videoRef:    React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera:  () => void;
  isReady:     () => boolean;
}

/**
 * Manages webcam access.
 *
 * - `startCamera()` requests getUserMedia and attaches the stream to videoRef.
 * - `stopCamera()` stops all tracks and nulls the stream.
 * - Auto-stops on unmount (no stream leak).
 * - Returns `isReady()` — true when video is playing and has valid dimensions.
 *   MediaPipe requires video to be playing before calling detectForVideo.
 */
export function useCamera(): CameraControls {
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // Don't start if already running
    if (streamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Let autoplay handle it — but trigger manually as a fallback
        videoRef.current.play().catch(() => {
          // Browser may require user gesture — handled gracefully
        });
      }
    } catch (err) {
      console.warn('[useCamera] getUserMedia failed:', err);
      stopCamera();
    }
  }, [stopCamera]);

  const isReady = useCallback((): boolean => {
    const v = videoRef.current;
    if (!v || !streamRef.current) return false;
    return v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
           !v.paused &&
           v.videoWidth > 0;
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { videoRef, startCamera, stopCamera, isReady };
}
