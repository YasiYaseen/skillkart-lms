export type CouponEffectiveStatus = 'active' | 'expired' | 'exhausted' | 'paused';

export interface CouponStatusInput {
  isActive: boolean;
  expiresAt?: string | Date | null;
  timesRedeemed?: number;
  maxRedemptions?: number | null;
}

/**
 * Computes the authoritative effective lifecycle status of a coupon based on its
 * active toggle, expiration date, and redemption limits.
 */
export function getCouponStatus(coupon: CouponStatusInput): CouponEffectiveStatus {
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) {
    return 'expired';
  }
  if (
    coupon.maxRedemptions !== undefined &&
    coupon.maxRedemptions !== null &&
    coupon.maxRedemptions > 0 &&
    (coupon.timesRedeemed ?? 0) >= coupon.maxRedemptions
  ) {
    return 'exhausted';
  }
  if (!coupon.isActive) {
    return 'paused';
  }
  return 'active';
}

/**
 * Backward compatibility alias for getCouponStatus
 */
export const getCouponEffectiveStatus = getCouponStatus;

export interface CouponBadgeConfig {
  label: string;
  badgeClass: string;
}

/**
 * Returns consistent styling and labels for coupon status badges across instructor and admin views.
 */
export function getCouponStatusBadgeConfig(status: CouponEffectiveStatus): CouponBadgeConfig {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        badgeClass:
          'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      };
    case 'expired':
      return {
        label: 'Expired',
        badgeClass:
          'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
      };
    case 'exhausted':
      return {
        label: 'Exhausted',
        badgeClass:
          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
      };
    case 'paused':
      return {
        label: 'Paused',
        badgeClass:
          'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      };
  }
}
