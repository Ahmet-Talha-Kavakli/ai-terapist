'use client';

import { useSessionStore } from '../session.store';

const PHASE_LABELS: Record<string, string> = {
  idle: 'Ready',
  connecting: 'Connecting…',
  active: 'Session Active',
  ended: 'Session Ended',
};

const PHASE_COLORS: Record<string, string> = {
  idle: 'bg-gray-500',
  connecting: 'bg-yellow-500 animate-pulse',
  active: 'bg-green-500',
  ended: 'bg-red-500',
};

export function SessionHeader() {
  const phase = useSessionStore((s) => s.phase);
  const sessionId = useSessionStore((s) => s.sessionId);

  return (
    <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-3">
      <a href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white">
        ← Dashboard
      </a>

      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${PHASE_COLORS[phase] ?? 'bg-gray-500'}`} />
        <span className="text-sm text-gray-300">{PHASE_LABELS[phase] ?? phase}</span>
      </div>

      {sessionId && (
        <span className="font-mono text-xs text-gray-600">
          {sessionId.slice(0, 8)}
        </span>
      )}
    </header>
  );
}
