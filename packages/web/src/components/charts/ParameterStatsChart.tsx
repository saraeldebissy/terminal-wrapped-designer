/**
 * Parameter/flag analysis chart
 */

import { motion } from 'motion/react';
import type { ParameterStats } from '../../api/types';
import { StaggeredList, StaggeredItem } from '../motion/StaggeredList';

export interface ParameterStatsChartProps {
  parameters: ParameterStats;
}

export function ParameterStatsChart({ parameters }: ParameterStatsChartProps) {
  const { topFlags, commandFlagCombos } = parameters;

  if (topFlags.length === 0 && commandFlagCombos.length === 0) {
    return null;
  }

  const maxCount = topFlags.length > 0 ? topFlags[0].count : 1;

  return (
    <div className="space-y-8">
      {/* Top Flags */}
      {topFlags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-300 mb-4">Top Flags</h3>
          <StaggeredList className="space-y-3">
            {topFlags.slice(0, 10).map((flag) => (
              <StaggeredItem key={flag.flag}>
                <div className="flex items-center gap-4">
                  <code className="w-24 text-sm font-mono text-primary truncate">
                    {flag.flag}
                  </code>
                  <div className="flex-1">
                    <motion.div
                      className="h-6 bg-gradient-to-r from-primary/80 to-secondary/60 rounded"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(flag.count / maxCount) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm text-slate-400">
                    {flag.count.toLocaleString()}
                  </span>
                </div>
                {flag.commands.length > 0 && (
                  <div className="ml-28 mt-1">
                    <span className="text-xs text-slate-500">
                      Used with: {flag.commands.slice(0, 3).join(', ')}
                    </span>
                  </div>
                )}
              </StaggeredItem>
            ))}
          </StaggeredList>
        </div>
      )}

      {/* Popular Flag Combos */}
      {commandFlagCombos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-300 mb-4">
            Your Signature Moves
          </h3>
          <StaggeredList className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {commandFlagCombos.slice(0, 6).map((combo, index) => (
              <StaggeredItem key={`${combo.command}-${index}`}>
                <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono text-accent">
                      {combo.command}
                    </code>
                    <span className="text-xs text-slate-500">
                      {combo.count.toLocaleString()}x
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {combo.flags.map((flag) => (
                      <span
                        key={flag}
                        className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-mono rounded"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              </StaggeredItem>
            ))}
          </StaggeredList>
        </div>
      )}
    </div>
  );
}
