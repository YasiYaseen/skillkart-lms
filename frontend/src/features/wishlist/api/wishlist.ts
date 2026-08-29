import { api } from "@/lib/api";

export interface WishlistItem {
  _id: string;
  createdAt: string;
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    level: "beginner" | "intermediate" | "advanced";
    isPaid: boolean;
    price: number | null;
    status: string;
    instructor: {
      _id: string;
      name: string;
      email: string;
    };
    averageRating?: number;
    reviewCount?: number;
    enrollmentCount?: number;
  };
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  const res = await api.get("/wishlist");
  return res.data.wishlist || [];
}

export async function addToWishlist(courseId: string): Promise<void> {
  await api.post("/wishlist", { courseId });
}

export async function removeFromWishlist(courseId: string): Promise<void> {
  await api.delete(`/wishlist/${courseId}`);
}

export async function checkWishlistStatus(courseId: string): Promise<boolean> {
  const res = await api.get(`/wishlist/check/${courseId}`);
  return Boolean(res.data.isWishlisted);
}
