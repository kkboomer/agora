'use client';

import { Coins, Sparkles } from 'lucide-react';
import type { DiscoverItem } from '@/lib/discoverFeed';

interface AIRecommendationBadgeProps {
  item: DiscoverItem;
  expanded: boolean;
  onToggle: () => void;
}

export default function AIRecommendationBadge({ item, expanded, onToggle }: AIRecommendationBadgeProps) {
  return (
    <div className="mb-2.5 mr-2 inline-flex max-w-[320px] select-none flex-col align-top pointer-events-auto opacity-100">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/50 text-[#F5C6B8] shadow-lg backdrop-blur-md transition-colors hover:bg-black/65"
        aria-expanded={expanded}
        aria-label={expanded ? 'Hide AI recommendation details' : 'Show AI recommendation details'}
      >
        <Sparkles className="h-4 w-4 fill-[#D98A76]" />
      </button>
      {expanded && (
        <div className="absolute bottom-full left-0 right-3 z-20 mb-2 max-w-[260px] rounded-2xl border border-white/20 bg-black/70 p-3 text-white shadow-lg backdrop-blur-md">
          <p className="text-[11px] font-extrabold leading-snug tracking-wide text-[#F5C6B8]">
            {item.aiReason ?? `${item.aiMatchScore ?? 94}% AI Style Match`}
          </p>
          {(item.obolReward ?? 0) > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-amber-100">
              <Coins className="h-3 w-3 text-amber-300" />
              +{item.obolReward} Obols
            </span>
          )}
        </div>
      )}
    </div>
  );
}
