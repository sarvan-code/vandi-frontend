import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { Building2, MapPin, Phone, CreditCard, Edit, Plus, X, Save } from 'lucide-react';
import Modal from '../../components/Modal';

const BranchConfig = () => {
    const { showToast } = useToast();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        uniqueName: '',
        displayName: '',
        address: '',
        city: '',
        district: '',
        country: '',
        gstNumber: '',
        phoneNumber: ''
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await api.get('/branches');
            setBranches(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setFormData(branch);
        setIsFormOpen(true);
    };

    const handleNew = () => {
        setEditingBranch(null);
        setFormData({
            uniqueName: '', displayName: '', address: '',
            city: '', district: '', country: '',
            gstNumber: '', phoneNumber: ''
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Unique Name alphabets only
        if (!/^[a-zA-Z]+$/.test(formData.uniqueName)) {
            showToast("Unique Name must contain alphabets only (no spaces/numbers/symbols).", "warning");
            return;
        }

        try {
            if (editingBranch) {
                // Update
                const res = await api.put(`/branches/${editingBranch.id}`, formData);
                setBranches(branches.map(b => b.id === editingBranch.id ? res.data : b));
            } else {
                // Create
                const res = await api.post('/branches', formData);
                setBranches([res.data, ...branches]);
            }
            setIsFormOpen(false);
        } catch (error) {
            showToast("Failed to save branch: " + (error.response?.data?.error || error.message), "error");
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-semibold mb-2 text-[var(--text-primary)]">Branch Management</h1>
                    <p className="text-[var(--text-secondary)] font-medium text-sm">Manage your showroom and workshop branches.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="btn-primary flex items-center gap-3 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all text-white"
                >
                    <Plus size={20} /> Add New Branch
                </button>
            </div>

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingBranch ? `Edit Branch: ${editingBranch.uniqueName}` : 'Add New Branch'}
                subtitle="Branch details"
                icon={Building2}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-8 py-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="branch-form"
                            className="btn-primary flex items-center gap-3 px-10 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all text-white"
                        >
                            <Save size={18} /> {editingBranch ? 'Save Changes' : 'Create Branch'}
                        </button>
                    </>
                }
            >
                <form id="branch-form" onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Branch Code (Unique)</label>
                            <input
                                className="input-field font-black uppercase text-sm tracking-widest bg-[var(--bg-tertiary)]/30"
                                placeholder="e.g. CHENNAI"
                                value={formData.uniqueName}
                                onChange={e => setFormData({ ...formData, uniqueName: e.target.value.replace(/[^a-zA-Z]/g, '') })}
                                required
                            />
                            <p className="text-[10px] text-[var(--text-muted)] mt-3 font-medium italic pl-1 opacity-70">Letters only. Used for routing and search.</p>
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Branch Display Name</label>
                            <input
                                className="input-field font-bold text-sm"
                                placeholder="e.g. Chennai Main Command"
                                value={formData.displayName}
                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Branch Address</label>
                            <input
                                className="input-field text-sm font-medium"
                                placeholder="Full street address, building, floor..."
                                value={formData.address || ''}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <input className="input-field text-sm" placeholder="City" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                        <input className="input-field text-sm" placeholder="District / State" value={formData.district || ''} onChange={e => setFormData({ ...formData, district: e.target.value })} />
                        <input className="input-field text-sm" placeholder="Country" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })} />

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] ml-1 mb-3">GST Number</label>
                            <input
                                className="input-field"
                                placeholder="27AAAAA0000A1Z5"
                                value={formData.gstNumber || ''}
                                onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Phone Number</label>
                            <input
                                className="input-field font-bold text-sm"
                                placeholder="+91 000 000 0000"
                                value={formData.phoneNumber || ''}
                                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {branches.map((branch, idx) => (
                    <div
                        key={branch.id}
                        className="card p-8 flex flex-col hover:shadow-2xl transition-all group border border-[var(--border)] animate-fade-in-up"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-[var(--accent)]/10 text-[var(--accent)] rounded-3xl group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-500 shadow-sm">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold leading-tight text-[var(--text-primary)]">{branch.displayName}</h3>
                                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 font-black text-[9px] rounded-full uppercase tracking-widest border border-emerald-500/20 shadow-sm flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        Status: Active
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleEdit(branch)}
                                className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] rounded-2xl transition-all"
                            >
                                <Edit size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-5 relative group/info">
                            <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-[var(--border)] rounded-full"></div>

                            {(branch.address || branch.city) && (
                                <div className="flex items-start gap-4 pl-6 relative">
                                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 bg-[var(--bg-secondary)] border-2 border-[var(--border)] rounded-full"></div>
                                    <div>
                                        <p className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2 opacity-60">Branch Address</p>
                                        <p className="text-xs font-bold text-[var(--text-primary)] leading-relaxed">
                                            {[branch.address, branch.city, branch.district, branch.country].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-8 pl-6 relative">
                                <div className="absolute left-0 top-1.5 w-2.5 h-2.5 bg-[var(--bg-secondary)] border-2 border-[var(--border)] rounded-full"></div>
                                {branch.phoneNumber && (
                                    <div>
                                        <p className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2 opacity-60">Phone Number</p>
                                        <p className="text-xs font-bold text-[var(--text-primary)]">{branch.phoneNumber}</p>
                                    </div>
                                )}
                                {branch.gstNumber && (
                                    <div>
                                        <p className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2 opacity-60">GST Number</p>
                                        <p className="text-xs font-bold text-[var(--text-primary)]">{branch.gstNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {branches.length === 0 && !loading && (
                    <div className="md:col-span-2 py-24 card border-dashed border-4 border-[var(--border)] bg-[var(--bg-secondary)]/30 flex flex-col items-center justify-center text-center rounded-[3rem]">
                        <div className="w-24 h-24 rounded-[2rem] bg-[var(--bg-secondary)] flex items-center justify-center mb-8 shadow-xl border border-[var(--border)] text-[var(--accent)]/50 rotate-12 transition-transform hover:rotate-0">
                            <Building2 size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">No branches found</h3>
                        <p className="text-[var(--text-secondary)] text-sm mt-4 font-medium max-w-sm px-10 leading-relaxed">Add your first branch to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchConfig;
