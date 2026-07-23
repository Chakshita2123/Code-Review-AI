'use client';

import { useCallback, useState } from 'react';
import type { IApproach, IDeveloperReport } from '@/types';

export function useReviews() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<IDeveloperReport | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);

  const submitReview = useCallback(async (code: string, language: string, roastMode = false, template = 'standard') => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    setStreamingStatus('Analyzing your code...');

    try {
      const response = await fetch('/api/review/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, roastMode, template }),
      });

      if (!response.ok) throw new Error('Failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'status') {
              setStreamingStatus(data.message);
            } else if (data.type === 'chunk') {
              setStreamingStatus('Generating your report...');
            } else if (data.type === 'complete') {
              setReport(data.report);
              setReviewId(data.reviewId);
              setIsLoading(false);
              setStreamingStatus(null);
              window.dispatchEvent(new CustomEvent('reviewComplete'));
            } else if (data.type === 'error') {
              setError(data.message);
              setIsLoading(false);
              setStreamingStatus(null);
            }
          } catch (e) {
            /* skip malformed */
          }
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
      setStreamingStatus(null);
    }
  }, []);

  const explainCode = useCallback(async (code: string, language: string) => {
    const response = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to explain code');
    }

    return data.explanation;
  }, []);

  const generateImproved = useCallback(async (code: string, language: string): Promise<IApproach[]> => {
    const response = await fetch('/api/improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to improve code');
    }

    return data.approaches;
  }, []);

  return {
    isLoading,
    error,
    report,
    reviewId,
    streamingStatus,
    submitReview,
    explainCode,
    generateImproved,
  };
}
