import { Link } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";

export interface EnrollmentCardProps {
  enrollment: {
    _id: string;
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
  };
  onUnenroll?: (enrollmentId: string) => void;
}

export function EnrollmentCard({ enrollment, onUnenroll }: EnrollmentCardProps) {
  const c = enrollment.course;
  const thumbnailUrl = c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop';

  const handleUnenrollClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to unenroll from "${c.title}"?`)) {
      onUnenroll?.(enrollment._id);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col">
      {onUnenroll && (
        <button
          onClick={handleUnenrollClick}
          title="Unenroll"
          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-500 p-1.5 rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <Link to={`/learn/${c._id}`} className="flex flex-col flex-grow">
        {/* Thumbnail with hover overlay inside */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={c.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-bold bg-blue-600 px-5 py-2 rounded-full text-sm shadow-lg">
              Continue Learning
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {c.title}
          </h3>
          <p className="text-sm text-gray-500 mb-4 line-clamp-1">
            {c.instructor?.name || 'Instructor'}
          </p>
          <div className="mt-auto">
            <ProgressBar percentage={enrollment.progressPercentage} size="sm" />
            {enrollment.totalLessonsCount !== undefined && (
              <p className="text-xs text-gray-400 mt-1.5 flex justify-between">
                <span>{enrollment.completedLessonsCount ?? 0} / {enrollment.totalLessonsCount} lessons</span>
                <span>{enrollment.progressPercentage}%</span>
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
