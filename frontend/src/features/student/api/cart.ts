import { api } from '@/lib/api';

export interface CouponValidationResult {
  valid: boolean;
  coupon: {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    description: string;
  };
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
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
