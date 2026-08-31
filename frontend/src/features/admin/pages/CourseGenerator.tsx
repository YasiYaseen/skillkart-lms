import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';
import {
  SparklesIcon,
  ShieldCheckIcon,
  UserIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  CheckBadgeIcon,
  FolderIcon,
  PlayCircleIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
} from '@heroicons/react/20/solid';

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
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);

  // Form Fields
  const [instructorName, setInstructorName] = useState('Skillkart');
  const [instructorEmail, setInstructorEmail] = useState('official@skillkart.com');
  const [instructorPassword, setInstructorPassword] = useState('Skillkart@123');
  const [instructorHeadline, setInstructorHeadline] = useState('Official SkillKart Curriculum Author & Educator');
  const [instructorBio, setInstructorBio] = useState('Curated masterclasses and certification programs authored and verified by the SkillKart engineering team.');
  const [instructorAvatar, setInstructorAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop');
  const [isPublished, setIsPublished] = useState(true);
  const [forceRegenerate, setForceRegenerate] = useState(false);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/course-generator/presets');
      setPresets(res.data.presets || []);
      setDefaultInstructor(res.data.defaultInstructor || null);

      if (res.data.presets) {
        setSelectedPresets(res.data.presets.map((p: PresetItem) => p.id));
      }

      if (res.data.defaultInstructor) {
        const d = res.data.defaultInstructor;
        setInstructorName(d.name || 'Skillkart');
        setInstructorEmail(d.email || 'official@skillkart.com');
        setInstructorPassword(d.password || 'Skillkart@123');
        setInstructorHeadline(d.headline || '');
        setInstructorBio(d.bio || '');
        setInstructorAvatar(d.avatar || '');
      }
    } catch {
      toast.error('Failed to load sample course presets');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDefaultSkillkart = () => {
    if (defaultInstructor) {
      setInstructorName(defaultInstructor.name);
      setInstructorEmail(defaultInstructor.email);
      setInstructorPassword(defaultInstructor.password || 'Skillkart@123');
      setInstructorHeadline(defaultInstructor.headline || '');
      setInstructorBio(defaultInstructor.bio || '');
      setInstructorAvatar(defaultInstructor.avatar || '');
      toast.info('Applied default platform author profile');
    }
  };

  const handleApplySampleInstructor = () => {
    setInstructorName('Alex Morgan');
    setInstructorEmail('alex.morgan@skillkart.com');
    setInstructorPassword('Password@123');
    setInstructorHeadline('Fullstack Developer & Distributed Systems Instructor');
    setInstructorBio('Former Senior Staff Engineer with 12+ years of production experience in React, Node.js, and high-throughput backend services.');
    setInstructorAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop');
    toast.info('Applied sample guest instructor profile');
  };

  const togglePresetSelection = (presetId: string) => {
    setSelectedPresets((prev) =>
      prev.includes(presetId) ? prev.filter((id) => id !== presetId) : [...prev, presetId]
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
    if (selectedPresets.length === 0) {
      toast.error('Please select at least one course preset to generate.');
      return;
    }

    try {
      setGenerating(true);
      setLastResult(null);

      const payload = {
        instructorName,
        instructorEmail,
        instructorPassword,
        instructorHeadline,
        instructorBio,
        instructorAvatar,
        selectedPresetIds: selectedPresets,
        isPublished,
        forceRegenerate,
      };

      const res = await api.post('/admin/course-generator/generate', payload);
      setLastResult(res.data.result);
      toast.success(res.data.message || 'Sample curriculum generation completed!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to generate courses';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Curriculum Course Generator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Seed comprehensive, professional test courses with video lessons, rich markdown items, assessments, and assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleApplyDefaultSkillkart}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>Platform Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleApplySampleInstructor}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sample Author</span>
          </button>
        </div>
      </div>

      {/* Generation Result Banner */}
      {lastResult && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckBadgeIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                  Generation Summary for {lastResult.instructor.name}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Email: <span className="font-mono">{lastResult.instructor.email}</span> • Status: {lastResult.instructor.created ? 'Created new instructor' : 'Found existing instructor'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLastResult(null)}
              className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-medium cursor-pointer"
            >
              Dismiss ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Courses Created</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{lastResult.coursesCreated}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Skipped (Existed)</p>
              <p className="text-lg font-bold text-slate-600 dark:text-slate-400">{lastResult.coursesSkipped}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Sections Added</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{lastResult.totalSectionsCreated}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Lessons Added</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{lastResult.totalLessonsCreated}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Quizzes Configured</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{lastResult.totalQuizzesCreated}</p>
            </div>
          </div>

          <div className="pt-1 space-y-2">
            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Generated Courses Details:</p>
            <div className="divide-y divide-emerald-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-slate-800 overflow-hidden">
              {lastResult.details.map((detail) => (
                <div key={detail.courseId} className="p-2.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{detail.title}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      detail.status === 'created' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {detail.status === 'created' ? 'CREATED' : 'ALREADY EXISTS'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
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
      <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Instructor Profile Information */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Instructor Information</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instructor Full Name *
                </label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="e.g. Skillkart or Jane Doe"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instructor Email Address *
                </label>
                <input
                  type="email"
                  value={instructorEmail}
                  onChange={(e) => setInstructorEmail(e.target.value)}
                  placeholder="e.g. official@skillkart.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">If this user already exists, courses will be added under their account.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  value={instructorPassword}
                  onChange={(e) => setInstructorPassword(e.target.value)}
                  placeholder="Password@123"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={instructorHeadline}
                  onChange={(e) => setInstructorHeadline(e.target.value)}
                  placeholder="e.g. Senior Fullstack Architect & Educator"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Biography
                </label>
                <textarea
                  value={instructorBio}
                  onChange={(e) => setInstructorBio(e.target.value)}
                  placeholder="Instructor bio..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={instructorAvatar}
                  onChange={(e) => setInstructorAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Options Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Cog6ToothIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Publishing Settings</h2>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Publish courses immediately (Visible to students)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceRegenerate}
                  onChange={(e) => setForceRegenerate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Force regenerate courses if they already exist
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Preset Courses Selection */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Available Course Masterclasses ({selectedPresets.length}/{presets.length} selected)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPresets}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <button
                  type="button"
                  onClick={clearAllPresets}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:underline font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {presets.map((preset) => {
                const isSelected = selectedPresets.includes(preset.id);
                return (
                  <div
                    key={preset.id}
                    onClick={() => togglePresetSelection(preset.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-colors flex flex-col sm:flex-row gap-3.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="sm:w-32 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative border border-slate-200 dark:border-slate-750">
                      <img
                        src={preset.thumbnailUrl}
                        alt={preset.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white uppercase tracking-wider">
                        {preset.level}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {preset.title}
                          </h3>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 shrink-0 mt-0.5"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1"><FolderIcon className="w-3 h-3 text-slate-400" /> {preset.sectionsCount} Sections</span>
                        <span className="flex items-center gap-1"><PlayCircleIcon className="w-3 h-3 text-slate-400" /> {preset.lessonsCount} Lessons</span>
                        <span className="flex items-center gap-1"><ClipboardDocumentCheckIcon className="w-3 h-3 text-slate-400" /> {preset.quizzesCount} Quizzes</span>
                        <span className="flex items-center gap-1"><AcademicCapIcon className="w-3 h-3 text-slate-400" /> {preset.assignmentsCount} Assignments</span>
                        <span className="ml-auto font-bold text-slate-900 dark:text-white">
                          {preset.isPaid ? formatPrice(preset.price || 0) : 'FREE'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={generating || selectedPresets.length === 0}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {generating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Instructor & Courses...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
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

export default CourseGenerator;
