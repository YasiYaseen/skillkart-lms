import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/features/auth/AuthContext';
import { completeOnboarding } from '@/features/auth/auth.service';

const STEPS = ['Your Role', 'Your Profile', 'Your Interests'] as const;

const INTEREST_OPTIONS = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'UI/UX Design',
  'DevOps',
  'Cybersecurity',
  'Cloud Computing',
  'Blockchain',
  'Game Development',
  'Business',
  'Marketing',
];

interface FormData {
  role: 'student' | 'instructor';
  headline: string;
  bio: string;
  interests: string[];
  socialLinks: { website: string; linkedin: string; twitter: string };
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    role: 'student',
    headline: '',
    bio: '',
    interests: [],
    socialLinks: { website: '', linkedin: '', twitter: '' },
  });

  useEffect(() => {
    if (!token || !user) {
      navigate('/', { replace: true });
      return;
    }

    if (user?.onboardingCompleted) {
      navigate('/', { replace: true });
    }
  }, [token, user, user?.onboardingCompleted, navigate]);

  const firstName = useMemo(() => user?.name?.split(' ')[0] ?? '', [user?.name]);

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const canProceed = () => {
    if (step === 0) return Boolean(form.role);
    if (step === 1) return form.headline.trim().length >= 3;
    return form.interests.length >= 1;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { user: updatedUser } = await completeOnboarding(form);
      updateUser({
        role: updatedUser.role,
        onboardingCompleted: true,
        headline: updatedUser.headline,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        socialLinks: updatedUser.socialLinks,
      });
      toast.success('Welcome to SkillKart!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save onboarding';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }
    handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome{firstName ? `, ${firstName}` : ''}!</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Let&apos;s set up your profile in three quick steps.</p>
      </div>

      <div className="flex items-center gap-3 mb-8">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  idx < step
                    ? 'bg-green-500 text-white'
                    : idx === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {idx < step ? 'OK' : idx + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${idx === step ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 mb-4 ${idx < step ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-2xl p-8">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">What best describes you?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">You can change this later in your profile settings.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['student', 'instructor'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => updateForm({ role })}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    form.role === role ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white capitalize">{role}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {role === 'student' ? 'I want to learn and grow my skills' : 'I want to teach and mentor learners'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Tell us about yourself</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">This helps us personalize your experience.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => updateForm({ headline: e.target.value })}
                  maxLength={120}
                  placeholder="e.g. Frontend Developer | React Enthusiast"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">{form.headline.length}/120</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => updateForm({ bio: e.target.value })}
                  maxLength={500}
                  rows={4}
                  placeholder="Share your background and goals."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="url"
                  value={form.socialLinks.website}
                  onChange={(e) =>
                    updateForm({ socialLinks: { ...form.socialLinks, website: e.target.value } })
                  }
                  placeholder="Website (optional)"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="url"
                  value={form.socialLinks.linkedin}
                  onChange={(e) =>
                    updateForm({ socialLinks: { ...form.socialLinks, linkedin: e.target.value } })
                  }
                  placeholder="LinkedIn (optional)"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">What topics interest you?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Choose at least one to personalize recommendations.</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = form.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
            {form.interests.length === 0 && (
              <p className="text-xs text-red-500 mt-3">Please select at least one interest.</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => setStep((prev) => prev - 1)}
            disabled={step === 0}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium disabled:opacity-30 transition-colors"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : step === STEPS.length - 1 ? 'Finish Setup' : 'Continue'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">Headline and at least one interest are required.</p>
    </div>
  );
}
