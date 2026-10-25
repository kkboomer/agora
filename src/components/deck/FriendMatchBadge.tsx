'use client';

import { Coins, Sparkles, Users } from 'lucide-react';
import type { DiscoverItem } from '@/lib/discoverFeed';
import { getFriendVibeMatch, type FriendActivity } from '@/lib/friendMatch';

interface FriendMatchBadgeProps {
  item: DiscoverItem;
  friendActivities?: FriendActivity[];
}

export default function FriendMatchBadge({ item, friendActivities }: FriendMatchBadgeProps) {
  const { hasMatch, matchText, bonusObols } = getFriendVibeMatch(item, friendActivities);
  if (!hasMatch) return null;

  return (
    <div className="mb-2.5 flex max-w-[320px] items-start gap-2.5 rounded-2xl border border-purple-400/30 bg-gradient-to-r from-purple-900/80 to-indigo-950/80 p-3 text-white shadow-xl backdrop-blur-md">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/25 text-purple-200">
        <Users className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-purple-200">
          <Sparkles className="h-3 w-3" />
          Social Group Vibe
        </div>
        <p className="mt-1 text-[11px] font-semibold leading-snug">{matchText}</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-amber-100">
          <Coins className="h-3 w-3 text-amber-300" />
          +{bonusObols} Obols
        </span>
      </div>
    </div>
  );
}
