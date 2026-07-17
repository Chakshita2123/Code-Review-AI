'use client';

import { useCallback, useState } from 'react';
import type { IApproach, IDeveloperReport } from '@/types';

export function useReviews() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<IDeveloperReport | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const submitReview = useCallback(async (code: string, language: string, roastMode = false) => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    setReviewId(null);

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, roastMode }),
      });

      const data = await response.json();
      console.log('Full API response:', data);
      console.log('Setting report:', data.report);
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to submit review');
      }

      setReport(data.report);
      setReviewId(data.reviewId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit review');
      throw err;
    } finally {
      setIsLoading(false);
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

  return { isLoading, error, report, reviewId, submitReview, explainCode, generateImproved };
}
