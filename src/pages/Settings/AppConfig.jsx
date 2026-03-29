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
            <div className="flex overflow-x-auto no-scrollbar items-center gap-6 sm:gap-8 border-b border-[var(--border)] mb-10 pb-0 w-full">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-4 pt-2 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] flex items-center shrink-0 gap-2 sm:gap-3 transition-all border-b-2 ${activeTab === 'general' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    <SettingsIcon size={16} /> Settings & Categories
                </button>
                <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`pb-4 pt-2 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] flex items-center shrink-0 gap-2 sm:gap-3 transition-all border-b-2 ${activeTab === 'vehicles' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    <Car size={16} /> Vehicle Master
                </button>
                <button
                    onClick={() => setActiveTab('relations')}
                    className={`pb-4 pt-2 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] flex items-center shrink-0 gap-2 sm:gap-3 transition-all border-b-2 ${activeTab === 'relations' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
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
                            <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{selectedCategory} Options</h3>
                            <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-[0.2em] mt-2 opacity-60">List of options for this category</p>
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
                                        <th className="px-8 py-6">Value</th>
                                        <th className="px-8 py-6">Label</th>
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
                    title={editingOption.id ? 'Edit Option' : 'Add New Option'}
                    subtitle="Manage Option Details"
                    icon={SettingsIcon}
                    maxWidth="max-w-md"
                    footer={
                        <div className="flex flex-col-reverse sm:flex-row justify-end w-full gap-4">
                            <button
                                type="button"
                                onClick={() => setEditingOption(null)}
                                className="px-6 py-3 w-full sm:w-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest transition-all text-center"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="option-form"
                                className="btn-primary py-3 px-8 w-full sm:w-auto text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/20 active:scale-95 transition-all text-white text-center"
                            >
                                Save Details
                            </button>
                        </div>
                    }
                >
                    <form id="option-form" onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Value Code</label>
                            <input
                                className="input-field font-bold"
                                value={editingOption.value}
                                onChange={e => setEditingOption({ ...editingOption, value: e.target.value })}
                                required
                                placeholder="e.g. SILVER_METALLIC"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Label</label>
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

        const lowerName = (editItem.name || '').trim().toLowerCase();
        let isDuplicate = false;

        if (subTab === 'types') {
            isDuplicate = types.some(t => t.name.toLowerCase() === lowerName && t.id !== editItem.id);
        } else if (subTab === 'brands') {
            isDuplicate = brands.some(b => b.name.toLowerCase() === lowerName && b.id !== editItem.id);
        } else if (subTab === 'models') {
            isDuplicate = models.some(m => m.name.toLowerCase() === lowerName && Number(m.brandId) === Number(editItem.brandId) && m.id !== editItem.id);
        } else if (subTab === 'variants') {
            isDuplicate = variants.some(v => v.name.toLowerCase() === lowerName && Number(v.modelId) === Number(editItem.modelId) && v.id !== editItem.id);
        }

        if (isDuplicate) {
            return showToast(`This ${subTab.slice(0, -1)} already exists. Please use a different name.`, 'warning');
        }

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
        <div className="space-y-4 sm:space-y-8 animate-fade-in">
            {/* Sub Tabs */}
            <div className="flex overflow-x-auto no-scrollbar items-center gap-6 border-b border-[var(--border)] w-full pb-0 mb-6">
                {['types', 'brands', 'models', 'variants'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setSubTab(tab)}
                        className={`pb-3 pt-1 shrink-0 text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] transition-all border-b-2 ${subTab === tab ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
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
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-r border-[var(--border)] pr-5 hidden sm:inline-block">Entity Filter</span>
                            <select
                                className="bg-transparent border border-[var(--border)] sm:border-none rounded-md sm:focus:ring-0 focus:ring-1 focus:ring-[var(--accent)] text-sm font-bold text-[var(--text-primary)] min-w-[140px] sm:min-w-[180px] cursor-pointer outline-none h-10 px-2 sm:px-0 shadow-sm sm:shadow-none"
                                value={filterBrandId}
                                onChange={e => { setFilterBrandId(e.target.value); setFilterModelId(''); }}
                            >
                                <option value="">All Brands</option>
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
                    className="btn-primary w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/30 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Add New
                </button>
            </div>

            {/* List View */}
            <div className="card shadow-2xl border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-secondary)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-8 py-6">ID</th>
                                <th className="px-8 py-6">Name</th>
                                {subTab === 'models' && <th className="px-8 py-6">Brand / Type</th>}
                                {subTab === 'variants' && <th className="px-8 py-6">Model Name</th>}
                                <th className="px-8 py-6 text-right">Actions</th>
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
                                        <p className="font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-[0.3em] opacity-30">No items found for the current selection.</p>
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
                title={editItem?.id ? `Edit ${subTab.slice(0, -1).toUpperCase()}` : `Add ${subTab.slice(0, -1).toUpperCase()}`}
                subtitle="Details"
                icon={Car}
                maxWidth="max-w-md"
                footer={
                    <div className="flex flex-col-reverse sm:flex-row justify-end w-full gap-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 w-full sm:w-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest transition-all text-center"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="vehicle-form"
                            className="btn-primary py-3 px-8 w-full sm:w-auto text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/20 active:scale-95 transition-all text-white text-center"
                        >
                            Save Details
                        </button>
                    </div>
                }
            >
                {editItem && (
                    <form id="vehicle-form" onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Name</label>
                            <input className="input-field font-bold" value={editItem.name || ''} onChange={e => setEditItem({ ...editItem, name: e.target.value })} required placeholder={`e.g. BMW / LUXURY_ELITE`} />
                        </div>

                        {subTab === 'models' && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Brand</label>
                                    <select className="input-field font-bold text-sm" value={editItem.brandId || ''} onChange={e => setEditItem({ ...editItem, brandId: e.target.value })} required>
                                        <option value="">Select Brand...</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Type</label>
                                    <select className="input-field font-bold text-sm" value={editItem.typeId || ''} onChange={e => setEditItem({ ...editItem, typeId: e.target.value })} required>
                                        <option value="">Select Type...</option>
                                        {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {subTab === 'variants' && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3">Model</label>
                                <select className="input-field font-bold text-sm" value={editItem.modelId || ''} onChange={e => setEditItem({ ...editItem, modelId: e.target.value })} required>
                                    <option value="">Select Model...</option>
                                    {models.sort((a, b) => a.name.localeCompare(b.name)).map(m => <option key={m.id} value={m.id}>{m.name} ({m.brand?.name})</option>)}
                                </select>
                            </div>
                        )}
                    </form>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Item"
                message={`Are you sure you want to delete this ${deleteConfirm.type?.slice(0, -1)}? This action cannot be undone.`}
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
            // Find the actual option objects to get category and value
            const parentOpt = parentOptions.find(o => String(o.id) === String(newRelation.parentOptionId));
            const childOpt = childOptions.find(o => String(o.id) === String(newRelation.childOptionId));

            if (!parentOpt || !childOpt) {
                showToast("Source/Target options not found", "error");
                return;
            }

            const payload = {
                parentCategory: parentOpt.category,
                parentValue: parentOpt.value,
                childCategory: childOpt.category,
                childValue: childOpt.value
            };

            await api.post('/option-relations', payload);
            showToast("Relation created successfully", "success");
            fetchRelations();
            setNewRelation({ parentOptionId: '', childOptionId: '' });
        } catch (error) {
            showToast(error.response?.data?.error || "Failed to create relation", "error");
        }
    };

    const handleDeleteRelation = async (id) => {
        if (!window.confirm("Are you sure you want to delete this relation?")) return;
        try {
            await api.delete(`/option-relations/${id}`);
            showToast("Relation deleted", "success");
            fetchRelations();
        } catch (error) {
            showToast("Dissolution failed", "error");
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Creator Form */}
            <div className="card p-6 sm:p-10 border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent)]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-8 sm:mb-10 flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center text-[var(--accent)] shrink-0">
                        <Plus size={20} />
                    </div>
                    Add New Relation
                </h3>
                <form onSubmit={handleCreateRelation} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-end">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">Parent Category</label>
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
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">Parent Option</label>
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
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">Child Category</label>
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
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">Child Option</label>
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
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col sm:flex-row justify-end pt-6 sm:pt-8 border-t border-[var(--border)]">
                        <button
                            type="submit"
                            className="btn-primary w-full sm:w-auto py-3 px-10 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[var(--accent)]/20 active:scale-95 transition-all text-white flex items-center justify-center gap-3"
                            disabled={!newRelation.parentOptionId || !newRelation.childOptionId}
                        >
                            <Save size={18} /> Save Relation
                        </button>
                    </div>
                </form>
            </div>

            {/* List Table */}
            <div className="card shadow-2xl border border-[var(--border)] overflow-hidden animate-fade-in-up">
                <div className="p-6 sm:p-8 border-b border-[var(--border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-secondary)]/30">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Relations List</h3>
                        <p className="text-[10px] text-[var(--accent)] font-black uppercase tracking-[0.2em] mt-2 opacity-60">All parent-child relations</p>
                    </div>
                    <button onClick={fetchRelations} className="text-[var(--accent)] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 border border-[var(--accent)]/20 px-4 py-2 rounded-full sm:border-none sm:px-0 sm:py-0">
                        <Plus className="rotate-45" size={14} /> Refresh
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
                                    <th className="px-6 md:px-8 py-6">Parent</th>
                                    <th className="px-6 md:px-8 py-6 text-center">Link</th>
                                    <th className="px-6 md:px-8 py-6">Child</th>
                                    <th className="px-6 md:px-8 py-6 text-right">Actions</th>
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
