'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FileCode, TrendingUp, Bug, Code2, Sparkles, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/utils/formatDate';
import Link from 'next/link';

type StatData = {
  totalReviews: number;
  averageScore: number;
  totalBugsFound: number;
  languagesUsed: number;
  weeklyNew?: number;
};

type ReviewRow = {
  id: string;
  language: string;
  overallScore: number;
  bugsFound: number;
  finalVerdict: string;
  isFavorited: boolean;
  createdAt: string;
};

const statCardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const languageColors: Record<string, string> = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-400',
  Python: 'bg-green-400',
  Java: 'bg-orange-400',
  'C++': 'bg-red-500',
  C: 'bg-zinc-400',
  Go: 'bg-cyan-400',
  Rust: 'bg-orange-500',
  PHP: 'bg-purple-500',
  'C#': 'bg-pink-500',
};

function useCountUp(value: number, duration = 700) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number | null = null;
    const start = Date.now();
    const from = display;
    const to = value;

    function frame() {
      const now = Date.now();
      const t = Math.min(1, (now - start) / duration);
      const current = Math.round(from + (to - from) * t);
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return display;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  const [stats, setStats] = useState<StatData | null>(null);
  const [recent, setRecent] = useState<ReviewRow[] | null>(null);
  const [trend, setTrend] = useState<Array<{ date: string; score: number }>>([]);
  const [langDistribution, setLangDistribution] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [sRes, hRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/history?limit=10'),
        ]);
        const sJson = await sRes.json();
        const hJson = await hRes.json();

        if (!mounted) return;

        if (!sJson.success) throw new Error(sJson.message || 'Failed to load stats');
        if (!hJson.success) throw new Error(hJson.message || 'Failed to load history');

        setStats({
          totalReviews: sJson.data.totalReviews || 0,
          averageScore: sJson.data.averageScore || 0,
          totalBugsFound: sJson.data.totalBugsFound || 0,
          languagesUsed: sJson.data.languagesUsed || 0,
          weeklyNew: sJson.data.weeklyNew || 0,
        });

        const reviews = hJson.reviews || [];
        setRecent(reviews.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() })));

        // Trend: last 10 reviews (reverse chronological -> chronological)
        const trendData = (hJson.reviews || [])
          .slice(0, 10)
          .map((r: any) => ({ date: new Date(r.createdAt).toISOString(), score: r.overallScore }))
          .reverse()
          .map((d: any) => ({ date: new Date(d.date).toLocaleDateString(), score: d.score }));
        setTrend(trendData);

        // Language distribution
        const byLang: Record<string, number> = {};
        (hJson.reviews || []).forEach((r: any) => {
          byLang[r.language] = (byLang[r.language] || 0) + 1;
        });
        setLangDistribution(Object.keys(byLang).length ? byLang : null);

        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Unable to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totalReviewsCount = useCountUp(stats?.totalReviews || 0);
  const avgScoreCount = useCountUp(Math.round(stats?.averageScore || 0));
  const totalBugsCount = useCountUp(stats?.totalBugsFound || 0);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <main className="min-h-screen bg-[#0A0A0A] p-4 sm:p-8 text-white">
      <div className="gradient-border-animated mx-auto max-w-7xl rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{greeting}, {firstName}!</h2>
            <p className="mt-1 text-sm text-zinc-400">Here's an overview of your code quality journey</p>
          </div>
          <div>
            <Link href="/new-review" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium shadow hover:bg-blue-700">
              <Sparkles className="h-4 w-4" />
              New Review
            </Link>
          </div>
        </div>

        <motion.div initial="hidden" animate="show" className="mt-6 grid gap-4 md:grid-cols-4">
          {loading && (
            <>
              <Skeleton className="h-28 rounded-2xl bg-[#111111] border border-zinc-800 p-6" />
              <Skeleton className="h-28 rounded-2xl bg-[#111111] border border-zinc-800 p-6" />
              <Skeleton className="h-28 rounded-2xl bg-[#111111] border border-zinc-800 p-6" />
              <Skeleton className="h-28 rounded-2xl bg-[#111111] border border-zinc-800 p-6" />
            </>
          )}

          {!loading && stats && (
            <>
              <motion.div variants={statCardVariants} className="stat-glow-blue rounded-2xl bg-[#111111] border border-zinc-800 p-6 hover:-translate-y-1 hover:border-zinc-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-700 p-2 text-white"><FileCode className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm text-zinc-400">Reviews completed</p>
                      <h3 className="mt-1 text-2xl font-semibold">{totalReviewsCount}</h3>
                      <p className="mt-1 text-xs text-zinc-500">+{stats.weeklyNew || 0} this week</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={statCardVariants} className="stat-glow-green rounded-2xl bg-[#111111] border border-zinc-800 p-6 hover:-translate-y-1 hover:border-zinc-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-700 p-2 text-white"><TrendingUp className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm text-zinc-400">Average code score</p>
                      <h3 className="mt-1 text-2xl font-semibold">
                        {avgScoreCount}
                        <span className="text-sm text-zinc-400">/100</span>
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={statCardVariants} className="stat-glow-red rounded-2xl bg-[#111111] border border-zinc-800 p-6 hover:-translate-y-1 hover:border-zinc-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-red-700 p-2 text-white"><Bug className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm text-zinc-400">Total bugs detected</p>
                      <h3 className="mt-1 text-2xl font-semibold">{totalBugsCount}</h3>
                      <p className="mt-1 text-xs text-zinc-500">Across all reviews</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={statCardVariants} className="stat-glow-purple rounded-2xl bg-[#111111] border border-zinc-800 p-6 hover:-translate-y-1 hover:border-zinc-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-700 p-2 text-white"><Code2 className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm text-zinc-400">Languages analyzed</p>
                      <h3 className="mt-1 text-2xl font-semibold">{stats.languagesUsed}</h3>
                      <p className="mt-1 text-xs text-zinc-500">Out of 10 supported</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-2 col-span-3 rounded-2xl bg-[#111111] border border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-zinc-200" />
                <h4 className="text-lg font-semibold">Score Trend</h4>
              </div>
              <div className="text-sm text-zinc-400">Last 10 reviews</div>
            </div>

            <div className="mt-4 h-64">
              {loading ? (
                <Skeleton className="h-full rounded-lg bg-zinc-800" />
              ) : trend.length < 2 ? (
                <div className="flex h-full items-center justify-center text-zinc-500">Complete more reviews to see your trend</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid stroke="#3f3f46" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
                    <Tooltip wrapperStyle={{ background: '#0b0b0b', border: '1px solid #27272a' }} />
                    <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} animationDuration={1000} animationBegin={200} animationEasing="ease-out" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-[#111111] border border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <Code2 className="h-5 w-5 text-zinc-200" />
              <h4 className="text-lg font-semibold">Languages Used</h4>
            </div>
            <div className="mt-4">
              {!langDistribution || Object.keys(langDistribution).length === 0 ? (
                <div className="text-zinc-500">No data yet</div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {Object.entries(langDistribution).map(([lang, count]) => (
                    <li key={lang} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`inline-block h-3 w-3 rounded-full ${languageColors[lang] || 'bg-zinc-400'}`} />
                        <span className="text-sm">{lang}</span>
                      </div>
                      <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 col-span-3 rounded-2xl bg-[#111111] border border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Recent Reviews</h4>
              <Link href="/history" className="text-sm text-blue-500">View All</Link>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {loading && (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <Skeleton className="h-12 w-12 rounded-md bg-zinc-800" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                      <Skeleton className="mt-2 h-3 w-1/2 bg-zinc-800" />
                    </div>
                    <Skeleton className="h-8 w-20 bg-zinc-800 rounded-md" />
                  </div>
                ))
              )}

              {!loading && recent && recent.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-zinc-500">
                  <div className="text-6xl">📄</div>
                  <div className="text-lg font-semibold">No reviews yet</div>
                  <div>Start your first code review to see it here</div>
                  <Link href="/new-review" className="mt-2 rounded-md bg-blue-600 px-4 py-2">New Review</Link>
                </div>
              )}

              {!loading && recent && recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-4 rounded-md border border-zinc-800 bg-[#0f0f0f] p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-md ${languageColors[r.language] || 'bg-zinc-500'} flex items-center justify-center text-black font-bold`}>{r.language.slice(0,2)}</div>
                    <div>
                      <div className="max-w-xl truncate text-sm">{r.finalVerdict}</div>
                      <div className="mt-1 text-xs text-zinc-500">{formatRelativeTime(r.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full px-3 py-1 text-sm ${r.overallScore > 80 ? 'bg-green-600' : r.overallScore > 60 ? 'bg-yellow-500' : 'bg-red-600'}`}>{r.overallScore}</div>
                    <div className={`rounded-full px-3 py-1 text-sm ${r.bugsFound > 0 ? 'bg-red-600' : 'bg-green-600'}`}>{r.bugsFound} bugs</div>
                    <div className="text-zinc-400"><Star className={`h-4 w-4 ${r.isFavorited ? 'text-yellow-400' : 'text-zinc-600'}`} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#111111] border border-zinc-800 p-6">
            <h4 className="text-lg font-semibold">Quick Actions</h4>
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/new-review" className="rounded-md bg-blue-600 px-4 py-2 text-center">New Review</Link>
              <Link href="/history" className="rounded-md border border-zinc-700 px-4 py-2 text-center">View History</Link>
              <Link href="/chat" className="rounded-md border border-zinc-700 px-4 py-2 text-center text-purple-300">AI Chat</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
