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
}

export function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
  const c = enrollment.course;
  const thumbnailUrl = c.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop';

  return (
    <Link
      to={`/learn/${c._id}`}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
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
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">
          {c.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-1">
          {c.instructor?.name || 'Instructor'}
        </p>
        <div className="mt-auto">
          <ProgressBar percentage={enrollment.progressPercentage} size="sm" />
          {enrollment.totalLessonsCount !== undefined && (
            <p className="text-xs text-gray-400 mt-1.5">
              {enrollment.completedLessonsCount ?? 0} / {enrollment.totalLessonsCount} lessons completed
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
