'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Bug, CheckCircle2, Cpu, Lightbulb, Lock, Sparkles, Tag, XCircle, Zap, Download, Flame, X, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { ScoreCircle } from '@/components/review/ScoreCircle';
import type { IApproach, IDeveloperReport } from '@/types';

/* ── Spring card variants ──────────────────────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, x: 50, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      delay: i * 0.12,
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  }),
};

const MonacoEditorComponent = dynamic(() => import('@monaco-editor/react').then((mod) => ({ default: mod.Editor })), {
  ssr: false,
});

interface DeveloperReportProps {
  report: IDeveloperReport;
  explanation?: string;
  approaches?: IApproach[];
  onExplainCode?: () => void;
  onGenerateImprovedCode?: () => void;
  onSaveReview?: () => void;
  isActionLoading?: 'explain' | 'improve' | null;
  isSaved?: boolean;
  originalCode?: string;
  language?: string;
  isRoastMode?: boolean;
}



function MetricPill({ label, value, tone }: { label: string; value: string | number; tone: 'green' | 'yellow' | 'red' | 'blue' }) {
  const toneClasses = {
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    red: 'bg-red-500/10 text-red-300 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  };

  return <div className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', toneClasses[tone])}>{label}: {value}</div>;
}

const DIFFICULTY_COLORS: Record<IApproach['difficulty'], { badge: string; border: string }> = {
  Easy: { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', border: 'border-emerald-500/30' },
  Medium: { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', border: 'border-amber-500/30' },
  Advanced: { badge: 'bg-red-500/15 text-red-300 border-red-500/30', border: 'border-red-500/30' },
};

export function DeveloperReport({
  report,
  explanation,
  approaches,
  onExplainCode,
  onGenerateImprovedCode,
  onSaveReview,
  isActionLoading,
  isSaved,
  originalCode,
  language,
  isRoastMode,
}: DeveloperReportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedApproachIndex, setSelectedApproachIndex] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const confettiFiredRef = useRef(false);

  const isRoast = isRoastMode || (report as any).isRoastMode;
  const scoreTone = report.overallScore > 80 ? 'green' : report.overallScore > 60 ? 'yellow' : 'red';

  const hasApproaches = approaches && approaches.length > 0;
  const selectedApproach = hasApproaches ? approaches[selectedApproachIndex] : null;

  useEffect(() => {
    if (explanation) setShowExplanationModal(true);
  }, [explanation]);

  useEffect(() => {
    if (hasApproaches) {
      setShowComparison(true);
      setSelectedApproachIndex(0);
    }
  }, [approaches, hasApproaches]);

  useEffect(() => {
    if (report.overallScore >= 85 && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#34d399', '#3b82f6', '#8b5cf6', '#fbbf24'],
        });
      });
    }
  }, [report.overallScore]);

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const reportElement = document.getElementById('developer-report-content');
      if (reportElement) {
        const canvas = await html2canvas(reportElement, { scale: 2, backgroundColor: '#09090b' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Code-Review-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (e) {
      console.error('Failed to export PDF', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveReviewWithConfetti = () => {
    if (onSaveReview) onSaveReview();
    // Score-based confetti burst
    const s = report.overallScore;
    import('canvas-confetti').then((mod) => {
      mod.default({
        particleCount: s > 85 ? 150 : s > 70 ? 80 : 30,
        spread: s > 85 ? 100 : 60,
        colors:
          s > 85
            ? ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B']
            : ['#3B82F6', '#8B5CF6'],
        origin: { y: 0.6 },
      });
    });
  };

  const handleCopyApproach = () => {
    if (!selectedApproach) return;
    navigator.clipboard.writeText(selectedApproach.code.trim());
    setCopyFeedback(true);
    window.setTimeout(() => setCopyFeedback(false), 1800);
  };

  return (
    <div className="space-y-3">
      {/* ── Banners ──────────────────────────────────────────────────────── */}
      {report.overallScore >= 85 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 p-3 text-emerald-200 flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium text-emerald-300">🎉 Excellent Code! Score: {report.overallScore}/100</span>
        </motion.div>
      )}

      {isRoast && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/5 border border-orange-500/30 p-3 text-orange-200 flex items-center gap-3">
          <Flame className="h-4 w-4 text-orange-400 shrink-0" />
          <span className="text-sm font-medium text-orange-300">You asked for it... 😈</span>
        </motion.div>
      )}

      {/* ── Report Content ───────────────────────────────────────────────── */}
      <div id="developer-report-content" className={`space-y-3 ${isRoast ? 'border-l-2 border-l-orange-500/50 pl-3' : ''}`}>

        {/* ── Header Card: Score + Metrics ─────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="flex items-center gap-4">
            <ScoreCircle score={report.overallScore} size={96} />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500 mb-1">Overall Score</div>
              <p className="text-sm font-medium text-white leading-snug line-clamp-2">{report.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <MetricPill label="Bugs" value={report.bugsFound} tone="red" />
                <MetricPill label="Perf" value={`${report.performance}/10`} tone={report.performance >= 8 ? 'green' : report.performance >= 6 ? 'yellow' : 'red'} />
                <MetricPill label="Read" value={`${report.readability}/10`} tone={report.readability >= 8 ? 'green' : report.readability >= 6 ? 'yellow' : 'red'} />
                <MetricPill label="Sec" value={`${report.security}/10`} tone={report.security >= 8 ? 'green' : report.security >= 6 ? 'yellow' : 'red'} />
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-400">Time: {report.timeComplexity}</span>
            <span className="rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-400">Space: {report.spaceComplexity}</span>
          </div>
        </motion.div>

        {/* ── Top Recommendation ───────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={1}
          className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"
        >
          <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-amber-200">
            <Lightbulb className="h-4 w-4" />
            Top Recommendation
          </div>
          <p className="text-sm text-amber-200/80 leading-relaxed">{report.topRecommendation}</p>
        </motion.div>

        {/* ── Summary ──────────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={2}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <BookOpen className="h-4 w-4 text-blue-400" />
            Summary
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">{report.summary}</p>
        </motion.div>

        {/* ── Strengths & Weaknesses ───────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={3}
          className="grid gap-3 grid-cols-2"
        >
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Strengths
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {report.strengths.map((item) => (
                <li key={item} className="flex gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <XCircle className="h-4 w-4 text-red-400" />
              Weaknesses
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {report.weaknesses.map((item) => (
                <li key={item} className="flex gap-1.5">
                  <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* ── Bug Detection ────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={4}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Bug className="h-4 w-4 text-red-400" />
            Bug Detection
          </div>
          {report.bugsFound === 0 ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">No bugs detected.</div>
          ) : (
            <div className="space-y-2">
              {report.bugDetails.map((item) => (
                <div key={item} className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-200">{item}</div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Performance & Complexity ─────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={5}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="h-4 w-4 text-cyan-400" />
            Performance &amp; Complexity
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(report.performance / 10) * 100}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-400">Time: {report.timeComplexity}</span>
            <span className="rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-400">Space: {report.spaceComplexity}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {report.suggestedImprovements.map((item) => (
              <li key={item} className="flex gap-1.5">
                <Zap className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── Best Practices ───────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={6}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <BookOpen className="h-4 w-4 text-violet-400" />
            Best Practices
          </div>
          <ol className="space-y-1.5 text-xs text-zinc-300">
            {report.bestPractices.map((item, index) => (
              <li key={item} className="flex gap-1.5">
                <span className="text-blue-400 shrink-0">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* ── Naming Suggestions ───────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={7}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Tag className="h-4 w-4 text-emerald-400" />
            Naming Suggestions
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {report.namingSuggestions.map((item) => (
              <li key={item} className="flex gap-1.5">
                <Tag className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── Security Analysis ────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={8}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Lock className="h-4 w-4 text-amber-400" />
            Security Analysis
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(report.security / 10) * 100}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
          </div>
          {report.securityIssues.length === 0 ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">No security issues found.</div>
          ) : (
            <div className="space-y-2">
              {report.securityIssues.map((item) => (
                <div key={item} className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-200">{item}</div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Final Verdict ────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={9}
          className={cn('rounded-xl border p-4', scoreTone === 'green' ? 'border-emerald-500/20 bg-emerald-500/10' : scoreTone === 'yellow' ? 'border-amber-500/20 bg-amber-500/10' : 'border-red-500/20 bg-red-500/10')}
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4" />
            Final Verdict
          </div>
          <p className="text-sm italic text-zinc-100 leading-relaxed">{report.finalVerdict}</p>
        </motion.div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────── */}
      {(onExplainCode || onGenerateImprovedCode || onSaveReview) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {onExplainCode && (
            <button onClick={onExplainCode} className="rounded-xl border border-violet-500/30 bg-transparent px-3 py-1.5 text-xs font-medium text-violet-300 transition hover:bg-violet-500/10">
              {isActionLoading === 'explain' ? 'Generating...' : 'Explain Code'}
            </button>
          )}
          {onGenerateImprovedCode && (
            <button onClick={onGenerateImprovedCode} className="rounded-xl border border-blue-500/30 bg-transparent px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/10">
              {isActionLoading === 'improve' ? 'Generating...' : 'Generate Improved Code'}
            </button>
          )}
          {onSaveReview && (
            <button
              onClick={handleSaveReviewWithConfetti}
              className="btn-press rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 active:scale-95"
            >
              {isSaved ? '✓ Saved' : 'Save Review'}
            </button>
          )}
          <button onClick={exportPDF} disabled={isExporting} className="flex items-center gap-1.5 rounded-xl border border-zinc-600/30 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700/20 disabled:opacity-50">
            <Download className="h-3 w-3" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          {hasApproaches && (
            <button onClick={() => setShowComparison(true)} className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-transparent px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/10">
              <Zap className="h-3 w-3" />
              View Improvements
            </button>
          )}
        </div>
      )}

      {/* ── Explanation Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showExplanationModal && explanation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Code Explanation</h2>
                </div>
                <button onClick={() => setShowExplanationModal(false)} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 text-zinc-300 prose prose-invert max-w-none">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Multi-Approach Comparison (Full-screen overlay) ─────────────── */}
      {showComparison && hasApproaches && originalCode && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col overflow-hidden"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Zap className="h-4 w-4 text-blue-400" />
                Improvement Approaches
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyApproach}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copyFeedback ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={() => setShowComparison(false)}
                  className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Approach Tabs */}
            <div className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {approaches.map((approach, index) => {
                  const isActive = selectedApproachIndex === index;
                  const diffColors = DIFFICULTY_COLORS[approach.difficulty];

                  return (
                    <button
                      key={approach.title}
                      onClick={() => setSelectedApproachIndex(index)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-blue-500/15 text-blue-200 border border-blue-500/40 shadow-lg shadow-blue-500/5'
                          : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200',
                      )}
                    >
                      <span>{approach.title}</span>
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', diffColors.badge)}>
                        {approach.difficulty}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected approach description & improvements */}
              {selectedApproach && (
                <motion.div
                  key={selectedApproachIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3"
                >
                  <p className="text-sm text-zinc-300">{selectedApproach.description}</p>
                  {selectedApproach.improvements.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {selectedApproach.improvements.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </div>

            {/* Editor panels */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-[1px] bg-zinc-800">
              {/* Original Code Panel */}
              <div className="flex flex-col min-h-0 bg-zinc-950">
                <div className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-medium text-zinc-400 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400/60" />
                  Original Code
                </div>
                <div className="flex-1 min-h-[400px]">
                  <MonacoEditorComponent
                    height="100%"
                    language={language?.toLowerCase()}
                    value={originalCode.trim()}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      renderLineHighlight: 'none',
                      padding: { top: 12 },
                    }}
                  />
                </div>
              </div>

              {/* Improved Code Panel — updates with selected approach */}
              <div className="flex flex-col min-h-0 bg-zinc-950">
                <div className={cn(
                  'border-b bg-blue-950/30 px-4 py-2 text-xs font-medium text-blue-300 flex items-center gap-2',
                  DIFFICULTY_COLORS[selectedApproach?.difficulty ?? 'Easy'].border,
                )}>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/60" />
                  {selectedApproach?.title ?? 'Improved Code'}
                </div>
                <div className="flex-1 min-h-[400px]">
                  <MonacoEditorComponent
                    height="100%"
                    language={language?.toLowerCase()}
                    value={selectedApproach?.code.trim() ?? ''}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      renderLineHighlight: 'none',
                      padding: { top: 12 },
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
