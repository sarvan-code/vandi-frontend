import React, { useState, useEffect, useContext } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { useOptions } from '../../context/OptionsContext';
import { Search, UserCheck, UserX, Trash2, Edit, X, Save, Eye, EyeOff, Building, UserPlus, Key, Lock, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { AuthContext } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import Table from '../../components/Table';
import FloatingActionPanel from '../../components/FloatingActionPanel';
import Modal from '../../components/Modal';

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

    // Selected user for floating action panel row selection
    const [selectedUserRow, setSelectedUserRow] = useState(null);

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, user: null });

    // Password Reset Modal State
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

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

    const openResetPasswordModal = (user) => {
        setResetPasswordUser(user);
        setNewPassword('');
        setShowPassword(false);
        setIsResetModalOpen(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword) return;
        setResetLoading(true);
        try {
            await api.patch(`/users/${resetPasswordUser.userId}/reset-password`, { newPassword });
            showToast(`Password for ${resetPasswordUser.fullName} has been reset.`, "success");
            setIsResetModalOpen(false);
        } catch (error) {
            showToast("Failed to reset password: " + (error.response?.data?.error || error.message), "error");
        } finally {
            setResetLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableRoles = isHR
        ? roles.filter(r => !superRoles.includes(r.code))
        : roles;

    const columns = [
        {
            key: 'userDetails',
            label: 'Name / Joined',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[var(--text-primary)] tracking-tight">{row.fullName}</span>
                    <span className="text-[9px] text-[var(--accent)] font-black uppercase tracking-[0.15em] mt-1 opacity-60">Joined: {new Date(row.createdAt).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            key: 'contactInfo',
            label: 'Contact Details',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{row.email}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-1">{row.phone || 'No communications record'}</span>
                </div>
            )
        },
        {
            key: 'role',
            label: 'Role',
            render: (row) => (
                <select
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] cursor-pointer hover:border-[var(--accent)] transition-all outline-none focus:ring-4 focus:ring-[var(--accent)]/10"
                    value={row.role}
                    onChange={(e) => handleRoleChange(row, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isHR && superRoles.includes(row.role)}
                >
                    {availableRoles.map(r => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                </select>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <select
                    className={clsx(
                        "rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all border shadow-sm outline-none",
                        row.userStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            row.userStatus === 'NEW' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    )}
                    value={row.userStatus}
                    onChange={(e) => handleStatusChange(row, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="NEW">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            )
        }
    ];

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
                <div>
                    <h1 className="text-4xl font-semibold mb-2 text-[var(--text-primary)]">Staff Management</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Manage staff accounts, roles, and branch assignments.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {(isSuperUser || isHR) && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
                            <Building size={18} className="text-[var(--text-muted)]" />
                            <select
                                className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-black text-[var(--text-primary)] min-w-[150px] cursor-pointer outline-none uppercase tracking-widest h-10 shadow-sm"
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
                    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-[var(--accent)]/20 flex-1 min-w-[250px]">
                        <Search className="text-[var(--text-muted)]" size={18} />
                        <input
                            className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-bold text-[var(--text-primary)] w-full outline-none placeholder:text-[var(--text-muted)] h-10 px-3 shadow-sm"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="btn-primary flex items-center gap-3 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all text-white whitespace-nowrap"
                    >
                        <UserPlus size={18} /> Add Staff Member
                    </button>
                </div>
            </div>

            <div className="relative">
                {loading ? (
                    <div className="card p-20 flex flex-col items-center justify-center space-y-6 animate-pulse border border-[var(--border)]">
                        <div className="w-16 h-16 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin"></div>
                        <p className="text-[var(--text-muted)] font-medium text-xs">Loading Unified Staff Systems...</p>
                    </div>
                ) : (
                    <>
                        <Table
                            columns={columns}
                            data={filteredUsers}
                            onRowClick={(row) => setSelectedUserRow(row)}
                            selectedRow={selectedUserRow?.userId}
                            rowKey="userId"
                            emptyMessage="No staff members found."
                        />

                        <FloatingActionPanel
                            selectedItem={selectedUserRow}
                            onClose={() => setSelectedUserRow(null)}
                            title={selectedUserRow?.fullName}
                            subtitle={selectedUserRow?.email}
                            actions={[
                                {
                                    icon: Eye,
                                    label: 'Edit',
                                    onClick: openDetailModal,
                                    color: 'blue',
                                    title: 'Edit Details'
                                },
                                ...(isSuperUser ? [{
                                    icon: Key,
                                    label: 'Reset Password',
                                    onClick: openResetPasswordModal,
                                    color: 'indigo',
                                    title: 'Reset User Password'
                                }] : []),
                                ...(currentUser?.userId !== selectedUserRow?.userId ? [{
                                    icon: Trash2,
                                    label: 'Delete',
                                    onClick: handleDeleteUser,
                                    color: 'red',
                                    title: 'Delete Account'
                                }] : [])
                            ]}
                        />
                    </>
                )}
            </div>

            {/* Detail/Edit/Create Modal */}
            <Modal
                isOpen={isModalOpen && !!selectedUser}
                onClose={() => setIsModalOpen(false)}
                title={isCreateMode ? 'Add Staff Member' : 'Update Staff Details'}
                subtitle={!isCreateMode ? selectedUser?.fullName : 'Role and Account Details'}
                icon={isCreateMode ? UserPlus : Edit}
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <div className="flex-1">
                            {!isCreateMode && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteUser(selectedUser)}
                                    className="text-rose-500 hover:text-rose-700 text-[10px] font-black flex items-center gap-3 px-6 py-3 hover:bg-rose-500/10 rounded-xl transition-all uppercase tracking-[0.2em]"
                                >
                                    <Trash2 size={18} /> Delete Account
                                </button>
                            )}
                        </div>
                        <div className="flex gap-6">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="user-form"
                                className="btn-primary flex items-center gap-3 px-10 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all text-white"
                            >
                                <Save size={18} /> {isCreateMode ? 'Create Account' : 'Save Changes'}
                            </button>
                        </div>
                    </>
                }
            >
                {selectedUser && (
                    <form id="user-form" onSubmit={handleModalSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3 block">Full Name</label>
                                <input
                                    className="input-field h-14 font-bold text-base px-6 bg-[var(--bg-secondary)]/50"
                                    value={selectedUser.fullName}
                                    onChange={e => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                                    required
                                    placeholder="e.g. Robert Smith"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3 block">Email Address</label>
                                <input
                                    type="email"
                                    className={`input-field h-14 font-bold text-base px-6 ${!isCreateMode ? 'bg-[var(--bg-tertiary)]/50 cursor-not-allowed opacity-60 text-[var(--text-muted)]' : 'bg-[var(--bg-secondary)]/50'}`}
                                    value={selectedUser.email}
                                    onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                    required
                                    disabled={!isCreateMode}
                                    placeholder="email@vandi.com"
                                />
                            </div>
                            {isCreateMode && (
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3 block">Password</label>
                                    <input
                                        type="password"
                                        className="input-field h-14 font-black text-base px-6 bg-[var(--bg-secondary)]/50 tracking-widest"
                                        value={selectedUser.password}
                                        onChange={e => setSelectedUser({ ...selectedUser, password: e.target.value })}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3 block">Phone Number</label>
                                <input
                                    className="input-field h-14 font-bold text-base px-6 bg-[var(--bg-secondary)]/50"
                                    value={selectedUser.phone || ''}
                                    onChange={e => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                                    placeholder="+91 00000 00000"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3 block">Select Role</label>
                                <select
                                    className="input-field h-14 cursor-pointer font-bold text-base px-6 bg-[var(--bg-secondary)]/50"
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
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3 block">Branch Assignment</label>
                                    <select
                                        className="input-field h-14 cursor-pointer font-bold text-base px-6 bg-[var(--bg-secondary)]/50"
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

                        <div className="bg-[var(--bg-secondary)]/50 p-8 rounded-[2rem] border border-[var(--border)] flex items-center justify-between shadow-inner">
                            <div>
                                <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Account Status</p>
                                <p className="text-[10px] text-[var(--accent)] uppercase font-black tracking-[0.2em] mt-2 opacity-60">Manage user account status and login access</p>
                            </div>
                            <select
                                className={clsx(
                                    "rounded-2xl px-8 py-3.5 text-[10px] font-black tracking-[0.2em] uppercase shadow-xl outline-none border transition-all cursor-pointer",
                                    selectedUser.userStatus === 'ACTIVE' ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/20' :
                                        selectedUser.userStatus === 'NEW' ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20' :
                                            'bg-rose-600 text-white border-rose-700 shadow-rose-500/20'
                                )}
                                value={selectedUser.userStatus}
                                onChange={e => setSelectedUser({ ...selectedUser, userStatus: e.target.value })}
                            >
                                <option value="NEW">Pending Approval</option>
                                <option value="ACTIVE">Active Account</option>
                                <option value="INACTIVE">Inactive / Locked</option>
                            </select>
                        </div>
                    </form>
                )}
            </Modal>

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

            {/* Reset Password Modal */}
            <Modal
                isOpen={isResetModalOpen && !!resetPasswordUser}
                onClose={() => setIsResetModalOpen(false)}
                title="Reset Password"
                subtitle={`Set a new secure password for ${resetPasswordUser?.fullName}`}
                icon={Lock}
                maxWidth="max-w-md"
                footer={
                    <div className="flex gap-6 w-full justify-end">
                        <button
                            type="button"
                            onClick={() => setIsResetModalOpen(false)}
                            className="px-8 py-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="reset-password-form"
                            disabled={resetLoading || !newPassword}
                            className="btn-primary flex items-center gap-3 px-10 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resetLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />} 
                            Reset Password
                        </button>
                    </div>
                }
            >
                <form id="reset-password-form" onSubmit={handleResetPassword} className="space-y-8 py-4">
                    <div className="bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border)] shadow-inner">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                                <Key size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--text-primary)]">{resetPasswordUser?.fullName}</p>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">{resetPasswordUser?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 block">New Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-field h-14 font-black text-lg pl-12 pr-14 bg-white dark:bg-[var(--bg-primary)] tracking-widest shadow-sm focus:ring-4 focus:ring-indigo-500/10 border-[var(--border)] transition-all"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    autoFocus
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-4 flex items-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-1"
                                    title={showPassword ? "Hide Password" : "Show Password"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium px-1 flex items-center gap-2">
                                <ShieldAlert size={12} className="text-amber-500" />
                                Use a strong, unique password for better security.
                            </p>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserConfig;
