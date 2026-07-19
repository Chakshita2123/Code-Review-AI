'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  History,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { DeveloperReport } from '@/components/review/DeveloperReport';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { IDeveloperReport, SupportedLanguage } from '@/types';
import { formatReviewDate } from '@/utils/formatDate';
import { SUPPORTED_LANGUAGES } from '@/utils/languageColors';

type SortBy = 'newest' | 'oldest' | 'highest' | 'lowest';

interface HistoryListItem {
  id: string;
  language: string;
  overallScore: number;
  bugsFound: number;
  performance: number;
  readability: number;
  security: number;
  timeComplexity: string;
  spaceComplexity: string;
  finalVerdict: string;
  isFavorited: boolean;
  createdAt: string;
}

interface HistoryResponse {
  success: boolean;
  reviews: HistoryListItem[];
  total: number;
  page: number;
  totalPages: number;
  averageScore: number;
  favoritesCount: number;
  totalAll: number;
}

interface FullReview {
  id: string;
  language: SupportedLanguage;
  originalCode: string;
  improvedCode?: string;
  report: IDeveloperReport;
  isFavorited: boolean;
  createdAt: string;
}

// ─── Language badge style map ────────────────────────────────────────────────
const languageBadgeMap: Record<string, { bg: string; text: string; dot: string }> = {
  JavaScript: { bg: 'bg-yellow-500/15 border-yellow-500/25', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  TypeScript: { bg: 'bg-blue-500/15 border-blue-500/25', text: 'text-blue-300', dot: 'bg-blue-400' },
  Python: { bg: 'bg-emerald-500/15 border-emerald-500/25', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  Java: { bg: 'bg-orange-500/15 border-orange-500/25', text: 'text-orange-300', dot: 'bg-orange-400' },
  'C++': { bg: 'bg-red-500/15 border-red-500/25', text: 'text-red-300', dot: 'bg-red-400' },
  C: { bg: 'bg-zinc-500/15 border-zinc-500/25', text: 'text-zinc-300', dot: 'bg-zinc-400' },
  Go: { bg: 'bg-cyan-500/15 border-cyan-500/25', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  Rust: { bg: 'bg-orange-600/15 border-orange-600/25', text: 'text-orange-400', dot: 'bg-orange-500' },
  PHP: { bg: 'bg-purple-500/15 border-purple-500/25', text: 'text-purple-300', dot: 'bg-purple-400' },
  'C#': { bg: 'bg-pink-500/15 border-pink-500/25', text: 'text-pink-300', dot: 'bg-pink-400' },
};

function getLanguageBadge(lang: string) {
  return languageBadgeMap[lang] ?? { bg: 'bg-zinc-500/15 border-zinc-500/25', text: 'text-zinc-300', dot: 'bg-zinc-400' };
}

function getScoreColor(score: number): string {
  if (score > 80) return '#34d399';
  if (score > 60) return '#f59e0b';
  return '#f87171';
}

function getScoreLabel(score: number): string {
  if (score > 80) return 'text-emerald-400';
  if (score > 60) return 'text-amber-400';
  return 'text-red-400';
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ─── Score Circle ─────────────────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const color = getScoreColor(score);
  const circumference = 113;
  const offset = circumference - (circumference * Math.max(0, Math.min(100, score))) / 100;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r="18" stroke="rgba(255,255,255,0.07)" strokeWidth="4" fill="none" />
        <motion.circle
          cx="24"
          cy="24"
          r="18"
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
      <span className={`absolute text-sm font-bold ${getScoreLabel(score)}`}>{score}</span>
    </div>
  );
}

// ─── Metric pill ──────────────────────────────────────────────────────────────
function MetricBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-zinc-400">
      <span className="text-zinc-600">{label}:</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </span>
  );
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({
  total,
  averageScore,
  favoritesCount,
}: {
  total: number;
  averageScore: number;
  favoritesCount: number;
}) {
  const scoreColor =
    averageScore > 80
      ? 'text-emerald-400'
      : averageScore > 60
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-[var(--border-primary)] bg-gradient-to-r from-zinc-900/80 to-[var(--bg-card)]/80 px-5 py-3 text-sm backdrop-blur"
    >
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
        <span className="font-semibold text-[var(--text-primary)]">{total}</span> total reviews
      </div>
      <span className="hidden text-zinc-700 sm:inline">·</span>
      <div className="flex items-center gap-2 text-zinc-400">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        Average score:&nbsp;
        <span className={`font-semibold ${scoreColor}`}>{averageScore}</span>
        <span className="text-zinc-600">/100</span>
      </div>
      <span className="hidden text-zinc-700 sm:inline">·</span>
      <div className="flex items-center gap-2 text-zinc-400">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="font-semibold text-white">{favoritesCount}</span> favorites
      </div>
    </motion.div>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────
function HistoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
  const language = searchParams.get('language') || '';
  const favorited = searchParams.get('favorited') === 'true';
  const sortBy = (searchParams.get('sortBy') || 'newest') as SortBy;
  const urlSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [reviews, setReviews] = useState<HistoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<IDeveloperReport | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HistoryListItem | null>(null);

  const hasActiveFilters = Boolean(debouncedSearch || language || favorited);

  // ── URL param helper ─────────────────────────────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      });
      router.push(`/history?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // ── Debounce search input ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      updateParams({ search: debouncedSearch || null, page: '1' });
    }
  }, [debouncedSearch, urlSearch, updateParams]);

  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [urlSearch]);

  // ── Fetch reviews ────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function loadReviews() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '10',
          sortBy,
        });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (language) params.set('language', language);
        if (favorited) params.set('favorited', 'true');

        const response = await fetch(`/api/history?${params.toString()}`);
        const data = (await response.json()) as HistoryResponse;

        if (!mounted) return;

        if (data.success) {
          setReviews(data.reviews ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 0);
          setAverageScore(data.averageScore ?? 0);
          setFavoritesCount(data.favoritesCount ?? 0);
          setTotalAll(data.totalAll ?? 0);
        }
      } catch {
        if (mounted) setReviews([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadReviews();
    return () => {
      mounted = false;
    };
  }, [page, debouncedSearch, language, favorited, sortBy]);

  const showingFrom = total === 0 ? 0 : (page - 1) * 10 + 1;
  const showingTo = Math.min(page * 10, total);
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  // ── Toggle favorite (optimistic) ─────────────────────────────────────────
  const toggleFavorite = async (review: HistoryListItem) => {
    const previous = review.isFavorited;
    setFavoriteLoadingId(review.id);
    setReviews((curr) => curr.map((r) => (r.id === review.id ? { ...r, isFavorited: !r.isFavorited } : r)));
    setFavoritesCount((c) => (previous ? c - 1 : c + 1));

    try {
      const res = await fetch(`/api/history/${review.id}/favorite`, { method: 'PATCH' });
      const data = await res.json();
      if (!data.success) {
        setReviews((curr) => curr.map((r) => (r.id === review.id ? { ...r, isFavorited: previous } : r)));
        setFavoritesCount((c) => (previous ? c + 1 : c - 1));
      }
    } catch {
      setReviews((curr) => curr.map((r) => (r.id === review.id ? { ...r, isFavorited: previous } : r)));
      setFavoritesCount((c) => (previous ? c + 1 : c - 1));
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  // ── Delete review ────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const reviewId = deleteTarget.id;
    setDeleteLoadingId(reviewId);

    try {
      const res = await fetch(`/api/history/${reviewId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReviews((curr) => curr.filter((r) => r.id !== reviewId));
        setTotal((t) => Math.max(0, t - 1));
        setTotalAll((t) => Math.max(0, t - 1));
        if (deleteTarget.isFavorited) setFavoritesCount((c) => Math.max(0, c - 1));
        if (expandedId === reviewId) {
          setExpandedId(null);
          setExpandedReport(null);
        }
      }
    } catch {
      // noop
    } finally {
      setDeleteLoadingId(null);
      setDeleteTarget(null);
    }
  };

  // ── Expand / collapse full report ────────────────────────────────────────
  const toggleExpand = async (review: HistoryListItem) => {
    if (expandedId === review.id) {
      setExpandedId(null);
      setExpandedReport(null);
      return;
    }

    setExpandedId(review.id);
    setLoadingReportId(review.id);

    try {
      const res = await fetch(`/api/history/${review.id}`);
      const data = (await res.json()) as { success: boolean; review?: FullReview };
      if (data.success && data.review) {
        setExpandedReport(data.review.report);
      }
    } catch {
      setExpandedId(null);
      setExpandedReport(null);
    } finally {
      setLoadingReportId(null);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    router.push('/history', { scroll: false });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] p-4 text-[var(--text-primary)] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-indigo-500/10">
              <History className="h-5 w-5 text-blue-400" />
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent opacity-50" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                Review History
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">All your past code reviews in one place</p>
            </div>
          </div>

          <Link
            href="/new-review"
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/10 transition-all hover:border-blue-400/50 hover:bg-blue-500 hover:shadow-blue-500/25"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            New Review
          </Link>
        </motion.div>

        {/* ── Search & filter bar ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]/40 p-4 backdrop-blur lg:flex-row lg:items-center"
        >
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              id="history-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search reviews..."
              className="border-zinc-700/50 bg-[var(--bg-input)] pl-10 text-[var(--text-primary)] placeholder:text-zinc-650 focus:border-blue-500/50 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language filter */}
            <Select
              id="history-language-filter"
              value={language}
              onChange={(e) => updateParams({ language: e.target.value || null, page: '1' })}
              className="h-10 min-w-[150px] border-zinc-700/50 bg-[#0f0f0f] text-white"
            >
              <option value="">All Languages</option>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </Select>

            {/* Favorites toggle */}
            <button
              id="history-favorites-toggle"
              type="button"
              onClick={() => updateParams({ favorited: favorited ? null : 'true', page: '1' })}
              className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                favorited
                  ? 'border-amber-500/40 bg-amber-500/12 text-amber-400 shadow-sm shadow-amber-500/10'
                  : 'border-zinc-700/50 bg-[#0f0f0f] text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              <Star className={`h-4 w-4 transition-all ${favorited ? 'fill-amber-400 text-amber-400' : ''}`} />
              Favorites Only
            </button>

            {/* Sort dropdown */}
            <Select
              id="history-sort"
              value={sortBy}
              onChange={(e) => updateParams({ sortBy: e.target.value, page: '1' })}
              className="h-10 min-w-[155px] border-zinc-700/50 bg-[#0f0f0f] text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Score</option>
              <option value="lowest">Lowest Score</option>
            </Select>
          </div>
        </motion.div>

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        {!loading && totalAll > 0 && (
          <StatsBar total={total} averageScore={averageScore} favoritesCount={favoritesCount} />
        )}

        {/* ── Content area ─────────────────────────────────────────────── */}
        {loading ? (
          <HistorySkeleton />
        ) : totalAll === 0 ? (
          /* Empty — no reviews at all */
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-primary)] bg-gradient-to-br from-[var(--bg-card)] to-zinc-900/50 px-6 py-20 text-center"
          >
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-700/50 bg-zinc-800/50">
              <History className="h-10 w-10 text-zinc-500" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">No reviews yet</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
              Run your first code review and it will appear here automatically.
            </p>
            <Link
              href="/new-review"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Start reviewing
            </Link>
          </motion.div>
        ) : reviews.length === 0 ? (
          /* Empty — filters returned no results */
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-primary)] bg-gradient-to-br from-[var(--bg-card)] to-zinc-900/50 px-6 py-20 text-center"
          >
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-700/50 bg-zinc-800/50">
              <Search className="h-10 w-10 text-zinc-500" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">No reviews match your search</h2>
            <p className="mt-2 text-sm text-zinc-500">Try different filters or clear your search</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* ── Review cards list ──────────────────────────────────── */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {reviews.map((review, index) => {
                  const badge = getLanguageBadge(review.language);
                  const isExpanded = expandedId === review.id;

                  return (
                    <motion.div
                      key={review.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="group relative overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 transition-all duration-200 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/30"
                    >
                      {/* Subtle gradient glow on hover */}
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:from-blue-500/3" />

                      {/* ── Top row ─────────────────────────────────── */}
                      <div className="relative flex flex-wrap items-center justify-between gap-3">
                        {/* Language badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${badge.bg} ${badge.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {review.language}
                        </span>

                        {/* Date (centered on larger screens) */}
                        <span className="text-xs text-zinc-500">
                          {formatReviewDate(review.createdAt)}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            id={`favorite-${review.id}`}
                            type="button"
                            onClick={() => void toggleFavorite(review)}
                            disabled={favoriteLoadingId === review.id}
                            aria-label={review.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                            className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-zinc-800 hover:text-amber-400 disabled:opacity-40"
                          >
                            {favoriteLoadingId === review.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Star
                                className={`h-4 w-4 transition-all ${
                                  review.isFavorited
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                                    : ''
                                }`}
                              />
                            )}
                          </button>

                          <button
                            id={`delete-${review.id}`}
                            type="button"
                            onClick={() => setDeleteTarget(review)}
                            disabled={deleteLoadingId === review.id}
                            aria-label="Delete review"
                            className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                          >
                            {deleteLoadingId === review.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* ── Middle row ──────────────────────────────── */}
                      <div className="relative mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Animated score circle */}
                        <ScoreCircle score={review.overallScore} />

                        <div className="flex-1 space-y-2.5">
                          {/* Metrics */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <MetricBadge label="Bugs" value={review.bugsFound} />
                            <span className="text-zinc-700">|</span>
                            <MetricBadge label="Performance" value={`${review.performance}/10`} />
                            <span className="text-zinc-700">|</span>
                            <MetricBadge label="Readability" value={`${review.readability}/10`} />
                            <span className="text-zinc-700">|</span>
                            <MetricBadge label="Security" value={`${review.security}/10`} />
                          </div>

                          {/* Complexity badges */}
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/60 bg-zinc-900 px-2.5 py-0.5 text-xs text-zinc-400">
                              <span className="font-medium text-zinc-500">Time:</span>
                              {review.timeComplexity}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/60 bg-zinc-900 px-2.5 py-0.5 text-xs text-zinc-400">
                              <span className="font-medium text-zinc-500">Space:</span>
                              {review.spaceComplexity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── Bottom row ──────────────────────────────── */}
                      <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">
                          {review.finalVerdict}
                        </p>

                        <button
                          id={`expand-${review.id}`}
                          type="button"
                          onClick={() => void toggleExpand(review)}
                          className="group/btn inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/8 hover:text-blue-300"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5 transition-transform" />
                              Collapse
                            </>
                          ) : (
                            <>
                              View Full Report
                              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* ── Expanded full report ─────────────────────── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="mt-6 border-t border-zinc-800/80 pt-6">
                              {loadingReportId === review.id ? (
                                <div className="flex items-center justify-center gap-3 py-12 text-zinc-500">
                                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                                  <span className="text-sm">Loading full report…</span>
                                </div>
                              ) : expandedReport ? (
                                <DeveloperReport report={expandedReport} />
                              ) : (
                                <p className="text-sm text-zinc-500">Unable to load report.</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* ── Pagination ────────────────────────────────────────── */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
              >
                <p className="text-sm text-zinc-500">
                  Showing{' '}
                  <span className="font-medium text-zinc-300">
                    {showingFrom}–{showingTo}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-zinc-300">{total}</span> reviews
                </p>

                <div className="flex items-center gap-1">
                  <button
                    id="pagination-prev"
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: String(page - 1) })}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      id={`pagination-${num}`}
                      type="button"
                      onClick={() => updateParams({ page: String(num) })}
                      className={`min-w-[36px] rounded-lg border px-2 py-1.5 text-sm transition ${
                        num === page
                          ? 'border-blue-500/40 bg-blue-500/10 font-semibold text-blue-400 shadow-sm shadow-blue-500/10'
                          : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    id="pagination-next"
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => updateParams({ page: String(page + 1) })}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ── Delete confirmation dialog ──────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Review</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure? This action cannot be undone and will permanently remove this review.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void confirmDelete()}
            disabled={!!deleteLoadingId}
          >
            {deleteLoadingId ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting…
              </span>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </main>
  );
}

// ─── Suspense fallback ────────────────────────────────────────────────────────
function HistoryPageFallback() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <Skeleton className="mb-6 h-16 w-full rounded-2xl" />
        <HistorySkeleton />
      </div>
    </main>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryPageFallback />}>
      <HistoryPageContent />
    </Suspense>
  );
}
