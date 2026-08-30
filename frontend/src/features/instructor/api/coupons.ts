import { api } from '@/lib/api';

export interface InstructorCoupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  course?: { _id: string; title: string };
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  maxRedemptions?: number;
  timesRedeemed: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export async function fetchInstructorCoupons(): Promise<InstructorCoupon[]> {
  const res = await api.get('/coupons/mine');
  return res.data.coupons || [];
}

export async function createInstructorCoupon(payload: {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  courseId?: string | null;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number | null;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
}): Promise<InstructorCoupon> {
  const res = await api.post('/coupons', payload);
  return res.data.coupon;
}

export async function updateInstructorCoupon(
  couponId: string,
  payload: Partial<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    courseId?: string | null;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number | null;
    maxRedemptions?: number | null;
    expiresAt?: string | null;
    isActive: boolean;
  }>
): Promise<InstructorCoupon> {
  const res = await api.put(`/coupons/${couponId}`, payload);
  return res.data.coupon;
}

export async function deleteInstructorCoupon(couponId: string): Promise<void> {
  await api.delete(`/coupons/${couponId}`);
}
