import { useEffect, useState } from 'react';
import { Trash2, ExternalLink, Clock, AlertCircle, Inbox } from 'lucide-react';
import { supabase, Scrape } from '../lib/supabase';
import { ContentTypeBadge } from '../components/Badge';

interface HistoryScreenProps {
  onViewDetail: (scrape: Scrape) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryScreen({ onViewDetail }: HistoryScreenProps) {
  const [scrapes, setScrapes] = useState<Scrape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    setError('');
    const { data, error: dbErr } = await supabase
      .from('scrapes')
      .select('*')
      .order('scraped_at', { ascending: false });

    if (dbErr) {
      setError(dbErr.message);
    } else {
      setScrapes(data ?? []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    const { error: dbErr } = await supabase.from('scrapes').delete().eq('id', id);
    if (!dbErr) {
      setScrapes(prev => prev.filter(s => s.id !== id));
    }
    setDeletingId(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Scrape History</h1>
          <p className="text-slate-500 text-sm mt-0.5">{scrapes.length} saved result{scrapes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-50 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-50 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && scrapes.length === 0 && !error && (
        <div className="text-center py-20 text-slate-400">
          <Inbox size={36} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No saved scrapes yet</p>
          <p className="text-xs mt-1">Scrape a website and save the results to see them here.</p>
        </div>
      )}

      {!loading && scrapes.length > 0 && (
        <div className="space-y-3">
          {scrapes.map(scrape => (
            <button
              key={scrape.id}
              onClick={() => onViewDetail(scrape)}
              className="w-full text-left bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {scrape.page_title || 'Untitled Page'}
                    </h3>
                    <ContentTypeBadge type={scrape.content_type} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                    <ExternalLink size={11} />
                    <span className="truncate">{scrape.url}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {scrape.ai_summary}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                    <Clock size={11} />
                    {formatDate(scrape.scraped_at)}
                  </div>
                </div>
                <button
                  onClick={e => handleDelete(scrape.id, e)}
                  disabled={deletingId === scrape.id}
                  className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
