'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Coins,
  Flame,
  Sparkles,
  CheckCircle2,
  X,
  ShoppingBag,
  Calendar,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import {
  claimDailyCheckin,
  fetchCoinHistory,
  fetchPublicProfile,
} from '@/lib/supabase/api';
import { DEMO_USER_ID } from '@/lib/supabase/client';
import { CoinTransaction } from '@/types/types';

interface CoinRewardsModalProps {
  userId?: string;
  /** Optional external balance override if parent page updates coins after checkout */
  externalBalance?: number | null;
  onBalanceUpdate?: (newBalance: number) => void;
}

export default function CoinRewardsModal({
  userId = DEMO_USER_ID,
  externalBalance = null,
  onBalanceUpdate,
}: CoinRewardsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState<number>(450);
  const [streak, setStreak] = useState<number>(4);
  const [canClaimToday, setCanClaimToday] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const loadWalletState = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const [profileData, historyData] = await Promise.all([
        fetchPublicProfile(userId),
        fetchCoinHistory(userId),
      ]);

      if (profileData?.profile) {
        setCoinBalance(profileData.profile.coin_balance);
        setStreak(profileData.profile.checkin_streak);

        // Check if last_checkin_date matches today's UTC YYYY-MM-DD
        const todayStr = new Date().toISOString().split('T')[0];
        setCanClaimToday(profileData.profile.last_checkin_date !== todayStr);
      }

      setTransactions(historyData);
    } catch (err) {
      console.error('Failed to load wallet state:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWalletState();
  }, [loadWalletState]);

  useEffect(() => {
    if (externalBalance !== null && externalBalance !== undefined) {
      setCoinBalance(externalBalance);
      loadWalletState();
    }
  }, [externalBalance, loadWalletState]);

  const triggerGoldConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#FBBF24', '#FEF08A', '#F43F5E'],
    });
  };

  const handleClaimCheckin = async () => {
    if (!canClaimToday || isClaiming) return;
    setIsClaiming(true);
    setStatusMessage(null);

    try {
      const result = await claimDailyCheckin(userId);
      setStatusMessage(result.message);

      if (result.success && !result.already_checked_in) {
        setCoinBalance(result.new_coin_balance);
        setStreak(result.current_streak);
        setCanClaimToday(false);
        onBalanceUpdate?.(result.new_coin_balance);
        triggerGoldConfetti();
        await loadWalletState();
      } else if (result.already_checked_in) {
        setCanClaimToday(false);
      }
    } catch (err) {
      console.error('Check-in error:', err);
      setStatusMessage('Could not claim check-in. Check Supabase connection.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Generate 7-day visual streak steps
  const streakDays = [1, 2, 3, 4, 5, 6, 7];

  return (
    <>
      {/* 1. NAVBAR PILL TRIGGER */}
      <button
        onClick={() => {
          setIsOpen(true);
          loadWalletState();
        }}
        className="relative flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition active:scale-95 hover:bg-amber-100/80"
      >
        <span className="flex items-center gap-1 text-orange-600">
          <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
          {streak}d
        </span>
        <span className="h-3 w-[1px] bg-amber-300" />
        <span className="flex items-center gap-1">
          <Coins className="h-3.5 w-3.5 fill-amber-400 text-amber-600" />
          {coinBalance.toLocaleString()}
        </span>

        {/* Pulse dot when daily check-in is available */}
        {canClaimToday && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
          </span>
        )}
      </button>

      {/* 2. SLIDE-UP MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="w-full max-w-[430px] max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden"
            >
              {/* Top Gradient Banner */}
              <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-4 rounded-full bg-black/20 p-1.5 text-white/90 hover:bg-black/30 transition"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 text-amber-100 text-xs font-medium uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  Agora Rewards Wallet
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <div className="text-4xl font-extrabold tracking-tight flex items-center gap-2">
                      {coinBalance.toLocaleString()}
                      <span className="text-lg font-semibold text-amber-100">Coins</span>
                    </div>
                    <p className="mt-1 text-xs text-amber-100/90">
                      ≈ ${(coinBalance / 100).toFixed(2)} toward partner drops
                    </p>
                  </div>

                  <div className="flex flex-col items-end rounded-2xl bg-white/15 backdrop-blur-md px-3.5 py-2 border border-white/20">
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <Flame className="h-5 w-5 fill-amber-300 text-amber-200" />
                      {streak} Days
                    </div>
                    <span className="text-[10px] text-amber-100 uppercase tracking-wide">
                      Active Streak
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* 7-Day Check-in Strip */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      Daily Check-In Bonus
                    </span>
                    <span className="text-xs font-medium text-orange-600">
                      +25 base +10/day streak
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 mb-4">
                    {streakDays.map((day) => {
                      const isCompleted = day <= streak && !canClaimToday ? true : day <= streak;
                      const isNextToClaim = canClaimToday && day === streak + 1;
                      const rewardAmount = 25 + Math.min(day * 10, 100);

                      return (
                        <div
                          key={day}
                          className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 border text-center transition ${
                            isCompleted
                              ? 'bg-amber-500/15 border-amber-400 text-amber-900'
                              : isNextToClaim
                              ? 'bg-white border-rose-500 ring-2 ring-rose-500/20 text-rose-600 scale-105'
                              : 'bg-white border-zinc-200 text-zinc-400'
                          }`}
                        >
                          <span className="text-[10px] font-semibold">D{day}</span>
                          {isCompleted ? (
                            <CheckCircle2 className="my-1 h-4 w-4 text-amber-600" />
                          ) : (
                            <Coins className="my-1 h-4 w-4 text-amber-400" />
                          )}
                          <span className="text-[10px] font-bold">+{rewardAmount}</span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleClaimCheckin}
                    disabled={!canClaimToday || isClaiming}
                    className={`w-full rounded-xl py-3 px-4 text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 ${
                      canClaimToday
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99]'
                        : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Claiming Streak Bonus...
                      </>
                    ) : canClaimToday ? (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        Claim Day {streak + 1} Reward (+{25 + Math.min((streak + 1) * 10, 100)} Coins)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Checked In Today • Come Back Tomorrow!
                      </>
                    )}
                  </button>

                  {statusMessage && (
                    <p className="mt-2.5 text-center text-xs font-medium text-emerald-600">
                      {statusMessage}
                    </p>
                  )}
                </div>

                {/* Partner Brand Promo Multiplier Callout */}
                <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/60 p-4 flex items-start gap-3">
                  <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">
                      Boost Coins with Partner Brand Drops
                    </h4>
                    <p className="mt-0.5 text-xs text-zinc-600 leading-relaxed">
                      Look for the <span className="font-semibold text-rose-600">🔥 Partner Brand</span> badge while swiping. Checking out promoted items awards up to <span className="font-semibold">+400 bonus coins</span> instantly.
                    </p>
                  </div>
                </div>

                {/* Coin Ledger History */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                    Recent Coin Activity
                  </h3>

                  {isLoadingHistory ? (
                    <div className="flex justify-center py-6 text-zinc-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-center text-xs text-zinc-400 py-4">
                      No coin transactions yet. Claim your check-in or purchase a promoted item!
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 px-3.5 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-lg p-2 ${
                                tx.reason === 'promo_purchase'
                                  ? 'bg-rose-100 text-rose-600'
                                  : 'bg-amber-100 text-amber-600'
                              }`}
                            >
                              {tx.reason === 'promo_purchase' ? (
                                <ShoppingBag className="h-4 w-4" />
                              ) : (
                                <Flame className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-800 line-clamp-1">
                                {tx.description}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {new Date(tx.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-extrabold text-emerald-600 whitespace-nowrap ml-2">
                            +{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}