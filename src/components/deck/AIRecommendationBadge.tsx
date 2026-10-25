'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Coins, ShieldCheck, Sparkles } from 'lucide-react';
import type { DiscoverItem } from '@/lib/discoverFeed';

interface AIRecommendationBadgeProps {
  item: DiscoverItem;
}

export default function AIRecommendationBadge({ item }: AIRecommendationBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-2.5 max-w-[320px] select-none pointer-events-auto">
      {item.isPromoted && (
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D98A76] to-amber-500/90 px-3 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-md">
          <Coins className="h-3 w-3 text-amber-100" />
          <span>
            {item.promoLabel || `Partner Promo • +${item.obolReward} Obols`}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setExpanded((previous) => !previous);
        }}
        className="w-full rounded-2xl border border-white/20 bg-black/50 px-3 py-2 text-left text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/65"
        aria-expanded={expanded}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 shrink-0 fill-[#D98A76] text-[#D98A76]" />
            <span className="text-[11px] font-extrabold tracking-wide text-[#F5C6B8]">
              {item.aiMatchScore ?? 94}% AI Style Match
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/85">
            Why this?
            {expanded ? (
              <ChevronUp className="h-2.5 w-2.5" />
            ) : (
              <ChevronDown className="h-2.5 w-2.5" />
            )}
          </span>
        </span>

        {item.aiReason && (
          <span className="mt-1 block text-[11px] font-medium leading-snug text-white/95">
            {item.aiReason}
          </span>
        )}

        {expanded && (
          <span className="mt-2 block space-y-1 border-t border-white/15 pt-2 text-[10px] text-white/80">
            <span className="flex items-center gap-1 font-semibold text-white/95">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              Explainable AI Taste Signals
            </span>
            <span className="block list-disc space-y-0.5 pl-4">
              {(item.aiSignals ?? []).map((signal, index) => (
                <span className="block before:mr-1 before:content-['•']" key={`${signal}-${index}`}>
                  {signal}
                </span>
              ))}
            </span>
            <span className="block pt-0.5 text-[9px] text-emerald-300/90">
              ✓ Visa Responsible AI • On-session learning • 0 Payment PII used
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
