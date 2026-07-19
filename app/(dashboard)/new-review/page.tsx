'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trash2, ScanSearch, Zap, Upload, Flame, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CodeEditor } from '@/components/review/CodeEditor';
import { DeveloperReport } from '@/components/review/DeveloperReport';
import { ReviewLoader } from '@/components/review/ReviewLoader';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useReviews } from '@/hooks/useReviews';
import { detectLanguage } from '@/utils/detectLanguage';
import type { IApproach, IDeveloperReport } from '@/types';
import type { SupportedLanguage } from '@/types';
import { formatRelativeTime } from '@/utils/formatDate';

const defaultCode = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`;

const supportedLanguages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'Go', 'Rust', 'PHP', 'C#'];

export default function NewReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isLoading, error, report, reviewId, streamingStatus, submitReview, explainCode, generateImproved } = useReviews();
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState<SupportedLanguage>('JavaScript');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [reviewComplete, setReviewComplete] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [explanation, setExplanation] = useState('');
  const [approaches, setApproaches] = useState<IApproach[]>([]);
  const [actionLoading, setActionLoading] = useState<'explain' | 'improve' | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [roastMode, setRoastMode] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const hasUserChangedLanguage = useRef(false);

  const AUTOSAVE_KEY = 'code-review-ai:autosave';
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const toast = ({ title, description }: { title: string; description: string }) => {
    showToast(`${title} - ${description}`);
  };

  // Restore on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const { code: savedCode, language: savedLang, savedAt } = JSON.parse(saved);
        const age = Date.now() - savedAt;
        if (age < 86400000 && savedCode?.trim()) {
          setCode(savedCode);
          setLanguage(savedLang || 'JavaScript');
          toast({ title: '📝 Code Restored', description: 'Your previous session has been restored.' });
        }
      }
    } catch (e) {
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  }, []);

  // Auto-save with 2s debounce
  useEffect(() => {
    if (!code.trim()) return;
    const timer = setTimeout(() => {
      localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({
          code,
          language,
          savedAt: Date.now(),
        })
      );
      setLastSaved(new Date());
    }, 2000);
    return () => clearTimeout(timer);
  }, [code, language]);

  // Sync completion states when report is updated
  useEffect(() => {
    if (report) {
      setReviewComplete(true);
      setIsSaved(Boolean(reviewId));
      setExplanation('');
      setApproaches([]);
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast(`Review complete! Score: ${report.overallScore}/100`);
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  }, [report, reviewId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3200);
  };

  // Auto-detect language when code changes (only if user hasn't manually picked a language)
  useEffect(() => {
    if (hasUserChangedLanguage.current || !code.trim()) return;

    const detected = detectLanguage(code, language);
    if (detected !== language) {
      setLanguage(detected);
      showToast(`Detected: ${detected}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    hasUserChangedLanguage.current = true;
    setLanguage(event.target.value as SupportedLanguage);
  };

  const handleReview = async () => {
    if (!code.trim() || isLoading) return;

    try {
      await submitReview(code, language, roastMode);
    } catch {
      setReviewComplete(false);
      showToast('Unable to generate the review right now.');
    }
  };

  const handleExplainCode = async () => {
    if (!code.trim() || !report) return;
    setActionLoading('explain');
    try {
      const explanationText = await explainCode(code, language);
      setExplanation(explanationText);
      showToast('Explanation generated.');
    } catch {
      showToast('Unable to explain the code right now.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateImprovedCode = async () => {
    if (!code.trim() || !report) return;
    setActionLoading('improve');
    try {
      const result = await generateImproved(code, language);
      setApproaches(result);
      showToast('Improvement approaches generated.');
    } catch {
      showToast('Unable to generate improved code right now.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveReview = () => {
    if (!reviewId && !report) return;
    setIsSaved(true);
    showToast('Review saved to your history.');
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCode(text);
    setUploadedFileName(file.name);
    // Reset manual language override so auto-detect can kick in for uploaded files
    hasUserChangedLanguage.current = false;
  };

  const resetEditor = () => {
    setCode('');
    setUploadedFileName('');
    setReviewComplete(false);
    setExplanation('');
    setApproaches([]);
    setIsSaved(false);
    hasUserChangedLanguage.current = false;
  };

  if (status === 'loading') {
    return <main className="min-h-screen bg-background p-8 text-foreground" />;
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      {toastMessage ? (
        <div className="fixed right-4 top-4 z-50 rounded-2xl border border-blue-500/20 bg-zinc-950/95 px-4 py-3 text-sm text-blue-100 shadow-2xl shadow-blue-500/10">
          {toastMessage}
        </div>
      ) : null}

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-5 py-5 shadow-[0_0_80px_rgba(8,15,30,0.3)]">
          <div>
            <div className="flex items-center gap-2 text-blue-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">AI Review Studio</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">New Review</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-blue-500/40 hover:text-[var(--text-primary)]">
              <Upload className="h-4 w-4" />
              Upload File
              <input type="file" accept=".js,.ts,.py,.java,.cpp,.c,.go,.rs,.php,.cs" className="hidden" onChange={handleUpload} />
            </label>

            <Button variant="outline" onClick={resetEditor} className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>

            <Select value={language} onChange={handleLanguageChange} className="w-[180px] bg-[var(--bg-input)]">
              {supportedLanguages.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>

            <button
              onClick={() => setRoastMode(!roastMode)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                roastMode
                  ? 'border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                  : 'border-zinc-700 bg-transparent text-[var(--text-secondary)] hover:border-zinc-600 hover:text-[var(--text-primary)]'
              }`}
              title="Get brutally honest feedback"
            >
              <Flame className={`h-4 w-4 ${roastMode ? 'animate-pulse text-orange-500' : ''}`} />
              Roast Mode
            </button>

            <div className="flex flex-col items-end gap-1.5">
              <Button onClick={handleReview} disabled={!code.trim() || isLoading} className="bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isLoading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Review Code
                  </>
                )}
              </Button>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Lock className="h-3 w-3 text-emerald-500/70" />
                <span>Your code is processed securely &amp; privately</span>
              </div>
            </div>
          </div>
        </div>

        {uploadedFileName ? <div className="text-sm text-[var(--text-secondary)]">Loaded file: {uploadedFileName}</div> : null}

        <div className="flex h-[calc(100vh-80px)] gap-4">
          <div className="flex flex-col flex-none w-[55%]">
            <div className={`relative flex-1 overflow-hidden rounded-2xl border bg-[var(--bg-card)] ${isLoading ? 'border-pulse-blue border-blue-500/30' : 'border-[var(--border-primary)]'}`}>
              {isLoading && <div className="scan-line" />}
              <CodeEditor value={code} language={language} onChange={setCode} />
            </div>
            {lastSaved && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 px-1">
                💾 Auto-saved {formatRelativeTime(lastSaved)}
              </p>
            )}
          </div>

          <div ref={resultsRef} className="flex-1 overflow-y-auto rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ReviewLoader isRoastMode={roastMode} streamingStatus={streamingStatus} />
                </motion.div>
              ) : report ? (
                <motion.div key="report" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <DeveloperReport
                    report={report as IDeveloperReport}
                    originalCode={code}
                    language={language}
                    explanation={explanation}
                    approaches={approaches}
                    onExplainCode={handleExplainCode}
                    onGenerateImprovedCode={handleGenerateImprovedCode}
                    onSaveReview={handleSaveReview}
                    isActionLoading={actionLoading}
                    isSaved={isSaved}
                    isRoastMode={roastMode}
                  />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-card)] p-8 text-center">
                  <div className="mb-5 rounded-full border border-zinc-700 bg-zinc-800/70 p-4 text-zinc-500">
                    <ScanSearch className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Your review will appear here</h2>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--text-secondary)]">Paste your code and click Review Code to receive a detailed AI-powered analysis.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {['Bug Detection', 'Performance', 'Security'].map((pill) => (
                      <span key={pill} className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
                        {pill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
