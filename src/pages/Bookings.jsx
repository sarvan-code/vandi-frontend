import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Eye, Clock, CheckCircle, Building, Phone } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import Table from '../components/Table';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useOptions } from '../context/OptionsContext';
import { useFinanceWorkspace } from '../context/FinanceWorkspaceContext';
import FloatingActionPanel from '../components/FloatingActionPanel';

const Bookings = () => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();
    const { branches } = useOptions();
    const navigate = useNavigate();
    const { openFinanceTab } = useFinanceWorkspace();
    const [handovers, setHandovers] = useState([]);
    const [activeBookings, setActiveBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('active'); // Default to active management
    const [statusFilter, setStatusFilter] = useState('active'); // Default to active status
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(user?.role);

    // Selected booking/enquiry for floating action panel
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        fetchData();
        setSelectedItem(null); // Reset selection when view/filter changes
    }, [view, statusFilter, selectedBranchId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (view === 'pending') {
                let url = '/enquiries?status=conversion-started';
                if (selectedBranchId) {
                    url += `&branchId=${selectedBranchId}`;
                }
                const response = await api.get(url);
                setHandovers(response.data.data || response.data);
            } else {
                // Fetch bookings with status filter if present
                let url = `/bookings?status=${statusFilter}`;
                if (selectedBranchId) {
                    url += `&branchId=${selectedBranchId}`;
                }
                const response = await api.get(url);
                setActiveBookings(response.data);
            }
        } catch (error) {
            console.error('Error fetching bookings data:', error);
            showToast('Failed to fetch data', 'error');
        } finally {
            setLoading(true);
            // Simulate shorter loading for better UX if needed, but here just toggle
            setTimeout(() => setLoading(false), 300);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const pendingColumns = [
        { label: 'Customer', key: 'customer', render: (row) => row.customer?.fullName || 'N/A' },
        { label: 'Phone', key: 'phone', render: (row) => row.customer?.phone || 'N/A' },
        {
            label: 'Car',
            key: 'selectedCar',
            render: (row) => {
                const handoverFollowUp = row.followUps?.find(f => f.followupResults === 'booking-handedover');
                if (handoverFollowUp && handoverFollowUp.car) {
                    return `${handoverFollowUp.car.make} ${handoverFollowUp.car.model} (${handoverFollowUp.car.registrationNumber})`;
                }
                return 'N/A';
            }
        },
        { label: 'Date', key: 'updatedAt', render: (row) => new Date(row.updatedAt).toLocaleDateString('en-IN') }
    ];

    const activeColumns = [
        {
            label: 'Booking ID',
            key: 'id',
            render: (row) => <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">{row.id.substring(0, 8)}</span>
        },
        {
            label: 'Customer Name',
            key: 'customer',
            render: (row) => <span className="font-semibold text-[var(--text-primary)]">{row.enquiry?.customer?.fullName || 'N/A'}</span>
        },
        {
            label: 'Vehicle',
            key: 'vehicle',
            render: (row) => <span className="text-sm font-medium text-[var(--text-secondary)]">{`${row.car?.make} ${row.car?.model}`}</span>
        },
        {
            label: 'Status',
            key: 'status',
            render: (row) => (
                <span className={clsx(
                    "rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border shadow-sm",
                    row.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        row.status === 'ready_for_delivery' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                )}>
                    {row.status.replace(/_/g, ' ')}
                </span>
            )
        },
        {
            label: 'Balance Amount',
            key: 'balance',
            render: (row) => (
                <div className="flex flex-col items-end">
                    <span className={clsx("font-bold text-base", row.balanceAmount > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                        {formatCurrency(row.balanceAmount)}
                    </span>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Remaining Balance</span>
                </div>
            )
        }
    ];

    return (
        <div className="animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
                <div>
                    <h1 className="text-4xl font-semibold mb-2 text-[var(--text-primary)]">Bookings</h1>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Manage vehicle sales, payments, and delivery tracking.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isSuperUser && (
                        <div className="search-box !w-auto">
                            <Building size={18} className="search-icon" />
                            <select
                                className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-bold text-[var(--text-primary)] min-w-[160px] cursor-pointer outline-none pl-10 h-10 shadow-sm"
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.displayName}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {view === 'active' && (
                        <div className="search-box !w-auto">
                            <Clock size={18} className="search-icon" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-bold text-[var(--text-primary)] min-w-[160px] cursor-pointer outline-none pl-10 h-10 shadow-sm"
                            >
                                <option value="active">Active Bookings</option>
                                <option value="ready_for_delivery">Ready for Delivery</option>
                                <option value="completed">Completed Bookings</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub Navigation Tabs */}
            <div className="flex gap-2 p-1.5 bg-[var(--bg-secondary)] rounded-xl w-fit mb-10 border shadow-sm" style={{ borderColor: 'var(--border)' }}>
                <button
                    onClick={() => setView('pending')}
                    className={clsx(
                        "flex items-center gap-3 px-6 py-2.5 rounded-lg font-bold transition-all text-[10px] uppercase tracking-wider",
                        view === 'pending'
                            ? 'bg-[var(--accent)] text-white shadow-md'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    )}
                >
                    <Clock size={14} /> New Handovers
                </button>
                <button
                    onClick={() => setView('active')}
                    className={clsx(
                        "flex items-center gap-3 px-6 py-2.5 rounded-lg font-bold transition-all text-[10px] uppercase tracking-wider",
                        view === 'active'
                            ? 'bg-[var(--accent)] text-white shadow-md'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    )}
                >
                    <CheckCircle size={14} /> Global Bookings
                </button>
            </div>

            <div className="relative">
                {loading ? (
                    <div className="card py-20 flex flex-col items-center justify-center space-y-4">
                        <div className="w-10 h-10 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></div>
                        <p className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest">Synchronizing Records...</p>
                    </div>
                ) : (
                    <>
                        <Table
                            columns={view === 'pending' ? pendingColumns : activeColumns}
                            data={view === 'pending' ? handovers : activeBookings}
                            emptyMessage={view === 'pending' ? 'No enquiries waiting for booking.' : 'No active bookings found.'}
                            onRowClick={(row) => setSelectedItem(row)}
                            selectedRow={view === 'pending' ? selectedItem?.enquiryId : selectedItem?.id}
                            rowKey={view === 'pending' ? 'enquiryId' : 'id'}
                        />

                        <FloatingActionPanel
                            selectedItem={selectedItem}
                            onClose={() => setSelectedItem(null)}
                            title={view === 'pending' ? selectedItem?.customer?.fullName : selectedItem?.enquiry?.customer?.fullName}
                            subtitle={view === 'pending' ? selectedItem?.customer?.phone : selectedItem?.enquiry?.customer?.phone}
                            actions={view === 'pending' ? [
                                {
                                    icon: Phone,
                                    label: 'Call',
                                    onClick: (row) => {
                                        const phone = row.customer?.phone;
                                        if (phone) window.open(`tel:${phone}`, '_self');
                                        else showToast("No phone number available.", "warning");
                                    },
                                    color: 'green',
                                    title: 'Call'
                                },
                                {
                                    icon: DollarSign,
                                    label: 'Book',
                                    onClick: (row) => openFinanceTab(row.enquiryId, row.customer?.fullName || 'New Lead'),
                                    color: 'blue',
                                    title: 'Create Booking'
                                }
                            ] : [
                                {
                                    icon: Phone,
                                    label: 'Call',
                                    onClick: (row) => {
                                        const phone = row.enquiry?.customer?.phone;
                                        if (phone) window.open(`tel:${phone}`, '_self');
                                        else showToast("No phone number available.", "warning");
                                    },
                                    color: 'green',
                                    title: 'Call'
                                },
                                {
                                    icon: Eye,
                                    label: 'Finance',
                                    onClick: (row) => openFinanceTab(row.enquiryId, row.enquiry?.customer?.fullName || 'Booking'),
                                    color: 'indigo',
                                    title: 'Finance & Payments'
                                }
                            ]}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Bookings;
