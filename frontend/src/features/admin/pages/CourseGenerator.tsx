import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';

interface PresetItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  isPaid: boolean;
  price: number | null;
  sectionsCount: number;
  lessonsCount: number;
  quizzesCount: number;
  assignmentsCount: number;
}

interface DefaultInstructor {
  name: string;
  email: string;
  password?: string;
  headline?: string;
  bio?: string;
  avatar?: string;
  interests?: string[];
}

interface GenerationDetail {
  courseId: string;
  title: string;
  status: 'created' | 'already_exists';
  sectionsCount: number;
  lessonsCount: number;
}

interface GenerationResult {
  instructor: {
    id: string;
    name: string;
    email: string;
    created: boolean;
  };
  coursesCreated: number;
  coursesSkipped: number;
  totalSectionsCreated: number;
  totalLessonsCreated: number;
  totalQuizzesCreated: number;
  details: GenerationDetail[];
}

export function CourseGenerator() {
  const { formatPrice } = useCurrency();
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [defaultInstructor, setDefaultInstructor] = useState<DefaultInstructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form State
  const [instructorName, setInstructorName] = useState('Skillkart');
  const [instructorEmail, setInstructorEmail] = useState('official@skillkart.com');
  const [instructorPassword, setInstructorPassword] = useState('Password@123');
  const [instructorHeadline, setInstructorHeadline] = useState('Official SkillKart Platform & Masterclass Academy');
  const [instructorBio, setInstructorBio] = useState('Official verified courses and high-impact technology masterclasses curated directly by the SkillKart platform engineering and instruction team.');
  const [instructorAvatar, setInstructorAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [forceRegenerate, setForceRegenerate] = useState(false);

  // Result state
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ presets: PresetItem[]; defaultInstructor: DefaultInstructor }>('/admin/course-presets');
      setPresets(res.data.presets);
      setDefaultInstructor(res.data.defaultInstructor);
      setSelectedPresets(res.data.presets.map((p) => p.id));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load course presets');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDefaultSkillkart = () => {
    if (!defaultInstructor) return;
    setInstructorName(defaultInstructor.name);
    setInstructorEmail(defaultInstructor.email);
    setInstructorPassword(defaultInstructor.password || 'Password@123');
    setInstructorHeadline(defaultInstructor.headline || '');
    setInstructorBio(defaultInstructor.bio || '');
    setInstructorAvatar(defaultInstructor.avatar || '');
    setSelectedPresets(presets.map((p) => p.id));
    toast.info('Applied official SkillKart platform defaults');
  };

  const handleApplySampleInstructor = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setInstructorName(`Dr. Alex Reynolds`);
    setInstructorEmail(`alex.reynolds${randomNum}@example.com`);
    setInstructorPassword('Password@123');
    setInstructorHeadline('Lead Distributed Systems Architect & Educator');
    setInstructorBio('Over 12 years of industry engineering experience building scalable microservices and teaching computer science.');
    setInstructorAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop');
    setSelectedPresets(presets.map((p) => p.id));
    toast.info('Populated sample instructor profile');
  };

  const togglePresetSelection = (id: string) => {
    setSelectedPresets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllPresets = () => {
    setSelectedPresets(presets.map((p) => p.id));
  };

  const clearAllPresets = () => {
    setSelectedPresets([]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructorName.trim() || !instructorEmail.trim()) {
      toast.error('Instructor name and email are required');
      return;
    }

    if (selectedPresets.length === 0) {
      toast.error('Please select at least one course preset to generate');
      return;
    }

    try {
      setGenerating(true);
      const payload = {
        instructor: {
          name: instructorName.trim(),
          email: instructorEmail.trim(),
          password: instructorPassword || 'Password@123',
          headline: instructorHeadline.trim(),
          bio: instructorBio.trim(),
          avatar: instructorAvatar.trim() || undefined,
        },
        selectedPresets,
        courseOverrides: {
          isPublished,
        },
        forceRegenerate,
      };

      const res = await api.post<{ message: string; result: GenerationResult }>('/admin/generate-courses', payload);
      setLastResult(res.data.result);
      toast.success(res.data.message || 'Courses generated successfully! 🎉');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to generate courses');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-72" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Instructor & Demo Course Generator
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Seed the official platform instructor or generate custom instructors with complete masterclasses, YouTube video lessons, markdown docs, quizzes, and assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleApplyDefaultSkillkart}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors"
          >
            🛡️ Load SkillKart Platform Defaults
          </button>
          <button
            type="button"
            onClick={handleApplySampleInstructor}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors"
          >
            👨‍🏫 Load Sample Instructor
          </button>
        </div>
      </div>

      {/* Generation Result Banner */}
      {lastResult && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl font-bold">
                ✓
              </span>
              <div>
                <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                  Generation Summary for {lastResult.instructor.name}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Email: <span className="font-mono">{lastResult.instructor.email}</span> • Status: {lastResult.instructor.created ? 'Created new instructor' : 'Found existing instructor'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLastResult(null)}
              className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-medium"
            >
              Dismiss ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-emerald-100 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Courses Created</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{lastResult.coursesCreated}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-emerald-100 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Skipped (Existed)</p>
              <p className="text-xl font-bold text-gray-600 dark:text-gray-400">{lastResult.coursesSkipped}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-emerald-100 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Sections Added</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{lastResult.totalSectionsCreated}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-emerald-100 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Lessons Added</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{lastResult.totalLessonsCreated}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-emerald-100 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Quizzes Configured</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{lastResult.totalQuizzesCreated}</p>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Generated Courses Details:</p>
            <div className="divide-y divide-emerald-100 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-gray-700 overflow-hidden">
              {lastResult.details.map((detail) => (
                <div key={detail.courseId} className="p-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={detail.status === 'created' ? 'text-emerald-600' : 'text-gray-400'}>
                      {detail.status === 'created' ? '✨' : 'ℹ️'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{detail.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      detail.status === 'created' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {detail.status === 'created' ? 'CREATED' : 'ALREADY EXISTS'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                    <span>{detail.sectionsCount} sections</span>
                    <span>{detail.lessonsCount} lessons</span>
                    <Link
                      to={`/courses/${detail.courseId}`}
                      target="_blank"
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      View Details ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Generator Form */}
      <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Instructor Profile Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <span className="text-lg">👤</span>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Instructor Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Instructor Full Name *
                </label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="e.g. Skillkart or Jane Doe"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Instructor Email Address *
                </label>
                <input
                  type="email"
                  value={instructorEmail}
                  onChange={(e) => setInstructorEmail(e.target.value)}
                  placeholder="e.g. official@skillkart.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">If this user already exists, courses will be added under their account.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  value={instructorPassword}
                  onChange={(e) => setInstructorPassword(e.target.value)}
                  placeholder="Password@123"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={instructorHeadline}
                  onChange={(e) => setInstructorHeadline(e.target.value)}
                  placeholder="e.g. Senior Fullstack Architect & Educator"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Biography
                </label>
                <textarea
                  value={instructorBio}
                  onChange={(e) => setInstructorBio(e.target.value)}
                  placeholder="Instructor bio..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={instructorAvatar}
                  onChange={(e) => setInstructorAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Options Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <span className="text-lg">⚙️</span>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Publishing Settings</h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Publish courses immediately (Visible to students)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceRegenerate}
                  onChange={(e) => setForceRegenerate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Force regenerate courses if they already exist
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Preset Courses Selection */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📚</span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Available Course Masterclasses ({selectedPresets.length}/{presets.length} selected)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPresets}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={clearAllPresets}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {presets.map((preset) => {
                const isSelected = selectedPresets.includes(preset.id);
                return (
                  <div
                    key={preset.id}
                    onClick={() => togglePresetSelection(preset.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col sm:flex-row gap-4 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <div className="sm:w-36 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 relative">
                      <img
                        src={preset.thumbnailUrl}
                        alt={preset.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white uppercase">
                        {preset.level}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            {preset.title}
                          </h3>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 shrink-0 mt-0.5"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                        <span className="flex items-center gap-1">📂 {preset.sectionsCount} Sections</span>
                        <span className="flex items-center gap-1">🎬 {preset.lessonsCount} Lessons</span>
                        <span className="flex items-center gap-1">📝 {preset.quizzesCount} Quizzes</span>
                        <span className="flex items-center gap-1">📋 {preset.assignmentsCount} Assignments</span>
                        <span className="ml-auto font-bold text-gray-900 dark:text-white">
                          {preset.isPaid ? formatPrice(preset.price || 0) : 'FREE'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="submit"
                disabled={generating || selectedPresets.length === 0}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Generating Instructor & Courses...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Generate {selectedPresets.length} Course{selectedPresets.length === 1 ? '' : 's'} for {instructorName}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
