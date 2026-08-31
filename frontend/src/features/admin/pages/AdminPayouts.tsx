import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { getErrorMessage } from '@/utils/errorUtils';
import {
  fetchAdminPayouts,
  updateAdminPayoutStatus,
  exportAdminPayoutsCsv,
  type AdminPayoutRecord,
  type PayoutsSummary,
} from '../api/payouts';
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  UserIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/20/solid';

const STATUS_TABS = [
  { id: 'all', label: 'All Requests' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'processing', label: 'Processing' },
  { id: 'completed', label: 'Completed / Paid' },
  { id: 'rejected', label: 'Rejected' },
];

export function AdminPayouts() {
  const [payouts, setPayouts] = useState<AdminPayoutRecord[]>([]);
  const [summary, setSummary] = useState<PayoutsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const { formatAmount } = useCurrency();

  // Detail & Action Modal
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutRecord | null>(null);
  const [actionStatus, setActionStatus] = useState<'pending' | 'processing' | 'completed' | 'rejected'>('completed');
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminPayouts(statusFilter, searchQuery);
      setPayouts(res.payouts);
      setSummary(res.summary);
    } catch {
      toast.error('Failed to load instructor payout requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const blob = await exportAdminPayoutsCsv(statusFilter);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skillkart-payouts-${statusFilter}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Payouts disbursement CSV exported successfully!');
    } catch {
      toast.error('Failed to export payouts CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const openActionModal = (payout: AdminPayoutRecord, defaultAction?: 'processing' | 'completed' | 'rejected') => {
    setSelectedPayout(payout);
    setActionStatus(defaultAction || (payout.status === 'pending' ? 'completed' : payout.status));
    setActionNotes(payout.notes || '');
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    try {
      setSubmittingAction(true);
      await updateAdminPayoutStatus(selectedPayout._id, actionStatus, actionNotes);
      toast.success(`Payout #${selectedPayout.referenceNumber} marked as ${actionStatus}`);
      setSelectedPayout(null);
      loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update payout status'));
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Instructor Payout Disbursements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, verify recipient bank credentials, and process withdrawal requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            <span>{exportingCsv ? 'Exporting...' : 'Export Payout CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Requests
            </span>
            <ClockIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {formatAmount(summary?.pending.amount || 0)}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary?.pending.count || 0} requests awaiting review
          </p>
        </div>

        {/* Processing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              In Processing
            </span>
            <ArrowPathIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {formatAmount(summary?.processing.amount || 0)}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary?.processing.count || 0} wire transfers initiated
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Total Disbursed
            </span>
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatAmount(summary?.completed.amount || 0)}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary?.completed.count || 0} paid withdrawals
          </p>
        </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Rejected / Refunded
            </span>
            <XCircleIcon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono">
            {formatAmount(summary?.rejected.amount || 0)}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary?.rejected.count || 0} returned to balance
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ref #, name, email..."
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden w-48 sm:w-60"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Payouts Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 space-y-2">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading payout requests queue...</p>
        </div>
      ) : payouts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 max-w-md mx-auto">
          <BanknotesIcon className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Payout Requests Found</h3>
          <p className="text-xs text-slate-400">There are no withdrawal requests matching the selected filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Reference #</th>
                  <th className="px-4 py-3.5">Requested Date</th>
                  <th className="px-4 py-3.5">Instructor</th>
                  <th className="px-4 py-3.5">Method & Destination</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payouts.map((p) => {
                  const inst = p.instructor;
                  const acc = p.accountDetails || {};

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        #{p.referenceNumber}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {inst?.name?.charAt(0).toUpperCase() || 'I'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{inst?.name || 'Instructor'}</p>
                            <p className="text-[10px] text-slate-400">{inst?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          {p.method === 'bank_transfer' ? (
                            <>
                              <BuildingLibraryIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{acc.bankName ? `${acc.bankName} (***${acc.accountNumber?.slice(-4) || ''})` : 'Bank Wire'}</span>
                            </>
                          ) : p.method === 'paypal' ? (
                            <>
                              <UserIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">{acc.paypalEmail || 'PayPal Account'}</span>
                            </>
                          ) : (
                            <>
                              <CreditCardIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <span className="truncate">{acc.stripeAccountId || 'Stripe Connect'}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-extrabold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                        {formatAmount(p.amount)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : p.status === 'processing'
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : p.status === 'rejected'
                              ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => openActionModal(p)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Review & Process
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

      {/* Payout Details & Action Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Payout Request #{selectedPayout.referenceNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Requested on {new Date(selectedPayout.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayout(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient & Amount Summary Banner */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Instructor</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedPayout.instructor?.name || 'Instructor'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 block">{selectedPayout.instructor?.email}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Disbursement Amount</span>
                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">
                  {formatAmount(selectedPayout.amount)}
                </span>
              </div>
            </div>

            {/* Destination Banking / PayPal Details Box */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[10px]">
                Disbursement Account Details ({selectedPayout.method.replace('_', ' ').toUpperCase()})
              </span>

              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-1.5 font-mono text-[11px]">
                {selectedPayout.method === 'bank_transfer' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Bank Name:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedPayout.accountDetails?.bankName || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Account Holder:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedPayout.accountDetails?.accountHolderName || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Account # / IBAN:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedPayout.accountDetails?.accountNumber || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Routing / SWIFT:</span>
                      <strong className="text-slate-900 dark:text-white">{selectedPayout.accountDetails?.routingNumber || 'N/A'}</strong>
                    </div>
                  </>
                ) : selectedPayout.method === 'paypal' ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">PayPal Email:</span>
                    <strong className="text-slate-900 dark:text-white">{selectedPayout.accountDetails?.paypalEmail || 'N/A'}</strong>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Stripe Account ID:</span>
                    <strong className="text-slate-900 dark:text-white">{selectedPayout.accountDetails?.stripeAccountId || 'N/A'}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Action Form */}
            <form onSubmit={handleStatusUpdate} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Update Payout Status
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="pending">Pending Review</option>
                  <option value="processing">In Processing (Wire in transit)</option>
                  <option value="completed">Completed / Paid (Wire Disbursed)</option>
                  <option value="rejected">Rejected (Refund back to balance)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Notes / Bank Reference ID (Optional)
                </label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Bank Wire Ref #TX99482 or reason for rejection..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl disabled:opacity-50 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>{submittingAction ? 'Saving...' : 'Confirm Status Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayouts;
