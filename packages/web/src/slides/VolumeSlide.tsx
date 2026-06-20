import type { SlideViewProps } from './types';
import { copy } from './copy';
import { useCountUp } from '../lib/useCountUp';

export function VolumeSlide({ stats }: SlideViewProps) {
  const total = useCountUp(stats.meta.totalCommands);
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl">{copy.volumeKicker}</p>
      <p className="font-display font-extrabold leading-none mt-2"
         style={{ fontSize: 'clamp(4rem, 18vw, 12rem)' }}>
        {total.toLocaleString('en-US')}
      </p>
      <p className="font-display font-bold text-lg md:text-2xl mt-2">commands</p>
      <p className="mt-6 inline-block bg-lime text-ink font-display font-bold text-sm md:text-base px-3 py-1 rounded-full">
        {copy.volumeAside(stats.meta.distinctCommands)}
      </p>
    </div>
  );
}
