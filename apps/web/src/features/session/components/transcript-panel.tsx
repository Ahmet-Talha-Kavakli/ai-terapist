'use client';

import { useSessionStore } from '../session.store';

export function TranscriptPanel() {
  const conversationHistory = useSessionStore((s) => s.conversationHistory);
  const aiResponseChunks = useSessionStore((s) => s.aiResponseChunks);
  const transcript = useSessionStore((s) => s.transcript);

  const streamingText = aiResponseChunks.join('');

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-4">
      {conversationHistory.map((entry, i) => (
        <div
          key={i}
          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
            entry.role === 'user'
              ? 'self-end bg-blue-600 text-white'
              : 'self-start bg-gray-700 text-gray-100'
          }`}
        >
          {entry.content}
        </div>
      ))}

      {/* Live user transcript */}
      {transcript && (
        <div className="max-w-[80%] self-end rounded-2xl bg-blue-700/50 px-4 py-2 text-sm italic text-blue-200">
          {transcript}
        </div>
      )}

      {/* Streaming AI response */}
      {streamingText && (
        <div className="max-w-[80%] self-start rounded-2xl bg-gray-700/50 px-4 py-2 text-sm text-gray-300">
          {streamingText}
          <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-gray-400" />
        </div>
      )}
    </div>
  );
}
