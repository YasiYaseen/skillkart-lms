import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'react-toastify';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

function Profile() {
    const { user, login } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/me');
                setName(res.data.user.name);
                setEmail(res.data.user.email);
            } catch (err) {
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/users/me', { name });
            toast.success('Profile updated successfully');
            if (user) {
                // Update local auth context (need token from storage, simplified approach here)
                const token = localStorage.getItem('token');
                if (token) {
                    login(token, res.data.user);
                }
            }
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="py-10 text-center text-gray-500">Loading profile...</div>;

    return (
        <div className="container py-10 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Input
                            label="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Input
                            label="Email Address"
                            value={email}
                            disabled
                            className="bg-gray-50 text-gray-500 cursor-not-allowed"
                            title="Email cannot be changed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <input
                            type="text"
                            value={user?.role || ''}
                            disabled
                            className="w-full rounded-lg border border-gray-200 px-4 py-2 bg-gray-50 text-gray-500 uppercase cursor-not-allowed"
                        />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Profile;
