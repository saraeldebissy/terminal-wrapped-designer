import type { ReactNode } from 'react';
import { useStats } from './api/useStats';
import { Story } from './story/Story';

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex h-full items-center justify-center text-center px-6">{children}</div>;
}

function App() {
  const { stats, loading, error } = useStats();

  if (loading) {
    return <Centered><p className="font-mono text-white/60">Loading your terminal stats…</p></Centered>;
  }
  if (error || !stats) {
    return (
      <Centered>
        <div className="max-w-md">
          <p className="font-display font-extrabold text-2xl">Couldn't load your Wrapped</p>
          <p className="mt-2 font-mono text-sm text-white/60">
            {error || 'Stats are unavailable. Make sure the CLI is running.'}
          </p>
        </div>
      </Centered>
    );
  }

  return <Story stats={stats} />;
}

export default App;
