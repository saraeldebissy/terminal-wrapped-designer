import type { SlideViewProps } from './types';
import { copy, topCategoryPct } from './copy';

export function TypeSlide({ stats }: SlideViewProps) {
  const top = stats.categories[0];
  const pct = topCategoryPct(top.count, stats.meta.totalCommands);
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl text-ink/70">{copy.typeKicker}</p>
      <h2 className="mt-2 font-display font-extrabold text-ink leading-[0.95]"
          style={{ fontSize: 'clamp(2.5rem, 9vw, 6rem)' }}>
        {copy.typeVerdict(top.name, pct)}
      </h2>
    </div>
  );
}
