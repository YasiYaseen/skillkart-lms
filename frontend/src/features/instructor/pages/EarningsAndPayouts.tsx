import { useState, useEffect, FormEvent } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ClockIcon,
  BookOpenIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';

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

interface MomGrowth {
  grossPercent: number;
  netPercent: number;
  salesCountPercent: number;
}

interface PromoVsOrganic {
  couponSalesCount: number;
  couponGross: number;
  couponNet: number;
  organicSalesCount: number;
  organicGross: number;
  organicNet: number;
}

interface CouponROI {
  code: string;
  unitsSold: number;
  grossRevenue: number;
  discountGiven: number;
  instructorNet: number;
}

interface EarningsData {
  range?: string;
  summary: EarningsSummary & { periodNetEarnings?: number };
  momGrowth?: MomGrowth;
  promoPerformance?: {
    promoVsOrganic: PromoVsOrganic;
    coupons: CouponROI[];
  };
  courseBreakdown: CourseEarnings[];
  monthlyTrend: MonthlyEarnings[];
  payouts: PayoutRecord[];
  recentSales: (SaleLedgerItem & { couponUsed?: string })[];
}

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

export function EarningsAndPayouts() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const { symbol, formatAmount, formatPrice } = useCurrency();

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

  const loadEarnings = async (selectedRange = range) => {
    try {
      setLoading(true);
      const res = await api.get<EarningsData>(`/instructor/earnings?range=${selectedRange}`);
      setData(res.data);
    } catch {
      toast.error('Failed to load instructor earnings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings(range);
  }, [range]);

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
      toast.warning(`Minimum withdrawal amount is ${formatAmount(50)}`);
      return;
    }
    setWithdrawAmount(data.summary.availableBalance.toFixed(2));
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 50) {
      toast.error(`Minimum withdrawal is ${formatAmount(50)}`);
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading instructor earnings & balance...</p>
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

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={downloadingCsv}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            <span>{downloadingCsv ? 'Exporting...' : 'Export Statement'}</span>
          </button>

          <button
            onClick={handleOpenPayoutModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <BanknotesIcon className="w-4 h-4" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Pills */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-fit shadow-2xs">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              range === r.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Primary Financial Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance (Hero Card) */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-2 relative overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
              Available For Withdrawal
            </span>
            <span className="p-1.5 bg-white/20 rounded-lg text-xs"><BanknotesIcon className="w-4 h-4 text-white" /></span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">
            {formatAmount(summary.availableBalance)}
          </div>
          <p className="text-[11px] text-blue-100">
            Min. withdrawal threshold: {formatAmount(50)}
          </p>
        </div>

        {/* Period Net Take-Home (80%) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Net Take-Home (80%)
            </span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs"><AcademicCapIcon className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono">
              {formatAmount((data?.summary as any)?.periodNetEarnings ?? summary.totalLifetimeNetEarnings)}
            </div>
            {data?.momGrowth && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                data.momGrowth.netPercent >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
              }`}>
                {data.momGrowth.netPercent >= 0 ? `+${data.momGrowth.netPercent}%` : `${data.momGrowth.netPercent}%`}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            From {formatAmount(summary.totalGrossSales)} gross sales ({summary.totalUnitsSold} units)
          </p>
        </div>

        {/* Total Platform Fee Deductions (20%) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Platform Share (20%)
            </span>
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg text-xs"><BuildingOfficeIcon className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {formatAmount(summary.totalPlatformFees)}
          </div>
          <p className="text-[11px] text-slate-400">
            Platform hosting & payment processing
          </p>
        </div>

        {/* Payouts Withdrawn & Pending */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Withdrawn / Pending
            </span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg text-xs"><ClockIcon className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
            {formatAmount(summary.totalPayoutsWithdrawn)}
          </div>
          <p className="text-[11px] text-slate-400">
            Pending approval: <strong className="text-amber-600 font-mono">{formatAmount(summary.pendingPayoutsAmount)}</strong>
          </p>
        </div>
      </div>

      {/* Course Revenue Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Course-by-Course Revenue Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Earnings distribution across your published courses.</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {data?.courseBreakdown.length || 0} Courses Active
          </span>
        </div>

        {data?.courseBreakdown && data.courseBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3">List Price</th>
                  <th className="px-4 py-3">Units Sold</th>
                  <th className="px-4 py-3">Gross Sales</th>
                  <th className="px-4 py-3">Platform Cut (20%)</th>
                  <th className="px-4 py-3">Your Net Earnings (80%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.courseBreakdown.map((course) => (
                  <tr key={course.courseId} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-3">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-10 h-7 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                          <BookOpenIcon className="w-4 h-4" />
                        </div>
                      )}
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                        {course.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatPrice(course.price)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {course.unitsSold}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
                      {formatAmount(course.grossRevenue)}
                    </td>
                    <td className="px-4 py-3 font-mono text-rose-500">
                      -{formatAmount(course.platformFee)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatAmount(course.netEarnings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-slate-400">No courses published yet.</p>
        )}
      </div>

      {/* Promotional vs Organic Sales ROI Section */}
      {data?.promoPerformance && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎟️ Promotional vs. Organic Sales ROI</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track how much revenue is driven by promo codes versus direct organic enrollments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-1">
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 block">
                Promo Code Sales
              </span>
              <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400">
                {formatAmount(data.promoPerformance.promoVsOrganic.couponNet)} take-home
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {data.promoPerformance.promoVsOrganic.couponSalesCount} sales from promotional campaigns ({formatAmount(data.promoPerformance.promoVsOrganic.couponGross)} gross)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                Direct / Organic Sales
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {formatAmount(data.promoPerformance.promoVsOrganic.organicNet)} take-home
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {data.promoPerformance.promoVsOrganic.organicSalesCount} sales at full price ({formatAmount(data.promoPerformance.promoVsOrganic.organicGross)} gross)
              </p>
            </div>
          </div>

          {data.promoPerformance.coupons.length > 0 ? (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Promo Code</th>
                    <th className="px-4 py-2.5">Redemptions</th>
                    <th className="px-4 py-2.5">Gross Revenue</th>
                    <th className="px-4 py-2.5">Discounts Given</th>
                    <th className="px-4 py-2.5">Your Net Earnings (80%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.promoPerformance.coupons.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {c.code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {c.unitsSold}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
                        {formatAmount(c.grossRevenue)}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-500">
                        -{formatAmount(c.discountGiven)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatAmount(c.instructorNet)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-slate-400">No promo code redemptions in this selected timeframe.</p>
          )}
        </div>
      )}

      {/* Payout & Withdrawal History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Payout & Withdrawal History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Record of requested and disbursed funds.</p>
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
                    <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 uppercase font-mono text-[10px]">
                      {p.method === 'bank_transfer' ? 'Bank Wire' : p.method === 'paypal' ? 'PayPal' : 'Stripe'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                      {p.method === 'bank_transfer'
                        ? `${p.accountDetails.bankName || 'Bank'} (${p.accountDetails.accountNumber ? `••••${p.accountDetails.accountNumber.slice(-4)}` : 'Account'})`
                        : p.method === 'paypal'
                        ? p.accountDetails.paypalEmail
                        : p.accountDetails.stripeAccountId || 'Stripe Account'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {formatAmount(p.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                        p.status === 'completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : p.status === 'pending'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : p.status === 'processing'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
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
          <p className="py-8 text-center text-xs text-slate-400">No payout withdrawals requested yet.</p>
        )}
      </div>

      {/* REQUEST PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full shadow-xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Request Earnings Payout
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Available Balance: <strong className="text-blue-600 font-mono">{formatAmount(summary.availableBalance)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="space-y-4 text-xs">
              {/* Payout Method Selector */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payout Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank_transfer')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      payoutMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <BuildingLibraryIcon className="w-4 h-4 text-slate-500" />
                    <span>Bank Wire</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('paypal')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      payoutMethod === 'paypal'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="italic font-bold text-xs">PP</span>
                    <span>PayPal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('stripe')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      payoutMethod === 'stripe'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <CreditCardIcon className="w-4 h-4 text-slate-500" />
                    <span>Stripe</span>
                  </button>
                </div>
              </div>

              {/* Amount to Withdraw */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-700 dark:text-gray-300">
                    Withdrawal Amount ({symbol}) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(summary.availableBalance.toFixed(2))}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Withdraw Full Balance ({formatAmount(summary.availableBalance)})
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
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold"
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
