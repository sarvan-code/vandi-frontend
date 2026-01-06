import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { Search, Plus, Trash2, Edit, X, Save, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import ConfirmDialog from '../../components/ConfirmDialog';

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
        category: 'SYSTEM'
    });

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, role: null });

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
        if (role) {
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
                showToast("Role updated successfully", "success");
            } else {
                await api.post('/roles', formData);
                showToast("Role created successfully", "success");
            }
            fetchRoles();
            setIsModalOpen(false);
        } catch (error) {
            showToast("Failed to save role: " + error.message, "error");
        }
    };

    const handleDelete = async (role) => {
        setDeleteConfirm({ isOpen: true, role });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.role) return;

        try {
            await api.delete(`/roles/${deleteConfirm.role.code}`);
            showToast("Role deleted successfully", "success");
            fetchRoles();
        } catch (error) {
            showToast("Failed to delete role: " + error.message, "error");
        } finally {
            setDeleteConfirm({ isOpen: false, role: null });
        }
    };

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Role Management</h2>
                <div className="flex gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                        <input
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Search roles..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Add Role
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b text-sm font-semibold text-gray-600">
                        <tr>
                            <th className="p-4">Role Code</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Category</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading roles...</td></tr>
                        ) : filteredRoles.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No roles found.</td></tr>
                        ) : (
                            filteredRoles.map(role => (
                                <tr key={role.code} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-sm">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-800">{role.code}</span>
                                    </td>
                                    <td className="p-4 font-medium">{role.name}</td>
                                    <td className="p-4 text-sm text-gray-500">{role.description || '-'}</td>
                                    <td className="p-4 text-sm">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${role.category === 'SYSTEM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {role.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(role)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Role"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(role)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Role"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Role Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <ShieldAlert className="text-blue-600" size={20} />
                                {isEditing ? 'Edit Role' : 'Create New Role'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role Code (Unique)</label>
                                    <input
                                        className={clsx(
                                            "w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase font-mono text-sm",
                                            isEditing ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
                                        )}
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                                        disabled={isEditing}
                                        placeholder="e.g. SALES_MANAGER"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
                                    <input
                                        className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Sales Manager"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none"
                                        value={formData.description || ''}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the responsibilities for this role..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                    <select
                                        className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="SYSTEM">SYSTEM</option>
                                        <option value="USER">USER</option>
                                    </select>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Save size={18} /> {isEditing ? 'Save Changes' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, role: null })}
                onConfirm={confirmDelete}
                title="Delete Role"
                message={`Are you sure you want to delete the role "${deleteConfirm.role?.name}"? Standard roles might be required for system functionality. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

export default RoleConfig;
