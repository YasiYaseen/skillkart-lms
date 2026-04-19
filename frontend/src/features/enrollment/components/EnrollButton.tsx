import { useEnrollment } from "../hooks/useEnrollment";

interface EnrollButtonProps {
  courseId: string;
  onEnrolled?: () => void;
}

export function EnrollButton({ courseId, onEnrolled }: EnrollButtonProps) {
  const { isEnrolled, enrolling, enroll, loading } = useEnrollment(courseId);

  const handleEnrollClick = async () => {
    const success = await enroll();
    if (success && onEnrolled) {
      onEnrolled();
    }
  };

  if (loading) {
    return (
      <button 
        disabled
        className="w-full bg-gray-200 text-gray-500 font-bold py-3.5 px-4 rounded-xl shadow-md cursor-wait mb-6"
      >
        Loading...
      </button>
    );
  }

  if (isEnrolled) {
    return (
      <div className="flex flex-col gap-2 mb-6">
        <button 
          onClick={() => onEnrolled && onEnrolled()}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          Go to Course
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleEnrollClick}
      disabled={enrolling}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {enrolling ? 'Enrolling...' : 'Enroll Now'}
    </button>
  );
}
