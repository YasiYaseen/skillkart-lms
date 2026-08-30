import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import { validateCouponCode, processCheckout, type OrderRecord } from '@/features/student/api/cart';
import { addToWishlist } from '@/features/wishlist';
import { toast } from 'react-toastify';

const POPULAR_PROMOS = [
  { code: 'WELCOME20', label: '20% OFF Welcome Bonus' },
  { code: 'SKILL50', label: '$50 OFF Super Saver' },
];

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
    description: string;
    discountTotal: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Checkout form & payment state
  const [billingName, setBillingName] = useState(user?.name || '');
  const [billingEmail, setBillingEmail] = useState(user?.email || '');
  const [billingCountry, setBillingCountry] = useState('United States');
  const [paymentMethod, setPaymentMethod] = useState<'simulated' | 'stripe' | 'paypal'>('simulated');
  const [checkingOut, setCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);

  // Validate coupon against current cart
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) return;

    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const courseIds = cart.map((i) => i.courseId);
      const res = await validateCouponCode(code, courseIds);
      if (res.valid) {
        setAppliedCoupon({
          code: res.coupon.code,
          discountValue: res.coupon.discountValue,
          discountType: res.coupon.discountType,
          description: res.coupon.description,
          discountTotal: res.discountTotal,
        });
        setCouponInput(res.coupon.code);
        toast.success(`Coupon "${res.coupon.code}" applied! You saved $${res.discountTotal.toFixed(2)}`);
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon code.');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const handleMoveToWishlist = async (item: { courseId: string; title: string }) => {
    if (!user) {
      toast.info('Please log in to save items to your wishlist');
      return;
    }
    try {
      await addToWishlist(item.courseId);
      removeFromCart(item.courseId);
      toast.success(`"${item.title}" moved to your Wishlist!`);
    } catch {
      toast.error('Failed to move course to Wishlist');
    }
  };

  // Calculations
  const discountTotal = appliedCoupon ? appliedCoupon.discountTotal : 0;
  const finalTotal = Math.max(0, Math.round((cartTotal - discountTotal) * 100) / 100);

  // Submit checkout
  const handleCheckout = async () => {
    if (!user) {
      toast.info('Please log in or create an account to complete checkout.');
      return;
    }

    if (cart.length === 0) return;

    setCheckingOut(true);
    try {
      const courseIds = cart.map((i) => i.courseId);
      const res = await processCheckout({
        courseIds,
        couponCode: appliedCoupon?.code,
        paymentMethod: finalTotal === 0 ? 'free' : paymentMethod,
        billingDetails: {
          name: billingName,
          email: billingEmail,
          country: billingCountry,
        },
      });

      setCompletedOrder(res.order);
      clearCart();
      toast.success('🎉 Purchase complete! You are now enrolled.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (completedOrder) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 sm:p-10 shadow-xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
              Payment Confirmed
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Thank You for Your Order!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Order Reference: <strong className="font-mono text-gray-800 dark:text-gray-200">{completedOrder.orderNumber}</strong>
            </p>
          </div>

          {/* Enrolled Courses Summary Box */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 text-left border border-gray-100 dark:border-gray-800 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Enrolled Courses ({completedOrder.items.length})
            </h3>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {completedOrder.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-900 dark:text-white">{item.title}</span>
                  <span className="text-gray-600 dark:text-gray-300 font-mono">${item.finalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm font-bold text-gray-900 dark:text-white">
              <span>Total Paid</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">${completedOrder.totalAmount.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/my-courses"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              Start Learning in My Courses →
            </Link>
            <Link
              to="/purchase-history"
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors"
            >
              View Order Receipt & Invoice
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART VIEW
  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-xs">
          🛒
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Cart is Empty</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            You haven't added any courses to your cart yet. Explore our top-rated courses and start building your skills!
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <span>Browse All Courses</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
          Shopping Cart & Checkout
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review your chosen courses, apply discount coupons, and complete your enrollment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items & Billing Options */}
        <div className="lg:col-span-8 space-y-6">
          {/* Courses List */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Courses in Cart ({cart.length})
              </span>
              <button
                onClick={clearCart}
                className="text-xs text-gray-400 hover:text-rose-500 transition-colors font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {cart.map((item) => (
                <div key={item.courseId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-16 h-12 object-cover rounded-xl shrink-0 border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm">
                        🎓
                      </div>
                    )}

                    <div className="space-y-0.5 min-w-0">
                      <Link
                        to={`/courses/${item.courseId}`}
                        className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      {item.instructorName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Instructor: {item.instructorName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                      {item.price > 0 ? `$${item.price.toFixed(2)}` : 'FREE'}
                    </span>

                    <button
                      onClick={() => handleMoveToWishlist(item)}
                      title="Move to Wishlist"
                      className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Save for Later
                    </button>

                    <button
                      onClick={() => removeFromCart(item.courseId)}
                      title="Remove course from cart"
                      className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <Link
                to="/courses"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Add more courses to cart
              </Link>
              <span className="text-xs text-gray-500">
                Subtotal: <strong className="font-mono text-gray-900 dark:text-white">${cartTotal.toFixed(2)}</strong>
              </span>
            </div>
          </div>

          {/* Billing Details Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Billing Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Payment Gateway Option
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'simulated'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="simulated"
                  checked={paymentMethod === 'simulated'}
                  onChange={() => setPaymentMethod('simulated')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <strong className="block font-bold">⚡ Instant Demo Pay</strong>
                  <span className="text-[10px] text-gray-500">Zero-friction 1-click test</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={() => setPaymentMethod('stripe')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <strong className="block font-bold">💳 Credit / Debit Card</strong>
                  <span className="text-[10px] text-gray-500">Stripe Gateway Ready</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'paypal'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <strong className="block font-bold">🅿️ PayPal / Wallet</strong>
                  <span className="text-[10px] text-gray-500">Digital checkout</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Coupon & Order Summary */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Promo Coupon Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Promotional Coupon
            </h3>

            {appliedCoupon ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                    ✓ {appliedCoupon.code}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {appliedCoupon.description} applied (-${discountTotal.toFixed(2)})
                  </span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplyCoupon();
                  }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. SKILL50"
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white uppercase font-mono tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">{couponError}</p>
                  )}
                </form>

                {/* Popular Promo Pills */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-gray-400 block mb-1.5 font-medium">Quick Offer Codes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_PROMOS.map((promo) => (
                      <button
                        key={promo.code}
                        type="button"
                        onClick={() => handleApplyCoupon(promo.code)}
                        className="text-[10px] px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 font-mono font-bold transition-colors"
                      >
                        🏷️ {promo.code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between items-center">
                <span>Original Price</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">${cartTotal.toFixed(2)}</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">-${discountTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-gray-400 text-[11px]">
                <span>Estimated Taxes & Fees</span>
                <span className="font-mono">$0.00</span>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-base font-extrabold text-gray-900 dark:text-white">
                <span>Total Amount:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                  ${finalTotal.toFixed(2)} USD
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              {checkingOut ? (
                <span>Processing Order...</span>
              ) : (
                <span>Complete Purchase & Enroll Now</span>
              )}
            </button>

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 text-center">
              <p>🔒 256-Bit SSL Encrypted & Secure Checkout</p>
              <p>⚡ Instant lifetime access to course materials upon order</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
