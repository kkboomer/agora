'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import CoinRewardsModal from '@/components/layout/CoinRewardsModal';
import { fetchSwipeDeck, checkoutCart } from '@/lib/supabase/api';
import { Product } from '@/types/types';
import { Sparkles, ShoppingCart, Check } from 'lucide-react';

export default function TestCoinsSandbox() {
  const [products, setProducts] = useState<Product[]>([]);
  const [externalBalance, setExternalBalance] = useState<number | null>(null);
  const [lastCheckoutMsg, setLastCheckoutMsg] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSwipeDeck().then(setProducts);
  }, []);

  const handleSimulatedCheckout = async (product: Product) => {
    setLoadingId(product.id);
    try {
      const res = await checkoutCart([product.id]);
      setExternalBalance(res.new_coin_balance);
      setLastCheckoutMsg(
        `Purchased ${product.title}! Earned +${res.coins_earned} promo coins (New balance: ${res.new_coin_balance}).`
      );
      if (res.coins_earned > 0) {
        confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
      }
    } catch (err) {
      console.error(err);
      setLastCheckoutMsg('Error running checkout_cart RPC. Did you run schema.sql?');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Mock Top Navbar showing Person 3's Coin Widget */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/90 backdrop-blur-md px-4 py-3">
        <div className="font-black tracking-tight text-lg text-zinc-900">
          agora<span className="text-rose-500">.</span>
        </div>
        <CoinRewardsModal externalBalance={externalBalance} />
      </header>

      <main className="p-4 space-y-4">
        <div className="rounded-2xl bg-zinc-900 text-white p-4">
          <h1 className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Person 3 Backend & Gamification Sandbox
          </h1>
          <p className="mt-1 text-xs text-zinc-300">
            1. Click the <span className="text-amber-300 font-semibold">Flame / Coin pill</span> in the top right to test your Daily Check-In streak RPC.
            <br />
            2. Click any item below to test your 1-Click Checkout & Promo Coin Multiplier RPC.
          </p>
        </div>

        {lastCheckoutMsg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            {lastCheckoutMsg}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Live Products from Supabase ({products.length})
          </h2>

          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="h-14 w-14 rounded-xl object-cover bg-zinc-100"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {p.brand_name}
                  </span>
                  <h3 className="text-xs font-bold text-zinc-900 line-clamp-1">
                    {p.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-700">
                      ${Number(p.price).toFixed(2)}
                    </span>
                    {p.is_promoted && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-200">
                        +{p.coin_reward} Coins
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSimulatedCheckout(p)}
                disabled={loadingId === p.id}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 active:scale-95 transition flex items-center gap-1.5 shrink-0"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {loadingId === p.id ? '...' : 'Test Buy'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}