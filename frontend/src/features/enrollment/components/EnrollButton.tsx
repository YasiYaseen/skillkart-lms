import { useState } from "react";
import { useEnrollment } from "../hooks/useEnrollment";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthModals } from "@/features/auth";
import { useCurrency } from "@/context/CurrencyContext";

interface EnrollButtonProps {
  courseId: string;
  price?: number;
  isPaid?: boolean;
  onEnrolled?: () => void;
}

export function EnrollButton({ courseId, price, isPaid, onEnrolled }: EnrollButtonProps) {
  const { user } = useAuth();
  const { isEnrolled, enrolling, enroll, loading } = useEnrollment(courseId);
  const { formatAmount } = useCurrency();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleEnrollClick = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const success = await enroll();
    if (success && onEnrolled) {
      onEnrolled();
    }
  };

  if (loading) {
    return (
      <button 
        disabled
        className="w-full bg-gray-100 dark:bg-gray-800 text-gray-400 font-semibold py-3.5 px-4 rounded-xl shadow-xs cursor-wait mb-6"
      >
        Checking enrollment...
      </button>
    );
  }

  if (isEnrolled) {
    return (
      <div className="flex flex-col gap-2 mb-6">
        <button 
          onClick={() => onEnrolled && onEnrolled()}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
        >
          <span>Continue Learning</span>
          <span>→</span>
        </button>
      </div>
    );
  }

  const buttonLabel = enrolling
    ? 'Enrolling...'
    : !user
    ? 'Sign in to Enroll'
    : isPaid && price
    ? `Enroll Now for ${formatAmount(price)}`
    : 'Enroll for Free';

  return (
    <>
      <button 
        onClick={handleEnrollClick}
        disabled={enrolling}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 mb-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span>{buttonLabel}</span>
      </button>

      {showAuthModal && (
        <AuthModals
          isOpen={showAuthModal}
          initialMode="login"
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}

export default EnrollButton;
