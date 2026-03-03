import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, Search, CheckCircle, XCircle, Save, X, Trash2, Car, Settings as SettingsIcon } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';

const AppConfig = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'vehicles' | 'relations'

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, type: null });

    return (
        <div className="h-full flex flex-col animate-fade-in-up">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Master Data Settings</h1>
                <p className="text-[var(--text-muted)] mt-1 font-medium">Manage vehicle master data, categories, and relationships.</p>
            </header>

            {/* Main Tabs */}
            <div className="flex bg-[var(--bg-secondary)] p-1.5 rounded-[2rem] mb-10 self-start border border-[var(--border)] backdrop-blur-sm">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-8 py-3 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all rounded-full ${activeTab === 'general' ? 'bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/30 scale-[1.05]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    <SettingsIcon size={16} /> Settings & Categories
                </button>
                <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`px-8 py-3 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all rounded-full ${activeTab === 'vehicles' ? 'bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/30 scale-[1.05]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    <Car size={16} /> Vehicle Master
                </button>
                <button
                    onClick={() => setActiveTab('relations')}
                    className={`px-8 py-3 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all rounded-full ${activeTab === 'relations' ? 'bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/30 scale-[1.05]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    <Plus size={16} /> Relationship Manager
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-12 custom-scrollbar">
                {activeTab === 'general' && <GeneralOptionsManager showToast={showToast} />}
                {activeTab === 'vehicles' && <VehicleMasterManager showToast={showToast} />}
                {activeTab === 'relations' && <OptionRelationManager showToast={showToast} />}
            </div>
        </div>
    );
};

// --- Sub-Component: General Options Manager (Existing Logic) ---
const GeneralOptionsManager = ({ showToast }) => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingOption, setEditingOption] = useState(null);

    useEffect(() => { fetchCategories(); }, []);
    useEffect(() => {
        if (selectedCategory) fetchOptions(selectedCategory);
        else setOptions([]);
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/options/categories');
            setCategories(res.data);
        } catch (error) { console.error("Failed to fetch categories", error); }
    };

    const fetchOptions = async (cat) => {
        setLoading(true);
        try {
            const res = await api.get(`/options`, { params: { category: cat } });
            setOptions(res.data);
        } catch (error) { console.error("Failed to fetch options", error); } finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingOption.id) {
                await api.put(`/options/${editingOption.id}`, editingOption);
            } else {
                await api.post('/options', { ...editingOption, category: selectedCategory });
            }
            fetchOptions(selectedCategory);
            setEditingOption(null);
        } catch (error) { showToast("Failed to save: " + error.message, "error"); }
    };

    return (
        <div className="space-y-8">
            {/* Category Selector */}
            <div className="card p-10 flex flex-col md:flex-row md:items-end justify-between gap-8 border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] mb-4 ml-1">Category</label>
                    <div className="relative group/select max-w-xl">
                        <select
                            className="input-field appearance-none pr-12 cursor-pointer font-bold text-sm bg-[var(--bg-secondary)]"
                            value={selectedCategory}
                            onChange={e => { setSelectedCategory(e.target.value); setEditingOption(null); }}
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover/select:text-[var(--accent)] transition-colors">
                            <Plus size={20} className="rotate-45 opacity-40 border-l border-[var(--border)] pl-3" />
                        </div>
                    </div>
                </div>
                {selectedCategory && (
                    <button
                        onClick={() => setEditingOption({ value: '', label: '', isActive: true })}
                        className="btn-primary flex items-center gap-3 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all"
                    >
                        <Plus size={20} /> Add New Option
                    </button>
                )}
            </div>

            {selectedCategory ? (
                <div className="card border border-[var(--border)] overflow-hidden animate-fade-in-up">
                    <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-tertiary)]/40">
                        <div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{selectedCategory} Taxonomy</h3>
                            <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-[0.2em] mt-2 opacity-60">Constituent Population</p>
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-24 text-center">
                            <div className="w-14 h-14 border-4 border-[var(--accent)]/10 border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-6"></div>
                            <p className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Loading options...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[var(--bg-secondary)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--border)]">
                                    <tr>
                                        <th className="px-8 py-6">System Code</th>
                                        <th className="px-8 py-6">Display Name</th>
                                        <th className="px-8 py-6 text-center">Status</th>
                                        <th className="px-8 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {options.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-20 text-center">
                                                <p className="font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-[0.3em] opacity-30">No options found for this category.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        options.map(opt => (
                                            <tr key={opt.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-all group">
                                                <td className="px-8 py-6">
                                                    <span className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-4 py-1.5 rounded-lg text-xs font-black tracking-tight border border-[var(--border)] shadow-sm">{opt.value}</span>
                                                </td>
                                                <td className="px-8 py-6 text-[var(--text-primary)] font-bold tracking-tight">{opt.label || opt.value}</td>
                                                <td className="px-8 py-6 text-center">
                                                    {opt.isActive ? (
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full ring-1 ring-emerald-200">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full ring-1 ring-slate-200">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => setEditingOption(opt)}
                                                        className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] hover:shadow-sm rounded-2xl transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-24 card border-dashed border-4 border-[var(--border)] bg-[var(--bg-secondary)]/30 flex flex-col items-center justify-center text-center max-w-2xl mx-auto rounded-[3rem]">
                    <div className="w-24 h-24 rounded-[2rem] bg-[var(--bg-secondary)] flex items-center justify-center mb-8 shadow-xl border border-[var(--border)] text-[var(--accent)] rotate-12 transition-transform hover:rotate-0">
                        <SettingsIcon size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Category Not Selected</h3>
                    <p className="text-[var(--text-secondary)] text-sm mt-4 font-medium max-w-md px-10 leading-relaxed">Please select a category from the dropdown above to manage its options.</p>
                </div>
            )}

            {editingOption && (
                <Modal
                    isOpen={!!editingOption}
                    onClose={() => setEditingOption(null)}
                    title={editingOption.id ? 'Refine Technical Specification' : 'Provision New Option'}
                    subtitle="Organizational Master Data"
                    icon={SettingsIcon}
                    maxWidth="max-w-md"
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setEditingOption(null)}
                                className="px-6 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest transition-all"
                            >
                                Cease Operations
                            </button>
                            <button
                                type="submit"
                                form="option-form"
                                className="btn-primary py-3 px-8 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/20 active:scale-95 transition-all text-white"
                            >
                                Commit Structural Change
                            </button>
                        </>
                    }
                >
                    <form id="option-form" onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">System Code</label>
                            <input
                                className="input-field font-bold"
                                value={editingOption.value}
                                onChange={e => setEditingOption({ ...editingOption, value: e.target.value })}
                                required
                                placeholder="e.g. SILVER_METALLIC"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Display Name</label>
                            <input
                                className="input-field font-bold"
                                value={editingOption.label || ''}
                                onChange={e => setEditingOption({ ...editingOption, label: e.target.value })}
                                placeholder="e.g. Metallic Radiant Silver"
                            />
                        </div>
                        <div className="flex items-center gap-4 bg-[var(--bg-tertiary)] p-4 rounded-[1.5rem] border border-[var(--border)]">
                            <input
                                type="checkbox"
                                id="optionActive"
                                className="w-5 h-5 rounded-lg border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] transition-all cursor-pointer"
                                checked={editingOption.isActive}
                                onChange={e => setEditingOption({ ...editingOption, isActive: e.target.checked })}
                            />
                            <label htmlFor="optionActive" className="text-sm font-bold text-[var(--text-primary)] cursor-pointer">Status: Active</label>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// --- Sub-Component: Vehicle Master Manager ---
const VehicleMasterManager = ({ showToast }) => {
    const [subTab, setSubTab] = useState('types'); // types | brands | models | variants
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [variants, setVariants] = useState([]);
    const [types, setTypes] = useState([]);

    const [loading, setLoading] = useState(false);

    // Filter Filters
    const [filterBrandId, setFilterBrandId] = useState('');
    const [filterModelId, setFilterModelId] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null); // null = new

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, type: null });

    useEffect(() => {
        fetchTypes();
        fetchBrands();
    }, []);

    useEffect(() => {
        if (subTab === 'models' || subTab === 'variants') fetchModels();
        if (subTab === 'variants') fetchVariants();
    }, [subTab, filterBrandId, filterModelId]);

    const fetchTypes = async () => { const res = await api.get('/vehicles/types'); setTypes(res.data); };
    const fetchBrands = async () => { const res = await api.get('/vehicles/brands'); setBrands(res.data); };
    const fetchModels = async () => {
        const res = await api.get('/vehicles/models', { params: { brandId: filterBrandId } });
        setModels(res.data);
    };
    const fetchVariants = async () => {
        const res = await api.get('/vehicles/variants', { params: { modelId: filterModelId } });
        setVariants(res.data);
    };

    const handleDelete = async (id, type) => {
        setDeleteConfirm({ isOpen: true, id, type });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.id || !deleteConfirm.type) return;

        try {
            await api.delete(`/vehicles/${deleteConfirm.type}/${deleteConfirm.id}`);
            if (deleteConfirm.type === 'types') fetchTypes();
            if (deleteConfirm.type === 'brands') fetchBrands();
            if (deleteConfirm.type === 'models') fetchModels();
            if (deleteConfirm.type === 'variants') fetchVariants();
            showToast('Deleted successfully', 'success');
        } catch (error) {
            showToast("Failed to delete: " + error.message, "error");
        } finally {
            setDeleteConfirm({ isOpen: false, id: null, type: null });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const endpoint = `/vehicles/${subTab}`; // types, brands, models, variants
            const payload = { ...editItem };

            if (editItem.id) {
                await api.put(`${endpoint}/${editItem.id}`, payload);
            } else {
                await api.post(endpoint, payload);
            }
            setIsModalOpen(false);
            if (subTab === 'types') fetchTypes();
            if (subTab === 'brands') fetchBrands();
            if (subTab === 'models') fetchModels();
            if (subTab === 'variants') fetchVariants();
        } catch (error) { showToast("Save failed: " + error.message, "error"); }
    };

    const openNew = () => {
        setEditItem({});
        // Pre-fill context
        if (subTab === 'models' && filterBrandId) setEditItem({ brandId: filterBrandId });
        if (subTab === 'variants' && filterModelId) setEditItem({ modelId: filterModelId });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Sub Tabs */}
            <div className="flex bg-[var(--bg-secondary)] p-1.5 rounded-2xl self-start w-fit border border-[var(--border)]">
                {['types', 'brands', 'models', 'variants'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setSubTab(tab)}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${subTab === tab ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-wrap gap-4">
                    {(subTab === 'models' || subTab === 'variants') && (
                        <div className="card flex items-center gap-4 px-5 py-2 border border-[var(--border)] shadow-sm transition-all focus-within:ring-2 focus-within:ring-[var(--accent)]/20 bg-[var(--bg-secondary)]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-r border-[var(--border)] pr-5">Entity Filter</span>
                            <select
                                className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-bold text-[var(--text-primary)] min-w-[180px] cursor-pointer outline-none h-10 px-2 shadow-sm"
                                value={filterBrandId}
                                onChange={e => { setFilterBrandId(e.target.value); setFilterModelId(''); }}
                            >
                                <option value="">Unified Organizational Hierarchy</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}
                    {subTab === 'variants' && (
                        <div className="card flex items-center gap-3 px-4 py-2 border border-[var(--border)] shadow-sm transition-all focus-within:ring-2 focus-within:ring-[var(--accent)]/20 bg-[var(--bg-secondary)]">
                            <span className="text-[10px] font-medium border-r border-[var(--border)] pr-3 text-[var(--text-muted)]">Model Filter</span>
                            <select
                                className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-bold text-[var(--text-primary)] min-w-[150px] cursor-pointer h-10 px-2 shadow-sm"
                                value={filterModelId}
                                onChange={e => setFilterModelId(e.target.value)}
                            >
                                <option value="">All Models</option>
                                {models.filter(m => !filterBrandId || m.brandId === parseInt(filterBrandId)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <button
                    onClick={openNew}
                    className="btn-primary flex items-center gap-3 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Provision Technical Spec
                </button>
            </div>

            {/* List View */}
            <div className="card shadow-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-secondary)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-8 py-6">Reference ID</th>
                                <th className="px-8 py-6">Constituent Classification</th>
                                {subTab === 'models' && <th className="px-8 py-6">Structural Alignment</th>}
                                {subTab === 'variants' && <th className="px-8 py-6">Parent Model Hierarchy</th>}
                                <th className="px-8 py-6 text-right">Registry Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                            {subTab === 'types' && types.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-all group">
                                    <td className="px-8 py-6 text-[var(--text-muted)] font-mono text-xs">#{item.id}</td>
                                    <td className="px-8 py-6 text-[var(--text-primary)] font-semibold">{item.name}</td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button onClick={() => { setEditItem(item); setIsModalOpen(true); }} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(item.id, 'types')} className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {subTab === 'brands' && brands.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-all group">
                                    <td className="px-8 py-6 text-[var(--text-muted)] font-mono text-xs">#{item.id}</td>
                                    <td className="px-8 py-6 text-[var(--text-primary)] font-semibold">{item.name}</td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button onClick={() => { setEditItem(item); setIsModalOpen(true); }} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(item.id, 'brands')} className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {subTab === 'models' && models.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-all group">
                                    <td className="px-8 py-6 text-[var(--text-muted)] font-mono text-xs">#{item.id}</td>
                                    <td className="px-8 py-6 text-[var(--text-primary)] font-semibold">{item.name}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-tight">{item.brand?.name}</span>
                                            <span className="text-[var(--border)]">/</span>
                                            <span className="text-[var(--text-muted)] text-xs font-bold">{item.type?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button onClick={() => { setEditItem(item); setIsModalOpen(true); }} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(item.id, 'models')} className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {subTab === 'variants' && variants.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-all group">
                                    <td className="px-8 py-6 text-[var(--text-muted)] font-mono text-xs">#{item.id}</td>
                                    <td className="px-8 py-6 text-[var(--text-primary)] font-semibold">{item.name}</td>
                                    <td className="px-8 py-6">
                                        <span className="text-[var(--text-secondary)] font-bold text-xs">{item.model?.name}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button onClick={() => { setEditItem(item); setIsModalOpen(true); }} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(item.id, 'variants')} className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {((subTab === 'types' && types.length === 0) || (subTab === 'brands' && brands.length === 0) || (subTab === 'models' && models.length === 0) || (subTab === 'variants' && variants.length === 0)) && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <p className="font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-[0.3em] opacity-30">No technical specifications localized for the current selection.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Config Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editItem?.id ? `Refine ${subTab.slice(0, -1).toUpperCase()}` : `Provision ${subTab.slice(0, -1).toUpperCase()}`}
                subtitle="Technical Data Protocol"
                icon={Car}
                maxWidth="max-w-md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                            Cease Operations
                        </button>
                        <button
                            type="submit"
                            form="vehicle-form"
                            className="btn-primary py-3 px-8 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/20 active:scale-95 transition-all text-white"
                        >
                            Finalize Provisioning
                        </button>
                    </>
                }
            >
                {editItem && (
                    <form id="vehicle-form" onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Item Code</label>
                            <input className="input-field font-bold" value={editItem.name || ''} onChange={e => setEditItem({ ...editItem, name: e.target.value })} required placeholder={`e.g. BMW / LUXURY_ELITE`} />
                        </div>

                        {subTab === 'models' && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Corporate Brand Portfolio</label>
                                    <select className="input-field font-bold text-sm" value={editItem.brandId || ''} onChange={e => setEditItem({ ...editItem, brandId: e.target.value })} required>
                                        <option value="">Select Brand Hierarchy...</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Vehicular Classification</label>
                                    <select className="input-field font-bold text-sm" value={editItem.typeId || ''} onChange={e => setEditItem({ ...editItem, typeId: e.target.value })} required>
                                        <option value="">Select Type Designation...</option>
                                        {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {subTab === 'variants' && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Base Model Prototype</label>
                                <select className="input-field font-bold text-sm" value={editItem.modelId || ''} onChange={e => setEditItem({ ...editItem, modelId: e.target.value })} required>
                                    <option value="">Select Anchor Model...</option>
                                    {models.sort((a, b) => a.name.localeCompare(b.name)).map(m => <option key={m.id} value={m.id}>{m.name} ({m.brand?.name})</option>)}
                                </select>
                            </div>
                        )}
                    </form>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="De-register Entity"
                message={`Are you certain you wish to remove this ${deleteConfirm.type?.slice(0, -1)} specification? This action is irrevocable.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null, type: null })}
            />
        </div>
    );
};

// --- Sub-Component: Option Relation Manager ---
const OptionRelationManager = ({ showToast }) => {
    const [categories, setCategories] = useState([]);
    const [parentCategory, setParentCategory] = useState('');
    const [childCategory, setChildCategory] = useState('');

    const [parentOptions, setParentOptions] = useState([]);
    const [childOptions, setChildOptions] = useState([]);

    const [relations, setRelations] = useState([]);
    const [loading, setLoading] = useState(false);

    // New Relation state
    const [newRelation, setNewRelation] = useState({ parentOptionId: '', childOptionId: '' });

    useEffect(() => {
        fetchCategories();
        fetchRelations();
    }, []);

    useEffect(() => {
        if (parentCategory) fetchOptions(parentCategory, setParentOptions);
        else setParentOptions([]);
    }, [parentCategory]);

    useEffect(() => {
        if (childCategory) fetchOptions(childCategory, setChildOptions);
        else setChildOptions([]);
    }, [childCategory]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/options/categories');
            setCategories(res.data);
        } catch (error) { console.error("Failed to fetch categories", error); }
    };

    const fetchOptions = async (cat, setter) => {
        try {
            const res = await api.get(`/options`, { params: { category: cat } });
            setter(res.data);
        } catch (error) { console.error("Failed to fetch options", error); }
    };

    const fetchRelations = async () => {
        setLoading(true);
        try {
            const res = await api.get('/option-relations');
            setRelations(res.data);
        } catch (error) { console.error("Failed to fetch relations", error); }
        finally { setLoading(false); }
    };

    const handleCreateRelation = async (e) => {
        e.preventDefault();
        try {
            await api.post('/option-relations', newRelation);
            showToast("Relation created successfully", "success");
            fetchRelations();
            setNewRelation({ parentOptionId: '', childOptionId: '' });
        } catch (error) {
            showToast(error.response?.data?.error || "Failed to create relation", "error");
        }
    };

    const handleDeleteRelation = async (id) => {
        if (!window.confirm("Are you certain you wish to dissolve this relationship?")) return;
        try {
            await api.delete(`/option-relations/${id}`);
            showToast("Relation dissolved", "success");
            fetchRelations();
        } catch (error) {
            showToast("Dissolution failed", "error");
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Creator Form */}
            <div className="card p-10 border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent)]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-10 flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center text-[var(--accent)]">
                        <Plus size={20} />
                    </div>
                    Relational Connectivity Architect
                </h3>
                <form onSubmit={handleCreateRelation} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">A: Primary Domain</label>
                        <select
                            className="input-field font-bold text-sm cursor-pointer"
                            value={parentCategory}
                            onChange={e => setParentCategory(e.target.value)}
                        >
                            <option value="">Select Domain...</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">Primary Constituent</label>
                        <select
                            className="input-field font-bold text-sm cursor-pointer"
                            value={newRelation.parentOptionId}
                            onChange={e => setNewRelation({ ...newRelation, parentOptionId: e.target.value })}
                            required
                            disabled={!parentCategory}
                        >
                            <option value="">Select Entity...</option>
                            {parentOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label || opt.value}</option>)}
                        </select>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">B: Secondary Domain</label>
                        <select
                            className="input-field font-bold text-sm cursor-pointer"
                            value={childCategory}
                            onChange={e => setChildCategory(e.target.value)}
                        >
                            <option value="">Select Domain...</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">Secondary Constituent</label>
                        <select
                            className="input-field font-bold text-sm cursor-pointer"
                            value={newRelation.childOptionId}
                            onChange={e => setNewRelation({ ...newRelation, childOptionId: e.target.value })}
                            required
                            disabled={!childCategory}
                        >
                            <option value="">Select Entity...</option>
                            {childOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label || opt.value}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-4 flex justify-end pt-8 border-t border-[var(--border)]">
                        <button
                            type="submit"
                            className="btn-primary py-3 px-10 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/20 active:scale-95 transition-all text-white flex items-center gap-3"
                            disabled={!newRelation.parentOptionId || !newRelation.childOptionId}
                        >
                            <Save size={18} /> Establish Relational Link
                        </button>
                    </div>
                </form>
            </div>

            {/* List Table */}
            <div className="card shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up">
                <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Established Relational Links</h3>
                        <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-[0.2em] mt-2 opacity-60">Relationship Catalog</p>
                    </div>
                    <button onClick={fetchRelations} className="text-[var(--accent)] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                        <Plus className="rotate-45" size={14} /> Clear Default Selections
                    </button>
                </div>
                {loading ? (
                    <div className="p-24 text-center">
                        <div className="w-14 h-14 border-4 border-[var(--accent)]/10 border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Clearing Data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--bg-secondary)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--border)]">
                                <tr>
                                    <th className="px-8 py-6">Primary Domain Node (A)</th>
                                    <th className="px-8 py-6 text-center">Structural Link</th>
                                    <th className="px-8 py-6">Secondary Domain Node (B)</th>
                                    <th className="px-8 py-6 text-right">Relational Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {relations.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-24 text-center">
                                            <p className="font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-[0.3em] opacity-30 italic">No relational dependencies localized.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    relations.map(rel => (
                                        <tr key={rel.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-[var(--accent)] font-semibold uppercase tracking-tight mb-1">{rel.parent.category}</span>
                                                    <span className="text-[var(--text-primary)] font-semibold">{rel.parent.label || rel.parent.value}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--bg-tertiary)] text-[var(--accent)] ring-1 ring-[var(--border)] shadow-sm">
                                                    <Plus className="rotate-45" size={16} strokeWidth={3} />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-[var(--accent)] font-semibold uppercase tracking-tight mb-1">{rel.child.category}</span>
                                                    <span className="text-[var(--text-primary)] font-semibold">{rel.child.label || rel.child.value}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => handleDeleteRelation(rel.id)}
                                                    className="p-3 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-secondary)] hover:shadow-sm rounded-2xl transition-all"
                                                    title="Sever Relationship"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppConfig;
