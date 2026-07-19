'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Check, Download, Edit2, Loader2, Trash2, LogOut, Shield, Lock, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  provider: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  
  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Actions State
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Delete Account State
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');

  // UI Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
          setEditNameValue(data.profile.name);
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchProfile();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveName = async () => {
    if (!editNameValue.trim() || editNameValue === profile?.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editNameValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => (prev ? { ...prev, name: data.name } : null));
        setIsEditingName(false);
        showToast('Name updated successfully');
      } else {
        showToast(data.message || 'Failed to update name', 'error');
      }
    } catch (err) {
      showToast('Server error while saving name', 'error');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/user/reviews');
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.reviews, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-reviews-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Data exported successfully');
      }
    } catch (err) {
      showToast('Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/user/reviews', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Cleared ${data.deletedCount} reviews`);
      } else {
        showToast('Failed to clear history', 'error');
      }
    } catch (err) {
      showToast('Server error while clearing history', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmailConfirm !== profile?.email) return;
    
    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/user/account', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await signOut({ callbackUrl: '/' });
      } else {
        showToast(data.message || 'Failed to delete account', 'error');
        setIsDeletingAccount(false);
      }
    } catch (err) {
      showToast('Server error while deleting account', 'error');
      setIsDeletingAccount(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 lg:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-xl transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {toastMessage.type === 'success' ? <Check className="h-4 w-4" /> : null}
            {toastMessage.text}
          </div>
        </div>
      )}

      <h1 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      <div className="space-y-8">
        {/* ── Appearance ──────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-zinc-400">Appearance</h2>
          <div className="flex items-center justify-between p-5 rounded-xl border border-zinc-800 bg-[#111111]">
            <div>
              <p className="font-medium text-white">Theme</p>
              <p className="text-sm text-zinc-400 mt-0.5">
                🌙 Dark mode only
              </p>
            </div>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-lg">
              Dark Mode
            </span>
          </div>
        </section>

        {/* ── Account ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">Account</h2>
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]/30 overflow-hidden divide-y divide-[var(--border-primary)]/50">
            {/* Display Name */}
            <div className="flex items-center justify-between p-5">
              <div className="flex-1 mr-4">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Display Name</h3>
                {isEditingName ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="h-8 w-full max-w-xs text-sm"
                      placeholder="Your name"
                      autoFocus
                      disabled={isSavingName}
                    />
                    <button
                      onClick={() => void handleSaveName()}
                      disabled={isSavingName}
                      className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {isSavingName ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditNameValue(profile.name);
                      }}
                      disabled={isSavingName}
                      className="rounded px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{profile.name}</p>
                )}
              </div>
              {!isEditingName && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)]"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              )}
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Email</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{profile.email}</p>
              </div>
              <div className="rounded-md bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 border border-blue-500/20">
                Google managed
              </div>
            </div>

            {/* Photo */}
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Profile Photo</h3>
              </div>
              <div className="rounded-md bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 border border-blue-500/20">
                Google managed
              </div>
            </div>
          </div>
        </section>

        {/* ── Security ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">Security</h2>
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]/30 overflow-hidden divide-y divide-[var(--border-primary)]/50">
            {/* Auth Provider */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)]/50">
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">Authentication</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">How you sign in to your account</p>
                </div>
              </div>
              <div className="rounded-md bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 border border-blue-500/20">
                {profile.provider === 'google' ? 'Google (OAuth 2.0)' : profile.provider}
              </div>
            </div>

            {/* Data Encryption */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)]/50">
                  <Lock className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">Data Encryption</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Your data is encrypted in transit and at rest</p>
                </div>
              </div>
              <div className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                Enabled
              </div>
            </div>

            {/* Session */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)]/50">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">Active Session</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Sessions expire automatically after 7 days</p>
                </div>
              </div>
              <div className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                1 Active
              </div>
            </div>

            {/* Privacy */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)]/50">
                  <Lock className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">Review Privacy</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Reviews are private and only visible to you</p>
                </div>
              </div>
              <div className="rounded-md bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 border border-blue-500/20">
                Private
              </div>
            </div>
          </div>
        </section>

        {/* ── Data & Privacy ──────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">Data & Privacy</h2>
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]/30 overflow-hidden divide-y divide-[var(--border-primary)]/50">
            {/* Export */}
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Export Reviews</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Download all your reviews as JSON</p>
              </div>
              <button
                onClick={() => void handleExportData()}
                disabled={isExporting}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Export
              </button>
            </div>

            {/* Clear History */}
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Clear Review History</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Delete all your saved reviews permanently</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20">
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear All
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Reviews</AlertDialogTitle>
                    <AlertDialogDescription className="text-[var(--text-secondary)]">
                      This will permanently delete all your code reviews. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-[var(--border-primary)] bg-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleClearHistory()}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clear All'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>

        {/* ── Danger Zone ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-red-400">Danger Zone</h2>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden divide-y divide-red-500/10">
            {/* Delete Account */}
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-sm font-medium text-red-400">Delete Account</h3>
                <p className="mt-1 text-xs text-red-400/70">Permanently delete your account and all data</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={() => setDeleteEmailConfirm('')}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    Delete Account
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-red-900/50 bg-[var(--bg-card)] text-[var(--text-primary)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-400">Delete Account</AlertDialogTitle>
                    <AlertDialogDescription className="text-[var(--text-secondary)]">
                      This will permanently delete your account, all reviews, and all conversations. This cannot be undone.
                      <br /><br />
                      Type <span className="font-semibold text-[var(--text-primary)]">{profile.email}</span> to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-2">
                    <Input
                      value={deleteEmailConfirm}
                      onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                      placeholder={profile.email}
                      className="border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-[var(--border-primary)] bg-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                      Cancel
                    </AlertDialogCancel>
                    <button
                      onClick={() => void handleDeleteAccount()}
                      disabled={deleteEmailConfirm !== profile.email || isDeletingAccount}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Account'}
                    </button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Sign Out */}
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Sign Out</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Sign out of your account on this device</p>
              </div>
              <button
                onClick={() => void signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
