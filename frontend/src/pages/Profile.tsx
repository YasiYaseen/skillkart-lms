import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'sonner';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { FileUpload } from '@/components/common';
import { getErrorMessage } from '@/utils/errorUtils';
import { FireIcon, UserIcon, LockClosedIcon, AcademicCapIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';

const POPULAR_INTERESTS = [
    'Web Development',
    'React & Next.js',
    'JavaScript',
    'TypeScript',
    'Node.js & Backend',
    'Python',
    'Data Science & AI',
    'UI/UX Design',
    'DevOps & Cloud',
    'Mobile Development',
];

function Profile() {
    const { user, updateUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'teaching'>('profile');

    // Profile state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [headline, setHeadline] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [interests, setInterests] = useState<string[]>([]);
    const [interestInput, setInterestInput] = useState('');
    const [socialLinks, setSocialLinks] = useState({ website: '', linkedin: '', twitter: '' });
    const [streakData, setStreakData] = useState<{ currentStreak: number; longestStreak: number; totalActiveDays: number } | null>(null);
    const [memberSince, setMemberSince] = useState('');

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Instructor Application State (Industry Standard Vetting)
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [applyTopic, setApplyTopic] = useState('');
    const [applyExperience, setApplyExperience] = useState<'none' | 'in_person' | 'online' | 'professional'>('online');
    const [applyDetails, setApplyDetails] = useState('');
    const [applyVideoUrl, setApplyVideoUrl] = useState('');
    const [applyLinkedin, setApplyLinkedin] = useState('');
    const [submittingApplication, setSubmittingApplication] = useState(false);

    // Auto-open modal if URL has ?apply=instructor or switch tab
    useEffect(() => {
        if (searchParams.get('tab') === 'teaching') {
            setActiveTab('teaching');
        }
        if (searchParams.get('apply') === 'instructor') {
            setActiveTab('teaching');
            if (user?.role === 'student') {
                setIsApplyModalOpen(true);
            }
        }
    }, [searchParams, user?.role]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const [profileRes, streakRes] = await Promise.all([
                    api.get('/users/profile'),
                    api.get('/users/streak').catch(() => ({ data: null })),
                ]);

                const userData = profileRes.data.user;
                setName(userData.name || '');
                setEmail(userData.email || '');
                setHeadline(userData.headline || '');
                setBio(userData.bio || '');
                setAvatar(userData.avatar || '');
                setInterests(userData.interests || []);
                setSocialLinks({
                    website: userData.socialLinks?.website || '',
                    linkedin: userData.socialLinks?.linkedin || '',
                    twitter: userData.socialLinks?.twitter || '',
                });

                if (userData.createdAt) {
                    const d = new Date(userData.createdAt);
                    if (!isNaN(d.getTime())) {
                        setMemberSince(d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }));
                    }
                }

                if (streakRes.data) {
                    setStreakData({
                        currentStreak: streakRes.data.currentStreak || 0,
                        longestStreak: streakRes.data.longestStreak || 0,
                        totalActiveDays: streakRes.data.totalActiveDays || 0,
                    });
                }

                // Keep AuthContext in sync with latest role and instructor status
                if (userData.role) {
                    updateUser({
                        role: userData.role,
                        instructorStatus: userData.instructorStatus,
                        isInstructorApproved: userData.isInstructorApproved,
                        instructorRejectionReason: userData.instructorRejectionReason,
                    });
                }
            } catch (err: unknown) {
                toast.error(getErrorMessage(err, 'Failed to load profile data'));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const currentStreak = streakData?.currentStreak || 0;

    const handleAddInterest = (item: string) => {
        const trimmed = item.trim();
        if (trimmed && !interests.includes(trimmed)) {
            setInterests([...interests, trimmed]);
            setInterestInput('');
        }
    };

    const handleRemoveInterest = (itemToRemove: string) => {
        setInterests(interests.filter((i) => i !== itemToRemove));
    };

    const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddInterest(interestInput);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/users/profile', {
                name,
                headline,
                bio,
                avatar,
                interests,
                socialLinks,
            });

            toast.success('Profile updated successfully!');
            updateUser({
                ...res.data.user,
            });
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to update profile'));
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setChangingPassword(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword,
            });
            toast.success('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to change password'));
        } finally {
            setChangingPassword(false);
        }
    };

    const handleApplyInstructor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applyTopic.trim()) {
            toast.error('Please enter the primary topic or domain you plan to teach');
            return;
        }
        if (!applyDetails.trim() || applyDetails.trim().length < 20) {
            toast.error('Please share some details about your credentials and background (minimum 20 characters)');
            return;
        }

        setSubmittingApplication(true);
        try {
            const res = await api.post('/users/apply-instructor', {
                primaryTopic: applyTopic.trim(),
                teachingExperience: applyExperience,
                experienceDetails: applyDetails.trim(),
                sampleVideoOrPortfolioUrl: applyVideoUrl.trim() || undefined,
                linkedinUrl: applyLinkedin.trim() || socialLinks.linkedin || undefined,
            });

            toast.success(res.data.message || 'Application submitted successfully!');
            if (res.data.user) {
                updateUser(res.data.user);
            } else {
                updateUser({ instructorStatus: 'pending' });
            }
            setIsApplyModalOpen(false);
            // Clear search param if present
            if (searchParams.get('apply')) {
                searchParams.delete('apply');
                setSearchParams(searchParams);
            }
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to submit instructor application'));
        } finally {
            setSubmittingApplication(false);
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-gray-500 dark:text-gray-400">Loading your profile...</div>;
    }

    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&size=128`;

    return (
        <div className="container max-w-5xl mx-auto py-10 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage your public profile, interests, and security settings.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl self-start flex-wrap">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'profile'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Profile & Interests</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'security'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <LockClosedIcon className="w-3.5 h-3.5" />
                        <span>Security & Password</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('teaching')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'teaching'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <AcademicCapIcon className="w-3.5 h-3.5" />
                        <span>{user?.role === 'instructor' ? 'Instructor Status' : 'Teach on SkillKart'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Card: Account Card Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-xs text-center">
                        <div className="relative inline-block mb-4">
                            <img
                                src={avatar || defaultAvatarUrl}
                                alt={name}
                                className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md mx-auto"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = defaultAvatarUrl;
                                }}
                            />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{name || 'SkillKart Learner'}</h2>
                        {headline && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{headline}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{email}</p>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                {user?.role || 'Student'}
                            </span>
                            {currentStreak > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    <FireIcon className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{currentStreak} day streak</span>
                                </span>
                            )}
                        </div>

                        {memberSince && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                                Member since {memberSince}
                            </p>
                        )}
                    </div>




                    {user?.role === 'instructor' && (
                        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-5 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
                                    <CheckCircleIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                                        Verified Instructor
                                    </h3>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                                        You have full access to create courses and manage students via the Instructor Studio.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Card: Dynamic Tab Content */}
                <div className="lg:col-span-2">
                    {activeTab === 'profile' ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-xs">
                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                {/* Avatar Upload Section */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Profile Avatar
                                    </label>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <img
                                            src={avatar || defaultAvatarUrl}
                                            alt="Current Avatar"
                                            className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                                        />
                                        <div className="flex-1 w-full">
                                            <FileUpload
                                                label=""
                                                accept="image/jpeg, image/png, image/webp"
                                                maxSizeMB={3}
                                                onUploadSuccess={(url) => setAvatar(url)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Email Address (read-only)"
                                        value={email}
                                        disabled
                                        className="bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                        Professional Headline
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={120}
                                        placeholder="e.g. Senior Frontend Engineer | React Enthusiast"
                                        value={headline}
                                        onChange={(e) => setHeadline(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-[11px] text-gray-400 text-right mt-1">{headline.length}/120</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                        Bio & About
                                    </label>
                                    <textarea
                                        rows={4}
                                        maxLength={500}
                                        placeholder="Share a short bio with instructors and fellow learners..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-[11px] text-gray-400 text-right mt-1">{bio.length}/500</p>
                                </div>

                                {/* Interests & Recommendation Topics */}
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                        Learning Interests & Topics
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        We use your interests to tailor course recommendations on your dashboard.
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {interests.map((item) => (
                                            <span
                                                key={item}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                            >
                                                <span>{item}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveInterest(item)}
                                                    className="hover:text-red-500 font-bold ml-1"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Type an interest and press Enter..."
                                        value={interestInput}
                                        onChange={(e) => setInterestInput(e.target.value)}
                                        onKeyDown={handleInterestKeyDown}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                                    />

                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        <span className="text-[11px] text-gray-400">Popular:</span>
                                        {POPULAR_INTERESTS.filter((p) => !interests.includes(p))
                                            .slice(0, 5)
                                            .map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => handleAddInterest(p)}
                                                    className="text-[11px] font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full transition-colors"
                                                >
                                                    + {p}
                                                </button>
                                            ))}
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        Social & Web Links
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Portfolio / Website</label>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={socialLinks.website}
                                                onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">LinkedIn Profile</label>
                                            <input
                                                type="url"
                                                placeholder="https://linkedin.com/in/..."
                                                value={socialLinks.linkedin}
                                                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Twitter / X</label>
                                            <input
                                                type="url"
                                                placeholder="https://twitter.com/..."
                                                value={socialLinks.twitter}
                                                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : activeTab === 'security' ? (
                        /* Security Tab */
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-xs">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Change Password</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                                Ensure your account is using a long, random password to stay secure.
                            </p>

                            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Current Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        New Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Confirm New Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" disabled={changingPassword}>
                                        {changingPassword ? 'Updating Password...' : 'Update Password'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        /* Teaching / Instructor Status Tab */
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-xs space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {user?.role === 'instructor' ? 'Instructor Account & Studio' : 'Teach on SkillKart'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {user?.role === 'instructor'
                                        ? 'Manage your instructor credentials and quickly jump into your teaching dashboard.'
                                        : 'Earn revenue, share your knowledge, and teach thousands of learners worldwide.'}
                                </p>
                            </div>

                            {user?.role === 'instructor' ? (
                                <div className="space-y-4">
                                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-5 flex items-start gap-4">
                                        <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                                            <CheckCircleIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                                Active Instructor Privileges
                                            </h3>
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                                                Your instructor account is fully verified. You have complete access to create courses, post announcements, issue quizzes, and review assignments.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex flex-wrap gap-3">
                                        <a
                                            href="/instructor"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                                        >
                                            <AcademicCapIcon className="w-4 h-4" />
                                            <span>Open Instructor Studio</span>
                                        </a>
                                        <a
                                            href="/instructor/create-course"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-2xs transition-colors"
                                        >
                                            <span>Create New Course</span>
                                        </a>
                                    </div>
                                </div>
                            ) : user?.instructorStatus === 'pending' ? (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-5 flex items-start gap-4">
                                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0">
                                            <ClockIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                                Application Under Review
                                            </h3>
                                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                                                Your application to become a SkillKart instructor is being reviewed by our administrative team. Once approved, your role will be upgraded automatically and you will gain full access to the Instructor Studio.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : user?.instructorStatus === 'rejected' ? (
                                <div className="space-y-6">
                                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl p-5 flex items-start gap-4">
                                        <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0">
                                            <XCircleIcon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                                                Application Not Approved
                                            </h3>
                                            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                                                Thank you for your interest in teaching on SkillKart. Unfortunately, your instructor application was not approved by our review team.
                                            </p>
                                            {user?.instructorRejectionReason && (
                                                <div className="mt-3 p-3 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-rose-200 dark:border-rose-800 text-xs">
                                                    <span className="font-semibold text-rose-900 dark:text-rose-200 block mb-0.5">Reason provided by reviewer:</span>
                                                    <span className="text-rose-800 dark:text-rose-300 whitespace-pre-wrap">{user.instructorRejectionReason}</span>
                                                </div>
                                            )}
                                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-3">
                                                You may address the feedback and submit a new application below.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setApplyTopic(user?.instructorApplication?.primaryTopic || '');
                                                setApplyExperience(user?.instructorApplication?.teachingExperience || 'online');
                                                setApplyDetails(user?.instructorApplication?.experienceDetails || '');
                                                setApplyVideoUrl(user?.instructorApplication?.sampleVideoOrPortfolioUrl || '');
                                                setApplyLinkedin(user?.instructorApplication?.linkedinUrl || socialLinks.linkedin || '');
                                                setIsApplyModalOpen(true);
                                            }}
                                        >
                                            Reapply to Become an Instructor
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">Reach Learners</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Publish courses to thousands of motivated students on SkillKart.</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">Keep Your Courses</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Retain 100% of your enrolled student courses, certificates, and cart.</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">Earn Revenue</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Set course pricing, offer discount coupons, and track payouts.</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setApplyTopic('');
                                                setApplyExperience('online');
                                                setApplyDetails('');
                                                setApplyVideoUrl('');
                                                setApplyLinkedin(socialLinks.linkedin || '');
                                                setIsApplyModalOpen(true);
                                            }}
                                        >
                                            Apply to Become an Instructor
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Instructor Application Modal (Industry Standard Vetting) */}
            <Modal
                isOpen={isApplyModalOpen}
                onClose={() => {
                    if (!submittingApplication) {
                        setIsApplyModalOpen(false);
                        if (searchParams.get('apply')) {
                            searchParams.delete('apply');
                            setSearchParams(searchParams);
                        }
                    }
                }}
                title="Apply to Teach on SkillKart"
            >
                <form onSubmit={handleApplyInstructor} className="space-y-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Join our instructor community. This application is reviewed by our curation team to ensure high quality courses for learners. Your student profile remains completely untouched.
                    </p>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Primary Subject or Domain to Teach <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={120}
                            placeholder="e.g. Modern React & Next.js, Cloud Architecture, or Machine Learning"
                            value={applyTopic}
                            onChange={(e) => setApplyTopic(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Prior Teaching Experience <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={applyExperience}
                            onChange={(e) => setApplyExperience(e.target.value as 'none' | 'in_person' | 'online' | 'professional')}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        >
                            <option value="professional">Industry Professional (senior engineer, architect, consultant)</option>
                            <option value="online">Online Instructor (taught on YouTube, Udemy, Coursera, or webinars)</option>
                            <option value="in_person">In-Person Educator (university lecturer, bootcamp mentor, workshop host)</option>
                            <option value="none">Beginner / First-time teacher (have domain mastery, new to teaching)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Teaching Credentials & Background <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            required
                            minLength={20}
                            maxLength={1000}
                            placeholder="Describe your expertise, work experience, certifications, and what topics or projects you intend to build for your learners..."
                            value={applyDetails}
                            onChange={(e) => setApplyDetails(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[11px] text-gray-400 text-right mt-1">{applyDetails.length}/1000</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Sample Video or Portfolio Link <span className="text-gray-400 font-normal">(Optional but recommended)</span>
                        </label>
                        <input
                            type="url"
                            placeholder="https://youtube.com/watch?v=... or https://loom.com/... or portfolio/GitHub"
                            value={applyVideoUrl}
                            onChange={(e) => setApplyVideoUrl(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] text-gray-400 mt-1 block">A 2-3 minute audio/video sample or project demo significantly speeds up approval.</span>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            LinkedIn / Public Professional Profile
                        </label>
                        <input
                            type="url"
                            placeholder="https://linkedin.com/in/..."
                            value={applyLinkedin}
                            onChange={(e) => setApplyLinkedin(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            disabled={submittingApplication}
                            onClick={() => {
                                setIsApplyModalOpen(false);
                                if (searchParams.get('apply')) {
                                    searchParams.delete('apply');
                                    setSearchParams(searchParams);
                                }
                            }}
                            className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <Button type="submit" disabled={submittingApplication}>
                            {submittingApplication ? 'Submitting Application...' : 'Submit Application for Review'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default Profile;
