import type { SlideViewProps } from './types';
import { copy, fmt } from './copy';

export function SecretsSlide({ stats }: SlideViewProps) {
  const n = stats.secrets.totalSecretsFound;
  const types = stats.secrets.secretTypes.slice(0, 3);
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.secretsKicker}</p>
      <p className="font-display font-extrabold text-coral leading-none mt-2"
         style={{ fontSize: 'clamp(4rem, 18vw, 12rem)' }}>{fmt(n)}</p>
      <p className="mt-2 font-display font-bold text-lg md:text-2xl">{copy.secretsVerdict(n)}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {types.map((t) => (
          <li key={t.type} className="font-mono text-sm bg-coral text-ink px-2 py-1 rounded">
            {t.type} ×{t.count}
          </li>
        ))}
      </ul>
      <p className="mt-6 font-display font-extrabold text-coral" style={{ fontSize: 'clamp(2rem, 7vw, 4rem)' }}>
        {copy.secretsAside}
      </p>
    </div>
  );
}
