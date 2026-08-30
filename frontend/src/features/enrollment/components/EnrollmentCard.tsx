import { useState } from "react";
import { Link } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";
import { Modal, Button } from "@/components/common";

export interface EnrollmentCardProps {
  enrollment: {
    _id: string;
    status?: string;
    lastAccessedLessonId?: string | { _id: string; title?: string };
    course: {
      _id: string;
      title: string;
      thumbnailUrl?: string;
      instructor?: { name: string };
      price?: number;
    };
    progressPercentage: number;
    completedLessonsCount?: number;
    totalLessonsCount?: number;
    completedAt?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  onUnenroll?: (enrollmentId: string) => void;
  completed?: boolean;
}

export function EnrollmentCard({ enrollment, onUnenroll, completed }: EnrollmentCardProps) {
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const c = enrollment.course;
  const thumbnailUrl = c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop';

  const lessonId = typeof enrollment.lastAccessedLessonId === 'object'
    ? enrollment.lastAccessedLessonId?._id
    : enrollment.lastAccessedLessonId;

  const lastLessonTitle = typeof enrollment.lastAccessedLessonId === 'object'
    ? enrollment.lastAccessedLessonId?.title
    : undefined;

  const learnHref = lessonId
    ? `/learn/${c._id}/${lessonId}`
    : `/learn/${c._id}`;

  const completionDate = enrollment.completedAt || enrollment.updatedAt;

  const confirmUnenroll = () => {
    setShowUnenrollModal(false);
    onUnenroll?.(enrollment._id);
  };

  return (
    <>
      <div className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xs hover:shadow-md border overflow-hidden transition-all duration-300 flex flex-col ${
        completed ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-gray-200 dark:border-gray-700'
      }`}>

        {/* Completed badge */}
        {completed && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Completed
          </div>
        )}

        {/* Unenroll button */}
        {onUnenroll && !completed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowUnenrollModal(true);
            }}
            title="Unenroll from course"
            className="absolute top-2.5 right-2.5 z-10 bg-white/90 dark:bg-gray-800/90 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 p-1.5 rounded-full shadow-xs transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <Link to={learnHref} className="flex flex-col flex-grow">
          {/* Thumbnail with hover overlay */}
          <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={thumbnailUrl}
              alt={c.title}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${completed ? 'opacity-85' : ''}`}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold bg-indigo-600 px-4 py-1.5 rounded-full text-xs shadow-md">
                {completed ? 'Review Course' : 'Resume Learning →'}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 flex flex-col flex-grow">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {c.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
              By {c.instructor?.name || 'Instructor'}
            </p>

            {/* Subtitle: Last lesson or completion date */}
            {completed && completionDate ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3 font-medium flex items-center gap-1">
                <span>✓ Completed on {new Date(completionDate).toLocaleDateString()}</span>
              </p>
            ) : lastLessonTitle ? (
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-1 italic">
                📖 {lastLessonTitle}
              </p>
            ) : (
              <div className="mb-2" />
            )}

            <div className="mt-auto space-y-2">
              <ProgressBar
                percentage={enrollment.progressPercentage}
                size="sm"
                color={completed ? 'green' : 'blue'}
              />
              <div className="text-xs text-gray-400 dark:text-gray-500 flex justify-between items-center">
                <span>{enrollment.completedLessonsCount ?? 0} / {enrollment.totalLessonsCount ?? 0} lessons</span>
                <span className={`font-semibold ${completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {enrollment.progressPercentage}%
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                  {completed ? 'Review Course →' : 'Continue Learning →'}
                </span>
                {completed && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    🎓 Certificate
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Confirmation Modal */}
      {showUnenrollModal && (
        <Modal isOpen={showUnenrollModal} onClose={() => setShowUnenrollModal(false)}>
          <div className="text-center p-2">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 text-xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Unenroll from Course?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to unenroll from <strong className="text-gray-800 dark:text-gray-200">"{c.title}"</strong>? Your completed lesson history will remain saved if you enroll again.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setShowUnenrollModal(false)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={confirmUnenroll}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
              >
                Yes, Unenroll
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default EnrollmentCard;
