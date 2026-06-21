import type { ReactNode } from 'react';
import { Cursor } from './Cursor';
import { rgba } from '../theme/color';

/**
 * Frames slide content as a terminal window: traffic-light dots, a title,
 * and an optional `$ command` prompt line. The panel is a faint tint of the
 * slide's text color (computed via rgba — see theme/color.ts for why we can't
 * use Tailwind's `*-current/NN`), so it gives depth on any background.
 */
export function TerminalChrome({
  tint,
  command,
  children,
}: {
  tint: string;
  command?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl shadow-black/30"
      style={{
        backgroundColor: rgba(tint, 0.04),
        border: `1px solid ${rgba(tint, 0.14)}`,
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{ borderBottom: `1px solid ${rgba(tint, 0.1)}` }}
      >
        <span className="h-3 w-3 rounded-full bg-coral" />
        <span className="h-3 w-3 rounded-full bg-yellow" />
        <span className="h-3 w-3 rounded-full bg-lime" />
        <span
          className="ml-3 font-mono text-xs tracking-wide"
          style={{ color: rgba(tint, 0.5) }}
        >
          terminal — wrapped
        </span>
      </div>

      {/* Body */}
      <div className="px-6 md:px-10 py-9 md:py-12">
        {command && (
          <p className="font-mono text-xs md:text-sm mb-6" style={{ color: rgba(tint, 0.6) }}>
            <span style={{ color: rgba(tint, 0.4) }}>$</span> {command}
            <Cursor className="ml-1" />
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
