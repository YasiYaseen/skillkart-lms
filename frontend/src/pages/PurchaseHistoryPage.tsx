import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrderHistory, fetchOrderReceipt, type OrderRecord } from '@/features/student/api/cart';
import { useAuth } from '@/features/auth/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'react-toastify';
import {
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
  PrinterIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';

export default function PurchaseHistoryPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<OrderRecord | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const { user } = useAuth();
  const { currency, formatAmount } = useCurrency();

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await fetchOrderHistory();
        setOrders(data);
      } catch {
        toast.error('Failed to load purchase history');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const openReceiptModal = async (orderId: string) => {
    setLoadingReceipt(true);
    try {
      const fullOrder = await fetchOrderReceipt(orderId);
      setSelectedReceipt(fullOrder);
    } catch {
      toast.error('Failed to load invoice receipt');
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const matchesOrder = order.orderNumber.toLowerCase().includes(term);
    const matchesItem = order.items.some((it) => it.title.toLowerCase().includes(term));
    return matchesOrder || matchesItem;
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCoursesPurchased = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Purchase History & Invoices</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access your lifetime course enrollments, receipts, and order invoices.
          </p>
        </div>
        <Link
          to="/courses"
          className="self-start sm:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
        >
          Explore Catalog
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Orders</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{orders.length}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Invested</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{formatAmount(totalSpent)}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Courses Enrolled</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCoursesPurchased}</div>
        </div>
      </div>

      {/* Orders Filter Toolbar */}
      {orders.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order # or course title..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
            />
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          </div>
        </div>
      )}

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ReceiptPercentIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No purchases found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When you purchase a course, your official invoice and receipt will appear here.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/courses"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition-colors shadow-2xs"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5">Total Paid</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 max-w-xs">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {it.title}
                            </span>
                            {it.course?._id ? (
                              <Link
                                to={`/learn/${it.course._id}`}
                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline shrink-0 font-medium"
                              >
                                [Open]
                              </Link>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {order.items.length} {order.items.length === 1 ? 'course' : 'courses'}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="capitalize text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                        {order.paymentMethod === 'simulated' ? 'Credit Card' : order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-slate-900 dark:text-white">
                      {formatAmount(order.totalAmount)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openReceiptModal(order._id)}
                        disabled={loadingReceipt}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg font-medium text-xs transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 print:shadow-none print:border-none print:p-0">
            {/* Action Bar (hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Official Invoice Document Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-base">
                    S
                  </div>
                  <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                    SkillKart<span className="text-indigo-600">.</span>
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Official Learning Tax Invoice & Receipt</p>
              </div>

              <div className="text-left sm:text-right text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <div>
                  Invoice #: <strong className="font-mono text-gray-900 dark:text-white">{selectedReceipt.orderNumber}</strong>
                </div>
                <div>
                  Date: {new Date(selectedReceipt.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div>
                  Status: <span className="font-bold text-emerald-600">Paid & Enrolled</span>
                </div>
              </div>
            </div>

            {/* Customer & Transaction Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-xs border border-gray-100 dark:border-gray-800">
              <div>
                <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Billed To:</span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {(typeof selectedReceipt.student === 'object' && selectedReceipt.student?.name) || user?.name || 'Enrolled Student'}
                </p>
                <p className="text-gray-500 dark:text-gray-400">{(typeof selectedReceipt.student === 'object' && selectedReceipt.student?.email) || user?.email}</p>
              </div>

              <div className="sm:text-right">
                <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Payment Reference:</span>
                <p className="font-mono text-gray-800 dark:text-gray-200 text-[11px] truncate">
                  Txn ID: {selectedReceipt.transactionId}
                </p>
                <p className="text-gray-500 dark:text-gray-400 capitalize">Method: {selectedReceipt.paymentMethod}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="p-3.5">Course Description</th>
                    <th className="p-3.5 text-right">Original</th>
                    <th className="p-3.5 text-right">Discount</th>
                    <th className="p-3.5 text-right">Final Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {selectedReceipt.items.map((item, i) => (
                    <tr key={i}>
                      <td className="p-3.5 font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </td>
                      <td className="p-3.5 text-right font-mono text-gray-500 dark:text-gray-400">
                        {formatAmount(item.originalPrice)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-600">
                        {item.discountAmount > 0 ? `-${formatAmount(item.discountAmount)}` : formatAmount(0)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                        {formatAmount(item.finalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatAmount(selectedReceipt.subtotal)}</span>
                </div>

                {selectedReceipt.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon ({selectedReceipt.couponCode || 'PROMO'})</span>
                    <span className="font-mono">-{formatAmount(selectedReceipt.discountTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-[11px]">
                  <span>Tax & Processing</span>
                  <span className="font-mono">{formatAmount(0)}</span>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between font-extrabold text-sm text-gray-900 dark:text-white">
                  <span>Total Paid ({currency})</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {formatAmount(selectedReceipt.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
              <p>SkillKart Online Learning Platform &bull; Thank you for learning with us!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
