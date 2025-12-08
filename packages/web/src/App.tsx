/**
 * Terminal Wrapped - Main App Component
 */

import { useStats } from './api/useStats';
import { LayoutShell } from './components/layout/LayoutShell';
import { Section } from './components/layout/Section';
import { HeroSummary } from './components/summary/HeroSummary';
import { HighlightsSection } from './components/summary/HighlightsSection';
import { SecretsSection } from './components/summary/SecretsSection';
import { TopCommandsBarChart } from './components/charts/TopCommandsBarChart';
import { HourlyPatternBarChart } from './components/charts/HourlyPatternBarChart';
import { CategoryBarChart } from './components/charts/CategoryBarChart';
import { ActivityHeatmap } from './components/charts/ActivityHeatmap';
import { ParameterStatsChart } from './components/charts/ParameterStatsChart';

function App() {
  const { stats, loading, error } = useStats();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-400 mt-4">Loading your terminal stats...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-2xl font-bold text-slate-200 mb-2">
            Couldn't load stats
          </h1>
          <p className="text-slate-400">
            {error || 'Stats data is not available. Make sure the CLI is running.'}
          </p>
        </div>
      </div>
    );
  }

  // Check if we have time-based data
  const hasTimeData = stats.activityByDay.length > 0;
  const hasHourlyData = stats.activityByHour.some(h => h.count > 0);
  const hasParameters = stats.parameters.topFlags.length > 0 || stats.parameters.commandFlagCombos.length > 0;

  return (
    <LayoutShell>
      {/* Hero Summary */}
      <HeroSummary
        meta={stats.meta}
        topCommand={stats.topCommands[0] || null}
      />

      {/* Top Commands */}
      <Section
        id="commands"
        title="Your Top Commands"
        subtitle="The commands you reach for most"
      >
        <TopCommandsBarChart commands={stats.topCommands} maxItems={10} />
      </Section>

      {/* Favorite Flags */}
      {hasParameters && (
        <Section
          id="flags"
          title="Your Favorite Flags"
          subtitle="The options and arguments you use most"
        >
          <ParameterStatsChart parameters={stats.parameters} />
        </Section>
      )}

      {/* Activity Section */}
      {hasTimeData && (
        <Section
          id="activity"
          title="Your Activity"
          subtitle="When you're most active in the terminal"
        >
          <div className="space-y-12">
            {/* Heatmap */}
            <div>
              <h3 className="text-lg font-medium text-slate-300 mb-4">
                Daily Activity
              </h3>
              <ActivityHeatmap data={stats.activityByDay} weeks={26} />
            </div>

            {/* Hourly pattern */}
            {hasHourlyData && (
              <div>
                <h3 className="text-lg font-medium text-slate-300 mb-4">
                  Hourly Pattern
                </h3>
                <HourlyPatternBarChart data={stats.activityByHour} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Categories */}
      {stats.categories.length > 0 && (
        <Section
          id="categories"
          title="Command Categories"
          subtitle="How you spend your terminal time"
        >
          <CategoryBarChart categories={stats.categories} maxItems={8} />
        </Section>
      )}

      {/* Secrets Detection */}
      <Section
        id="secrets"
        title="Secrets Exposed"
        subtitle="Credentials that might be in your shell history"
      >
        <SecretsSection secrets={stats.secrets} />
      </Section>

      {/* Highlights */}
      <Section
        id="highlights"
        title="Highlights"
        subtitle="Your terminal achievements"
      >
        <HighlightsSection
          highlights={stats.highlights}
          quirky={stats.quirky}
        />
      </Section>
    </LayoutShell>
  );
}

export default App;
