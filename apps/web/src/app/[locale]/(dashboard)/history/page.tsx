import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SessionList } from '@/features/session/components/session-list';

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

interface HistoryResponse {
  sessions: SessionSummary[];
  total:    number;
}

async function fetchHistory(userId: string, page: number): Promise<HistoryResponse> {
  try {
    const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';
    const res = await fetch(
      `${apiUrl}/session/history?page=${page}&perPage=20`,
      {
        headers: { 'x-clerk-user-id': userId },
        cache: 'no-store',
      },
    );
    if (!res.ok) return { sessions: [], total: 0 };
    return res.json() as Promise<HistoryResponse>;
  } catch {
    return { sessions: [], total: 0 };
  }
}

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params:       Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { locale }     = await params;
  const { page = '1' } = await searchParams;
  const prefix         = locale === 'tr' ? '/tr' : '';
  const currentPage    = Math.max(1, parseInt(page, 10) || 1);

  const { sessions, total } = await fetchHistory(userId, currentPage);
  const totalPages = Math.ceil(total / 20);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-white">Session History</h1>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <p className="text-gray-400">No sessions yet.</p>
          <p className="mt-2 text-sm text-gray-600">
            Your completed sessions will appear here after your first session.
          </p>
        </div>
      ) : (
        <>
          <SessionList sessions={sessions} />

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {currentPage > 1 && (
                <a
                  href={`${prefix}/history?page=${currentPage - 1}`}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10"
                >
                  Previous
                </a>
              )}
              <span className="text-sm text-gray-500">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <a
                  href={`${prefix}/history?page=${currentPage + 1}`}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
