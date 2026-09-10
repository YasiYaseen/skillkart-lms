import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEnrollment } from "../hooks/useEnrollment";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthModals } from "@/features/auth";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";

export interface EnrollButtonProps {
  courseId: string;
  price?: number;
  isPaid?: boolean;
  title?: string;
  thumbnailUrl?: string;
  instructorName?: string;
  className?: string;
  onEnrolled?: () => void;
}

export function EnrollButton({
  courseId,
  price,
  isPaid,
  title,
  thumbnailUrl,
  instructorName,
  className,
  onEnrolled,
}: EnrollButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEnrolled, enrolling, enroll, loading } = useEnrollment(courseId);
  const { formatAmount } = useCurrency();
  const { addToCart, isInCart } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const isCoursePaid = Boolean(isPaid || (price !== undefined && price !== null && price > 0));

  const handleEnrollClick = async () => {
    // If it's a paid course, route to checkout instead of invoking the free enrollment endpoint
    if (isCoursePaid) {
      try {
        setRedirecting(true);
        if (!isInCart(courseId)) {
          await addToCart({
            courseId,
            title: title || "Course",
            price: price || 0,
            thumbnailUrl,
            instructorName,
          });
        }
        navigate('/cart?step=payment');
      } catch {
        // Prevent navigating to cart or payment if adding to cart failed (e.g. self-purchase)
      } finally {
        setRedirecting(false);
      }
      return;
    }

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
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue Learning</span>
          <span>→</span>
        </button>
      </div>
    );
  }

  const buttonLabel = redirecting
    ? 'Redirecting to checkout...'
    : enrolling
    ? 'Enrolling...'
    : isCoursePaid
    ? (price && price > 0 ? `Enroll Now for ${formatAmount(price)}` : 'Enroll Now')
    : !user
    ? 'Sign in to Enroll'
    : 'Enroll for Free';

  const defaultButtonClass = "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 mb-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer";

  return (
    <>
      <button 
        onClick={handleEnrollClick}
        disabled={enrolling || redirecting}
        className={className || defaultButtonClass}
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
