import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { Building2, MapPin, Phone, CreditCard, Edit, Plus, X, Save } from 'lucide-react';

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
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Branch Configuration</h2>
                <button
                    onClick={handleNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} /> Add New Branch
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-lg shadow-lg border border-blue-100 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-700">{editingBranch ? 'Edit Branch' : 'New Branch Details'}</h3>
                        <button onClick={() => setIsFormOpen(false)}><X className="text-gray-400" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unique Name (Code)</label>
                            <input
                                className="w-full border p-2 rounded mt-1 uppercase"
                                placeholder="e.g. CHENNAI"
                                value={formData.uniqueName}
                                onChange={e => setFormData({ ...formData, uniqueName: e.target.value.replace(/[^a-zA-Z]/g, '') })}
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1">Alphabets only. Used as internal ID.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Display Name</label>
                            <input
                                className="w-full border p-2 rounded mt-1"
                                placeholder="e.g. Chennai Main Branch"
                                value={formData.displayName}
                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <input className="w-full border p-2 rounded mt-1" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>

                        <input className="border p-2 rounded" placeholder="City" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                        <input className="border p-2 rounded" placeholder="District" value={formData.district || ''} onChange={e => setFormData({ ...formData, district: e.target.value })} />
                        <input className="border p-2 rounded" placeholder="Country" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })} />

                        <div>
                            <label className="text-xs text-gray-500 block">GST Number</label>
                            <input className="w-full border p-2 rounded" value={formData.gstNumber || ''} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block">Phone Number</label>
                            <input className="w-full border p-2 rounded" value={formData.phoneNumber || ''} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                                <Save size={18} /> Save Branch
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {branches.map(branch => (
                    <div key={branch.id} className="bg-white rounded-lg shadow-sm border p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{branch.displayName}</h3>
                                <div className="text-sm text-blue-600 font-mono font-semibold mb-2">{branch.uniqueName}</div>

                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                                    {(branch.address || branch.city) && (
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} />
                                            {[branch.address, branch.city, branch.country].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                    {branch.phoneNumber && (
                                        <div className="flex items-center gap-1">
                                            <Phone size={14} /> {branch.phoneNumber}
                                        </div>
                                    )}
                                    {branch.gstNumber && (
                                        <div className="flex items-center gap-1">
                                            <CreditCard size={14} /> GST: {branch.gstNumber}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleEdit(branch)}
                            className="mt-4 md:mt-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                            <Edit size={20} />
                        </button>
                    </div>
                ))}
                {branches.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                        No branches configured yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchConfig;
