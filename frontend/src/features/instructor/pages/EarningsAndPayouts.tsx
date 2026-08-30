import { useState, useEffect, FormEvent } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

interface EarningsSummary {
  totalGrossSales: number;
  totalPlatformFees: number;
  totalLifetimeNetEarnings: number;
  totalPayoutsWithdrawn: number;
  pendingPayoutsAmount: number;
  availableBalance: number;
  totalCoursesCount: number;
  totalUnitsSold: number;
}

interface CourseEarnings {
  courseId: string;
  title: string;
  price: number;
  thumbnailUrl?: string;
  unitsSold: number;
  grossRevenue: number;
  discountAbsorbed: number;
  platformFee: number;
  netEarnings: number;
}

interface MonthlyEarnings {
  month: string;
  gross: number;
  net: number;
  sales: number;
}

interface PayoutRecord {
  _id: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'paypal' | 'stripe';
  accountDetails: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    routingNumber?: string;
    paypalEmail?: string;
    stripeAccountId?: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: string;
  processedAt?: string;
  notes?: string;
}

interface SaleLedgerItem {
  orderNumber: string;
  date: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  salePrice: number;
  platformFee: number;
  instructorTakeHome: number;
}

interface EarningsData {
  summary: EarningsSummary;
  courseBreakdown: CourseEarnings[];
  monthlyTrend: MonthlyEarnings[];
  payouts: PayoutRecord[];
  recentSales: SaleLedgerItem[];
}

