import type { SlideViewProps } from './types';
import { copy } from './copy';
import { DaySparkline } from '../components/charts/DaySparkline';
import { useSlideTint } from '../components/SlideTint';

function prettyDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function BusiestDaySlide({ stats }: SlideViewProps) {
  const tint = useSlideTint();
  const busiest = [...stats.activityByDay].sort((a, b) => b.count - a.count)[0];
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.busiestKicker}</p>
      <p className="font-display font-extrabold leading-[0.95] mt-1 mb-6"
         style={{ fontSize: 'clamp(2.75rem, 11vw, 7rem)' }}>
        {prettyDate(busiest.date)}
      </p>
      <DaySparkline data={stats.activityByDay} tint={tint} accent="#C9F23C" />
      <p className="mt-5 font-display font-bold text-lg md:text-2xl">{copy.busiestAside(busiest.count)}</p>
    </div>
  );
}
