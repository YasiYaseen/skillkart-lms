import { useState, useEffect, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'react-toastify';

export interface SystemSettingsData {
  _id?: string;
  platformName: string;
  supportEmail: string;
  tagline: string;
  primaryCurrency: string;
  platformCommissionRate: number;
  instructorPayoutShare: number;
  minPayoutThreshold: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceEstimatedEndTime?: string;
  allowUserRegistration: boolean;
  requireInstructorApproval: boolean;
  requireEmailVerification: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSenderEmail: string;
  smtpStatus: 'operational' | 'degraded' | 'not_configured';
  updatedAt?: string;
}

export interface DiagnosticResult {
  success: boolean;
  message: string;
  smtpHost: string;
  smtpPort: number;
  sender: string;
  recipient: string;
  latencyMs: number;
  timestamp: string;
  status: string;
}

type SettingsTab = 'general' | 'financials' | 'access' | 'maintenance' | 'email';

export function SystemSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  const [formData, setFormData] = useState<SystemSettingsData>({
    platformName: 'SkillKart LMS',
    supportEmail: 'support@skillkart.com',
    tagline: 'Empower your career with top-rated interactive tech courses',
    primaryCurrency: 'USD',
    platformCommissionRate: 20,
    instructorPayoutShare: 80,
    minPayoutThreshold: 50,
    maintenanceMode: false,
    maintenanceMessage: 'SkillKart is currently undergoing scheduled platform upgrades. We will be right back!',
    maintenanceEstimatedEndTime: '',
    allowUserRegistration: true,
    requireInstructorApproval: true,
    requireEmailVerification: false,
    smtpHost: 'smtp.mailtrap.io',
    smtpPort: 587,
    smtpSenderEmail: 'notifications@skillkart.com',
    smtpStatus: 'operational',
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data?.settings) {
        const s = res.data.settings;
        setFormData({
          _id: s._id,
          platformName: s.platformName || 'SkillKart LMS',
          supportEmail: s.supportEmail || 'support@skillkart.com',
          tagline: s.tagline || 'Empower your career with top-rated interactive tech courses',
          primaryCurrency: s.primaryCurrency || 'USD',
          platformCommissionRate: typeof s.platformCommissionRate === 'number' ? s.platformCommissionRate : 20,
          instructorPayoutShare: typeof s.instructorPayoutShare === 'number' ? s.instructorPayoutShare : 80,
          minPayoutThreshold: typeof s.minPayoutThreshold === 'number' ? s.minPayoutThreshold : 50,
          maintenanceMode: Boolean(s.maintenanceMode),
          maintenanceMessage: s.maintenanceMessage || 'SkillKart is currently undergoing scheduled platform upgrades. We will be right back!',
          maintenanceEstimatedEndTime: s.maintenanceEstimatedEndTime ? new Date(s.maintenanceEstimatedEndTime).toISOString().slice(0, 16) : '',
          allowUserRegistration: s.allowUserRegistration ?? true,
          requireInstructorApproval: s.requireInstructorApproval ?? true,
          requireEmailVerification: Boolean(s.requireEmailVerification),
          smtpHost: s.smtpHost || 'smtp.mailtrap.io',
          smtpPort: s.smtpPort || 587,
          smtpSenderEmail: s.smtpSenderEmail || 'notifications@skillkart.com',
          smtpStatus: s.smtpStatus || 'operational',
          updatedAt: s.updatedAt,
        });
      }
    } catch {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleCommissionChange = (val: number) => {
    const rate = Math.max(0, Math.min(100, val));
    setFormData((prev) => ({
      ...prev,
      platformCommissionRate: rate,
      instructorPayoutShare: 100 - rate,
    }));
  };

  const handleSaveSettings = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        maintenanceEstimatedEndTime: formData.maintenanceEstimatedEndTime
          ? new Date(formData.maintenanceEstimatedEndTime).toISOString()
          : null,
      };

      const res = await api.put('/admin/settings', payload);
      toast.success(res.data?.message || 'System settings saved successfully!');
      if (res.data?.settings) {
        setFormData((prev) => ({
          ...prev,
          updatedAt: res.data.settings.updatedAt,
        }));
      }
    } catch (err: unknown) {
      let msg = 'Failed to update system settings';
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { message?: unknown } } }).response;
        if (typeof resp?.data?.message === 'string') {
          msg = resp.data.message;
        }
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setDiagnosticResult(null);
    try {
      const res = await api.post('/admin/settings/test-email', {
        targetEmail: testEmailAddress.trim() || user?.email,
      });
      setDiagnosticResult(res.data);
      toast.success('Diagnostic test email dispatched successfully!');
    } catch {
      toast.error('Failed to run mail server diagnostic');
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium text-sm">Loading platform configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Platform System Settings
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure platform branding, financial commission splits, access security, and maintenance status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formData.maintenanceMode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Maintenance Mode Active
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'general'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🌐 General & Branding
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financials')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'financials'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          💰 Revenue & Commission
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'access'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🛡️ Access & Moderation
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'maintenance'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🚧 Maintenance Mode
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
            activeTab === 'email'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          ✉️ SMTP Diagnostics
        </button>
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSaveSettings}>
        {/* TAB 1: General & Branding */}
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/60 p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Platform Branding & Identity</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                These details represent your LMS instance across navigation headers, email notifications, invoices, and certificates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={formData.platformName}
                  onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. SkillKart LMS"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Support & Contact Email
                </label>
                <input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. support@skillkart.com"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Platform Tagline / Slogan
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Empower your career with top-rated interactive tech courses"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Primary Storefront Currency
                </label>
                <select
                  value={formData.primaryCurrency}
                  onChange={(e) => setFormData({ ...formData, primaryCurrency: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Revenue & Commission */}
        {activeTab === 'financials' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/60 p-6 sm:p-8 space-y-8 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Sharing & Commission Split</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Adjust how course earnings are split between the SkillKart platform and content instructors on paid transactions.
              </p>
            </div>

            {/* Visual Split Bar */}
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700/60 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                  Platform Fee: {formData.platformCommissionRate}%
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Instructor Share: {formData.instructorPayoutShare}%
                </span>
              </div>

              <div className="h-6 w-full rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex shadow-inner">
                <div
                  style={{ width: `${formData.platformCommissionRate}%` }}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-300 flex items-center justify-center text-[10px] font-black text-white"
                >
                  {formData.platformCommissionRate > 12 && `${formData.platformCommissionRate}%`}
                </div>
                <div
                  style={{ width: `${formData.instructorPayoutShare}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 flex items-center justify-center text-[10px] font-black text-white"
                >
                  {formData.instructorPayoutShare > 12 && `${formData.instructorPayoutShare}%`}
                </div>
              </div>

              <div className="pt-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.platformCommissionRate}
                  onChange={(e) => handleCommissionChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Platform Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.platformCommissionRate}
                    onChange={(e) => handleCommissionChange(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                    required
                  />
                  <span className="absolute right-4 top-3 text-sm font-bold text-gray-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Instructor Payout Share (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.instructorPayoutShare}
                    onChange={(e) => handleCommissionChange(100 - Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                    required
                  />
                  <span className="absolute right-4 top-3 text-sm font-bold text-gray-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Minimum Instructor Withdrawal Threshold ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={formData.minPayoutThreshold}
                    onChange={(e) => setFormData({ ...formData, minPayoutThreshold: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none pl-8"
                    required
                  />
                  <span className="absolute left-4 top-3 text-sm font-bold text-gray-400">$</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Instructors must accumulate at least this balance before submitting payout withdrawal requests.
                </p>
              </div>

              {/* Simulation Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col justify-center">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                  💡 Example Sale Simulation ($100 Course):
                </span>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  • Instructor Net Take-Home: <strong className="font-bold">${(100 * (formData.instructorPayoutShare / 100)).toFixed(2)}</strong><br />
                  • Platform Commission Retained: <strong className="font-bold">${(100 * (formData.platformCommissionRate / 100)).toFixed(2)}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Access & Moderation */}
        {activeTab === 'access' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/60 p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registration & Moderation Policies</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage user onboarding permissions, instructor publishing restrictions, and security policies.
              </p>
            </div>

            <div className="space-y-4">
              {/* Allow User Registration */}
              <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                <div className="space-y-1 pr-4">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">Allow Public Student Signups</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    When disabled, new student registrations and Google OAuth signup will be paused.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.allowUserRegistration}
                    onChange={(e) => setFormData({ ...formData, allowUserRegistration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Require Instructor Approval */}
              <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                <div className="space-y-1 pr-4">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">Require Course Moderation / Instructor Approval</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Newly created courses remain in &apos;draft&apos; or &apos;pending_review&apos; status until reviewed by an administrator.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.requireInstructorApproval}
                    onChange={(e) => setFormData({ ...formData, requireInstructorApproval: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Require Email Verification */}
              <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                <div className="space-y-1 pr-4">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">Enforce Email Verification</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Require students to confirm their email before accessing enrolled courses.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.requireEmailVerification}
                    onChange={(e) => setFormData({ ...formData, requireEmailVerification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Maintenance Mode */}
        {activeTab === 'maintenance' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/60 p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Platform Maintenance & Downtime Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                When maintenance mode is active, visitors and learners see a global maintenance banner notifying them of scheduled system upgrades.
              </p>
            </div>

            {/* Maintenance Toggle */}
            <div className={`p-6 rounded-3xl border transition-all ${
              formData.maintenanceMode
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60'
                : 'bg-gray-50/50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🚧</span> Enable Platform Maintenance Mode
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Displays public maintenance notification. Admins retain full dashboard access.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.maintenanceMode}
                    onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Maintenance Announcement Message
                </label>
                <textarea
                  rows={3}
                  value={formData.maintenanceMessage}
                  onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="SkillKart is undergoing scheduled upgrades..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Estimated End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.maintenanceEstimatedEndTime}
                  onChange={(e) => setFormData({ ...formData, maintenanceEstimatedEndTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Live Banner Preview */}
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Live Maintenance Banner Preview:
                </span>
                <div className="p-4 rounded-2xl bg-amber-500 text-white flex items-center justify-between gap-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <strong className="font-black text-xs uppercase tracking-wider block">Platform Maintenance</strong>
                      <p className="text-xs text-amber-50 font-medium">
                        {formData.maintenanceMessage || 'SkillKart is undergoing upgrades.'}
                        {formData.maintenanceEstimatedEndTime && ` Expected completion: ${new Date(formData.maintenanceEstimatedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SMTP & Email Diagnostics */}
        {activeTab === 'email' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/60 p-6 sm:p-8 space-y-8 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">SMTP Mail Server & Diagnostics</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure transactional email transport credentials and execute real-time SMTP diagnostic rounds.
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  formData.smtpStatus === 'operational'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : formData.smtpStatus === 'degraded'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                }`}>
                  ● {formData.smtpStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  SMTP Host Address
                </label>
                <input
                  type="text"
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. smtp.mailtrap.io"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="587"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Default Sender Address (From)
                </label>
                <input
                  type="email"
                  value={formData.smtpSenderEmail}
                  onChange={(e) => setFormData({ ...formData, smtpSenderEmail: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="notifications@skillkart.com"
                />
              </div>
            </div>

            {/* Diagnostic Dispatch Simulator */}
            <div className="p-6 rounded-3xl bg-gray-900 text-white space-y-4 shadow-xl border border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-300">
                    SMTP Diagnostic Dispatcher
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-gray-400">RFC 5321 Compliant</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder={`Recipient email (${user?.email || 'admin@skillkart.com'})`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {testingEmail ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Testing Roundtrip...
                    </>
                  ) : (
                    '🚀 Send Test Email'
                  )}
                </button>
              </div>

              {diagnosticResult && (
                <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-emerald-400 space-y-1.5 border border-emerald-500/30 animate-fadeIn">
                  <div className="flex items-center justify-between text-gray-400 text-[11px]">
                    <span>STATUS: 250 OK (DELIVERED)</span>
                    <span>LATENCY: {diagnosticResult.latencyMs}ms</span>
                  </div>
                  <div className="text-gray-300">
                    [SMTP-CLIENT] Handshake: CONNECT {diagnosticResult.smtpHost}:{diagnosticResult.smtpPort} OK
                  </div>
                  <div className="text-gray-300">
                    [SMTP-CLIENT] MAIL FROM: &lt;{diagnosticResult.sender}&gt;
                  </div>
                  <div className="text-gray-300">
                    [SMTP-CLIENT] RCPT TO: &lt;{diagnosticResult.recipient}&gt;
                  </div>
                  <div className="text-emerald-300 font-bold">
                    ✓ {diagnosticResult.message}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
