import type { SlideViewProps } from './types';
import { copy, topCategoryPct } from './copy';
import { CategoryBars } from '../components/charts/CategoryBars';
import { useSlideTint } from '../components/SlideTint';

export function TypeSlide({ stats }: SlideViewProps) {
  const tint = useSlideTint();
  const top = stats.categories[0];
  const pct = topCategoryPct(top.count, stats.meta.totalCommands);
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl text-ink/70">{copy.typeKicker}</p>
      <h2 className="mt-1 mb-6 font-display font-extrabold text-ink leading-[0.95]"
          style={{ fontSize: 'clamp(2.25rem, 8vw, 5rem)' }}>
        {copy.typeVerdict(top.name, pct)}
      </h2>
      <CategoryBars categories={stats.categories} total={stats.meta.totalCommands} tint={tint} accent="#FF2E93" />
    </div>
  );
}
