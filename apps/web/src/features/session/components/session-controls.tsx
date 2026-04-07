'use client';

import { useState } from 'react';

interface SessionControlsProps {
  muted:         boolean;
  onMuteToggle:  () => void;
  onEnd:         () => void;
}

const MicIcon = ({ muted }: { muted: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
  >
    {muted ? (
      <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM12 4a3 3 0 0 0-3 3v3.659l4.341 4.341A3 3 0 0 0 12 4ZM9 14.341V15a3 3 0 1 0 6 0v-.341L9 14.341ZM5.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75Zm2.25 4.604v.146a5.25 5.25 0 0 0 10.44.75H18a.75.75 0 0 1 0-1.5h.25a.75.75 0 0 1 .75.75 6.75 6.75 0 0 1-13.5 0 .75.75 0 0 1 .75-.75H6a.75.75 0 0 1 0 1.5h-.5Z" />
    ) : (
      <>
        <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
        <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
      </>
    )}
  </svg>
);

export function SessionControls({ muted, onMuteToggle, onEnd }: SessionControlsProps) {
  const [ending, setEnding] = useState(false);

  const handleEnd = () => {
    if (ending) return;
    setEnding(true);
    onEnd();
  };

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Mic toggle */}
      <button
        type="button"
        onClick={onMuteToggle}
        aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
          muted
            ? 'bg-red-600 text-white hover:bg-red-500'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        <MicIcon muted={muted} />
      </button>

      {/* End session */}
      <button
        type="button"
        onClick={handleEnd}
        disabled={ending}
        className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
      >
        {ending ? 'Ending…' : 'End Session'}
      </button>
    </div>
  );
}
