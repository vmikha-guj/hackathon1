import { useState } from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ScrapeResult, ScrapeResultData } from '../components/ScrapeResult';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function HomeScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScrapeResultData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setSaved(false);

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a URL.');
      return;
    }

    const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    if (!isValidUrl(normalized)) {
      setError('Please enter a valid URL (e.g. https://example.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ url: normalized }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Scraping failed. Please try again.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const { error: dbErr } = await supabase.from('scrapes').insert({
        url: result.url,
        page_title: result.page_title,
        raw_headings: result.raw_headings,
        ai_summary: result.ai_summary,
        key_topics: result.key_topics,
        content_type: result.content_type,
        tone: result.tone,
      });
      if (dbErr) throw dbErr;
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight mb-3">
          Instant Website Intelligence
        </h1>
        <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
          Paste any URL and get an AI-powered breakdown of content, topics, and tone in seconds.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleScrape} className="mb-8">
        <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm focus-within:border-blue-400 focus-within:shadow-md transition-all">
          <div className="flex items-center pl-3 text-slate-400 flex-shrink-0">
            <Search size={17} />
          </div>
          <input
            type="text"
            value={url}
            onChange={e => { setUrl(e.target.value); setError(''); }}
            placeholder="https://example.com"
            className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm outline-none py-2 px-2"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60 flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Scraping...
              </>
            ) : (
              'Scrape'
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 mt-3 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </form>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="h-5 bg-slate-100 rounded w-2/3 mb-2" />
            <div className="h-4 bg-slate-50 rounded w-1/3" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="h-4 bg-slate-100 rounded w-1/4 mb-3" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-50 rounded w-full" />
              <div className="h-3 bg-slate-50 rounded w-5/6" />
              <div className="h-3 bg-slate-50 rounded w-4/5" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 h-40" />
            <div className="bg-white rounded-xl border border-slate-200 p-5 h-40" />
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <ScrapeResult
          data={result}
          onSave={handleSave}
          saving={saving}
          saved={saved}
        />
      )}
    </div>
  );
}
