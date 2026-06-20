import { useCallback, useEffect, useMemo } from 'react';
import type { MouseEvent } from 'react';
import { AnimatePresence } from 'motion/react';
import type { Stats } from '../api/types';
import { buildSlideManifest } from '../slides/manifest';
import { SLIDE_REGISTRY } from '../slides/registry';
import { Slide } from './Slide';
import { ProgressBars } from './ProgressBars';
import { useStoryNavigation } from './useStoryNavigation';

/** Selector for elements that should handle their own clicks/keys (not trigger navigation). */
const INTERACTIVE = 'button, a, input, textarea, select';

export interface StoryProps {
  stats: Stats;
}

export function Story({ stats }: StoryProps) {
  const slides = useMemo(() => buildSlideManifest(stats), [stats]);
  const nav = useStoryNavigation(slides.length);
  const { next, prev, index } = nav;

  // Guard against a transient out-of-range index if the manifest ever shrinks.
  const entry = slides[index] ?? slides[slides.length - 1];
  const SlideView = SLIDE_REGISTRY[entry.id];

  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      // Let interactive controls (e.g. the receipt Download button) handle their own clicks.
      if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
      if (e.clientX < window.innerWidth / 3) prev();
      else next();
    },
    [next, prev],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      // Don't hijack keys when focus is on an interactive control.
      if (t instanceof Element && t.closest(INTERACTIVE)) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  return (
    <main className="relative h-full w-full overflow-hidden cursor-pointer" onClick={handleClick}>
      <ProgressBars count={slides.length} index={index} />
      <AnimatePresence mode="wait">
        <Slide key={entry.id} bg={entry.bg}>
          <SlideView stats={stats} />
        </Slide>
      </AnimatePresence>
    </main>
  );
}
