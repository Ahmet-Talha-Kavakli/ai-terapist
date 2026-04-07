'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSessionStore } from '../session.store';
import { useLiveKit } from '../hooks/use-livekit';
import { useCrisisDetector } from '../hooks/use-crisis-detector';
import { SessionHeader } from './session-header';
import { TranscriptPanel } from './transcript-panel';
import { SessionControls } from './session-controls';
import { CrisisOverlay } from './crisis-overlay';
import { UserCamera } from '@/features/vision/components/user-camera';

/**
 * AvatarCanvas uses WebGL (Canvas API) — must be loaded client-side only.
 * The loading div is the same dark background so there's no layout shift.
 */
const AvatarCanvas = dynamic(
  () => import('@/features/avatar').then((m) => ({ default: m.AvatarCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    ),
  },
);

interface SessionViewProps {
  roomName: string;
}

export function SessionView({ roomName }: SessionViewProps) {
  const phase            = useSessionStore((s) => s.phase);
  const lastCrisisScore  = useSessionStore((s) => s.lastCrisisScore);
  const { connect, disconnect } = useLiveKit();

  useCrisisDetector({ crisisScore: lastCrisisScore });

  useEffect(() => {
    connect(roomName);
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      {/* Crisis overlay — renders on top of everything when activated */}
      <CrisisOverlay />

      <SessionHeader />

      <main className="flex flex-1 overflow-hidden">
        {/* Left: 3D Avatar */}
        <section className="relative flex flex-1 bg-gray-900">
          {phase === 'connecting' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="mt-3 text-sm text-gray-400">Connecting to session…</p>
            </div>
          )}

          {phase === 'ended' ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
              <p className="text-lg text-gray-300">Session ended</p>
              <a
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Back to Dashboard
              </a>
            </div>
          ) : (
            <>
              {/* AvatarCanvas fills the entire left panel — renders even while
                  connecting so the 3D scene is already warm when active */}
              <AvatarCanvas />

              {/* Webcam overlay — MediaPipe analysis + live feed */}
              <UserCamera />
            </>
          )}
        </section>

        {/* Right: Conversation transcript */}
        <aside className="flex w-96 flex-col border-l border-gray-800 bg-gray-950">
          <div className="border-b border-gray-800 px-4 py-3">
            <h2 className="text-sm font-medium text-gray-400">Conversation</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <TranscriptPanel />
          </div>
        </aside>
      </main>

      {phase === 'active' && (
        <footer className="border-t border-gray-800 bg-gray-900 px-6 py-4">
          <SessionControls onEnd={disconnect} />
        </footer>
      )}
    </div>
  );
}
