import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrderHistory, fetchOrderReceipt, type OrderRecord } from '@/features/student/api/cart';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'react-toastify';

export default function PurchaseHistoryPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<OrderRecord | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const { user } = useAuth();

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

  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesNumber = order.orderNumber?.toLowerCase().includes(term);
    const matchesCourses = order.items?.some((i) => i.title?.toLowerCase().includes(term));
    return matchesNumber || matchesCourses;
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCoursesPurchased = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading your purchase history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Purchase History & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            View all your past orders, transactions, and download official PDF/print receipts.
          </p>
        </div>

        <Link
          to="/courses"
          className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors self-start sm:self-auto"
        >
          Explore More Courses →
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
            🧾
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Orders Placed</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{orders.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
            💰
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Amount Invested</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              ${totalSpent.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
            🎓
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Courses Acquired</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{totalCoursesPurchased}</div>
          </div>
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
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-xs"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            📂
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No purchases found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              You have not purchased any paid courses yet. When you complete an order, your receipts will be saved here.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            Browse Course Catalog
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-gray-900 dark:text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">{it.title}</span>
                            {typeof it.course === 'object' && it.course?._id ? (
                              <Link
                                to={`/learn/${it.course._id}`}
                                className="text-[10px] text-indigo-600 hover:underline shrink-0"
                              >
                                [Open Course]
                              </Link>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        {order.items.length} {order.items.length === 1 ? 'course' : 'courses'}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="capitalize text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                        {order.paymentMethod === 'simulated' ? '⚡ Demo Pay' : order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-gray-900 dark:text-white">
                      ${order.totalAmount.toFixed(2)} USD
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>✓</span> Completed
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openReceiptModal(order._id)}
                        disabled={loadingReceipt}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg font-semibold text-xs transition-colors border border-indigo-200 dark:border-indigo-800"
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
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 p-8 space-y-6 print:shadow-none print:border-none print:p-0">
            {/* Action Bar (hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>🖨️ Print / Save PDF</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
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
                        ${item.originalPrice.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-600">
                        {item.discountAmount > 0 ? `-$${item.discountAmount.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                        ${item.finalPrice.toFixed(2)}
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
                  <span className="font-mono">${selectedReceipt.subtotal.toFixed(2)}</span>
                </div>

                {selectedReceipt.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon ({selectedReceipt.couponCode || 'PROMO'})</span>
                    <span className="font-mono">-${selectedReceipt.discountTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-[11px]">
                  <span>Tax & Processing</span>
                  <span className="font-mono">$0.00</span>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between font-extrabold text-sm text-gray-900 dark:text-white">
                  <span>Total Paid (USD)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    ${selectedReceipt.totalAmount.toFixed(2)}
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
