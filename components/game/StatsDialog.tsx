"use client";

import { Dialog } from "@/components/ui/Dialog";
import type { GameStats } from "@/src/lib/storage/localStats";

export function StatsDialog({
  open,
  onOpenChange,
  stats,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: GameStats;
}) {
  const winRate = stats.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  const maximum = Math.max(1, ...stats.guessDistribution);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Your observatory log" description="Stored only in this browser.">
      <div className="stats-grid">
        <div><strong>{stats.gamesPlayed}</strong><span>Played</span></div>
        <div><strong>{winRate}%</strong><span>Wins</span></div>
        <div><strong>{stats.currentStreak}</strong><span>Streak</span></div>
        <div><strong>{stats.bestStreak}</strong><span>Best</span></div>
      </div>
      <h3>Guess distribution</h3>
      <div className="distribution">
        {stats.guessDistribution.map((count, index) => (
          <div key={index}>
            <span>{index + 1}</span>
            <span className="distribution-bar" style={{ width: `${Math.max(12, (count / maximum) * 100)}%` }}>{count}</span>
          </div>
        ))}
        <p>Losses: {stats.losses}</p>
      </div>
    </Dialog>
  );
}
