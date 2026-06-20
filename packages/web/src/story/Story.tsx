import { useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import type { Stats } from '../api/types';
import { buildSlideManifest } from '../slides/manifest';
import { SLIDE_REGISTRY } from '../slides/registry';
import { Slide } from './Slide';
import { ProgressBars } from './ProgressBars';
import { useStoryNavigation } from './useStoryNavigation';

export interface StoryProps {
  stats: Stats;
}

export function Story({ stats }: StoryProps) {
  const slides = useMemo(() => buildSlideManifest(stats), [stats]);
  const nav = useStoryNavigation(slides.length);
  const entry = slides[nav.index];
  const SlideView = SLIDE_REGISTRY[entry.id];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nav.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); nav.prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav]);

  return (
    <main className="relative h-full w-full overflow-hidden">
      <ProgressBars count={slides.length} index={nav.index} />

      {/* Click zones: left third = back, right two-thirds = forward */}
      <button type="button" aria-label="Previous slide"
        className="absolute left-0 top-0 z-20 h-full w-1/3 cursor-default"
        onClick={nav.prev} />
      <button type="button" aria-label="Next slide"
        className="absolute right-0 top-0 z-20 h-full w-2/3 cursor-default"
        onClick={nav.next} />

      <AnimatePresence mode="wait">
        <Slide key={entry.id} bg={entry.bg}>
          <SlideView stats={stats} />
        </Slide>
      </AnimatePresence>
    </main>
  );
}
