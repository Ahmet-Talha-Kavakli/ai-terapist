'use client';

import { useState } from 'react';

interface SoapNotes {
  subjective?: string;
  objective?:  string;
  assessment?: string;
  plan?:       string;
}

interface SessionSummary {
  id:              string;
  startedAt:       string;
  endedAt:         string | null;
  durationSeconds: number | null;
  summary:         string | null;
  soapNotes:       SoapNotes | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  });
}

function SoapSection({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-400">
        {label}
      </h4>
      <p className="text-sm leading-relaxed text-gray-300">{text}</p>
    </div>
  );
}

function SessionCard({ session }: { session: SessionSummary }) {
  const [open, setOpen] = useState(false);
  const hasSoap = session.soapNotes && Object.values(session.soapNotes).some(Boolean);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] transition-all hover:border-white/10">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
      >
        <div>
          <p className="text-sm font-medium text-white">{formatDate(session.startedAt)}</p>
          {session.summary && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{session.summary}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <span className="text-sm text-gray-600">{formatDuration(session.durationSeconds)}</span>
          {hasSoap && (
            <span className="text-xs text-gray-500">{open ? '▲ Hide notes' : '▼ Show notes'}</span>
          )}
        </div>
      </button>

      {/* SOAP notes drawer */}
      {open && hasSoap && (
        <div className="border-t border-white/5 px-6 pb-6 pt-5 grid gap-4">
          <SoapSection label="Subjective"  text={session.soapNotes?.subjective} />
          <SoapSection label="Objective"   text={session.soapNotes?.objective} />
          <SoapSection label="Assessment"  text={session.soapNotes?.assessment} />
          <SoapSection label="Plan"        text={session.soapNotes?.plan} />
        </div>
      )}
    </div>
  );
}

export function SessionList({ sessions }: { sessions: SessionSummary[] }) {
  return (
    <div className="flex flex-col gap-3">
      {sessions.map((s) => (
        <SessionCard key={s.id} session={s} />
      ))}
    </div>
  );
}
