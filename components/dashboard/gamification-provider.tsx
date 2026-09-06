'use client';

import * as React from 'react';
import { useAuth } from '@/components/auth-provider';
import { AchievementNotifier } from '@/components/dashboard/achievement-notifier';
import type { AchievementEvent } from '@/lib/gamification/service';

interface GamificationContextValue {
  achievements: AchievementEvent[];
  notify: (events: AchievementEvent[]) => void;
  clearAchievements: () => void;
}

const GamificationContext = React.createContext<GamificationContextValue | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [achievements, setAchievements] = React.useState<AchievementEvent[]>([]);

  const notify = React.useCallback((events: AchievementEvent[]) => {
    if (events.length > 0) {
      setAchievements((prev) => [...prev, ...events]);
    }
  }, []);

  const clearAchievements = React.useCallback(() => {
    setAchievements([]);
  }, []);

  const value: GamificationContextValue = { achievements, notify, clearAchievements };

  return (
    <GamificationContext.Provider value={value}>
      {children}
      <AchievementNotifier achievements={achievements} />
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = React.useContext(GamificationContext);
  if (!ctx) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return ctx;
}
