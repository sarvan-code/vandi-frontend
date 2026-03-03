import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { Search, Plus, Trash2, Edit, X, Save, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import ConfirmDialog from '../../components/ConfirmDialog';
import Table from '../../components/Table';
import FloatingActionPanel from '../../components/FloatingActionPanel';
import Modal from '../../components/Modal';

const RoleConfig = () => {
    const { showToast } = useToast();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        category: 'USER'
    });

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, role: null });

    // Selected role for floating action panel
    const [selectedRole, setSelectedRole] = useState(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            showToast("Failed to fetch roles: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (role = null) => {
        if (role && role.code) { // Handle case where it might be passed from an event
            setFormData({ ...role });
            setIsEditing(true);
        } else {
            setFormData({
                code: '',
                name: '',
                description: '',
                category: 'USER'
            });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/roles/${formData.code}`, formData);
                showToast("Role protocol updated", "success");
            } else {
                await api.post('/roles', formData);
                showToast("Role initialized successfully", "success");
            }
            fetchRoles();
            setIsModalOpen(false);
        } catch (error) {
            showToast("Role save failed: " + error.message, "error");
        }
    };

    const handleDelete = (role) => {
        setDeleteConfirm({ isOpen: true, role });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.role) return;

        try {
            await api.delete(`/roles/${deleteConfirm.role.code}`);
            showToast("Role purged from system", "success");
            fetchRoles();
            setSelectedRole(null);
        } catch (error) {
            showToast("Purge failed: " + error.message, "error");
        } finally {
            setDeleteConfirm({ isOpen: false, role: null });
        }
    };

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            key: 'code',
            label: 'Role Code',
            render: (row) => (
                <span className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-4 py-1.5 rounded-lg text-[10px] font-black tracking-tight border border-[var(--border)] shadow-sm">{row.code}</span>
            )
        },
        {
            key: 'name',
            label: 'Organizational Designation',
            render: (row) => <span className="font-bold text-[var(--text-primary)] tracking-tight">{row.name}</span>
        },
        {
            key: 'description',
            label: 'Functional Mandate',
            render: (row) => <span className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{row.description || '-'}</span>
        },
        {
            key: 'category',
            label: 'Domain',
            render: (row) => (
                <span className={clsx(
                    "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm",
                    row.category === 'SYSTEM'
                        ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                        : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                )}>
                    {row.category}
                </span>
            )
        }
    ];

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-semibold mb-2 text-[var(--text-primary)]">Authorization Hierarchy</h1>
                    <p className="text-[var(--text-secondary)] font-medium text-sm">System configuration of access tiers and permissions.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="card flex items-center gap-3 px-4 py-2 border border-[var(--border)] shadow-sm focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all bg-[var(--bg-secondary)]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] border-r border-[var(--border)] pr-3">Filter Hierarchy</span>
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search Roles..."
                                className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-bold text-[var(--text-primary)] w-full pl-6 outline-none h-10 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary flex items-center gap-3 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all text-white"
                    >
                        <Plus size={20} /> Provision Authorization tier
                    </button>
                </div>
            </div>

            <div className="relative">
                <div className="card shadow-2xl border border-slate-100 overflow-hidden">
                    <Table
                        columns={columns}
                        data={filteredRoles}
                        onRowClick={(row) => setSelectedRole(row)}
                        selectedRow={selectedRole?.code}
                        rowKey="code"
                        emptyMessage={loading ? "Synchronizing registry..." : "No protocols identified."}
                    />
                </div>

                <FloatingActionPanel
                    selectedItem={selectedRole}
                    onClose={() => setSelectedRole(null)}
                    title={selectedRole?.name}
                    subtitle={selectedRole?.code}
                    actions={[
                        {
                            icon: Edit,
                            label: 'Edit Role',
                            onClick: () => handleOpenModal(selectedRole),
                            color: 'indigo',
                            title: 'Modify'
                        },
                        {
                            icon: Trash2,
                            label: 'Purge Role',
                            onClick: () => handleDelete(selectedRole),
                            color: 'red',
                            title: 'Purge'
                        }
                    ]}
                />
            </div>

            {/* Role Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Refine Designation' : 'Provision Authorization Tier'}
                subtitle="Authorization Specification"
                icon={ShieldAlert}
                maxWidth="max-w-lg"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-8 py-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                            Cease Operations
                        </button>
                        <button
                            type="submit"
                            form="role-form"
                            className="btn-primary flex items-center gap-3 px-10 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all text-white"
                        >
                            <Save size={18} /> {isEditing ? 'Save Role' : 'Create Role'}
                        </button>
                    </>
                }
            >
                <form id="role-form" onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Reference Code (Unique System ID)</label>
                        <input
                            className={clsx(
                                "input-field font-black uppercase tracking-widest text-sm",
                                isEditing ? "bg-[var(--bg-tertiary)]/50 text-[var(--text-muted)] cursor-not-allowed opacity-60" : ""
                            )}
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                            disabled={isEditing}
                            placeholder="e.g. OPERATIONS_DIRECTOR"
                            required
                        />
                        {!isEditing && <p className="text-[10px] text-[var(--text-muted)] mt-3 font-medium italic pl-1 opacity-70">Auto-formatted to UPPER_SNAKE_CASE</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Organizational Designation</label>
                            <input
                                className="input-field font-bold text-sm"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Director of Operations"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Authority Domain</label>
                            <select
                                className="input-field font-bold text-sm cursor-pointer"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="SYSTEM">SYSTEM (Protected)</option>
                                <option value="USER">USER (Customizable)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Functional Mandate & Responsibilities</label>
                        <textarea
                            className="input-field h-32 resize-none text-sm font-medium leading-relaxed p-5"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Outline the responsibilities and access privileges for this organizational designation..."
                        />
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, role: null })}
                onConfirm={confirmDelete}
                title="Delete Role"
                message={`Are you certain you wish to purge the role "${deleteConfirm.role?.name}"? System-critical authorizations may be disrupted. This action is irrevocable.`}
                confirmText="Execute Purge"
                cancelText="Abort"
                variant="danger"
            />
        </div >
    );
};

export default RoleConfig;
