import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  fetchInstructorCoupons,
  createInstructorCoupon,
  updateInstructorCoupon,
  deleteInstructorCoupon,
  type InstructorCoupon,
} from '../api/coupons';

interface Course {
  _id: string;
  title: string;
}

export function Coupons() {
  const [coupons, setCoupons] = useState<InstructorCoupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [courseId, setCourseId] = useState<string>('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>('');
  const [maxRedemptions, setMaxRedemptions] = useState<number | ''>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [couponsData, coursesRes] = await Promise.all([
        fetchInstructorCoupons(),
        api.get('/courses?mine=true'),
      ]);
      setCoupons(couponsData);
      setCourses(coursesRes.data.courses || []);
    } catch {
      toast.error('Failed to load coupons or courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(20);
    setCourseId('');
    setMinPurchaseAmount(0);
    setMaxDiscountAmount('');
    setMaxRedemptions('');
    setExpiresAt('');
    setShowModal(true);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    setSaving(true);
    try {
      await createInstructorCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        courseId: courseId || null,
        minPurchaseAmount: Number(minPurchaseAmount) || 0,
        maxDiscountAmount: maxDiscountAmount !== '' ? Number(maxDiscountAmount) : null,
        maxRedemptions: maxRedemptions !== '' ? Number(maxRedemptions) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      toast.success(`Coupon "${code.toUpperCase()}" created successfully!`);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon: InstructorCoupon) => {
    try {
      await updateInstructorCoupon(coupon._id, { isActive: !coupon.isActive });
      toast.success(`Coupon "${coupon.code}" ${coupon.isActive ? 'deactivated' : 'activated'}`);
      loadData();
    } catch {
      toast.error('Failed to update coupon status');
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteInstructorCoupon(couponId);
      toast.success('Coupon deleted');
      loadData();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard!`);
  };

  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.timesRedeemed || 0), 0);
  const activeCouponsCount = coupons.filter((c) => c.isActive).length;

  // Simulator calculation for modal
  const sampleOriginal = 100;
  const sampleDiscount = discountType === 'percentage'
    ? (sampleOriginal * Number(discountValue || 0)) / 100
    : Math.min(sampleOriginal, Number(discountValue || 0));
  const sampleFinal = Math.max(0, sampleOriginal - sampleDiscount);

  if (loading) {
    return <div className="text-gray-500 py-16 text-center">Loading coupons manager...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons & Promo Discounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create promotional discount campaigns to boost course enrollments and sales.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+ Create Promo Coupon</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
            🏷️
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Promo Codes</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{coupons.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
            🔥
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Redemptions</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalRedemptions}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
            ⚡
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Currently Active</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{activeCouponsCount}</div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      {coupons.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
            🏷️
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">No promo coupons created</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Create your first promo code (e.g. 50% off or $20 off) for your students.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            Create First Coupon
          </button>
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
                        <span className="font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          title="Copy Code to Clipboard"
                          className="text-gray-400 hover:text-indigo-600 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue} OFF`}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gray-700 dark:text-gray-300">
                        {coupon.course?.title || 'All My Courses (Global)'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {coupon.timesRedeemed} used
                        </span>
                        {coupon.maxRedemptions && (
                          <div className="text-gray-400 text-[10px]">
                            {coupon.maxRedemptions - coupon.timesRedeemed} spots left ({coupon.maxRedemptions} max)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-[11px]">
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
                        className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {coupon.isActive ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
                Create Promo Coupon
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SKILL50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="fixed">Fixed Amount ($ OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Discount Value *
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
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
                <span className="text-indigo-900 dark:text-indigo-200">
                  💡 <strong>Simulator Preview:</strong> A $100 course will cost{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">${sampleFinal.toFixed(2)}</strong> for students (saves ${sampleDiscount.toFixed(2)})
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
                  <option value="">All My Courses (Global)</option>
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
                    Min Purchase ($)
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
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(e.target.value ? Number(e.target.value) : '')}
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
                  disabled={saving}
                  className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50 shadow-xs"
                >
                  {saving ? 'Creating...' : 'Create Coupon'}
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

