import { api } from '@/lib/api';

export interface AdminCoupon {
  _id: string;
  code: string;
  title?: string;
  creatorRole: 'admin' | 'instructor';
  scope: 'single_course' | 'instructor_all' | 'platform_global';
  fundedBy: 'platform' | 'instructor';
  isPublic: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  course?: { _id: string; title: string };
  instructor?: { _id: string; name: string; email: string };
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  maxRedemptions?: number;
  timesRedeemed: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminCouponsResponse {
  coupons: AdminCoupon[];
  platformCommissionRate: number;
}

export async function fetchAdminCoupons(): Promise<AdminCouponsResponse> {
  const res = await api.get('/coupons/admin');
  return res.data;
}

export async function createAdminCoupon(payload: {
  code: string;
  title?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  scope?: 'single_course' | 'instructor_all' | 'platform_global';
  isPublic?: boolean;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
}): Promise<AdminCoupon> {
  const res = await api.post('/coupons', payload);
  return res.data.coupon;
}

export async function updateAdminCoupon(
  id: string,
  payload: Partial<AdminCoupon>
): Promise<AdminCoupon> {
  const res = await api.put(`/coupons/${id}`, payload);
  return res.data.coupon;
}

export async function deleteAdminCoupon(id: string): Promise<void> {
  await api.delete(`/coupons/${id}`);
}
