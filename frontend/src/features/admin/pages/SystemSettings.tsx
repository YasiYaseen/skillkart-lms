import { useState, useEffect, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import {
  Cog6ToothIcon,
  GlobeAltIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  EnvelopeIcon,
  CheckIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid';

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
  const { symbol, formatAmount, refreshSettings } = useCurrency();
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
      await refreshSettings();
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 text-xs">Loading platform configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
              <Cog6ToothIcon className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Platform System Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure platform branding, financial commission splits, access security, and maintenance status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formData.maintenanceMode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Maintenance Mode Active
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer ${
            activeTab === 'general'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GlobeAltIcon className="w-4 h-4" />
          <span>General & Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financials')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer ${
            activeTab === 'financials'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BanknotesIcon className="w-4 h-4" />
          <span>Revenue & Commission</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer ${
            activeTab === 'access'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheckIcon className="w-4 h-4" />
          <span>Access & Moderation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <WrenchScrewdriverIcon className="w-4 h-4" />
          <span>Maintenance Mode</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer ${
            activeTab === 'email'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-800'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <EnvelopeIcon className="w-4 h-4" />
          <span>Email & Diagnostics</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* TAB 1: General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Platform Identity & Localization</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your public LMS branding and primary base storefront currency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={formData.platformName}
                  onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Public Support Email Address
                </label>
                <input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Primary Storefront Currency
                </label>
                <select
                  value={formData.primaryCurrency}
                  onChange={(e) => setFormData({ ...formData, primaryCurrency: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="CAD">CAD (CA$) - Canadian Dollar</option>
                  <option value="AUD">AUD (A$) - Australian Dollar</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Revenue & Commission */}
        {activeTab === 'financials' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Revenue Sharing & Commission Split</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Adjust how course earnings are split between the SkillKart platform and content instructors on paid transactions.
              </p>
            </div>

            {/* Visual Split Bar */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Platform Fee: {formData.platformCommissionRate}%
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Instructor Share: {formData.instructorPayoutShare}%
                </span>
              </div>

              <div className="h-5 w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex">
                <div
                  style={{ width: `${formData.platformCommissionRate}%` }}
                  className="bg-blue-600 transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white"
                >
                  {formData.platformCommissionRate > 12 && `${formData.platformCommissionRate}%`}
                </div>
                <div
                  style={{ width: `${formData.instructorPayoutShare}%` }}
                  className="bg-emerald-600 transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white"
                >
                  {formData.instructorPayoutShare > 12 && `${formData.instructorPayoutShare}%`}
                </div>
              </div>

              <div className="pt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.platformCommissionRate}
                  onChange={(e) => handleCommissionChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Platform Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.platformCommissionRate}
                    onChange={(e) => handleCommissionChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none pr-8"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Instructor Payout Share (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.instructorPayoutShare}
                    onChange={(e) => handleCommissionChange(100 - Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none pr-8"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Minimum Instructor Withdrawal Threshold ({symbol})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={formData.minPayoutThreshold}
                    onChange={(e) => setFormData({ ...formData, minPayoutThreshold: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none pl-7"
                    required
                  />
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">{symbol}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Instructors must accumulate at least this balance before submitting payout withdrawal requests.
                </p>
              </div>

              {/* Simulation Card */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex flex-col justify-center">
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Example Sale Simulation ({formatAmount(100)} Course):
                </span>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  • Instructor Net Take-Home: <strong className="font-semibold">{formatAmount(100 * (formData.instructorPayoutShare / 100))}</strong><br />
                  • Platform Commission Retained: <strong className="font-semibold">{formatAmount(100 * (formData.platformCommissionRate / 100))}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Access & Moderation */}
        {activeTab === 'access' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registration & Moderation Policies</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage user onboarding permissions, instructor publishing restrictions, and security policies.
              </p>
            </div>

            <div className="space-y-3">
              {/* Allow User Registration */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
                <div className="space-y-0.5 pr-4">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Allow Public Student Signups</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Require Instructor Approval */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
                <div className="space-y-0.5 pr-4">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Require Course Moderation / Instructor Approval</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Require Email Verification */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
                <div className="space-y-0.5 pr-4">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Enforce Email Verification</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Maintenance Mode */}
        {activeTab === 'maintenance' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Platform Maintenance & Downtime Mode</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                When maintenance mode is active, visitors and learners see a global maintenance banner notifying them of scheduled system upgrades.
              </p>
            </div>

            {/* Maintenance Toggle */}
            <div className={`p-4 rounded-lg border transition-colors ${
              formData.maintenanceMode
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <WrenchScrewdriverIcon className="w-4 h-4 text-amber-600" />
                    <span>Enable Platform Maintenance Mode</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Maintenance Announcement Message
                </label>
                <textarea
                  rows={3}
                  value={formData.maintenanceMessage}
                  onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  placeholder="SkillKart is undergoing scheduled upgrades..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Estimated End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.maintenanceEstimatedEndTime}
                  onChange={(e) => setFormData({ ...formData, maintenanceEstimatedEndTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Live Banner Preview */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Live Maintenance Banner Preview:
                </span>
                <div className="p-3.5 rounded-lg bg-amber-500 text-white flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <ExclamationTriangleIcon className="w-5 h-5 text-white shrink-0" />
                    <div>
                      <strong className="font-bold text-xs uppercase tracking-wider block">Platform Maintenance</strong>
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-2xs">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">SMTP Mail Server & Diagnostics</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure transactional email transport credentials and execute real-time SMTP diagnostic rounds.
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                  formData.smtpStatus === 'operational'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : formData.smtpStatus === 'degraded'
                    ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  ● {formData.smtpStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  SMTP Host Address
                </label>
                <input
                  type="text"
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="e.g. smtp.mailtrap.io"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="587"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Default Sender Address (From)
                </label>
                <input
                  type="email"
                  value={formData.smtpSenderEmail}
                  onChange={(e) => setFormData({ ...formData, smtpSenderEmail: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="notifications@skillkart.com"
                />
              </div>
            </div>

            {/* Diagnostic Dispatch Simulator */}
            <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3 shadow-2xs border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
                    SMTP Diagnostic Dispatcher
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">RFC 5321 Compliant</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder={`Recipient email (${user?.email || 'admin@skillkart.com'})`}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {testingEmail ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Testing Roundtrip...</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-3.5 h-3.5" />
                      <span>Send Test Email</span>
                    </>
                  )}
                </button>
              </div>

              {diagnosticResult && (
                <div className="p-3.5 rounded-lg bg-black/60 font-mono text-xs text-emerald-400 space-y-1 border border-emerald-500/30">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>STATUS: 250 OK (DELIVERED)</span>
                    <span>LATENCY: {diagnosticResult.latencyMs}ms</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    [SMTP-CLIENT] Handshake: CONNECT {diagnosticResult.smtpHost}:{diagnosticResult.smtpPort} OK
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    [SMTP-CLIENT] MAIL FROM: &lt;{diagnosticResult.sender}&gt;
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    [SMTP-CLIENT] RCPT TO: &lt;{diagnosticResult.recipient}&gt;
                  </div>
                  <div className="text-emerald-300 font-semibold text-[11px]">
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
export default SystemSettings;
