import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/errorUtils';
import { useCurrency } from '@/context/CurrencyContext';
import {
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  type AdminCoupon,
} from '../api/coupons';
import {
  TagIcon,
  PlusIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [commissionRate, setCommissionRate] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'platform' | 'instructor'>('all');
  const { symbol, formatAmount } = useCurrency();

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [isPublic, setIsPublic] = useState(true);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(0);
  const [maxRedemptions, setMaxRedemptions] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminCoupons();
      setCoupons(data.coupons || []);
      setCommissionRate(data.platformCommissionRate || 20);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setCode('');
    setTitle('');
    setDiscountType('percentage');
    setDiscountValue(Math.min(15, commissionRate));
    setIsPublic(true);
    setMinPurchaseAmount(0);
    setMaxRedemptions(0);
    setExpiresAt('');
    setShowModal(true);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.warn('Please enter a coupon code (e.g. WELCOME15)');
      return;
    }

    if (discountType === 'percentage' && discountValue > commissionRate) {
      toast.error(
        `Platform coupon discount cannot exceed platform commission (${commissionRate}%) to protect instructor payouts.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await createAdminCoupon({
        code: code.trim().toUpperCase(),
        title: title.trim() || undefined,
        discountType,
        discountValue: Number(discountValue),
        scope: 'platform_global',
        isPublic,
        minPurchaseAmount: Number(minPurchaseAmount),
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      toast.success(`Platform coupon "${code.toUpperCase()}" created successfully!`);
      setShowModal(false);
      loadCoupons();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create platform coupon'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: AdminCoupon) => {
    try {
      await updateAdminCoupon(coupon._id, { isActive: !coupon.isActive });
      toast.success(`Coupon "${coupon.code}" ${coupon.isActive ? 'paused' : 'activated'}`);
      loadCoupons();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update coupon status'));
    }
  };

  const handleTogglePublic = async (coupon: AdminCoupon) => {
    try {
      await updateAdminCoupon(coupon._id, { isPublic: !coupon.isPublic });
      toast.success(`Coupon "${coupon.code}" ${coupon.isPublic ? 'hidden from cart' : 'featured on cart'}`);
      loadCoupons();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update visibility'));
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) return;
    try {
      await deleteAdminCoupon(id);
      toast.success(`Coupon "${couponCode}" deleted`);
      loadCoupons();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to delete coupon'));
    }
  };

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    toast.info(`Coupon code "${couponCode}" copied to clipboard!`);
  };

  const filteredCoupons = coupons.filter((c) => {
    if (filterTab === 'platform') return c.creatorRole === 'admin';
    if (filterTab === 'instructor') return c.creatorRole === 'instructor';
    return true;
  });

  const platformCouponsCount = coupons.filter((c) => c.creatorRole === 'admin').length;
  const publicOffersCount = coupons.filter((c) => c.creatorRole === 'admin' && c.isPublic && c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.timesRedeemed || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Coupons & Platform Promotions
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage site-wide promotional campaigns with guaranteed instructor payout protection.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Platform Promo</span>
        </button>
      </div>

      {/* Creator-First Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3.5">
        <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
            Creator-First Subsidized Promotions Policy
          </h4>
          <p className="text-xs text-blue-800/80 dark:text-blue-300 leading-relaxed">
            Platform discounts are funded <strong>100% out of SkillKart's platform commission</strong> (strictly capped at{' '}
            <strong className="text-blue-900 dark:text-blue-100">{commissionRate}%</strong>). Instructors are always guaranteed their full{' '}
            <strong className="text-emerald-700 dark:text-emerald-400">80% baseline payout</strong> on course list prices.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TagIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Platform Campaigns</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{platformCouponsCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <EyeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Featured on Cart</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{publicOffersCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Redemptions</div>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{totalRedemptions}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Discount Cap Limit</div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">Max {commissionRate}%</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          All Coupons ({coupons.length})
        </button>
        <button
          onClick={() => setFilterTab('platform')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterTab === 'platform'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Platform Campaigns ({platformCouponsCount})
        </button>
        <button
          onClick={() => setFilterTab('instructor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterTab === 'instructor'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Instructor Promo Codes ({coupons.length - platformCouponsCount})
        </button>
      </div>

      {/* Coupons Table */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3 max-w-md mx-auto">
          <TagIcon className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No coupons found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create a platform-wide welcome or flash discount to feature on the checkout cart.
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors shadow-xs"
            >
              Create Platform Coupon
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Promo Code</th>
                  <th className="px-5 py-3.5">Discount</th>
                  <th className="px-5 py-3.5">Creator & Funding</th>
                  <th className="px-5 py-3.5">Applicable Scope</th>
                  <th className="px-5 py-3.5">Cart Visibility</th>
                  <th className="px-5 py-3.5">Redemptions</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredCoupons.map((coupon) => {
                  const isPlatform = coupon.creatorRole === 'admin';
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/60">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              title="Copy Code"
                              className="text-gray-400 hover:text-blue-600 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            >
                              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {coupon.title && (
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block">
                              {coupon.title}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `${formatAmount(coupon.discountValue)} OFF`}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {isPlatform ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <ShieldCheckIcon className="w-3 h-3 text-indigo-600" />
                            <span>Platform (Subsidized)</span>
                          </span>
                        ) : (
                          <div>
                            <span className="text-gray-900 dark:text-white font-semibold block">
                              {coupon.instructor?.name || 'Instructor'}
                            </span>
                            <span className="text-[10px] text-gray-400">Instructor Funded</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {coupon.course?.title
                            ? `Course: ${coupon.course.title}`
                            : isPlatform
                            ? 'Site-Wide (All Courses)'
                            : 'All Instructor Courses'}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {isPlatform ? (
                          <button
                            onClick={() => handleTogglePublic(coupon)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                              coupon.isPublic
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}
                          >
                            {coupon.isPublic ? <EyeIcon className="w-3 h-3" /> : <EyeSlashIcon className="w-3 h-3" />}
                            <span>{coupon.isPublic ? 'Featured Pill' : 'Hidden Code'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Direct Code Only</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {coupon.timesRedeemed}
                        {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ' used'}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            coupon.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Paused'}
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
                          onClick={() => handleDelete(coupon._id, coupon.code)}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PLATFORM COUPON MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Create Platform Campaign Promo
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Subsidized by platform commission to safeguard instructor earnings.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME15"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono uppercase tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Promo Badge Title (Shown in Cart Offer Pills)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15% OFF Welcome Bonus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700 dark:text-gray-300">
                      Discount Value <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      Max: {commissionRate}%
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={discountType === 'percentage' ? commissionRate : 10000}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Commission Protection Notice */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 text-xs text-purple-900 dark:text-purple-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheckIcon className="w-4 h-4 text-purple-600" />
                  <span>Platform Commission Capping Guarantee:</span>
                </div>
                <p className="mt-1 text-[11px] text-purple-800/80 dark:text-purple-300">
                  Because this is a platform-wide coupon, discounts are capped at the {commissionRate}% platform commission rate so SkillKart absorbs the promotion without reducing instructor payouts.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 dark:text-white block">
                    Feature on Student Cart Page
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Display as a 1-click quick offer pill on the checkout page
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Min Purchase ({symbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
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
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl disabled:opacity-50 shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Create Platform Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCoupons;
