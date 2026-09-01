import { api } from '@/lib/api';

export interface FeaturedCoupon {
  _id: string;
  code: string;
  title: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount: number;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon: {
    _id: string;
    code: string;
    title?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    description: string;
    scope?: string;
    creatorRole?: string;
    fundedBy?: string;
  };
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  applicableItemsCount?: number;
}

export async function fetchFeaturedCoupons(): Promise<FeaturedCoupon[]> {
  try {
    const res = await api.get('/coupons/featured');
    return res.data.coupons || [];
  } catch {
    return [];
  }
}

export interface OrderItem {
  course: string | { _id: string; title: string; thumbnail?: string; instructor?: { _id: string; name: string } | string };
  title: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

export interface OrderRecord {
  _id: string;
  orderNumber: string;
  student: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  couponCode?: string;
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  completedAt: string;
  createdAt: string;
}

export async function validateCouponCode(
  code: string,
  courseIds: string[]
): Promise<CouponValidationResult> {
  const res = await api.post('/coupons/validate', { code, courseIds });
  return res.data;
}

export async function processCheckout(payload: {
  courseIds: string[];
  couponCode?: string;
  paymentMethod: 'simulated' | 'free' | 'stripe' | 'razorpay' | 'paypal' | 'card' | 'express' | 'upi';
  billingDetails?: {
    name?: string;
    email?: string;
    country?: string;
  };
}): Promise<{ message: string; order: OrderRecord }> {
  const res = await api.post('/orders/checkout', payload);
  return res.data;
}

export async function fetchOrderHistory(): Promise<OrderRecord[]> {
  const res = await api.get('/orders/history');
  return res.data.orders || [];
}

export async function fetchOrderReceipt(orderId: string): Promise<OrderRecord> {
  const res = await api.get(`/orders/${orderId}/receipt`);
  return res.data.order;
}

// ---------------------------------------------------------------------------
// Backend Cart Persistence API
// ---------------------------------------------------------------------------
export interface ApiCartItem {
  courseId: string;
  title: string;
  price: number;
  thumbnailUrl?: string;
  instructorName?: string;
  addedAt?: string;
}

export async function fetchBackendCart(): Promise<ApiCartItem[]> {
  const res = await api.get('/cart');
  return res.data.items || [];
}

export async function addToBackendCart(courseId: string): Promise<ApiCartItem[]> {
  const res = await api.post('/cart/items', { courseId });
  return res.data.items || [];
}

export async function removeFromBackendCart(courseId: string): Promise<ApiCartItem[]> {
  const res = await api.delete(`/cart/items/${courseId}`);
  return res.data.items || [];
}

export async function clearBackendCart(): Promise<void> {
  await api.delete('/cart');
}

export async function mergeBackendCart(courseIds: string[]): Promise<ApiCartItem[]> {
  const res = await api.post('/cart/merge', { courseIds });
  return res.data.items || [];
}
