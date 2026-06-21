import type { SlideViewProps } from './types';
import { copy, hourLabel } from './copy';
import { Cursor } from '../components/Cursor';
import { HourHistogram } from '../components/charts/HourHistogram';
import { useSlideTint } from '../components/SlideTint';

export function PeakHourSlide({ stats }: SlideViewProps) {
  const tint = useSlideTint();
  const peak = [...stats.activityByHour].sort((a, b) => b.count - a.count)[0];
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.peakKicker}</p>
      <p className="font-display font-extrabold leading-none mt-1 mb-6"
         style={{ fontSize: 'clamp(3.5rem, 14vw, 8rem)' }}>
        {hourLabel(peak.hour)}
        <Cursor className="ml-2 align-top" />
      </p>
      <HourHistogram data={stats.activityByHour} tint={tint} accent="#C9F23C" />
      <p className="mt-5 font-display font-bold text-lg md:text-2xl text-white/80">{copy.peakAside}</p>
    </div>
  );
}
