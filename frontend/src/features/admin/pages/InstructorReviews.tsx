import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ClockIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';

interface PendingInstructor {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  instructorHeadline?: string;
  instructorBio?: string;
  linkedin?: string;
  role: string;
  instructorStatus: string;
  createdAt: string;
  updatedAt: string;
}

export function InstructorReviews() {
  const [instructors, setInstructors] = useState<PendingInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ pendingInstructors: PendingInstructor[]; count: number }>(
        '/admin/instructor-reviews'
      );
      setInstructors(data.pendingInstructors);
      setSelected(new Set());
    } catch {
      toast.error('Failed to load pending instructor applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === instructors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(instructors.map((i) => i._id)));
    }
  };

  const handleBulk = async (action: 'approve' | 'reject', userIds?: string[]) => {
    const ids = userIds ?? (selected.size > 0 ? Array.from(selected) : undefined);
    const label = action === 'approve' ? 'Approve' : 'Reject';
    const count = ids ? ids.length : instructors.length;
    if (count === 0) {
      toast.info('No applications selected');
      return;
    }
    try {
      setActing(true);
      const data = await api.post<{ message: string; processed: number }>(
        '/admin/instructor-reviews/bulk',
        { action, userIds: ids }
      );
      toast.success(data.message ?? `${label}d ${data.processed} application(s)`);
      await fetchPending();
    } catch {
      toast.error(`Failed to ${action} applications`);
    } finally {
      setActing(false);
    }
  };

  const handleSingle = async (userId: string, action: 'approve' | 'reject') => {
    await handleBulk(action, [userId]);
  };

  const allSelected = instructors.length > 0 && selected.size === instructors.length;
  const someSelected = selected.size > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserGroupIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Instructor Applications
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and manage pending instructor applications
          </p>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {someSelected && (
            <>
              <button
                onClick={() => handleBulk('approve')}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition-colors cursor-pointer"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Approve Selected ({selected.size})
              </button>
              <button
                onClick={() => handleBulk('reject')}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60 transition-colors cursor-pointer"
              >
                <XCircleIcon className="w-4 h-4" />
                Reject Selected ({selected.size})
              </button>
            </>
          )}
          {instructors.length > 0 && (
            <button
              onClick={() => handleBulk('approve', undefined)}
              disabled={acting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors cursor-pointer"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Approve All ({instructors.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {loading ? 'Loading…' : `${instructors.length} pending application${instructors.length !== 1 ? 's' : ''} awaiting review`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : instructors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
            <CheckCircleIcon className="w-14 h-14 mb-3 text-green-500" />
            <p className="text-base font-semibold text-gray-600 dark:text-gray-400">All caught up!</p>
            <p className="text-sm">No pending instructor applications</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  <th className="w-10 px-4 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                        allSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                      aria-label="Select all"
                    >
                      {allSelected && <CheckIcon className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Applicant</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Headline</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Applied</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {instructors.map((inst) => {
                  const isSelected = selected.has(inst._id);
                  const isExpanded = expandedId === inst._id;
                  return (
                    <>
                      <tr
                        key={inst._id}
                        className={`transition-colors ${
                          isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleSelect(inst._id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                            }`}
                            aria-label={`Select ${inst.name}`}
                          >
                            {isSelected && <CheckIcon className="w-3 h-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {inst.avatar ? (
                              <img src={inst.avatar} alt={inst.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {inst.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{inst.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{inst.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-gray-700 dark:text-gray-300 truncate max-w-xs">
                            {inst.instructorHeadline || <span className="text-gray-400 italic">No headline</span>}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(inst.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleSingle(inst._id, 'approve')}
                              disabled={acting}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/70 disabled:opacity-60 transition-colors cursor-pointer"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleSingle(inst._id, 'reject')}
                              disabled={acting}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/70 disabled:opacity-60 transition-colors cursor-pointer"
                            >
                              <XCircleIcon className="w-3.5 h-3.5" />
                              Reject
                            </button>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : inst._id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              {isExpanded ? 'Less' : 'Details'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${inst._id}-expanded`} className="bg-gray-50 dark:bg-gray-800/30">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                              {inst.instructorBio && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Bio</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{inst.instructorBio}</p>
                                </div>
                              )}
                              {inst.linkedin && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">LinkedIn</p>
                                  <a
                                    href={inst.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                                    {inst.linkedin}
                                  </a>
                                </div>
                              )}
                              {!inst.instructorBio && !inst.linkedin && (
                                <p className="text-sm text-gray-400 italic col-span-2">No additional details provided</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
