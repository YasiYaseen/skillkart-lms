import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from "../api/wishlist";
import { toast } from "react-toastify";

interface WishlistButtonProps {
  courseId: string;
  variant?: "icon" | "button";
  className?: string;
  onToggle?: (isWishlisted: boolean) => void;
}

export function WishlistButton({
  courseId,
  variant = "button",
  className = "",
  onToggle,
}: WishlistButtonProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "student" || !courseId) return;

    let isMounted = true;
    checkWishlistStatus(courseId)
      .then((status) => {
        if (isMounted) setIsWishlisted(status);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user, courseId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Please log in to add courses to your wishlist");
      return;
    }

    if (user.role !== "student") {
      toast.info("Only students can maintain a wishlist");
      return;
    }

    try {
      setLoading(true);
      if (isWishlisted) {
        await removeFromWishlist(courseId);
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
        onToggle?.(false);
      } else {
        await addToWishlist(courseId);
        setIsWishlisted(true);
        toast.success("Saved to wishlist");
        onToggle?.(true);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update wishlist";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const heartIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={isWishlisted ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={isWishlisted ? "0" : "2"}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-5 h-5 transition-transform duration-200 ${
        isWishlisted ? "text-rose-500 scale-110" : "text-gray-600 hover:text-rose-500"
      }`}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className={`p-2 rounded-full bg-white/90 backdrop-blur-xs shadow-xs hover:bg-white hover:shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 ${className}`}
      >
        {heartIcon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`w-full py-3 px-4 rounded-xl font-medium border flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 disabled:opacity-50 ${
        isWishlisted
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
      } ${className}`}
    >
      {heartIcon}
      <span>{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
    </button>
  );
}
