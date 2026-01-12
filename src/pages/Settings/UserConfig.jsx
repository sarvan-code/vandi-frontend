import React, { useState, useEffect, useContext } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { useOptions } from '../../context/OptionsContext';
import { Search, UserCheck, UserX, Trash2, Edit, X, Save, Eye, Building, UserPlus } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';

const UserConfig = () => {
    const { user: currentUser } = useContext(AuthContext);
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const { getOptionList, branches, roles, loading: optionsLoading } = useOptions();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(currentUser?.role);
    const isHR = currentUser?.role === 'HR_MGR';

    const superRoles = ['APP_OWNER', 'SYS_ADMIN', 'DEV'];

    // Modal State
    const [selectedUser, setSelectedUser] = useState(null); // For Detail/Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateMode, setIsCreateMode] = useState(false);

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, user: null });

    useEffect(() => {
        fetchUsers();
    }, [selectedBranchId]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersRes = await api.get(`/users?pageSize=100${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`);
            setUsers(usersRes.data.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            showToast("Failed to fetch users: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (targetUser, newRole) => {
        try {
            const updated = await api.put(`/users/${targetUser.userId}`, { role: newRole });
            setUsers(users.map(u => u.userId === targetUser.userId ? { ...u, role: updated.data.role } : u));
            showToast("User role updated successfully", "success");
        } catch (error) {
            showToast("Failed to update role: " + error.message, "error");
        }
    };

    const handleStatusChange = async (targetUser, newStatus) => {
        try {
            const updated = await api.put(`/users/${targetUser.userId}`, {
                userStatus: newStatus
            });
            const updatedUser = updated.data;
            setUsers(users.map(u => u.userId === targetUser.userId ? { ...u, userStatus: updatedUser.userStatus } : u));
            if (selectedUser && selectedUser.userId === targetUser.userId) {
                setSelectedUser({ ...selectedUser, userStatus: updatedUser.userStatus });
            }
            showToast("User status updated successfully", "success");
        } catch (error) {
            showToast("Failed to update status: " + error.message, "error");
        }
    };

    const handleDeleteUser = async (targetUser) => {
        if (targetUser.userId === currentUser.userId) {
            showToast("You cannot delete yourself.", "warning");
            return;
        }
        setDeleteConfirm({ isOpen: true, user: targetUser });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.user) return;

        try {
            await api.delete(`/users/${deleteConfirm.user.userId}`);
            setUsers(users.filter(u => u.userId !== deleteConfirm.user.userId));
            if (isModalOpen) setIsModalOpen(false);
            showToast("User deleted successfully", "success");
        } catch (error) {
            showToast("Failed to delete user: " + error.message, "error");
        } finally {
            setDeleteConfirm({ isOpen: false, user: null });
        }
    };

    const openDetailModal = (user) => {
        setSelectedUser({ ...user });
        setIsCreateMode(false);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedUser({
            fullName: '',
            email: '',
            phone: '',
            password: '',
            role: 'SALES_REP',
            userStatus: 'NEW',
            branchId: isHR ? currentUser.branchId : ''
        });
        setIsCreateMode(true);
        setIsModalOpen(true);
    };

    const handleModalSave = async (e) => {
        e.preventDefault();
        try {
            if (isCreateMode) {
                const response = await api.post('/users', selectedUser);
                setUsers([response.data, ...users]);
                showToast("User created successfully", "success");
            } else {
                const response = await api.put(`/users/${selectedUser.userId}`, selectedUser);
                const updated = response.data;
                setUsers(users.map(u => u.userId === selectedUser.userId ? { ...u, ...updated } : u));
                showToast("User updated successfully", "success");
            }
            setIsModalOpen(false);
        } catch (error) {
            showToast("Failed to save user: " + (error.response?.data?.error || error.message), "error");
        }
    };

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableRoles = isHR
        ? roles.filter(r => !superRoles.includes(r.code))
        : roles;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <div className="flex gap-4 items-center">
                    {(isSuperUser || isHR) && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                            <Building size={16} className="text-gray-400" />
                            <select
                                className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 font-medium"
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.displayName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                        <input
                            className="w-full pl-10 pr-4 py-2 border rounded-lg"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <UserPlus size={18} /> Add User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                        <tr>
                            <th className="p-4">User Details</th>
                            <th className="p-4">Contact info</th>
                            <th className="p-4">System Role</th>
                            <th className="p-4 text-center">Lifecycle Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => (
                            <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">{user.fullName}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">JOINED: {new Date(user.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">{user.email}</div>
                                    <div className="text-gray-400">{user.phone || '-'}</div>
                                </td>
                                <td className="p-4">
                                    <select
                                        className="border-gray-200 rounded p-1 text-xs bg-white cursor-pointer hover:border-blue-300 transition-colors max-w-[150px] font-medium"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user, e.target.value)}
                                        disabled={isHR && superRoles.includes(user.role)}
                                    >
                                        {availableRoles.map(r => (
                                            <option key={r.code} value={r.code}>{r.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-4 text-center">
                                    <select
                                        className={`border rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${user.userStatus === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                            user.userStatus === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                                'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                            }`}
                                        value={user.userStatus}
                                        onChange={(e) => handleStatusChange(user, e.target.value)}
                                    >
                                        <option value="NEW">NEW</option>
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                    </select>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => openDetailModal(user)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                            title="View/Edit Details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                        <UserCheck size={48} className="mb-2 opacity-20" />
                        <p>No staff members found in this view.</p>
                    </div>
                )}
            </div>

            {/* Detail/Edit/Create Modal */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {isCreateMode ? 'Add New Staff' : `Edit: ${selectedUser.fullName}`}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-tighter">
                                    Access & Identity Configuration
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleModalSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Full Identity Name</label>
                                    <input
                                        className="w-full border-gray-200 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={selectedUser.fullName}
                                        onChange={e => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                                        required
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">System Credential (Email)</label>
                                    <input
                                        type="email"
                                        className={`w-full border-gray-200 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${!isCreateMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                        value={selectedUser.email}
                                        onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                        required
                                        disabled={!isCreateMode}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                {isCreateMode && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Initial Password</label>
                                        <input
                                            type="password"
                                            className="w-full border-gray-200 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={selectedUser.password}
                                            onChange={e => setSelectedUser({ ...selectedUser, password: e.target.value })}
                                            required
                                            placeholder="••••••••"
                                        />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Contact Channel (Phone)</label>
                                    <input
                                        className="w-full border-gray-200 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={selectedUser.phone || ''}
                                        onChange={e => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                                        placeholder="+91 00000 00000"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Assigned System Role</label>
                                    <select
                                        className="w-full border-gray-200 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                        value={selectedUser.role}
                                        onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                                        disabled={!isCreateMode && isHR && superRoles.includes(selectedUser.role)}
                                    >
                                        {availableRoles.map(r => (
                                            <option key={r.code} value={r.code}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {(isSuperUser || isHR || isCreateMode) && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Base Branch Attachment</label>
                                        <select
                                            className="w-full border-gray-200 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                            value={selectedUser.branchId || ''}
                                            onChange={e => setSelectedUser({ ...selectedUser, branchId: e.target.value })}
                                        >
                                            <option value="">Select Branch...</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.displayName}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-blue-900 mb-0.5">Deployment Status</p>
                                    <p className="text-[10px] text-blue-600 uppercase font-medium">Controls application entry access</p>
                                </div>
                                <select
                                    className={`border rounded-lg px-4 py-2 text-sm font-black shadow-sm outline-none ${selectedUser.userStatus === 'ACTIVE' ? 'bg-green-600 text-white border-green-700' :
                                        selectedUser.userStatus === 'NEW' ? 'bg-blue-600 text-white border-blue-700' :
                                            'bg-red-600 text-white border-red-700'
                                        }`}
                                    value={selectedUser.userStatus}
                                    onChange={e => setSelectedUser({ ...selectedUser, userStatus: e.target.value })}
                                >
                                    <option value="NEW">PENDING (NEW)</option>
                                    <option value="ACTIVE">LIVE (ACTIVE)</option>
                                    <option value="INACTIVE">BLOCKED (INACTIVE)</option>
                                </select>
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t mt-2">
                                {!isCreateMode ? (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteUser(selectedUser)}
                                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 p-2 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-widest"
                                    >
                                        <Trash2 size={14} /> PURGE IDENTITY
                                    </button>
                                ) : <div />}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm uppercase tracking-wider"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Save size={18} /> {isCreateMode ? 'Initialize Staff' : 'Apply Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, user: null })}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`WARNING: Are you sure you want to DELETE user "${deleteConfirm.user?.fullName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

export default UserConfig;
