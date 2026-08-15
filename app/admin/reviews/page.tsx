'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Star,
  Search,
  Filter,
  RefreshCw,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChefHat,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  booking_id: string;
  customer_id: string;
  cook_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  cook?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  booking?: {
    id: string;
    booking_number: string;
    booking_date: string;
    services?: { name: string } | null;
  } | null;
}

interface ReviewSummary {
  totalReviews: number;
  avgRating: number;
  starCounts: { [key: number]: number };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    totalReviews: 0,
    avgRating: 0,
    starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Deletion modal / state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReviews = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reviews');
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      const payload = data.data || data;
      setReviews(payload.reviews || []);
      if (payload.summary) setSummary(payload.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      if (!ignore) {
        await fetchReviews();
      }
    };
    init();
    return () => {
      ignore = true;
    };
  }, [fetchReviews]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete review');
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setDeletingId(null);
      setActionMsg({ type: 'success', text: 'Review deleted successfully.' });
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: unknown) {
      setActionMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete review',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        if (starFilter !== 'all' && Math.round(r.rating).toString() !== starFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const commentMatch = r.comment?.toLowerCase().includes(q);
          const customerMatch = r.customer?.full_name?.toLowerCase().includes(q) || r.customer?.email?.toLowerCase().includes(q);
          const cookMatch = r.cook?.full_name?.toLowerCase().includes(q);
          const bookingMatch = r.booking?.booking_number?.toLowerCase().includes(q);
          if (!commentMatch && !customerMatch && !cookMatch && !bookingMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortOrder === 'highest') return (b.rating || 0) - (a.rating || 0);
        if (sortOrder === 'lowest') return (a.rating || 0) - (b.rating || 0);
        return 0;
      });
  }, [reviews, starFilter, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage, itemsPerPage]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${
              s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
            }`}
          />
        ))}
        <span className="ml-1.5 text-xs font-bold text-slate-700">{Number(rating).toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ratings, cook reviews, feedback moderation, and quality metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReviews()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{actionMsg.text}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-500 flex items-center justify-center">
            <Star className="w-8 h-8 fill-amber-400" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">
              {summary.avgRating > 0 ? summary.avgRating.toFixed(1) : '5.0'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Average Platform Rating</div>
            <div className="text-xs text-slate-400 mt-1">Based on {summary.totalReviews} verified ratings</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{summary.totalReviews}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Reviews Received</div>
            <div className="text-xs text-slate-400 mt-1">Across all cook bookings</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-700 mb-2">Rating Distribution</div>
          <div className="space-y-1.5 text-xs text-slate-600">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = summary.starCounts[s] || 0;
              const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-6 font-semibold text-slate-700">{s}★</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-400 font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search comments, customer, cook..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Star Filter */}
          <div>
            <select
              value={starFilter}
              onChange={(e) => {
                setStarFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-700"
            >
              <option value="all">All Star Ratings</option>
              <option value="5">5 Stars (Excellent)</option>
              <option value="4">4 Stars (Good)</option>
              <option value="3">3 Stars (Average)</option>
              <option value="2">2 Stars (Poor)</option>
              <option value="1">1 Star (Critical)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-700"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-slate-400" />
          <p className="text-sm font-medium">Loading reviews...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-rose-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-rose-500" />
          <p className="font-semibold text-base">{error}</p>
          <button
            onClick={() => fetchReviews()}
            className="mt-4 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Retry
          </button>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <Star className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">No reviews found</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery || starFilter !== 'all'
              ? 'Try adjusting your search criteria or star filter.'
              : 'Customer reviews will automatically appear after booking completion.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedReviews.map((r) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {renderStars(r.rating)}
                  <button
                    onClick={() => setDeletingId(r.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete / Moderate Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-slate-800 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {r.comment ? `"${r.comment}"` : <span className="text-slate-400 font-normal">No written comment provided.</span>}
                </p>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">By:</span>
                    <span>{r.customer?.full_name || 'Verified Customer'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">Cook:</span>
                    <span>{r.cook?.full_name || 'Assigned Cook'}</span>
                  </div>
                  {r.booking && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{r.booking.booking_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  {new Date(r.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="font-mono text-[10px]">ID: {r.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && filteredReviews.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * itemsPerPage, filteredReviews.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{filteredReviews.length}</span> reviews
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Delete Review</h3>
                <p className="text-xs text-slate-500">Moderation action will be recorded in audit logs.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to permanently remove this review? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