export function EarningsAndPayouts() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Request Payout Modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'paypal' | 'stripe'>('bank_transfer');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Account details form
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const res = await api.get<EarningsData>('/instructor/earnings');
      setData(res.data);
    } catch {
      toast.error('Failed to load instructor earnings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  const handleExportCsv = async () => {
    try {
      setDownloadingCsv(true);
      const res = await api.get('/instructor/earnings/export-csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `skillkart-instructor-statement-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Earnings statement CSV downloaded successfully!');
    } catch {
      toast.error('Failed to export earnings statement');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleOpenPayoutModal = () => {
    if (!data || data.summary.availableBalance < 50) {
      toast.warn('Minimum withdrawal amount is $50.00');
      return;
    }
    setWithdrawAmount(data.summary.availableBalance.toFixed(2));
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 50) {
      toast.error('Minimum withdrawal is $50.00');
      return;
    }
    if (data && amt > data.summary.availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    try {
      setSubmittingPayout(true);
      const payload = {
        amount: amt,
        method: payoutMethod,
        accountDetails: {
          bankName,
          accountHolderName,
          accountNumber,
          routingNumber,
          paypalEmail,
          stripeAccountId,
        },
        notes: payoutNotes,
      };

      const res = await api.post('/instructor/payouts/request', payload);
      toast.success(res.data.message || 'Payout request submitted successfully!');
      setShowPayoutModal(false);
      await loadEarnings();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit payout request';
      toast.error(msg);
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Loading instructor earnings & balance...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalGrossSales: 0,
    totalPlatformFees: 0,
    totalLifetimeNetEarnings: 0,
    totalPayoutsWithdrawn: 0,
    pendingPayoutsAmount: 0,
    availableBalance: 0,
    totalCoursesCount: 0,
    totalUnitsSold: 0,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Instructor Earnings & Payouts Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your 80% course revenue take-home, manage payment accounts, and request instant withdrawals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={downloadingCsv}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>📥 {downloadingCsv ? 'Exporting...' : 'Export Statement'}</span>
          </button>

          <button
            onClick={handleOpenPayoutModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <span>⚡ Request Payout</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance (Hero Card) */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-lg shadow-blue-600/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Available to Withdraw
            </span>
            <span className="p-1.5 bg-white/20 rounded-lg text-xs">💵</span>
          </div>
          <div className="text-3xl font-extrabold font-mono tracking-tight">
            ${summary.availableBalance.toFixed(2)}
          </div>
          <p className="text-[11px] text-blue-100">
            Min. withdrawal threshold: $50.00
          </p>
        </div>

        {/* Net Lifetime Take-Home (80%) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Net Lifetime Earnings (80%)
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs">🎓</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            ${summary.totalLifetimeNetEarnings.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400">
            From ${summary.totalGrossSales.toFixed(2)} gross sales
          </p>
        </div>

        {/* Total Platform Fee Deductions (20%) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Platform Share (20%)
            </span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs">🏛️</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 font-mono">
            ${summary.totalPlatformFees.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400">
            Platform hosting & payment processing
          </p>
        </div>

        {/* Payouts Withdrawn & Pending */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Withdrawn / Pending
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs">⏳</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
            ${summary.totalPayoutsWithdrawn.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400">
            Pending approval: <strong className="text-amber-600 font-mono">${summary.pendingPayoutsAmount.toFixed(2)}</strong>
          </p>
        </div>
      </div>

      {/* Course Revenue Breakdown Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Course-by-Course Revenue Breakdown
            </h3>
            <p className="text-xs text-gray-500">Earnings distribution across your published courses.</p>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {data?.courseBreakdown.length || 0} Courses Active
          </span>
        </div>

        {data?.courseBreakdown && data.courseBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3">List Price</th>
                  <th className="px-4 py-3">Units Sold</th>
                  <th className="px-4 py-3">Gross Sales</th>
                  <th className="px-4 py-3">Platform Cut (20%)</th>
                  <th className="px-4 py-3">Your Net Earnings (80%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.courseBreakdown.map((course) => (
                  <tr key={course.courseId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 flex items-center gap-3">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-10 h-8 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                          📚
                        </div>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                        {course.title}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      {course.price > 0 ? `$${course.price.toFixed(2)}` : 'FREE'}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">
                      {course.unitsSold}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-gray-800 dark:text-gray-200">
                      ${course.grossRevenue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-rose-500">
                      -${course.platformFee.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ${course.netEarnings.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-gray-400">No courses published yet.</p>
        )}
      </div>

      {/* Payout & Withdrawal History Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Payout & Withdrawal History
            </h3>
            <p className="text-xs text-gray-500">Record of requested and disbursed funds.</p>
          </div>
        </div>

        {data?.payouts && data.payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Reference ID</th>
                  <th className="px-4 py-3">Requested Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Disbursement Destination</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.payouts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                      {p.referenceNumber}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 uppercase font-mono text-[10px]">
                      {p.method === 'bank_transfer' ? '🏦 Bank Wire' : p.method === 'paypal' ? '🅿️ PayPal' : '⚡ Stripe'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 truncate max-w-xs">
                      {p.method === 'bank_transfer'
                        ? `${p.accountDetails.bankName || 'Bank'} (${p.accountDetails.accountNumber ? `••••${p.accountDetails.accountNumber.slice(-4)}` : 'Account'})`
                        : p.method === 'paypal'
                        ? p.accountDetails.paypalEmail
                        : p.accountDetails.stripeAccountId || 'Stripe Account'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : p.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : p.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-gray-400">No payout withdrawals requested yet.</p>
        )}
      </div>

      {/* REQUEST PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Request Earnings Payout
                </h3>
                <p className="text-xs text-gray-500">
                  Available Balance: <strong className="text-blue-600 font-mono">${summary.availableBalance.toFixed(2)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="space-y-4 text-xs">
              {/* Payout Method Selector */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Payout Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank_transfer')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all ${
                      payoutMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                        : 'border-gray-200 dark:border-gray-800 text-gray-600'
                    }`}
                  >
                    🏦 Bank Wire
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('paypal')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all ${
                      payoutMethod === 'paypal'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                        : 'border-gray-200 dark:border-gray-800 text-gray-600'
                    }`}
                  >
                    🅿️ PayPal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('stripe')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all ${
                      payoutMethod === 'stripe'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                        : 'border-gray-200 dark:border-gray-800 text-gray-600'
                    }`}
                  >
                    ⚡ Stripe
                  </button>
                </div>
              </div>

              {/* Amount to Withdraw */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-700 dark:text-gray-300">
                    Withdrawal Amount ($) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(summary.availableBalance.toFixed(2))}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Withdraw Full Balance (${summary.availableBalance.toFixed(2)})
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="50"
                  max={summary.availableBalance}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="50.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Dynamic Account Fields */}
              {payoutMethod === 'bank_transfer' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. JPMorgan Chase / Barclays"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Account / IBAN Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="•••• •••• 9821"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Routing / SWIFT Code
                    </label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      placeholder="e.g. 021000021"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {payoutMethod === 'paypal' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      PayPal Account Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="instructor.payouts@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {payoutMethod === 'stripe' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Stripe Connect ID or Email *
                    </label>
                    <input
                      type="text"
                      required
                      value={stripeAccountId}
                      onChange={(e) => setStripeAccountId(e.target.value)}
                      placeholder="acct_1N234567890ABC"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Monthly withdrawal"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50"
                >
                  {submittingPayout ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
