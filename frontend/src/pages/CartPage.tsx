import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/features/auth/AuthContext';
import { validateCouponCode, processCheckout, type OrderRecord } from '@/features/student/api/cart';
import { addToWishlist } from '@/features/wishlist';
import { PaymentCardSimulator, type PaymentFormState } from '@/components/cart/PaymentCardSimulator';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

const POPULAR_PROMOS = [
  { code: 'WELCOME20', label: '20% OFF Welcome Bonus' },
  { code: 'SKILL50', label: '$50 OFF Super Saver' },
];

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal, addToCart } = useCart();
  const { formatAmount, formatPrice } = useCurrency();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Step state: 'items' | 'payment' | 'success'
  const [currentStep, setCurrentStep] = useState<'items' | 'payment'>(
    searchParams.get('step') === 'payment' ? 'payment' : 'items'
  );

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

  // Billing Details
  const [billingName, setBillingName] = useState(user?.name || '');
  const [billingEmail, setBillingEmail] = useState(user?.email || '');
  const [billingCountry, setBillingCountry] = useState('United States');

  // Interactive Payment State
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    method: 'card',
    cardNumber: '4242 •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvc: '•••',
    savePaymentDetails: true,
  });

  // Recommended Upsell Courses
  const [recommendedCourses, setRecommendedCourses] = useState<
    Array<{ _id: string; title: string; price: number; thumbnailUrl?: string; thumbnail?: string }>
  >([]);

  // Checkout submission state
  const [checkingOut, setCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);

  const discountTotal = appliedCoupon ? appliedCoupon.discountTotal : 0;
  const finalTotal = Math.max(0, Math.round((cartTotal - discountTotal) * 100) / 100);

  // Load recommended courses
  useEffect(() => {
    api.get('/courses?limit=4')
      .then((res) => {
        const inCartIds = new Set(cart.map((c) => c.courseId));
        const list = (res.data?.courses || []).filter(
          (c: { _id: string }) => !inCartIds.has(c._id)
        );
        setRecommendedCourses(list.slice(0, 3));
      })
      .catch(() => {});
  }, [cart]);

  const handleApplyCoupon = async (codeToTry?: string) => {
    const code = (codeToTry || couponInput).trim();
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
        toast.success(`Coupon "${res.coupon.code}" applied! You saved ${formatAmount(res.discountTotal)}`);
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      const errorMsg = errObj?.response?.data?.message || 'Invalid or expired coupon code.';
      setCouponError(errorMsg);
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
        paymentMethod: finalTotal === 0 ? 'free' : 'simulated',
        billingDetails: {
          name: billingName || paymentForm.cardHolder,
          email: billingEmail,
          country: billingCountry,
        },
      });

      setCompletedOrder(res.order);
      clearCart();
      toast.success('🎉 Purchase complete! You are now enrolled.');
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      const errorMsg = errObj?.response?.data?.message || 'Checkout failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setCheckingOut(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (completedOrder) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Payment Confirmed &bull; Lifetime Enrolled
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Thank You for Your Order!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Order Reference: <strong className="font-mono text-gray-800 dark:text-gray-200">{completedOrder.orderNumber}</strong>
            </p>
          </div>

          {/* Enrolled Courses Summary Box */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 text-left border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Enrolled Courses ({completedOrder.items.length})
            </h3>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {completedOrder.items.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">{item.title}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Instant Access Activated</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 font-mono font-bold">{formatAmount(item.finalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm font-extrabold text-gray-900 dark:text-white">
              <span>Total Paid</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-base">{formatAmount(completedOrder.totalAmount, { showCode: true })}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/my-courses"
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              Start Learning in My Courses →
            </Link>
            <Link
              to="/purchase-history"
              className="w-full sm:w-auto px-6 py-3.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors"
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
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-xs">
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
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
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
      {/* 3-Step Checkout Progression Header */}
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between text-xs font-bold">
          <button
            onClick={() => setCurrentStep('items')}
            className={`flex items-center gap-2 ${
              currentStep === 'items'
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              currentStep === 'items'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-emerald-500 text-white'
            }`}>
              {currentStep === 'payment' ? '✓' : '1'}
            </span>
            <span>1. Review Cart</span>
          </button>

          <div className={`flex-1 h-0.5 mx-4 ${currentStep === 'payment' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />

          <button
            onClick={() => setCurrentStep('payment')}
            className={`flex items-center gap-2 ${
              currentStep === 'payment'
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              currentStep === 'payment'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
            }`}>
              2
            </span>
            <span>2. Payment & Billing</span>
          </button>

          <div className="flex-1 h-0.5 mx-4 bg-gray-200 dark:bg-gray-800" />

          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-[11px]">
              3
            </span>
            <span>3. Confirmation</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items OR Payment Step */}
        <div className="lg:col-span-8 space-y-6">
          {currentStep === 'items' ? (
            /* STEP 1: CART ITEMS REVIEW */
            <div className="space-y-6">
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
                            className="w-20 h-14 object-cover rounded-xl shrink-0 border border-gray-200 dark:border-gray-700 shadow-2xs"
                          />
                        ) : (
                          <div className="w-20 h-14 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-base">
                            🎓
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/courses/${item.courseId}`}
                            className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          {item.instructorName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              By {item.instructorName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-semibold">
                            <span>✓ Lifetime Access</span>
                            <span>&bull;</span>
                            <span>Certificate Included</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                          {formatPrice(item.price)}
                        </span>

                        <button
                          onClick={() => handleMoveToWishlist(item)}
                          title="Move to Wishlist"
                          className="text-xs text-gray-400 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          Save for Later
                        </button>

                        <button
                          onClick={() => removeFromCart(item.courseId)}
                          title="Remove course from cart"
                          className="text-gray-400 hover:text-rose-500 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Link
                    to="/courses"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    ← Continue exploring more courses
                  </Link>
                  <button
                    onClick={() => setCurrentStep('payment')}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Payment & Billing</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Upsell / Recommended Courses Strip */}
              {recommendedCourses.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Frequently Bought Together
                    </h3>
                    <span className="text-[11px] text-gray-400">Popular learner add-ons</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendedCourses.slice(0, 2).map((c) => {
                      const coursePrice = typeof c.price === 'number' ? c.price : 0;
                      return (
                        <div
                          key={c._id}
                          className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
                        >
                          <div className="truncate flex-1">
                            <h5 className="font-semibold text-xs text-gray-900 dark:text-white truncate">{c.title}</h5>
                            <span className="text-xs font-bold text-indigo-600 font-mono">
                              {formatPrice(coursePrice)}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              addToCart({
                                courseId: c._id,
                                title: c.title,
                                price: coursePrice,
                                thumbnailUrl: c.thumbnailUrl || c.thumbnail,
                                instructorName: 'Instructor',
                              });
                              toast.success(`"${c.title}" added to your cart!`);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors shrink-0"
                          >
                            + Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: PAYMENT & BILLING DETAILS */
            <div className="space-y-6 animate-fadeIn">
              {/* Billing Info Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Billing Details
                  </h3>
                  <button
                    onClick={() => setCurrentStep('items')}
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    ← Edit Cart Items ({cart.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Country / Region
                    </label>
                    <input
                      type="text"
                      value={billingCountry}
                      onChange={(e) => setBillingCountry(e.target.value)}
                      placeholder="United States"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Payment Gateway Simulator */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Payment Authorization
                  </h3>
                  <span className="text-[10px] text-gray-400">🔒 256-Bit SSL Encrypted</span>
                </div>

                <PaymentCardSimulator
                  formState={paymentForm}
                  onChange={(updates) => setPaymentForm((prev) => ({ ...prev, ...updates }))}
                  totalAmount={finalTotal}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Coupon & Order Summary */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
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
                    {appliedCoupon.description} applied (-{formatAmount(discountTotal)})
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
                <span>Original Price ({cart.length} items)</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{formatAmount(cartTotal)}</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">-{formatAmount(discountTotal)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-gray-400 text-[11px]">
                <span>Estimated Taxes & Fees</span>
                <span className="font-mono">{formatAmount(0)}</span>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-base font-extrabold text-gray-900 dark:text-white">
                <span>Total Amount:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-lg">
                  {formatAmount(finalTotal, { showCode: true })}
                </span>
              </div>
            </div>

            {currentStep === 'items' ? (
              <button
                onClick={() => setCurrentStep('payment')}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Payment →</span>
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <span>Authorizing Order...</span>
                ) : (
                  <span>Authorize & Complete Purchase ({formatAmount(finalTotal)})</span>
                )}
              </button>
            )}

            {/* Trust Badges */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">🛡️</span>
                <span>30-Day 100% Money-Back Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-indigo-500">⚡</span>
                <span>Instant full access on desktop & mobile</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-500">📜</span>
                <span>Verified Certificate of Completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

