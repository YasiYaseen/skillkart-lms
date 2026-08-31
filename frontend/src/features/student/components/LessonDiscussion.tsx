import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  fetchLessonComments,
  createLessonComment,
  deleteLessonComment,
  type LessonComment,
} from '../api/comments';
import { toast } from 'sonner';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/20/solid';

interface Props {
  lessonId: string;
  courseInstructorId?: string;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function LessonDiscussion({ lessonId, courseInstructorId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await fetchLessonComments(lessonId);
      setComments(data);
    } catch {
      toast.error('Failed to load discussion comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    setReplyingToId(null);
    setReplyContent('');
  }, [lessonId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const newComment = await createLessonComment(lessonId, { content: content.trim() });
      setComments((prev) => [...prev, newComment]);
      setContent('');
      toast.success('Question/Comment posted!');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentCommentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setSubmittingReply(true);
      const newReply = await createLessonComment(lessonId, {
        content: replyContent.trim(),
        parentCommentId,
      });
      setComments((prev) => [...prev, newReply]);
      setReplyingToId(null);
      setReplyContent('');
      toast.success('Reply posted!');
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      setDeletingId(commentId);
      await deleteLessonComment(lessonId, commentId);
      setComments((prev) =>
        prev.filter((c) => c._id !== commentId && c.parentComment !== commentId)
      );
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  // Split into top-level comments and replies map
  const topLevelComments = comments.filter((c) => !c.parentComment);
  const repliesByParentId = comments.reduce<Record<string, LessonComment[]>>((acc, c) => {
    if (c.parentComment) {
      if (!acc[c.parentComment]) acc[c.parentComment] = [];
      acc[c.parentComment].push(c);
    }
    return acc;
  }, {});

  const canDeleteComment = (c: LessonComment) => {
    if (!user) return false;
    if (c.user?._id === user.id) return true;
    if (user.role === 'admin') return true;
    if (user.role === 'instructor' && courseInstructorId === user.id) return true;
    return false;
  };

  return (
    <div className="space-y-5">
      {/* Top Question / Comment Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <span>Ask a Question / Join the Discussion</span>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({comments.length} total)</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
          Have a question about this lesson or want to share feedback? Post below for peers and instructors to see.
        </p>
        <form onSubmit={handlePostComment} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your question or thought about this lesson..."
            rows={3}
            required
            minLength={2}
            className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>

      {/* Comment List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-28" />
          ))}
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900/60">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No comments on this lesson yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Be the first to start a conversation or ask a question about the learning material!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevelComments.map((comment) => {
            const replies = repliesByParentId[comment._id] || [];
            const isReplying = replyingToId === comment._id;
            const authorAvatar =
              comment.user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                comment.user?.name || 'User'
              )}&background=random`;

            return (
              <div
                key={comment._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs transition-colors"
              >
                {/* Main Comment Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={authorAvatar}
                      alt={comment.user?.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {comment.user?.name || 'Unknown User'}
                        </span>
                        {comment.user?.role === 'instructor' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Instructor
                          </span>
                        )}
                        {comment.user?.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                    </div>
                  </div>

                  {canDeleteComment(comment) && (
                    <button
                      onClick={() => handleDelete(comment._id)}
                      disabled={deletingId === comment._id}
                      title="Delete comment"
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Comment Body */}
                <div className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-10.5">
                  {comment.content}
                </div>

                {/* Action Bar */}
                <div className="mt-3 pl-10.5 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  <button
                    onClick={() => {
                      if (isReplying) {
                        setReplyingToId(null);
                        setReplyContent('');
                      } else {
                        setReplyingToId(comment._id);
                        setReplyContent('');
                      }
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                    {isReplying ? 'Cancel Reply' : 'Reply'}
                  </button>

                  {replies.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                </div>

                {/* Reply Form */}
                {isReplying && (
                  <form
                    onSubmit={(e) => handlePostReply(comment._id, e)}
                    className="mt-3 pl-10.5 space-y-2.5"
                  >
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${comment.user?.name || 'comment'}...`}
                      rows={2}
                      required
                      autoFocus
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyContent('');
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReply || !replyContent.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        {submittingReply ? 'Replying...' : 'Post Reply'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Threaded Replies List */}
                {replies.length > 0 && (
                  <div className="mt-3 pl-8 space-y-2.5 border-l border-blue-200 dark:border-blue-900/60 ml-4">
                    {replies.map((reply) => {
                      const replyAvatar =
                        reply.user?.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          reply.user?.name || 'User'
                        )}&background=random`;

                      return (
                        <div
                          key={reply._id}
                          className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-lg p-3 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={replyAvatar}
                                alt={reply.user?.name || 'User'}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                    {reply.user?.name || 'Unknown User'}
                                  </span>
                                  {reply.user?.role === 'instructor' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                      Instructor
                                    </span>
                                  )}
                                  {reply.user?.role === 'admin' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {timeAgo(reply.createdAt)}
                                </span>
                              </div>
                            </div>

                            {canDeleteComment(reply) && (
                              <button
                                onClick={() => handleDelete(reply._id)}
                                disabled={deletingId === reply._id}
                                title="Delete reply"
                                className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            )}
                          </div>

                          <div className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-8">
                            {reply.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LessonDiscussion;
