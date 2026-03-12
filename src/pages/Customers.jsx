import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash, MessageSquare, X, Phone, Plus, ChevronLeft, ChevronRight, Building, Users } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import Table from '../components/Table';
import { useToast } from '../context/ToastContext';
import { useOptions } from '../context/OptionsContext';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import FloatingActionPanel from '../components/FloatingActionPanel';
import CustomerForm from '../components/CustomerForm';

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

    // Selected customer for floating action panel
    const [selectedCustomer, setSelectedCustomer] = useState(null);


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
        {
            key: 'fullName', label: 'Customer Name', render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[var(--text-primary)]">{row.fullName}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-tight">{row.email || 'No email record'}</span>
                </div>
            )
        },
        {
            key: 'phone', label: 'Phone Number', render: (row) => (
                <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                    <Phone size={14} className="text-[var(--text-muted)]" />
                    {row.phone}
                </div>
            )
        },
        {
            key: 'customerType', label: 'Type', render: (row) => (
                <span className={clsx(
                    "badge py-1 px-3 rounded-full text-[10px] font-black tracking-[0.1em] border shadow-sm",
                    row.customerType === 'Individual' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        row.customerType === 'Corporate' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                )}>
                    {row.customerType?.toUpperCase() || 'STANDARD'}
                </span>
            )
        }
    ];

    // Fetch customers when page, pageSize, or selectedBranchId changes
    useEffect(() => {
        fetchCustomers();
    }, [page, pageSize, selectedBranchId]);

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-semibold mb-2 text-[var(--text-primary)]">Customers</h1>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Manage your customer database and interaction history.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isSuperUser && (
                        <div className="search-box !w-auto">
                            <Building size={18} className="search-icon" />
                            <select
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-semibold text-[var(--text-primary)] min-w-[160px] cursor-pointer outline-none pl-10 h-10 shadow-sm"
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
                        className="btn-primary flex items-center gap-3 !py-2 !px-6"
                    >
                        <Plus size={18} /> New Customer
                    </button>
                </div>
            </div>

            {/* Collapsible Form Block */}
            {isModalOpen && (
                <div className="p-8 mb-10 relative overflow-visible animate-fade-in card">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-6 right-6 p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-muted)]"
                        title="Close"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-5 mb-10 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center text-[var(--accent)]">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                                {isViewMode ? 'Customer Profile' : (currentCustomer?.customerId ? 'Update Customer' : 'New Customer')}
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mt-1">
                                {isViewMode ? 'Comprehensive customer overview' : 'Registration of a new stakeholder entity'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-10">
                        <CustomerForm 
                            customer={currentCustomer} 
                            setCustomer={setCurrentCustomer}
                            readOnly={isViewMode}
                        />

                        <div className="flex flex-col sm:flex-row-reverse gap-4 pt-8 border-t border-[var(--border)]">
                            {!isViewMode && (
                                <button
                                    type="submit"
                                    className="btn-primary px-12 py-3 text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-[var(--accent)]/30 active:scale-95 transition-all text-white"
                                >
                                    Save Customer
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="btn-secondary px-8"
                            >
                                {isViewMode ? 'Dismiss' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            )}


            <div className="relative mb-8">
                <Table
                    columns={columns}
                    data={customers}
                    onRowClick={(customer) => setSelectedCustomer(customer)}
                    selectedRow={selectedCustomer?.customerId}
                    rowKey="customerId"
                />

                <FloatingActionPanel
                    selectedItem={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    actions={[
                        {
                            icon: Phone,
                            label: 'Call',
                            onClick: (customer) => {
                                if (customer.phone) {
                                    window.open(`tel:${customer.phone}`, '_self');
                                } else {
                                    showToast("No phone number available.", "warning");
                                }
                            },
                            color: 'green',
                            title: 'Call'
                        },
                        {
                            icon: Eye,
                            label: 'View',
                            onClick: handleView,
                            color: 'blue',
                            title: 'View'
                        },
                        {
                            icon: MessageSquare,
                            label: 'Enquiries',
                            onClick: (customer) => navigate(`/enquiries?customerId=${customer.customerId}`),
                            color: 'indigo',
                            title: 'Enquiries'
                        },
                        {
                            icon: Edit,
                            label: 'Edit',
                            onClick: handleEdit,
                            color: 'orange',
                            title: 'Edit'
                        },
                        {
                            icon: Trash,
                            label: 'Delete',
                            onClick: handleDelete,
                            color: 'red',
                            title: 'Delete'
                        }
                    ]}
                    title={selectedCustomer?.fullName}
                    subtitle={selectedCustomer?.phone}
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
                            Showing <span className="font-bold text-[var(--text-primary)]">{(page - 1) * pageSize + 1}</span> to <span className="font-bold text-[var(--text-primary)]">{Math.min(page * pageSize, totalCustomers)}</span> of <span className="font-bold text-[var(--text-primary)]">{totalCustomers}</span> results
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
                                <option value={5}>5</option>
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
        </div>
    );
};

export default Customers;
