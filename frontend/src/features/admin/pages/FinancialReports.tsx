import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

interface FinancialMetrics {
  grossVolume: number;
  totalSubtotal: number;
  totalDiscount: number;
  platformCommission: number;
  instructorPayouts: number;
  totalOrdersCount: number;
  averageOrderValue: number;
}

interface TimeSeriesPoint {
  date: string;
  revenue: number;
  count: number;
  discounts: number;
}

interface TopCourse {
  courseId: string;
  title: string;
  unitsSold: number;
  revenue: number;
  instructorName: string;
}

interface TopInstructor {
  instructorId: string;
  name: string;
  email: string;
  unitsSold: number;
  grossRevenue: number;
  estimatedPayout: number;
}

interface RecentTransaction {
  _id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  itemsCount: number;
  coursesSummary: string;
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
}

interface FinancialReportsData {
  range: string;
  startDate: string | null;
  endDate: string;
  metrics: FinancialMetrics;
  timeSeries: TimeSeriesPoint[];
  topCourses: TopCourse[];
  topInstructors: TopInstructor[];
  paymentMethodsBreakdown: Record<string, { count: number; volume: number }>;
  recentTransactions: RecentTransaction[];
}

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '1y', label: 'Last Year' },
  { id: 'all', label: 'All Time' },
];

export function FinancialReports() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<FinancialReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [searchLedger, setSearchLedger] = useState('');

  const loadReports = async (selectedRange: string) => {
    try {
      setLoading(true);
      const res = await api.get<FinancialReportsData>(`/admin/financial-reports?range=${selectedRange}`);
      setData(res.data);
    } catch {
      toast.error('Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(range);
  }, [range]);

  const handleExportCsv = async () => {
    try {
      setDownloadingCsv(true);
      const res = await api.get('/admin/financial-reports/export-csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `skillkart-financials-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Sales report CSV downloaded successfully!');
    } catch {
      toast.error('Failed to export CSV report');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const maxDailyRevenue = data?.timeSeries?.length
    ? Math.max(...data.timeSeries.map((p) => p.revenue), 1)
    : 1;

  const filteredTransactions = data?.recentTransactions?.filter((tx) => {
    if (!searchLedger.trim()) return true;
    const q = searchLedger.toLowerCase();
    return (
      tx.orderNumber.toLowerCase().includes(q) ||
      tx.customerName.toLowerCase().includes(q) ||
      tx.customerEmail.toLowerCase().includes(q) ||
      tx.coursesSummary.toLowerCase().includes(q)
    );
  }) || [];

  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Generating platform financial reports...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {
    grossVolume: 0,
    totalSubtotal: 0,
    totalDiscount: 0,
    platformCommission: 0,
    instructorPayouts: 0,
    totalOrdersCount: 0,
    averageOrderValue: 0,
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Platform Financials & Revenue Reports
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time Gross Merchandise Value (GMV), platform commission cut, coupon impacts, and sales ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={downloadingCsv}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>📥 {downloadingCsv ? 'Exporting...' : 'Export to CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>🖨️ Print Statement</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 w-fit shadow-xs">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              range === r.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Gross Sales (GMV)
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-sm">
              💰
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
            ${metrics.grossVolume.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400">
            Across {metrics.totalOrdersCount} paid transactions
          </p>
        </div>

        {/* Platform Commission (20%) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Platform Cut (20%)
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 text-sm">
              ⚡
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            ${metrics.platformCommission.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400">
            Net revenue retained by SkillKart
          </p>
        </div>

        {/* Instructor Payout Share (80%) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Instructor Share (80%)
            </span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 text-sm">
              🎓
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            ${metrics.instructorPayouts.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400">
            Total instructor earnings allocated
          </p>
        </div>

        {/* Discounts Absorbed & AOV */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Coupon Discounts / AOV
            </span>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 text-sm">
              🏷️
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            -${metrics.totalDiscount.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400">
            Avg Order Value: <strong className="text-gray-700 dark:text-gray-300 font-mono">${metrics.averageOrderValue.toFixed(2)}</strong>
          </p>
        </div>
      </div>

      {/* Revenue Timeline Progression Visual Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Revenue Volume Trend
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Daily revenue spikes and checkout frequency over the selected timeframe.
            </p>
          </div>
          <div className="text-xs font-mono text-gray-400">
            Peak Day: <strong className="text-indigo-600">${maxDailyRevenue.toFixed(2)}</strong>
          </div>
        </div>

        {data?.timeSeries && data.timeSeries.length > 0 ? (
          <div className="pt-6">
            <div className="h-48 flex items-end gap-2 sm:gap-3 overflow-x-auto pb-2 border-b border-gray-100 dark:border-gray-800">
              {data.timeSeries.map((point) => {
                const heightPct = Math.max(8, Math.round((point.revenue / maxDailyRevenue) * 100));
                return (
                  <div key={point.date} className="flex-1 min-w-[28px] flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-xl z-20 font-mono">
                      {point.date}: ${point.revenue.toFixed(2)} ({point.count} orders)
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-linear-to-t from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300 rounded-t-lg transition-all duration-300 shadow-2xs"
                    />

                    {/* X-axis label */}
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">
                      {point.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-gray-400">
            No transaction volume recorded in this time interval.
          </div>
        )}
      </div>

      {/* Two Columns: Top Grossing Courses & Top Instructors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Grossing Courses */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🏆 Top Grossing Courses</span>
            </h3>
            <span className="text-[11px] text-gray-400">Ranked by Revenue</span>
          </div>

          {data?.topCourses && data.topCourses.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {data.topCourses.map((c, idx) => (
                <div key={c.courseId} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-gray-200 text-gray-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{c.title}</p>
                      <p className="text-[10px] text-gray-400 truncate">Instructor: {c.instructorName}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-gray-900 dark:text-white font-mono block">
                      ${c.revenue.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-400">{c.unitsSold} enrollments</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-gray-400">No course sales recorded yet.</p>
          )}
        </div>

        {/* Top Earning Instructors */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>👨‍🏫 Top Earning Instructors</span>
            </h3>
            <span className="text-[11px] text-gray-400">80% Share Model</span>
          </div>

          {data?.topInstructors && data.topInstructors.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {data.topInstructors.map((inst, idx) => (
                <div key={inst.instructorId} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      idx === 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{inst.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{inst.email || 'Instructor Account'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block">
                      ${inst.estimatedPayout.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-400">From ${inst.grossRevenue.toFixed(2)} gross</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-gray-400">No instructor sales recorded yet.</p>
          )}
        </div>
      </div>

      {/* Recent Orders & Transactions Ledger */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Transactions & Invoices Ledger
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Live feed of verified platform purchases.</p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchLedger}
              onChange={(e) => setSearchLedger(e.target.value)}
              placeholder="Search by order #, learner name, course..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="py-12 text-center text-xs text-gray-400">No transactions match your search query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Learner</th>
                  <th className="px-4 py-3">Courses</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Total Paid</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-gray-900 dark:text-white">
                      {tx.orderNumber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 dark:text-white">{tx.customerName}</p>
                      <p className="text-[10px] text-gray-400">{tx.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate font-medium text-gray-800 dark:text-gray-200" title={tx.coursesSummary}>
                      {tx.coursesSummary}
                    </td>
                    <td className="px-4 py-3.5 uppercase font-mono text-[11px] text-gray-500 dark:text-gray-400">
                      {tx.paymentMethod}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                      ${tx.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        {tx.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
