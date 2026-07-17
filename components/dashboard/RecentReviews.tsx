import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ReviewSummary {
  id: string;
  language: string;
  overallScore: number;
  summary: string;
  createdAt: string;
  topRecommendation: string;
  bugsFound: number;
}

interface RecentReviewsProps {
  reviews: ReviewSummary[];
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Recent Reviews</p>
          <p className="text-sm text-gray-400">Your latest AI code review snapshots</p>
        </div>
        <Link href="/history" className="flex items-center gap-2 text-sm text-blue-400 transition hover:text-blue-300">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-400">
            No reviews yet. Start your first review to see it here.
          </div>
        ) : (
          reviews.slice(0, 4).map((review) => (
            <div key={review.id} className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-white">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span>{review.language}</span>
                </div>
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">
                  {review.overallScore}/100
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-300">{review.summary}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                <span>{review.bugsFound} bugs found</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
