'use client';

import { useEffect, useRef } from 'react';
import { useSessionStore } from '../../session/session.store';
import { useCamera } from '../hooks/use-camera';
import { useMediaPipe } from '../hooks/use-mediapipe';
import { useVisionCapture } from '../hooks/use-vision-capture';

/**
 * Webcam capture component for real-time face/emotion analysis.
 *
 * Renders a small, pip-style video preview in the bottom-left of the avatar
 * panel so the user can see their own camera feed (reassurance + consent UX).
 *
 * The <video> element is intentionally visible — hidden video elements may be
 * blocked by some browsers as a privacy measure. Keeping it visible also
 * acts as a live indicator that analysis is running.
 *
 * Camera starts when session goes active, stops when session ends.
 * MediaPipe runs inside useMediaPipe — this component just provides the
 * video ref and camera lifecycle.
 */
export function UserCamera() {
  const phase = useSessionStore((s) => s.phase);
  const camera = useCamera();
  const { videoRef, startCamera, stopCamera } = camera;

  // Track whether camera is currently active to avoid double-start
  const cameraActiveRef = useRef(false);

  useEffect(() => {
    if (phase === 'active' && !cameraActiveRef.current) {
      cameraActiveRef.current = true;
      startCamera();
    }

    if (phase === 'ended' && cameraActiveRef.current) {
      cameraActiveRef.current = false;
      stopCamera();
    }
  }, [phase, startCamera, stopCamera]);

  // MediaPipe detection loop — driven by the same videoRef
  useMediaPipe(camera);

  // GPT-4o Vision periodic capture (every 30 s)
  useVisionCapture(videoRef);

  // Don't render the preview before the session is active
  if (phase === 'idle') return null;

  return (
    <div
      className="absolute bottom-4 left-4 z-10 overflow-hidden rounded-lg border border-gray-700 shadow-lg"
      aria-label="Your camera feed (used for emotion analysis)"
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-24 w-32 object-cover"
        style={{ transform: 'scaleX(-1)' }} // mirror — more natural for user
      />

      {/* Status indicator */}
      {phase === 'active' && (
        <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
          <span className="text-xs text-gray-300">Live</span>
        </div>
      )}
    </div>
  );
}
