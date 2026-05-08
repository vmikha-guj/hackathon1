type BadgeVariant = 'blue' | 'green' | 'amber' | 'rose' | 'slate' | 'cyan' | 'teal';

const variantClasses: Record<BadgeVariant, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
  cyan: 'bg-cyan-100 text-cyan-700',
  teal: 'bg-teal-100 text-teal-700',
};

const contentTypeVariant: Record<string, BadgeVariant> = {
  blog: 'blue',
  news: 'amber',
  ecommerce: 'green',
  documentation: 'cyan',
  'landing page': 'teal',
  other: 'slate',
};

const toneVariant: Record<string, BadgeVariant> = {
  professional: 'blue',
  casual: 'green',
  technical: 'cyan',
};

export function ContentTypeBadge({ type }: { type: string }) {
  const variant = contentTypeVariant[type.toLowerCase()] ?? 'slate';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${variantClasses[variant]}`}>
      {type}
    </span>
  );
}

export function ToneBadge({ tone }: { tone: string }) {
  const variant = toneVariant[tone.toLowerCase()] ?? 'slate';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${variantClasses[variant]}`}>
      {tone}
    </span>
  );
}
