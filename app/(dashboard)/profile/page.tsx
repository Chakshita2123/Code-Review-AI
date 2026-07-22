'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FileCode, Loader2, Star, TrendingUp, Flame, Award, Bug, Shield, Code, Globe, MessageSquare } from 'lucide-react';
import { formatReviewDate, formatRelativeTime } from '@/utils/formatDate';
import type { AchievementDef } from '@/utils/achievements';

interface ProfileStats {
  totalReviews: number;
  averageScore: number;
  favoritesCount: number;
  recentActivity: Array<{
    id: string;
    language: string;
    score: number;
    createdAt: string;
  }>;
  lastReviewDate: string | null;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  image?: string;
  provider: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [achievements, setAchievements] = useState<{ earned: AchievementDef[]; locked: AchievementDef[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        
        const achRes = await fetch('/api/achievements');
        const achData = await achRes.json();

        if (data.success) {
          setProfile(data.profile);
          setStats(data.stats);
        }
        if (achData.success) {
          setAchievements({ earned: achData.earned, locked: achData.locked });
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchProfile();
  }, []);

  if (isLoading || !profile || !stats) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Helpers for stats display
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getIcon = (iconStr: string, className = "h-6 w-6") => {
    switch (iconStr) {
      case 'star': return <Star className={className} />;
      case 'flame': return <Flame className={className} />;
      case 'award': return <Award className={className} />;
      case 'bug': return <Bug className={className} />;
      case 'shield': return <Shield className={className} />;
      case 'code': return <Code className={className} />;
      case 'globe': return <Globe className={className} />;
      case 'message': return <MessageSquare className={className} />;
      default: return <Star className={className} />;
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6 lg:p-8">
      {/* ── Header Section ─────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
        <div className="relative mb-4 h-20 w-20 shrink-0 sm:mb-0">
          {profile.image ? (
            <Image
              src={profile.image}
              alt={profile.name}
              fill
              className="rounded-full object-cover ring-2 ring-blue-500/30"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-500/20 text-2xl font-bold text-blue-400 ring-2 ring-blue-500/30">
              {getInitials(profile.name)}
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{profile.name}</h1>
          <p className="mt-1 text-[var(--text-secondary)]">{profile.email}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Member since {memberSince}</p>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3 text-[var(--text-secondary)]">
            <FileCode className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-medium">Reviews Completed</h3>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{stats.totalReviews}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3 text-[var(--text-secondary)]">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-medium">Average Score</h3>
          </div>
          <p className={`mt-3 text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
            {stats.averageScore > 0 ? stats.averageScore : '-'}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-3 text-[var(--text-secondary)]">
            <Star className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-medium">Favorites</h3>
          </div>
          <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{stats.favoritesCount}</p>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {/* ── Recent Activity ────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Recent Activity</h2>
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]/50 overflow-hidden">
            {stats.recentActivity.length > 0 ? (
              <div className="divide-y divide-[var(--border-primary)]/50">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{activity.language} Review</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                    <div className={`font-bold ${getScoreColor(activity.score)}`}>
                      {activity.score}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
                No recent activity found.
              </div>
            )}
            <div className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 p-3 text-center">
              <Link href="/history" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition">
                View all reviews
              </Link>
            </div>
          </div>
        </section>

        {/* ── Account Info Card ─────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Account Information</h2>
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]/50 p-5">
            <dl className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
                <dt className="text-sm text-[var(--text-secondary)]">Name</dt>
                <dd className="text-sm font-medium text-[var(--text-primary)]">{profile.name}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
                <dt className="text-sm text-[var(--text-secondary)]">Email</dt>
                <dd className="text-sm font-medium text-[var(--text-primary)]">{profile.email}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
                <dt className="text-sm text-[var(--text-secondary)]">Auth Provider</dt>
                <dd className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)] capitalize">
                  {profile.provider === 'google' && (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
                    </svg>
                  )}
                  {profile.provider}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
                <dt className="text-sm text-[var(--text-secondary)]">Account Created</dt>
                <dd className="text-sm font-medium text-[var(--text-primary)]">{formatReviewDate(profile.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-[var(--text-secondary)]">Last Review</dt>
                <dd className="text-sm font-medium text-[var(--text-primary)]">
                  {stats.lastReviewDate ? formatReviewDate(stats.lastReviewDate) : 'Never'}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      {/* ── Achievements Section ────────────────────────────────────────── */}
      {achievements && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Achievements</h2>
            <span className="text-sm text-[var(--text-secondary)] font-medium">
              {achievements.earned.length} / {achievements.earned.length + achievements.locked.length} Unlocked
            </span>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {achievements.earned.map((ach) => (
              <div
                key={ach.id}
                title={ach.description}
                className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center transition-transform hover:scale-105 ${ach.color}`}
              >
                <div className="mb-3 rounded-full bg-white/10 p-3 shadow-inner">
                  {getIcon(ach.icon)}
                </div>
                <h3 className="font-semibold">{ach.title}</h3>
                <p className="mt-1 text-xs opacity-80">{ach.description}</p>
              </div>
            ))}
            
            {achievements.locked.map((ach) => (
              <div
                key={ach.id}
                title={ach.description}
                className="group relative flex flex-col items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]/50 p-5 text-center grayscale transition-all hover:grayscale-0 hover:border-zinc-700"
              >
                <div className="mb-3 rounded-full bg-zinc-800 p-3 text-zinc-600 group-hover:text-zinc-400 group-hover:bg-zinc-700/50 transition-colors">
                  {getIcon(ach.icon)}
                </div>
                <h3 className="font-semibold text-zinc-500 group-hover:text-zinc-300">{ach.title}</h3>
                <p className="mt-1 text-xs text-zinc-600 group-hover:text-zinc-400">{ach.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
