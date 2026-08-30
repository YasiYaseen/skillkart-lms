import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  fetchAllUserNotes,
  deleteNote,
  updateNote,
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

export default function NotesAndBookmarksPage() {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes'>('bookmarks');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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
      } catch {
        toast.error('Failed to load study records');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRemoveBookmark = async (lessonId: string) => {
    try {
      await toggleLessonBookmark(lessonId);
      setBookmarks((prev) => prev.filter((b) => b.lesson._id !== lessonId));
      toast.success('Bookmark removed');
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleSaveNoteEdit = async (noteId: string) => {
    if (!editingContent.trim() || savingNote) return;
    try {
      setSavingNote(true);
      const updated = await updateNote(noteId, editingContent.trim());
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, content: updated.content, updatedAt: updated.updatedAt } : n))
      );
      setEditingNoteId(null);
      toast.success('Note updated');
    } catch {
      toast.error('Failed to update note');
    } finally {
      setSavingNote(false);
    }
  };

  // Get distinct course list for filter
  const courseOptions = Array.from(
    new Map(
      [
        ...bookmarks.map((b) => (typeof b.course === 'object' ? b.course : null)),
        ...notes.map((n) => (typeof n.course === 'object' ? n.course : null)),
      ]
        .filter(Boolean)
        .map((c) => [c!._id, c!.title])
    )
  );

  const filteredBookmarks = bookmarks.filter((b) => {
    const courseObj = typeof b.course === 'object' ? b.course : null;
    const matchesCourse =
      selectedCourseFilter === 'all' || (courseObj && courseObj._id === selectedCourseFilter);
    const matchesSearch =
      !searchTerm.trim() ||
      b.lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (courseObj && courseObj.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCourse && matchesSearch;
  });

  const filteredNotes = notes.filter((n) => {
    const courseObj = typeof n.course === 'object' ? n.course : null;
    const lessonObj = typeof n.lesson === 'object' ? n.lesson : null;
    const matchesCourse =
      selectedCourseFilter === 'all' || (courseObj && courseObj._id === selectedCourseFilter);
    const matchesSearch =
      !searchTerm.trim() ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lessonObj && lessonObj.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (courseObj && courseObj.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCourse && matchesSearch;
  });

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Study Hub & Bookmarks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your bookmarked lessons and study notes across all enrolled courses.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'bookmarks'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🔖 Bookmarks</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {bookmarks.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>📝 Study Notes</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {notes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'bookmarks'
                ? 'Search bookmarked lessons or courses...'
                : 'Search study notes or lesson topics...'
            }
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {courseOptions.length > 0 && (
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          >
            <option value="all">All Courses ({courseOptions.length})</option>
            {courseOptions.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="animate-pulse bg-white border border-gray-200 rounded-2xl h-44 p-6" />
          ))}
        </div>
      ) : activeTab === 'bookmarks' ? (
        filteredBookmarks.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl p-8">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🔖
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No bookmarked lessons found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              While learning, click the bookmark icon on any lesson to save it here for fast revision.
            </p>
            <Link
              to="/my-courses"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs"
            >
              Go to My Courses →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookmarks.map((bookmark) => {
              const courseObj = typeof bookmark.course === 'object' ? bookmark.course : null;
              const courseId = courseObj ? courseObj._id : bookmark.course;
              const courseTitle = courseObj ? courseObj.title : 'Course';

              return (
                <div
                  key={bookmark._id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 truncate max-w-[200px]">
                        {courseTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBookmark(bookmark.lesson._id)}
                        title="Remove bookmark"
                        className="text-amber-500 hover:text-red-500 transition-colors p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.58A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      Lesson {bookmark.lesson.order}: {bookmark.lesson.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {bookmark.lesson.durationMinutes !== undefined && (
                        <span>⏱ {bookmark.lesson.durationMinutes} mins</span>
                      )}
                      <span>Saved on {formatDate(bookmark.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      to={`/learn/${courseId}/${bookmark.lesson._id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>Study Lesson</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Notes Tab */
        filteredNotes.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl p-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              📝
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No study notes found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              Write study notes under any lesson in the learning page to capture takeaways and code snippets.
            </p>
            <Link
              to="/my-courses"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs"
            >
              Go to My Courses →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredNotes.map((note) => {
              const courseObj = typeof note.course === 'object' ? note.course : null;
              const lessonObj = typeof note.lesson === 'object' ? note.lesson : null;
              const courseId = courseObj ? courseObj._id : note.course;
              const isEditing = editingNoteId === note._id;

              return (
                <div
                  key={note._id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {courseObj && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 truncate max-w-[180px]">
                            {courseObj.title}
                          </span>
                        )}
                        {lessonObj && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 truncate max-w-[200px]">
                            Lesson {lessonObj.order}: {lessonObj.title}
                          </span>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(note._id);
                              setEditingContent(note.content);
                            }}
                            title="Edit note"
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note._id)}
                            title="Delete note"
                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 mt-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={4}
                          maxLength={5000}
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNoteEdit(note._id)}
                            disabled={savingNote || !editingContent.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {savingNote ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">
                        {note.content}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(note.createdAt)}</span>
                    {lessonObj && (
                      <Link
                        to={`/learn/${courseId}/${lessonObj._id}`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <span>Open Lesson</span>
                        <span>↗</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
