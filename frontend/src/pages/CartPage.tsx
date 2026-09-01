import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/features/auth/AuthContext';
import {
  validateCouponCode,
  processCheckout,
  fetchFeaturedCoupons,
  type FeaturedCoupon,
  type OrderRecord,
} from '@/features/student/api/cart';
import { addToWishlist } from '@/features/wishlist';
import { AuthModals } from '@/features/auth';
import { PaymentCardSimulator, type PaymentFormState } from '@/components/cart/PaymentCardSimulator';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  TagIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, LockClosedIcon, UserIcon } from '@heroicons/react/20/solid';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal, addToCart } = useCart();
  const { formatAmount, formatPrice } = useCurrency();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Auth modal state for unauthenticated guest checkout
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Step state: 'items' | 'payment' | 'success'
  const [currentStep, setCurrentStep] = useState<'items' | 'payment'>(
    searchParams.get('step') === 'payment' && user ? 'payment' : 'items'
  );

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountValue: number;
    discountType: 'percentage' | 'fixed';
    description: string;
    discountTotal: number;
    scope?: string;
    creatorRole?: string;
    applicableItemsCount?: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [featuredPromos, setFeaturedPromos] = useState<FeaturedCoupon[]>([]);

  // Billing Details
  const [billingName, setBillingName] = useState(user?.name || '');
  const [billingEmail, setBillingEmail] = useState(user?.email || '');
  const [billingCountry, setBillingCountry] = useState('United States');

  // Sync billing details when user logs in
  useEffect(() => {
    if (user) {
      if (user.name && !billingName) setBillingName(user.name);
      if (user.email && !billingEmail) setBillingEmail(user.email);
    }
  }, [user]);

  // Interactive Payment State
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    method: 'card',
    cardNumber: '4242 4242 4242 4242',
    cardHolder: 'JANE DOE',
    expiry: '12/28',
    cvv: '888',
    saveCard: true,
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

  // Load featured coupons from database
  useEffect(() => {
    fetchFeaturedCoupons()
      .then((promos) => setFeaturedPromos(promos))
      .catch(() => setFeaturedPromos([]));
  }, []);

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
          scope: res.coupon.scope,
          creatorRole: res.coupon.creatorRole,
          applicableItemsCount: res.applicableItemsCount,
        });
        setCouponInput(res.coupon.code);
        toast.success(`Coupon "${res.coupon.code}" applied! You saved ${formatAmount(res.discountTotal)}`);
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Invalid or expired coupon code');
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    toast.info('Coupon removed');
  };

  const handleMoveToWishlist = async (item: { courseId: string; title: string }) => {
    if (!user) {
      setAuthModalMode('login');
      setShowAuthModal(true);
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

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      toast.warning('Your cart is empty');
      return;
    }

    if (!user) {
      setAuthModalMode('register');
      setShowAuthModal(true);
      return;
    }

    setCurrentStep('payment');
  };

  const handleAuthModalSuccess = (authenticatedUser: { name?: string; email?: string }) => {
    setShowAuthModal(false);
    if (authenticatedUser.name) setBillingName(authenticatedUser.name);
    if (authenticatedUser.email) setBillingEmail(authenticatedUser.email);
    setCurrentStep('payment');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning('Your cart is empty');
      return;
    }

    if (!user) {
      setAuthModalMode('register');
      setShowAuthModal(true);
      return;
    }

    setCheckingOut(true);
    try {
      const courseIds = cart.map((i) => i.courseId);
      const order = await processCheckout({
        courseIds,
        couponCode: appliedCoupon?.code,
        paymentMethod: paymentForm.method,
        billingDetails: {
          name: billingName.trim() || undefined,
          email: billingEmail.trim() || undefined,
          country: billingCountry.trim() || undefined,
        },
      });

      setCompletedOrder(order);
      clearCart();
      toast.success('Order completed successfully! Welcome to your courses.');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Checkout failed. Please try again.'));
    } finally {
      setCheckingOut(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-center space-y-5 animate-fadeIn">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              Payment Confirmed &bull; Enrolled
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Thank you for your order
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Order Reference: <strong className="font-mono text-slate-800 dark:text-slate-200">{completedOrder.orderNumber}</strong>
            </p>
          </div>

          {/* Enrolled Courses Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-left border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Enrolled Courses ({completedOrder.items.length})
            </h3>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {completedOrder.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">{item.title}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Instant Access Activated</span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 font-mono font-semibold">{formatAmount(item.finalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
              <span>Total Paid</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">{formatAmount(completedOrder.totalAmount, { showCode: true })}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Link
              to="/my-courses"
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
            >
              Go to My Courses
            </Link>
            <Link
              to="/purchase-history"
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              View Order Receipt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART VIEW
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBagIcon className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You haven't added any courses to your cart yet. Explore our catalog and begin learning.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-2xs"
          >
            <span>Browse Courses</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
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
            onClick={() => handleProceedToPayment()}
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
                          <div className="w-20 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                            <AcademicCapIcon className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/courses/${item.courseId}`}
                            className="text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
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
                          className="text-xs text-gray-400 hover:text-blue-600 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                    className="text-xs font-semibold text-blue-600 dark:text-indigo-400 hover:underline"
                  >
                    ← Continue exploring more courses
                  </Link>
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {!user ? (
                      <>
                        <UserIcon className="w-4 h-4" />
                        <span>Sign in to Proceed to Payment</span>
                        <span>→</span>
                      </>
                    ) : (
                      <>
                        <span>Proceed to Payment & Billing</span>
                        <span>→</span>
                      </>
                    )}
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
                            <span className="text-xs font-bold text-blue-600 font-mono">
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
                    className="text-xs text-blue-600 hover:underline font-semibold"
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
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Payment Authorization
                  </h3>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <LockClosedIcon className="w-3 h-3 text-slate-400" />
                    <span>256-Bit SSL Encrypted</span>
                  </span>
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
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* Promo Coupon Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Promotional Coupon
            </h3>

            {appliedCoupon ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs animate-fadeIn">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      ✓ {appliedCoupon.code}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {appliedCoupon.scope === 'single_course'
                        ? '1 Course'
                        : appliedCoupon.scope === 'instructor_all'
                        ? `${appliedCoupon.applicableItemsCount || 1} Instructor Course(s)`
                        : 'Site-Wide'}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                    {appliedCoupon.description} applied (-{formatAmount(discountTotal)})
                  </span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer shrink-0"
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
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white uppercase font-mono tracking-wider focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-2xs"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">{couponError}</p>
                  )}
                </form>

                {/* Dynamic Featured Platform Promo Pills */}
                {featuredPromos.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">Featured Offers:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {featuredPromos.map((promo) => (
                        <button
                          key={promo.code}
                          type="button"
                          onClick={() => handleApplyCoupon(promo.code)}
                          className="text-[10px] px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 font-mono font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <TagIcon className="w-3 h-3 text-blue-500" />
                          <span>{promo.code}</span>
                          <span className="text-slate-400 font-normal">({promo.discountType === 'percentage' ? `${promo.discountValue}% off` : `$${promo.discountValue} off`})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                <span className="text-blue-600 dark:text-indigo-400 font-mono text-lg">
                  {formatAmount(finalTotal, { showCode: true })}
                </span>
              </div>
            </div>

            {currentStep === 'items' ? (
              <div className="space-y-2">
                <button
                  onClick={handleProceedToPayment}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {!user ? (
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4" />
                      <span>Sign in to Proceed to Payment →</span>
                    </span>
                  ) : (
                    <span>Proceed to Payment →</span>
                  )}
                </button>
                {!user && (
                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                    Sign in or create an account to proceed to payment.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {checkingOut ? (
                    <span>Authorizing Order...</span>
                  ) : (
                    <span>Authorize & Complete Purchase ({formatAmount(finalTotal)})</span>
                  )}
                </button>
              </div>
            )}

            {/* Trust Badges */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>30-Day 100% Money-Back Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <BoltIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Instant full access on desktop & mobile</span>
              </div>
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                <span>Verified Certificate of Completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModals
          isOpen={showAuthModal}
          initialMode={authModalMode}
          redirectTo={null}
          onSuccess={handleAuthModalSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}

