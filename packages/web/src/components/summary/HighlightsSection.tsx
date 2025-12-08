/**
 * Highlights section
 */

import { motion } from 'motion/react';
import type { Highlight, QuirkyStats } from '../../api/types';
import { StaggeredList, StaggeredItem } from '../motion/StaggeredList';

export interface HighlightsSectionProps {
  highlights: Highlight[];
  quirky: QuirkyStats;
}

const iconMap: Record<string, string> = {
  star: '⭐',
  moon: '🌙',
  sun: '☀️',
  flame: '🔥',
  'git-branch': '🌿',
  box: '📦',
  shield: '🛡️',
  'check-circle': '✅',
  layers: '📚',
  zap: '⚡',
  alert: '⚠️',
};

export function HighlightsSection({
  highlights,
  quirky,
}: HighlightsSectionProps) {
  return (
    <div className="space-y-8">
      {/* Highlights */}
      {highlights.length > 0 && (
        <StaggeredList className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highlights.map((highlight) => (
            <StaggeredItem key={highlight.id}>
              <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 h-full">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {iconMap[highlight.iconKey || ''] || '✨'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-200">
                      {highlight.title}
                    </h3>
                    <p
                      className="text-sm text-slate-400 mt-1"
                      dangerouslySetInnerHTML={{
                        __html: highlight.description
                          .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-primary">$1</strong>'),
                      }}
                    />
                  </div>
                </div>
              </div>
            </StaggeredItem>
          ))}
        </StaggeredList>
      )}

      {/* Quirky stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-2xl">🔓</span>
          <p className="text-2xl font-bold text-slate-200 mt-2">
            {quirky.sudoCount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">sudo commands</p>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-2xl">⚡</span>
          <p className="text-2xl font-bold text-slate-200 mt-2">
            {quirky.aliasLikeCount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">alias-like</p>
        </motion.div>

        <motion.div
          className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-2xl">💥</span>
          <p className="text-2xl font-bold text-slate-200 mt-2">
            {quirky.destructiveCount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">destructive</p>
        </motion.div>
      </div>
    </div>
  );
}
