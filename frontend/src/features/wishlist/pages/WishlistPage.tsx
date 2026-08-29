import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchWishlist, removeFromWishlist, type WishlistItem } from "../api/wishlist";
import { toast } from "react-toastify";
import Rating from "@/components/common/Rating";

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await fetchWishlist();
      setItems(data);
    } catch {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await removeFromWishlist(courseId);
      setItems((prev) => prev.filter((item) => item.course._id !== courseId));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove course");
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-100 rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-pulse space-y-4">
              <div className="aspect-video bg-gray-200 rounded-xl"></div>
              <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-full mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span>My Wishlist</span>
            <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              {items.length} {items.length === 1 ? "course" : "courses"}
            </span>
          </h1>
          <p className="text-gray-500 mt-1">Courses you have saved to learn in the future</p>
        </div>

        {items.length > 0 && (
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>Explore More Courses</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-xs p-8 max-w-lg mx-auto">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Explore our rich catalog of courses and click the heart icon to save courses you want to enroll in later.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 active:scale-98"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        /* Course Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(({ _id, course }) => (
            <div
              key={_id}
              className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* Thumbnail & Level Badge */}
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                <img
                  src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-xs text-gray-800 shadow-xs capitalize">
                  {course.level}
                </span>

                {/* Remove button overlay */}
                <button
                  type="button"
                  onClick={(e) => handleRemove(course._id, e)}
                  title="Remove from wishlist"
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 shadow-xs transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </button>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                    <Link to={`/courses/${course._id}`}>{course.title}</Link>
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">By {course.instructor?.name || "Instructor"}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <Rating value={course.averageRating || 0} readonly size="sm" />
                    <span className="text-xs text-gray-400 font-medium">
                      ({course.reviewCount || 0})
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-2">
                  <div className="text-lg font-bold text-gray-900">
                    {course.isPaid && course.price ? `$${course.price}` : "Free"}
                  </div>

                  <Link
                    to={`/courses/${course._id}`}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    View Course
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
