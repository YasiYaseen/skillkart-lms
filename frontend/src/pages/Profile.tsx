import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'react-toastify';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FileUpload } from '@/components/common';

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
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // Profile state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [headline, setHeadline] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [interests, setInterests] = useState<string[]>([]);
    const [interestInput, setInterestInput] = useState('');
    const [socialLinks, setSocialLinks] = useState({
        website: '',
        linkedin: '',
        twitter: '',
    });
    const [memberSince, setMemberSince] = useState<string>('');
    const [currentStreak, setCurrentStreak] = useState(0);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/me');
                const u = res.data.user;
                setName(u.name || '');
                setEmail(u.email || '');
                setHeadline(u.headline || '');
                setBio(u.bio || '');
                setAvatar(u.avatar || '');
                setInterests(u.interests || []);
                setSocialLinks({
                    website: u.socialLinks?.website || '',
                    linkedin: u.socialLinks?.linkedin || '',
                    twitter: u.socialLinks?.twitter || '',
                });
                if (u.createdAt) {
                    setMemberSince(new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
                }
                setCurrentStreak(u.currentStreak || 0);
            } catch {
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

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
            await api.put('/users/me', {
                name,
                headline,
                bio,
                avatar,
                interests,
                socialLinks,
            });
            toast.success('Profile updated successfully!');
            updateUser({
                name,
                headline,
                bio,
                avatar,
                interests,
                socialLinks,
            });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile';
            toast.error(msg);
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
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
            toast.error(msg);
        } finally {
            setChangingPassword(false);
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
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl self-start">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                            activeTab === 'profile'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        👤 Profile & Interests
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                            activeTab === 'security'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        🔒 Security & Password
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
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                    🔥 {currentStreak} day streak
                                </span>
                            )}
                        </div>

                        {memberSince && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                                Member since {memberSince}
                            </p>
                        )}
                    </div>
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
                    ) : (
                        /* Security Tab */
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-xs">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Change Password</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                                Ensure your account is using a long, random password to stay secure.
                            </p>

                            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Current Password
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
                                        New Password
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
                                        Confirm New Password
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
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
