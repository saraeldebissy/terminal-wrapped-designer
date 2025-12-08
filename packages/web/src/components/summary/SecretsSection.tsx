/**
 * Secrets detection section - displays potentially exposed secrets
 */

import { motion } from 'motion/react';
import type { SecretsStats } from '../../api/types';
import { StaggeredList, StaggeredItem } from '../motion/StaggeredList';

export interface SecretsSectionProps {
  secrets: SecretsStats;
}

export function SecretsSection({ secrets }: SecretsSectionProps) {
  const { totalSecretsFound, secretTypes, potentialSecrets } = secrets;

  if (totalSecretsFound === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">🔒</span>
        <p className="text-slate-400">
          No exposed secrets detected in your history. Nice!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <motion.div
        className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4"
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-orange-300 font-semibold">
              {totalSecretsFound} potential secret{totalSecretsFound !== 1 ? 's' : ''} detected
            </p>
            <p className="text-sm text-orange-200/70 mt-1">
              These patterns in your shell history might contain sensitive data.
              Consider rotating any exposed credentials.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Secret types breakdown */}
      {secretTypes.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-3">
            By Type
          </h3>
          <div className="flex flex-wrap gap-2">
            {secretTypes.map(({ type, count }) => (
              <motion.span
                key={type}
                className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <span className="text-orange-400">{type}</span>
                <span className="text-slate-500 ml-2">({count})</span>
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Sample redacted commands */}
      {potentialSecrets.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-3">
            Examples (Redacted)
          </h3>
          <StaggeredList className="space-y-2">
            {potentialSecrets.slice(0, 5).map((secret, index) => (
              <StaggeredItem key={index}>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                      {secret.type}
                    </span>
                  </div>
                  <code className="text-xs text-slate-400 font-mono break-all">
                    {secret.redactedCommand}
                  </code>
                </div>
              </StaggeredItem>
            ))}
          </StaggeredList>
          {potentialSecrets.length > 5 && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              ...and {potentialSecrets.length - 5} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
