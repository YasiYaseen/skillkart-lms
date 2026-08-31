import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorUtils';
import {
  fetchInstructorCoupons,
  createInstructorCoupon,
  updateInstructorCoupon,
  deleteInstructorCoupon,
  type InstructorCoupon,
} from '../api/coupons';
import { useCurrency } from '@/context/CurrencyContext';
import {
  TagIcon,
  FireIcon,
  CheckCircleIcon,
  PlusIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';

interface Course {
  _id: string;
  title: string;
}

export function Coupons() {
  const [coupons, setCoupons] = useState<InstructorCoupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { symbol, formatAmount } = useCurrency();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [courseId, setCourseId] = useState<string>('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(0);
  const [maxRedemptions, setMaxRedemptions] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, crsRes] = await Promise.all([
        fetchInstructorCoupons(),
        api.get('/instructor/courses').catch(() => ({ data: { courses: [] } })),
      ]);
      setCoupons(cData);
      setCourses(crsRes.data?.courses || []);
    } catch {
      toast.error('Failed to load coupons or courses');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCouponId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(20);
    setCourseId('');
    setMinPurchaseAmount(0);
    setMaxRedemptions(0);
    setExpiresAt('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (coupon: InstructorCoupon) => {
    setEditingCouponId(coupon._id);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setCourseId(coupon.applicableCourse || '');
    setMinPurchaseAmount(coupon.minPurchaseAmount || 0);
    setMaxRedemptions(coupon.maxRedemptions || 0);
    setExpiresAt(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '');
    setDescription(coupon.description || '');
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.warn('Please provide a coupon code (e.g. FLASH50)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        courseId: courseId || null,
        minPurchaseAmount: Number(minPurchaseAmount),
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (editingCouponId) {
        await updateInstructorCoupon(editingCouponId, payload);
        toast.success(`Coupon "${payload.code}" updated successfully!`);
      } else {
        await createInstructorCoupon(payload);
        toast.success(`Coupon "${payload.code}" created successfully!`);
      }

      setShowModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save coupon'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    toast.info(`Coupon code "${couponCode}" copied to clipboard!`);
  };

  const handleToggleActive = async (coupon: InstructorCoupon) => {
    try {
      await updateInstructorCoupon(coupon._id, { isActive: !coupon.isActive });
      toast.success(`Coupon "${coupon.code}" ${coupon.isActive ? 'paused' : 'activated'}`);
      loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update coupon status'));
    }
  };

  const handleDeleteCoupon = async (couponId: string, couponCode: string) => {
    if (!window.confirm(`Are you sure you want to deactivate and delete "${couponCode}"?`)) {
      return;
    }
    try {
      await deleteInstructorCoupon(couponId);
      toast.success(`Coupon "${couponCode}" removed`);
      loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to delete coupon'));
    }
  };

  const sampleDiscount = discountType === 'percentage' ? (100 * discountValue) / 100 : Math.min(100, discountValue);
  const sampleFinal = Math.max(0, 100 - sampleDiscount);

  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.timesRedeemed || c.timesUsed || 0), 0);
  const activeCouponsCount = coupons.filter((c) => c.isActive).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Coupons & Promotions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create custom promo codes to share with your students for your courses.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Scope Protection Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-start gap-3">
        <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-blue-900 dark:text-blue-200 block">
            Direct Promotion Codes
          </span>
          <p className="text-blue-800/80 dark:text-blue-300">
            Instructor coupons apply <strong>exclusively to your courses</strong>. Share these codes on your social media, YouTube, or mailing list. They will never discount courses by other instructors.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TagIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Promo Codes</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{coupons.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FireIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Redemptions</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalRedemptions}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Currently Active</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{activeCouponsCount}</div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      {coupons.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <TagIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No promo coupons created</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Create your first promo code (e.g. 20% off or {symbol}20 off) for your students.
          </p>
          <div className="pt-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors cursor-pointer shadow-2xs"
            >
              Create First Coupon
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Coupon Code</th>
                  <th className="px-5 py-3.5">Discount</th>
                  <th className="px-5 py-3.5">Applicable Scope</th>
                  <th className="px-5 py-3.5">Usage / Limit</th>
                  <th className="px-5 py-3.5">Expiration</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/60">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          title="Copy Code to Clipboard"
                          className="text-slate-400 hover:text-blue-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        >
                          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `${formatAmount(coupon.discountValue)} OFF`}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gray-700 dark:text-gray-300">
                        {coupon.course?.title || 'All My Courses'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {coupon.timesRedeemed || coupon.timesUsed || 0} used
                        </span>
                        {coupon.maxRedemptions && (
                          <div className="text-gray-400 text-[10px]">
                            {coupon.maxRedemptions - (coupon.timesRedeemed || coupon.timesUsed || 0)} spots left ({coupon.maxRedemptions} max)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 text-[11px]">
                      {coupon.expiresAt ? (
                        new Date(coupon.expiresAt) < new Date() ? (
                          <span className="text-rose-500 font-bold">Expired</span>
                        ) : (
                          new Date(coupon.expiresAt).toLocaleDateString()
                        )
                      ) : (
                        <span className="text-gray-400">Never expires</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          coupon.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        {coupon.isActive ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingCouponId ? 'Edit Promo Coupon' : 'Create Promo Coupon'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono uppercase tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="fixed">Fixed Amount ({symbol} OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={discountType === 'percentage' ? 100 : 10000}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Live Preview Calculation Pill */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between text-xs">
                <span className="text-blue-900 dark:text-blue-200 flex items-center gap-1.5 flex-wrap">
                  <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span><strong>Simulator Preview:</strong> A {formatAmount(100)} course will cost{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatAmount(sampleFinal)}</strong> for students (saves {formatAmount(sampleDiscount)})</span>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Applicable Course Scope (Optional)
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">All My Courses</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Min Purchase ({symbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(Number(e.target.value))}
                    placeholder="0 (No minimum)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxRedemptions || ''}
                    onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl disabled:opacity-50 shadow-xs"
                >
                  {submitting ? 'Saving...' : editingCouponId ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Coupons;

