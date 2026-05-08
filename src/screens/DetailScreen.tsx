import { ArrowLeft, Clock, ExternalLink } from 'lucide-react';
import { Scrape } from '../lib/supabase';
import { ScrapeResult } from '../components/ScrapeResult';

interface DetailScreenProps {
  scrape: Scrape;
  onBack: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DetailScreen({ scrape, onBack }: DetailScreenProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to History
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
        <Clock size={12} />
        <span>Scraped on {formatDate(scrape.scraped_at)}</span>
        <span className="text-slate-200">·</span>
        <a
          href={scrape.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-blue-500 transition-colors"
        >
          <ExternalLink size={11} />
          Open original
        </a>
      </div>

      <ScrapeResult
        data={{
          url: scrape.url,
          page_title: scrape.page_title,
          raw_headings: scrape.raw_headings,
          ai_summary: scrape.ai_summary,
          key_topics: scrape.key_topics,
          content_type: scrape.content_type,
          tone: scrape.tone,
        }}
      />
    </div>
  );
}
