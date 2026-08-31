import { useState } from "react";
import { Link } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";
import { Modal, Button } from "@/components/common";
import {
  AcademicCapIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/20/solid";

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

  const completionDate = enrollment.completedAt || enrollment.updatedAt || enrollment.createdAt;
  const targetUrl = lessonId ? `/courses/${c._id}/lessons/${lessonId}` : `/courses/${c._id}`;

  return (
    <>
      <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-colors flex flex-col h-full">
        {/* Unenroll / Drop Action */}
        {onUnenroll && !completed && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowUnenrollModal(true);
            }}
            className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-black/40 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-xs transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Unenroll from course"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <Link
          to={targetUrl}
          className="flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={thumbnailUrl}
              alt={c.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            {/* Status Overlay Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              {completed ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                  <CheckCircleIcon className="w-3 h-3" />
                  Completed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/80 backdrop-blur-xs text-white shadow-2xs">
                  {enrollment.progressPercentage > 0 ? `${enrollment.progressPercentage}% Done` : 'Not Started'}
                </span>
              )}
            </div>

            {/* Resume / Review prompt hover */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-semibold bg-blue-600 px-3 py-1 rounded-lg text-xs shadow-2xs flex items-center gap-1">
                <span>{completed ? 'Review Course' : 'Resume Learning'}</span>
                <ArrowRightIcon className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-0.5 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {c.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 line-clamp-1">
              By {c.instructor?.name || 'Instructor'}
            </p>

            {/* Subtitle: Last lesson or completion date */}
            {completed && completionDate ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mb-2 font-medium flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>Completed on {new Date(completionDate).toLocaleDateString()}</span>
              </p>
            ) : lastLessonTitle ? (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2 line-clamp-1 flex items-center gap-1">
                <BookOpenIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{lastLessonTitle}</span>
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
              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex justify-between items-center">
                <span>{enrollment.completedLessonsCount ?? 0} / {enrollment.totalLessonsCount ?? 0} lessons</span>
                <span className={`font-semibold ${completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {enrollment.progressPercentage}%
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                  <span>{completed ? 'Review Course' : 'Continue Learning'}</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </span>
                {completed && (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <AcademicCapIcon className="w-3 h-3" />
                    <span>Certificate</span>
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
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-200 dark:border-rose-800">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Unenroll from Course?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Are you sure you want to unenroll from <strong className="text-slate-800 dark:text-slate-200">"{c.title}"</strong>? Your completed lesson history will remain saved if you enroll again.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setShowUnenrollModal(false)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowUnenrollModal(false);
                  onUnenroll?.(enrollment._id);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-2xs"
              >
                Confirm Unenroll
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default EnrollmentCard;
