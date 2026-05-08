import { BookOpen, Tag, Heading, Sparkles, Volume2 } from 'lucide-react';
import { ContentTypeBadge, ToneBadge } from './Badge';

export interface ScrapeResultData {
  url: string;
  page_title: string;
  raw_headings: string[];
  ai_summary: string;
  key_topics: string[];
  content_type: string;
  tone: string;
}

interface ScrapeResultProps {
  data: ScrapeResultData;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
}

export function ScrapeResult({ data, onSave, saving, saved }: ScrapeResultProps) {
  return (
    <div className="space-y-4">
      {/* Title + meta */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-800 leading-snug">
              {data.page_title || 'Untitled Page'}
            </h2>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-700 truncate block mt-0.5 transition-colors"
            >
              {data.url}
            </a>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ContentTypeBadge type={data.content_type} />
            <ToneBadge tone={data.tone} />
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center">
            <Sparkles size={13} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">AI Summary</h3>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">{data.ai_summary}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Key Topics */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center">
              <Tag size={13} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Key Topics</h3>
          </div>
          <ul className="space-y-1.5">
            {data.key_topics.map((topic, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                  {i + 1}
                </span>
                {topic}
              </li>
            ))}
          </ul>
        </div>

        {/* Content Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-amber-50 rounded-md flex items-center justify-center">
                <BookOpen size={13} className="text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Content Type</h3>
            </div>
            <ContentTypeBadge type={data.content_type} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center">
                <Volume2 size={13} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">Tone</h3>
            </div>
            <ToneBadge tone={data.tone} />
          </div>
        </div>
      </div>

      {/* Headings */}
      {data.raw_headings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-slate-50 rounded-md flex items-center justify-center">
              <Heading size={13} className="text-slate-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Page Headings</h3>
          </div>
          <div className="space-y-1">
            {data.raw_headings.map((heading, i) => (
              <div key={i} className="text-sm text-slate-600 py-1 border-b border-slate-50 last:border-0">
                {heading}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={saving || saved}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            saved
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-[0.99]'
          } disabled:opacity-60`}
        >
          {saved ? 'Saved to History' : saving ? 'Saving...' : 'Save to History'}
        </button>
      )}
    </div>
  );
}
