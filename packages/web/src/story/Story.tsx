import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import type { Stats } from '../api/types';
import { buildSlideManifest } from '../slides/manifest';
import { SLIDE_REGISTRY } from '../slides/registry';
import { PROMPTS } from '../slides/copy';
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

  const mainRef = useRef<HTMLElement>(null);

  // Auto-focus on mount so keyboard nav is immediately reachable.
  useEffect(() => {
    mainRef.current?.focus();
  }, []);

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
    <MotionConfig reducedMotion="user">
      <main
        ref={mainRef}
        className="relative h-full w-full overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset"
        onClick={handleClick}
        tabIndex={0}
        role="region"
        aria-roledescription="story"
        aria-label="Terminal Wrapped story. Use left and right arrow keys to navigate."
      >
        <div aria-live="polite" className="sr-only">
          Slide {index + 1} of {slides.length}
        </div>
        <ProgressBars count={slides.length} index={index} />
        <AnimatePresence mode="wait">
          <Slide key={entry.id} bg={entry.bg} command={PROMPTS[entry.id]}>
            <SlideView stats={stats} />
          </Slide>
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
