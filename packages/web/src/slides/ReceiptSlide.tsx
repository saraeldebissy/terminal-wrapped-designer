import { useRef } from 'react';
import type { SlideViewProps } from './types';
import { copy, fmt } from './copy';
import { downloadNodeAsPng } from '../lib/exportImage';

export function ReceiptSlide({ stats }: SlideViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const top = stats.topCommands[0];

  const rows: Array<[string, string]> = [
    ['commands run', fmt(stats.meta.totalCommands)],
    ['tools used', fmt(stats.meta.distinctCommands)],
    ['#1 command', top ? top.name : '—'],
    ['secrets leaked', fmt(stats.secrets.totalSecretsFound)],
  ];

  return (
    <div className="flex flex-col items-center">
      <div ref={cardRef} className="w-full max-w-sm bg-ink border border-white/15 rounded-2xl p-6">
        <p className="font-mono text-lime text-xs uppercase tracking-widest">Terminal, Wrapped</p>
        <p className="mt-1 font-display font-extrabold text-2xl">{copy.receiptTitle}</p>
        <dl className="mt-4 divide-y divide-white/10">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between py-2">
              <dt className="font-display text-white/70">{label}</dt>
              <dd className="font-mono font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <button
        type="button"
        className="mt-6 bg-lime text-ink font-display font-bold px-5 py-2 rounded-full"
        onClick={() => {
          if (cardRef.current) {
            downloadNodeAsPng(cardRef.current).catch((err) => {
              console.error('Failed to export Wrapped image:', err);
            });
          }
        }}
      >
        Download your Wrapped
      </button>
    </div>
  );
}
