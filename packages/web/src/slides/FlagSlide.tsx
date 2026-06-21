import type { SlideViewProps } from './types';
import { copy, fmt, flagGloss } from './copy';

export function FlagSlide({ stats }: SlideViewProps) {
  const flag = stats.parameters.topFlags[0];
  const cmd = flag.commands?.[0];
  const gloss = flagGloss(flag.flag);
  return (
    <div>
      <p className="font-display font-bold text-lg md:text-2xl text-white/80">{copy.flagKicker}</p>

      {/* Shown in context as a real command (`ls -la`) so the flag isn't cryptic. */}
      <p className="font-mono font-bold leading-none mt-2" style={{ fontSize: 'clamp(3rem, 13vw, 8rem)' }}>
        {cmd && <span className="text-white/90">{cmd} </span>}
        <span className="text-coral">{flag.flag}</span>
      </p>

      <p className="mt-4 font-mono text-sm md:text-base text-white/60">{fmt(flag.count)}× this year</p>
      {gloss && (
        <p className="mt-1 font-mono text-sm md:text-base text-white/60">
          <span className="text-coral">→</span> {gloss}
        </p>
      )}

      <p className="mt-5 font-display font-bold text-lg md:text-2xl">{copy.flagAside}</p>
    </div>
  );
}
