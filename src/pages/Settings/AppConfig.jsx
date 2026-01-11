import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, Search, CheckCircle, XCircle, Save, X, Trash2, Car, Settings as SettingsIcon } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

const AppConfig = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'vehicles' | 'relations'

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, type: null });

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Application Configuration</h2>

            {/* Main Tabs */}
            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'general' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <SettingsIcon size={16} /> General Options
                </button>
                <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'vehicles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Car size={16} /> Vehicle Master
                </button>
                <button
                    onClick={() => setActiveTab('relations')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'relations' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <SettingsIcon size={16} /> Option Relations
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
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
            console.log(res.data);
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
        <div>
            {/* Category Selector */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Configuration Category</label>
                <select className="w-full md:w-1/2 border p-2 rounded-lg" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setEditingOption(null); }}>
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {selectedCategory && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-700">{selectedCategory} Options</h3>
                        <button onClick={() => setEditingOption({ value: '', label: '', isActive: true })} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
                            <Plus size={16} /> Add New Option
                        </button>
                    </div>
                    {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 text-sm text-gray-600">
                                <tr>
                                    <th className="p-3">Value</th>
                                    <th className="p-3">Label</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {options.map(opt => (
                                    <tr key={opt.id} className="hover:bg-gray-50">
                                        <td className="p-3">{opt.value}</td>
                                        <td className="p-3 text-gray-600">{opt.label || opt.value}</td>
                                        <td className="p-3 text-center">
                                            {opt.isActive ? <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span> : <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Inactive</span>}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => setEditingOption(opt)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {editingOption && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{editingOption.id ? 'Edit Option' : 'New Option'}</h3>
                            <button onClick={() => setEditingOption(null)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div><label className="block text-sm font-medium">Value</label><input className="w-full border p-2 rounded" value={editingOption.value} onChange={e => setEditingOption({ ...editingOption, value: e.target.value })} required /></div>
                            <div><label className="block text-sm font-medium">Label</label><input className="w-full border p-2 rounded" value={editingOption.label || ''} onChange={e => setEditingOption({ ...editingOption, label: e.target.value })} /></div>
                            <div className="flex items-center gap-2"><input type="checkbox" checked={editingOption.isActive} onChange={e => setEditingOption({ ...editingOption, isActive: e.target.checked })} /><label>Is Active?</label></div>
                            <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setEditingOption(null)} className="px-4 py-2 border rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button></div>
                        </form>
                    </div>
                </div>
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
        <div>
            {/* Sub Tabs */}
            <div className="flex gap-4 mb-4 border-b">
                {['types', 'brands', 'models', 'variants'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setSubTab(tab)}
                        className={`pb-2 capitalize font-medium ${subTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-4">
                {(subTab === 'models' || subTab === 'variants') && (
                    <select className="border p-2 rounded" value={filterBrandId} onChange={e => { setFilterBrandId(e.target.value); setFilterModelId(''); }}>
                        <option value="">All Brands</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                )}
                {subTab === 'variants' && (
                    <select className="border p-2 rounded" value={filterModelId} onChange={e => setFilterModelId(e.target.value)}>
                        <option value="">All Models</option>
                        {models.filter(m => !filterBrandId || m.brandId === parseInt(filterBrandId)).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                )}
                <button onClick={openNew} className="ml-auto bg-green-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-green-700">
                    <Plus size={16} /> Add {subTab.slice(0, -1)}
                </button>
            </div>

            {/* List View */}
            <div className="bg-white rounded shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-sm font-semibold">
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Name</th>
                            {subTab === 'models' && <th className="p-3">Brand / Type</th>}
                            {subTab === 'variants' && <th className="p-3">Model</th>}
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {subTab === 'types' && types.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-3">{item.id}</td>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setEditItem(item); setIsModalOpen(true); }} className="text-blue-600 px-2"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id, 'types')} className="text-red-500 px-2"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {subTab === 'brands' && brands.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-3">{item.id}</td>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setEditItem(item); setIsModalOpen(true); }} className="text-blue-600 px-2"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id, 'brands')} className="text-red-500 px-2"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {subTab === 'models' && models.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-3">{item.id}</td>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-gray-500">{item.brand?.name} - {item.type?.name}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setEditItem(item); setIsModalOpen(true); }} className="text-blue-600 px-2"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id, 'models')} className="text-red-500 px-2"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {subTab === 'variants' && variants.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-3">{item.id}</td>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-gray-500">{item.model?.name}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => { setEditItem(item); setIsModalOpen(true); }} className="text-blue-600 px-2"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id, 'variants')} className="text-red-500 px-2"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Config Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold capitalize">{editItem.id ? 'Edit' : 'Add'} {subTab.slice(0, -1)}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <input className="w-full border p-2 rounded" value={editItem.name || ''} onChange={e => setEditItem({ ...editItem, name: e.target.value })} required />
                            </div>

                            {/* Brand specific fields - None */}

                            {/* Model specific fields */}
                            {subTab === 'models' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium">Brand</label>
                                        <select className="w-full border p-2 rounded" value={editItem.brandId || ''} onChange={e => setEditItem({ ...editItem, brandId: e.target.value })} required>
                                            <option value="">Select Brand...</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Type</label>
                                        <select className="w-full border p-2 rounded" value={editItem.typeId || ''} onChange={e => setEditItem({ ...editItem, typeId: e.target.value })} required>
                                            <option value="">Select Type...</option>
                                            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Variant specific fields */}
                            {subTab === 'variants' && (
                                <div>
                                    <label className="block text-sm font-medium">Model</label>
                                    <select className="w-full border p-2 rounded" value={editItem.modelId || ''} onChange={e => setEditItem({ ...editItem, modelId: e.target.value })} required>
                                        <option value="">Select Model...</option>
                                        {/* Show all models or filtered? Better show all if possible or filter by brand if selected. Let's show all valid for context... actually filterBrandId is not bound to editItem. */}
                                        {/* Simple: Show all models sorted by name */}
                                        {models.sort((a, b) => a.name.localeCompare(b.name)).map(m => <option key={m.id} value={m.id}>{m.name} ({m.brand?.name})</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
        if (!window.confirm("Are you sure you want to delete this relation?")) return;
        try {
            await api.delete(`/option-relations/${id}`);
            showToast("Relation deleted", "success");
            fetchRelations();
        } catch (error) {
            showToast("Delete failed", "error");
        }
    };

    return (
        <div className="space-y-6">
            {/* Creator Form */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-600" /> Create New Relation
                </h3>
                <form onSubmit={handleCreateRelation} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Parent Category</label>
                        <select
                            className="w-full border p-2 rounded-lg text-sm bg-gray-50"
                            value={parentCategory}
                            onChange={e => setParentCategory(e.target.value)}
                        >
                            <option value="">Select Parent Cat...</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Parent Option</label>
                        <select
                            className="w-full border p-2 rounded-lg text-sm"
                            value={newRelation.parentOptionId}
                            onChange={e => setNewRelation({ ...newRelation, parentOptionId: e.target.value })}
                            required
                            disabled={!parentCategory}
                        >
                            <option value="">Select Parent...</option>
                            {parentOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label || opt.value}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Child Category</label>
                        <select
                            className="w-full border p-2 rounded-lg text-sm bg-gray-50"
                            value={childCategory}
                            onChange={e => setChildCategory(e.target.value)}
                        >
                            <option value="">Select Child Cat...</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Child Option</label>
                        <select
                            className="w-full border p-2 rounded-lg text-sm"
                            value={newRelation.childOptionId}
                            onChange={e => setNewRelation({ ...newRelation, childOptionId: e.target.value })}
                            required
                            disabled={!childCategory}
                        >
                            <option value="">Select Child...</option>
                            {childOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label || opt.value}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                            disabled={!newRelation.parentOptionId || !newRelation.childOptionId}
                        >
                            Link Options
                        </button>
                    </div>
                </form>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Existing Relations</h3>
                    <button onClick={fetchRelations} className="text-blue-600 hover:underline text-sm">Refresh</button>
                </div>
                {loading ? (
                    <div className="p-10 text-center text-gray-400">Loading relations...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase">
                                <tr>
                                    <th className="p-4">Parent (Category: Value)</th>
                                    <th className="p-4">Link</th>
                                    <th className="p-4">Child (Category: Value)</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {relations.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-10 text-center text-gray-400 italic">No relations mapped yet.</td>
                                    </tr>
                                ) : (
                                    relations.map(rel => (
                                        <tr key={rel.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <span className="text-xs text-gray-400 block mb-1">{rel.parent.category}</span>
                                                <span className="font-medium text-gray-900">{rel.parent.label || rel.parent.value}</span>
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                <Plus size={14} className="rotate-45" strokeWidth={3} />
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs text-gray-400 block mb-1">{rel.child.category}</span>
                                                <span className="font-medium text-gray-900">{rel.child.label || rel.child.value}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteRelation(rel.id)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="Delete Relation"
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
