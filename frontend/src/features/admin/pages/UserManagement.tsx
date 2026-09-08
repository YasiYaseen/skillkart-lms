import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from 'sonner';
import { Pagination } from "@/components/common";
import { useAuth } from "@/features/auth/AuthContext";
import { ShieldCheckIcon, AcademicCapIcon, UserIcon, ClockIcon } from "@heroicons/react/20/solid";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  isActive?: boolean;
  isInstructorApproved?: boolean;
  instructorStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

const PAGE_SIZE = 10;

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    api
      .get<{ users: AdminUser[] }>("/admin/users")
      .then((res) => {
        setUsers(res.data.users || []);
      })
      .catch(() => {
        toast.error("Failed to load users");
      })
      .finally(() => setLoading(false));
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingUserId(userId);
      await api.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? "enabled" : "disabled"} successfully`);
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update user status";
      toast.error(msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    if (currentUser?.id === userId && newRole !== 'admin') {
      toast.error("You cannot remove your own admin privileges.");
      return;
    }

    try {
      setUpdatingUserId(userId);
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole} successfully`);
      setUsers(users.map(u => {
        if (u._id === userId) {
          return {
            ...u,
            role: newRole,
            isInstructorApproved: newRole === 'instructor',
            instructorStatus: newRole === 'instructor' ? 'approved' : 'none',
          };
        }
        return u;
      }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update user role";
      toast.error(msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const pendingInstructorCount = useMemo(() => {
    return users.filter(u => u.instructorStatus === 'pending').length;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      
      const roleMatch =
        selectedRole === "all"
          ? true
          : selectedRole === "pending"
          ? u.instructorStatus === "pending"
          : u.role === selectedRole;

      return (nameMatch || emailMatch) && roleMatch;
    });
  }, [users, searchQuery, selectedRole]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleRoleChange = (val: string) => {
    setSelectedRole(val);
    setCurrentPage(1);
  };

  const getRoleBadge = (user: AdminUser) => {
    if (user.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          Admin
        </span>
      );
    }
    if (user.role === 'instructor') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          <AcademicCapIcon className="w-3.5 h-3.5" />
          Instructor
        </span>
      );
    }
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
          <UserIcon className="w-3.5 h-3.5" />
          Student
        </span>
        {user.instructorStatus === 'pending' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 animate-pulse">
            <ClockIcon className="w-3 h-3" />
            Pending Instructor
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-64" />
        </div>
        <div className="h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingInstructorCount > 0 && selectedRole !== 'pending' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-800/40 rounded-lg text-amber-600 dark:text-amber-400">
              <ClockIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {pendingInstructorCount} Pending Instructor Application{pendingInstructorCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                New instructors registered under the approval policy are waiting for verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRoleChange('pending')}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            View Applications
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Search, filter, manage roles, and review instructor applications.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">All Roles</option>
            <option value="pending">
              Pending Approvals {pendingInstructorCount > 0 ? `(${pendingInstructorCount})` : ''}
            </option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Role & Approvals</th>
                <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3.5 text-right font-semibold text-gray-700 dark:text-gray-300">Role & Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {paginatedUsers.map((user) => {
                const isSelf = currentUser?.id === user._id;
                const isUpdating = updatingUserId === user._id;

                return (
                  <tr key={user._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {user.name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">(You)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.isActive !== false
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {user.isActive !== false ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {/* Quick Approve Button for Pending Instructors */}
                        {user.instructorStatus === 'pending' && (
                          <button
                            onClick={() => handleUpdateRole(user._id, 'instructor')}
                            disabled={isUpdating}
                            className="text-xs font-semibold px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
                          >
                            Approve Instructor
                          </button>
                        )}

                        {/* Role Selector */}
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user._id, e.target.value as 'student' | 'instructor' | 'admin')}
                          disabled={isSelf || isUpdating}
                          aria-label={`Change role for ${user.name}`}
                          className="text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Enable/Disable Button */}
                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive !== false)}
                          disabled={isSelf || isUpdating}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            user.isActive !== false
                              ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                              : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          }`}
                        >
                          {user.isActive !== false ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery || selectedRole !== "all" ? "No users matching your filter criteria." : "No users found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default UserManagement;

