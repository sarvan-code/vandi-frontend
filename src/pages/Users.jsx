import React, { useState, useEffect, useContext } from 'react';
import { Eye, Edit, Trash, UserPlus, X, Shield, Mail, Phone, MapPin, Calendar, Building, Briefcase, Tag, Filter, ChevronLeft, ChevronRight, Users as UsersIcon, Save } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import Table from '../components/Table';
import { useToast } from '../context/ToastContext';
import { useOptions } from '../context/OptionsContext';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import FloatingActionPanel from '../components/FloatingActionPanel';

const Users = () => {
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { getOptionList, branches, roles, loading: optionsLoading } = useOptions();
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, user: null });
    const { user } = useContext(AuthContext);

    // Selected user for floating action panel
    const [selectedUser, setSelectedUser] = useState(null);

    const globalRoles = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE', 'HR_MGR', 'HR_ASSIS', 'AUTH_USER', 'GUEST'];
    const isGlobalUser = globalRoles.includes(user?.role);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, [page, pageSize, selectedBranchId]);

    const fetchUsers = async () => {
        try {
            const response = await api.get(`/users?page=${page}&pageSize=${pageSize}${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`);
            if (response.data.data && response.data.meta) {
                setUsers(response.data.data);
                setTotalPages(response.data.meta.totalPages);
                setTotalUsers(response.data.meta.total);
            } else {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // alert('Failed to fetch users');
        }
    };

    const handleEdit = (user) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (user) => {
        setDeleteConfirm({ isOpen: true, user });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.user) return;
        try {
            await api.delete(`/users/${deleteConfirm.user.userId}`);
            showToast("User deleted successfully", "success");
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user", error);
            showToast("Failed to delete user", "error");
        } finally {
            setDeleteConfirm({ isOpen: false, user: null });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentUser.userId) {
                await api.put(`/users/${currentUser.userId}`, currentUser);
            } else {
                await api.post('/users', currentUser);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            showToast('Failed to save user', 'error');
        }
    };

    const columns = [
        {
            key: 'fullName', label: 'User Name', render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[var(--text-primary)]">{row.fullName}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-tight">{row.email}</span>
                </div>
            )
        },
        {
            key: 'role', label: 'Role', render: (row) => (
                <span className={clsx(
                    "badge py-1 px-3 rounded-full text-[10px] font-bold tracking-[0.1em] shadow-sm",
                    ['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(row.role) ? 'bg-indigo-600 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)]'
                )}>
                    {row.role}
                </span>
            )
        },
        {
            key: 'userStatus', label: 'Status', render: (row) => (
                <span className={clsx(
                    "badge py-1 px-3 rounded-full text-[10px] font-bold tracking-[0.1em] shadow-sm border",
                    row.userStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        row.userStatus === 'NEW' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                )}>
                    {row.userStatus === 'ACTIVE' ? 'ACTIVE' : row.userStatus === 'NEW' ? 'NEW' : 'INACTIVE'}
                </span>
            )
        },
    ];

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)] shadow-sm border border-[var(--accent)]/20">
                        <UsersIcon size={32} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">Security & Governance</h2>
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] mt-2">Manage system users, access levels and organizational hierarchy.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {isGlobalUser && (
                        <div className="search-box !w-auto">
                            <Filter size={18} className="search-icon" />
                            <select
                                className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-bold text-[var(--text-primary)] min-w-[160px] cursor-pointer outline-none pl-10 h-10 shadow-sm"
                                value={selectedBranchId}
                                onChange={(e) => {
                                    setSelectedBranchId(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.displayName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button
                        onClick={() => { setCurrentUser({}); setIsModalOpen(true); }}
                        className="btn-primary flex items-center gap-3 !py-2 !px-6"
                    >
                        <UserPlus size={18} /> New Identity
                    </button>
                </div>
            </div>

            <div className="relative mb-8">
                <Table
                    columns={columns}
                    data={users}
                    onRowClick={(row) => setSelectedUser(row)}
                    selectedRow={selectedUser?.userId}
                    rowKey="userId"
                />

                <FloatingActionPanel
                    selectedItem={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    title={selectedUser?.fullName}
                    subtitle={selectedUser?.email}
                    actions={[
                        {
                            icon: Edit,
                            label: 'Edit',
                            onClick: handleEdit,
                            color: 'blue',
                            title: 'Update user details'
                        },
                        {
                            icon: Trash,
                            label: 'Delete',
                            onClick: handleDelete,
                            color: 'red',
                            title: 'Remove user from system'
                        }
                    ]}
                />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t bg-[var(--surface)] px-6 py-4 mt-8 rounded-lg border shadow-sm" style={{ borderColor: 'var(--border)' }}>
                <div className="flex flex-1 justify-between sm:hidden">
                    <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className="btn-secondary px-4 !py-1">Previous</button>
                    <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className="btn-secondary px-4 !py-1">Next</button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-medium text-[var(--text-secondary)]">
                            Showing <span className="font-bold text-[var(--text-primary)]">{(page - 1) * pageSize + 1}</span> to <span className="font-bold text-[var(--text-primary)]">{Math.min(page * pageSize, totalUsers)}</span> of <span className="font-bold text-[var(--text-primary)]">{totalUsers}</span> results
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <label htmlFor="pageSize" className="text-xs font-medium text-[var(--text-secondary)]">Rows per page:</label>
                            <select
                                id="pageSize"
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md px-2 py-1 text-xs font-semibold text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <nav className="flex items-center gap-2" aria-label="Pagination">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-md border border-[var(--border)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="text-xs font-bold text-[var(--text-primary)] px-2">
                                {page} / {totalPages}
                            </div>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-md border border-[var(--border)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentUser?.userId ? 'Update User' : 'Add New User'}
            >
                <form onSubmit={handleSave} className="space-y-8 pt-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="form-label font-bold uppercase tracking-wider text-[10px]">Credential Identity</label>
                            <input
                                required
                                className="input-field font-bold text-lg"
                                placeholder="Legal Full Name"
                                value={currentUser?.fullName || ''}
                                onChange={(e) => setCurrentUser({ ...currentUser, fullName: e.target.value })}
                                minLength={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="form-label font-bold uppercase tracking-wider text-[10px]">Communication Channel</label>
                            <input
                                required
                                type="email"
                                className="input-field font-semibold"
                                placeholder="Corporate Email Address"
                                value={currentUser?.email || ''}
                                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="form-label font-bold uppercase tracking-wider text-[10px]">System Access Level</label>
                                <select
                                    className="input-field font-bold text-xs"
                                    value={currentUser?.role || 'AUTH_USER'}
                                    onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                                >
                                    {roles.map(role => (
                                        <option key={role.code} value={role.code}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="form-label font-bold uppercase tracking-wider text-[10px]">Operational State</label>
                                <select
                                    className="input-field font-bold text-xs"
                                    value={currentUser?.userStatus || 'NEW'}
                                    onChange={(e) => setCurrentUser({ ...currentUser, userStatus: e.target.value })}
                                >
                                    <option value="NEW">PROVISIONAL (NEW)</option>
                                    <option value="ACTIVE">ACTIVE TRANSIT</option>
                                    <option value="INACTIVE">DECOMMISSIONED</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-10 border-t" style={{ borderColor: 'var(--border)' }}>
                            <button
                                type="submit"
                                className="flex-1 btn-primary py-3 flex items-center justify-center gap-3 text-white"
                            >
                                <Save size={18} /> Save Profile
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="btn-secondary px-10 py-3"
                            >
                                Abort
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, user: null })}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you sure you want to delete "${deleteConfirm.user?.fullName}"? All their assigned follow-ups will also be deleted. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

export default Users;
