'use client';

import { Coins, Users } from 'lucide-react';
import type { DiscoverItem } from '@/lib/discoverFeed';
import { getFriendVibeMatch, type FriendActivity } from '@/lib/friendMatch';

interface FriendMatchBadgeProps {
  item: DiscoverItem;
  friendActivities?: FriendActivity[];
  expanded: boolean;
  onToggle: () => void;
}

export default function FriendMatchBadge({ item, friendActivities, expanded, onToggle }: FriendMatchBadgeProps) {
  const { hasMatch, matchText, bonusObols } = getFriendVibeMatch(item, friendActivities);
  if (!hasMatch) return null;

  return (
    <div className="mb-2.5 mr-2 inline-flex max-w-[320px] select-none flex-col align-top pointer-events-auto opacity-100">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-purple-300/35 bg-indigo-950/70 text-purple-200 shadow-lg backdrop-blur-md transition-colors hover:bg-indigo-900/80"
        aria-expanded={expanded}
        aria-label={expanded ? 'Hide friend match details' : 'Show friend match details'}
      >
        <Users className="h-4 w-4" />
      </button>
      {expanded && (
        <div className="absolute bottom-full left-0 right-3 z-20 mb-2 flex max-w-[260px] items-start gap-2.5 rounded-2xl border border-purple-400/30 bg-indigo-950/90 p-3 text-white shadow-xl backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold leading-snug">{matchText}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-amber-100">
              <Coins className="h-3 w-3 text-amber-300" />
              +{bonusObols} Obols
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
