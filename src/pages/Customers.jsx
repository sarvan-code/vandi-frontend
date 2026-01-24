import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Eye, Edit, Trash, MessageSquare, X } from 'lucide-react';
import api from '../api';
import Table from '../components/Table';
import { useToast } from '../context/ToastContext';
import { useOptions } from '../context/OptionsContext';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';

const Customers = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { getOptionList, branches, loading: optionsLoading } = useOptions();
    const { user } = useContext(AuthContext);
    const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(user?.role);

    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCustomers, setTotalCustomers] = useState(0);

    // Filter state for super users
    const [selectedBranchId, setSelectedBranchId] = useState('');

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, customer: null });


    // Helper to get options from context
    const getOpt = (key) => getOptionList(key);

    const fetchCustomers = async () => {
        try {
            let url = `/customers?page=${page}&pageSize=${pageSize}`;
            if (selectedBranchId) {
                url += `&branchId=${selectedBranchId}`;
            }
            const response = await api.get(url);
            // Check if response has data and meta (paginated) or just array (legacy/fallback)
            if (response.data.data && response.data.meta) {
                setCustomers(response.data.data);
                setTotalPages(response.data.meta.totalPages);
                setTotalCustomers(response.data.meta.total);
            } else {
                setCustomers(response.data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            showToast('Failed to fetch customers', 'error');
        }
    };

    const handleEdit = (customer) => {
        setCurrentCustomer(customer);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleView = (customer) => {
        setCurrentCustomer(customer);
        setIsViewMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (customer) => {
        setDeleteConfirm({ isOpen: true, customer });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.customer) return;

        try {
            await api.delete(`/customers/${deleteConfirm.customer.customerId}`);
            showToast('Customer deleted successfully', 'success');
            fetchCustomers();
        } catch (error) {
            console.error("Error deleting customer", error);
            showToast("Failed to delete customer", "error");
        } finally {
            setDeleteConfirm({ isOpen: false, customer: null });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentCustomer.customerId) {
                // Remove system fields and relations
                const { enquiries, createdAt, updatedAt, customerId, ...dataToUpdate } = currentCustomer;
                console.log(dataToUpdate);
                await api.put(`/customers/${currentCustomer.customerId}`, dataToUpdate);
            } else {
                await api.post('/customers', currentCustomer);
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (error) {
            console.error('Error saving customer:', error);
            showToast('Failed to save customer', 'error');
        }
    };

    const columns = [
        { key: 'fullName', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        {
            key: 'customerType', label: 'Type', render: (row) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.customerType === 'Customer' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {row.customerType}
                </span>
            )
        },
        {
            key: 'actions', label: 'Actions', render: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleView(row);
                        }}
                        className="text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1 rounded-md text-sm border border-gray-200"
                        title="View Details"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent row click if any
                            navigate(`/enquiries?customerId=${row.customerId}`);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md text-sm border border-indigo-200"
                    >
                        <MessageSquare size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded-md text-sm border border-blue-200"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row);
                        }}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md text-sm border border-red-200"
                    >
                        <Trash size={16} />
                    </button>
                </div>
            )
        }
    ];

    // Fetch customers when page, pageSize, or selectedBranchId changes
    useEffect(() => {
        fetchCustomers();
    }, [page, pageSize, selectedBranchId]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
                <div className="flex gap-4 items-center">
                    {isSuperUser && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Branch:</label>
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Branches</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button
                        onClick={() => { setCurrentCustomer({}); setIsViewMode(false); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add Customer
                    </button>
                </div>
            </div>

            {/* Collapsible Form Block */}
            {isModalOpen && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 relative animate-fade-in-down border-l-4 border-blue-500">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        {isViewMode ? 'Customer Details' : (currentCustomer?.customerId ? 'Edit Customer' : 'New Customer')}
                    </h2>

                    <form onSubmit={handleSave} className="space-y-4">
                        <fieldset disabled={isViewMode} className="contents">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={currentCustomer?.fullName || ''}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={currentCustomer?.phone || ''}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={currentCustomer?.email || ''}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Instagram ID</label>
                                    <input
                                        className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={currentCustomer?.instaid || ''}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, instaid: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={currentCustomer?.dateOfBirth || ''}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, dateOfBirth: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Marriage Date</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={currentCustomer?.marriageDate || ''}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, marriageDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Profession</label>
                                    <select
                                        className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={currentCustomer?.profession || ''}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, profession: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {getOpt('PROFESSIONS').map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Customer Type</label>
                                    <select
                                        className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                        value={currentCustomer?.customerType || 'Lead'}
                                        onChange={(e) => setCurrentCustomer({ ...currentCustomer, customerType: e.target.value })}
                                    >
                                        <option value="Lead">Lead</option>
                                        <option value="Customer">Customer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-2">Referral Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Referred By (Source)</label>
                                        <select
                                            className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                            value={currentCustomer?.referredBy || ''}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, referredBy: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            {getOpt('REFERRAL_SOURCES').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Referred By Name</label>
                                        <input
                                            className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                            placeholder="Name of referrer if applicable"
                                            value={currentCustomer?.referredByName || ''}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, referredByName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-2">Address & Location</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Address Line</label>
                                        <input
                                            className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                            value={currentCustomer?.address || ''}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Landmark</label>
                                        <input
                                            className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                            value={currentCustomer?.landMark || ''}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, landMark: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">District</label>
                                        <input
                                            className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                            value={currentCustomer?.district || ''}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, district: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">State</label>
                                        <input
                                            className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                            value={currentCustomer?.state || ''}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, state: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Country</label>
                                        <input
                                            className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                            value={currentCustomer?.country || ''}
                                            onChange={(e) => setCurrentCustomer({ ...currentCustomer, country: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                                <textarea
                                    className="mt-1 block w-full border p-2 rounded-md border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                    rows={3}
                                    value={currentCustomer?.remarks || ''}
                                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, remarks: e.target.value })}
                                />
                            </div>
                        </fieldset>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 bg-white"
                            >
                                {isViewMode ? 'Close' : 'Cancel'}
                            </button>
                            {!isViewMode && (
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Save Customer
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <Table columns={columns} data={customers} />

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalCustomers)}</span> of{' '}
                            <span className="font-medium">{totalCustomers}</span> results
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <label htmlFor="pageSize" className="mr-2 text-sm text-gray-700">Rows per page:</label>
                            <select
                                id="pageSize"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1); // Reset to first page on size change
                                }}
                                className="block w-full rounded-md border-gray-300 py-1.5 text-base leading-5 text-gray-900 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100"
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100"
                            >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, customer: null })}
                onConfirm={confirmDelete}
                title="Delete Customer"
                message={`Are you sure you want to delete ${deleteConfirm.customer?.fullName || 'this customer'}? This will also delete all their Enquiries and Follow-ups. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

        </div >
    );
};

export default Customers;
