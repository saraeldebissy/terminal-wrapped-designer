import type { SlideViewProps } from './types';
import { copy } from './copy';

function prettyDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function BusiestDaySlide({ stats }: SlideViewProps) {
  const busiest = [...stats.activityByDay].sort((a, b) => b.count - a.count)[0];
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.busiestKicker}</p>
      <p className="font-display font-extrabold leading-[0.95] mt-2"
         style={{ fontSize: 'clamp(3rem, 12vw, 8rem)' }}>
        {prettyDate(busiest.date)}
      </p>
      <p className="mt-4 font-display font-bold text-lg md:text-2xl">{copy.busiestAside(busiest.count)}</p>
    </div>
  );
}
