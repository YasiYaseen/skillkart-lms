import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchAllUserNotes,
  deleteNote,
  updateNote,
  createNote,
  type NoteItem,
} from '../api/notes';
import {
  fetchAllUserBookmarks,
  toggleLessonBookmark,
  type BookmarkItem,
} from '../api/bookmarks';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function NotesAndBookmarksPage() {
  const navigate = useNavigate();

  // Data states
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and selection states
  const [activeMode, setActiveMode] = useState<'all' | 'notes' | 'bookmarks'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // New quick note modal/state
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [bookmarksData, notesData] = await Promise.all([
          fetchAllUserBookmarks(),
          fetchAllUserNotes(),
        ]);
        setBookmarks(bookmarksData);
        setNotes(notesData);
        if (notesData.length > 0) {
          setSelectedNoteId(notesData[0]._id);
          setEditingContent(notesData[0].content);
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load study records');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute enrolled course list with notes/bookmark metrics
  const courseList = useMemo(() => {
    const map = new Map<string, { id: string; title: string; notesCount: number; bookmarksCount: number }>();

    bookmarks.forEach((b) => {
      const courseObj = typeof b.course === 'object' ? b.course : null;
      const id = courseObj ? courseObj._id : (b.course as string);
      const title = courseObj ? courseObj.title : 'Course';
      if (!map.has(id)) {
        map.set(id, { id, title, notesCount: 0, bookmarksCount: 0 });
      }
      map.get(id)!.bookmarksCount++;
    });

    notes.forEach((n) => {
      const courseObj = typeof n.course === 'object' ? n.course : null;
      const id = courseObj ? courseObj._id : (n.course as string);
      const title = courseObj ? courseObj.title : 'Course';
      if (!map.has(id)) {
        map.set(id, { id, title, notesCount: 0, bookmarksCount: 0 });
      }
      map.get(id)!.notesCount++;
    });

    return Array.from(map.values());
  }, [bookmarks, notes]);

  // Filtered bookmarks
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      const courseObj = typeof b.course === 'object' ? b.course : null;
      const courseId = courseObj ? courseObj._id : (b.course as string);
      const matchesCourse = selectedCourseId === 'all' || courseId === selectedCourseId;
      const matchesSearch =
        !searchTerm.trim() ||
        b.lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (courseObj && courseObj.title.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCourse && matchesSearch;
    });
  }, [bookmarks, selectedCourseId, searchTerm]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const courseObj = typeof n.course === 'object' ? n.course : null;
      const lessonObj = typeof n.lesson === 'object' ? n.lesson : null;
      const courseId = courseObj ? courseObj._id : (n.course as string);
      const matchesCourse = selectedCourseId === 'all' || courseId === selectedCourseId;
      const matchesSearch =
        !searchTerm.trim() ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lessonObj && lessonObj.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (courseObj && courseObj.title.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCourse && matchesSearch;
    });
  }, [notes, selectedCourseId, searchTerm]);

  // Active selected note
  const activeSelectedNote = useMemo(() => {
    return notes.find((n) => n._id === selectedNoteId) || filteredNotes[0] || null;
  }, [notes, selectedNoteId, filteredNotes]);

  // Bookmark handlers
  const handleRemoveBookmark = async (lessonId: string) => {
    try {
      await toggleLessonBookmark(lessonId);
      setBookmarks((prev) => prev.filter((b) => b.lesson._id !== lessonId));
      toast.success('Bookmark removed');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update bookmark');
    }
  };

  // Note handlers
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      if (selectedNoteId === noteId) {
        const remaining = notes.filter((n) => n._id !== noteId);
        setSelectedNoteId(remaining.length > 0 ? remaining[0]._id : null);
      }
      toast.success('Note deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete note');
    }
  };

  const handleSaveNoteEdit = async () => {
    if (!activeSelectedNote || !editingContent.trim() || savingNote) return;
    try {
      setSavingNote(true);
      const updated = await updateNote(activeSelectedNote._id, editingContent.trim());
      setNotes((prev) =>
        prev.map((n) => (n._id === activeSelectedNote._id ? { ...n, content: updated.content, updatedAt: updated.updatedAt } : n))
      );
      setIsEditingNote(false);
      toast.success('Note saved successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update note');
    } finally {
      setSavingNote(false);
    }
  };

  // Export Notes to Markdown file
  const handleExportNotes = () => {
    if (filteredNotes.length === 0) {
      toast.info('No notes available to export');
      return;
    }
    const currentCourse = courseList.find((c) => c.id === selectedCourseId);
    const title = currentCourse ? currentCourse.title : 'All Courses';
    let mdContent = `# 📚 SkillKart Study Notes - ${title}\n\nGenerated on ${new Date().toLocaleDateString()}\n\n---\n\n`;

    filteredNotes.forEach((n, idx) => {
      const c = typeof n.course === 'object' ? n.course : null;
      const l = typeof n.lesson === 'object' ? n.lesson : null;
      mdContent += `### ${idx + 1}. ${l ? `Lesson ${l.order}: ${l.title}` : 'General Note'}\n`;
      if (c) mdContent += `*Course: ${c.title}*\n`;
      if (n.videoTimestamp) mdContent += `*Timestamp: ${formatTime(n.videoTimestamp)}*\n`;
      mdContent += `\n${n.content}\n\n---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SkillKart_Study_Notes_${title.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Study notes exported as Markdown!');
  };

  return (
    <div className="container py-8 max-w-[1440px] mx-auto space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>🧠</span>
            <span>Study Hub & Knowledge Studio</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your centralized learning second-brain. Organize notes, revisit bookmarked moments, and export study guides.
          </p>
        </div>

        {/* Global Action: Export Markdown Study Notes */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportNotes}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            title="Download notes as markdown"
          >
            <span>📥</span>
            <span>Export Notes (.md)</span>
          </button>

          <Link
            to="/my-courses"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Go to My Courses →
          </Link>
        </div>
      </div>

      {/* 2. Main 2-Pane Notion-Style Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Course & Record Navigator (4 cols on lg) */}
        <aside className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 shadow-2xs space-y-4">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes, topics, or lessons..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
          </div>

          {/* Mode Selector (All / Notes / Bookmarks) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200/60 dark:border-gray-700/60 text-xs font-semibold">
            <button
              onClick={() => setActiveMode('all')}
              className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                activeMode === 'all'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({notes.length + bookmarks.length})
            </button>
            <button
              onClick={() => setActiveMode('notes')}
              className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                activeMode === 'notes'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📝 Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveMode('bookmarks')}
              className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                activeMode === 'bookmarks'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🔖 Saved ({bookmarks.length})
            </button>
          </div>

          {/* Course Scope Filter */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Courses</p>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              <button
                onClick={() => setSelectedCourseId('all')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
                  selectedCourseId === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>🌐 All Enrolled Courses</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {notes.length + bookmarks.length}
                </span>
              </button>

              {courseList.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
                    selectedCourseId === c.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="truncate pr-2">{c.title}</span>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">
                    {c.notesCount + c.bookmarksCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes & Bookmarks Item Feed (Master List) */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {activeMode === 'bookmarks' ? 'Saved Lessons' : 'Study Notes Feed'}
            </p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : activeMode === 'bookmarks' ? (
              // Bookmarks in list
              filteredBookmarks.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No saved bookmarks match criteria.</p>
              ) : (
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredBookmarks.map((b) => {
                    const c = typeof b.course === 'object' ? b.course : null;
                    return (
                      <div
                        key={b._id}
                        className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 hover:border-indigo-300 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            Lesson {b.lesson.order}: {b.lesson.title}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{c?.title || 'Course'}</p>
                        </div>
                        <Link
                          to={`/courses/${c?._id || b.course}`}
                          className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shrink-0 hover:bg-indigo-700"
                        >
                          Study →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Notes in list
              filteredNotes.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No study notes match criteria.</p>
              ) : (
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredNotes.map((n) => {
                    const isSelected = activeSelectedNote?._id === n._id;
                    const c = typeof n.course === 'object' ? n.course : null;
                    const l = typeof n.lesson === 'object' ? n.lesson : null;

                    return (
                      <button
                        key={n._id}
                        onClick={() => {
                          setSelectedNoteId(n._id);
                          setEditingContent(n.content);
                          setIsEditingNote(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 shadow-2xs'
                            : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                            {l ? `Lesson ${l.order}: ${l.title}` : 'General Note'}
                          </span>
                          <span className="text-[9px] text-gray-400">{formatDate(n.updatedAt)}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          {n.content}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </aside>

        {/* RIGHT PANE: Interactive Notion-Style Study Pad / Detail Workspace (8 cols on lg) */}
        <main className="lg:col-span-8 space-y-6">
          {activeMode === 'bookmarks' ? (
            // Full Bookmark Shelf
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🔖</span>
                  <span>Bookmarked Lessons & Key Timestamps ({filteredBookmarks.length})</span>
                </h2>
              </div>

              {filteredBookmarks.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-4xl">🔖</div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">No bookmarks yet</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    While watching course lessons, click the bookmark icon to save lessons here for rapid exam revision.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredBookmarks.map((b) => {
                    const c = typeof b.course === 'object' ? b.course : null;
                    return (
                      <div
                        key={b._id}
                        className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/70 dark:border-gray-700/70 p-4 space-y-3 flex flex-col justify-between hover:shadow-xs transition-shadow"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 truncate max-w-[180px]">
                              {c?.title || 'Course'}
                            </span>
                            <button
                              onClick={() => handleRemoveBookmark(b.lesson._id)}
                              className="text-amber-500 hover:text-red-500 text-xs p-1"
                              title="Remove bookmark"
                            >
                              ✕
                            </button>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            Lesson {b.lesson.order}: {b.lesson.title}
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Bookmarked on {formatDate(b.createdAt)}
                          </p>
                        </div>

                        <Link
                          to={`/courses/${c?._id || b.course}`}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl text-center shadow-2xs transition-colors"
                        >
                          Open Lesson Video →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Interactive Markdown Study Pad & Note Editor
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xs space-y-4">
              {activeSelectedNote ? (
                <>
                  {/* Note Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {typeof activeSelectedNote.course === 'object' && activeSelectedNote.course
                            ? activeSelectedNote.course.title
                            : 'Course Note'}
                        </span>
                        <span>•</span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {typeof activeSelectedNote.lesson === 'object' && activeSelectedNote.lesson
                            ? `Lesson ${activeSelectedNote.lesson.order}: ${activeSelectedNote.lesson.title}`
                            : 'Lesson'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Last updated {formatDate(activeSelectedNote.updatedAt)}
                        {activeSelectedNote.videoTimestamp ? ` • Timestamp: ${formatTime(activeSelectedNote.videoTimestamp)}` : ''}
                      </p>
                    </div>

                    {/* Actions: Edit / Delete */}
                    <div className="flex items-center gap-2">
                      {isEditingNote ? (
                        <>
                          <button
                            onClick={handleSaveNoteEdit}
                            disabled={savingNote}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            {savingNote ? 'Saving...' : '💾 Save Changes'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingNote(false);
                              setEditingContent(activeSelectedNote.content);
                            }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditingNote(true)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>✏️</span>
                            <span>Edit Note</span>
                          </button>
                          <button
                            onClick={() => handleDeleteNote(activeSelectedNote._id)}
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Note Body: Editable or View mode */}
                  <div className="min-h-[320px] py-2">
                    {isEditingNote ? (
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={12}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-mono leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        placeholder="Write your study notes in markdown..."
                      />
                    ) : (
                      <div className="prose dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {activeSelectedNote.content}
                      </div>
                    )}
                  </div>

                  {/* Footer Jump to Lesson */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Word count: {activeSelectedNote.content.split(/\s+/).filter(Boolean).length} words
                    </span>

                    {typeof activeSelectedNote.course === 'object' && activeSelectedNote.course && (
                      <Link
                        to={`/courses/${activeSelectedNote.course._id}`}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Jump to Lesson Video</span>
                        <span>→</span>
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 space-y-4">
                  <div className="text-4xl">📝</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">No note selected</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Select a note from the left panel or take notes while watching lessons in the course player.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
