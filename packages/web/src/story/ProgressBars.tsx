export interface ProgressBarsProps {
  count: number;
  index: number;
}

/** Wrapped-style position indicator across the top. Filled = seen, current = highlighted. */
export function ProgressBars({ count, index }: ProgressBarsProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex gap-1.5" role="progressbar"
         aria-valuemin={1} aria-valuemax={count} aria-valuenow={index + 1}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-1 flex-1 rounded-full bg-current/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-current transition-all duration-300"
            style={{ width: i <= index ? '100%' : '0%' }}
          />
        </div>
      ))}
    </div>
  );
}
