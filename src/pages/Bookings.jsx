import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Eye, Clock, CheckCircle, Building, Phone } from 'lucide-react';
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
            label: 'Selected Car',
            key: 'selectedCar',
            render: (row) => {
                const handoverFollowUp = row.followUps?.find(f => f.followupResults === 'booking-handedover');
                if (handoverFollowUp && handoverFollowUp.car) {
                    return `${handoverFollowUp.car.make} ${handoverFollowUp.car.model} (${handoverFollowUp.car.registrationNumber})`;
                }
                return 'N/A';
            }
        },
        { label: 'Handover Date', key: 'updatedAt', render: (row) => new Date(row.updatedAt).toLocaleDateString('en-IN') }
    ];

    const activeColumns = [
        { label: 'Booking ID', key: 'id', render: (row) => row.id.substring(0, 8).toUpperCase() },
        { label: 'Customer', key: 'customer', render: (row) => row.enquiry?.customer?.fullName || 'N/A' },
        { label: 'Vehicle', key: 'vehicle', render: (row) => `${row.car?.make} ${row.car?.model}` },
        {
            label: 'Status', key: 'status', render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.status === 'completed' ? 'bg-green-100 text-green-700' :
                    row.status === 'ready_for_delivery' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {row.status.replace(/_/g, ' ')}
                </span>
            )
        },
        {
            label: 'Balance', key: 'balance', render: (row) => (
                <span className={row.balanceAmount > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                    {formatCurrency(row.balanceAmount)}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between my-4 gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign size={24} className="text-blue-600" />
                    Finance & Bookings
                </h2>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {isSuperUser && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                            <Building size={16} className="text-gray-400" />
                            <select
                                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
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
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 shadow-sm outline-none"
                        >
                            <option value="active">Active</option>
                            <option value="ready_for_delivery">Ready for Delivery</option>
                            <option value="completed">Completed</option>
                        </select>
                    )}
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border">
                        <button
                            onClick={() => setView('pending')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Clock size={18} />
                            Ready for Booking
                        </button>
                        <button
                            onClick={() => setView('active')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === 'active' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <CheckCircle size={18} />
                            Active Bookings
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden relative">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium">Loading {view} listings...</p>
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
                                    label: 'Call Customer',
                                    onClick: (row) => {
                                        const phone = row.customer?.phone;
                                        if (phone) window.open(`tel:${phone}`, '_self');
                                        else showToast("No phone number available.", "warning");
                                    },
                                    color: 'green',
                                    title: 'Call Customer'
                                },
                                {
                                    icon: DollarSign,
                                    label: 'Start Booking',
                                    onClick: (row) => openFinanceTab(row.enquiryId, row.customer?.fullName || 'New Lead'),
                                    color: 'blue',
                                    title: 'Start Booking'
                                }
                            ] : [
                                {
                                    icon: Phone,
                                    label: 'Call Customer',
                                    onClick: (row) => {
                                        const phone = row.enquiry?.customer?.phone;
                                        if (phone) window.open(`tel:${phone}`, '_self');
                                        else showToast("No phone number available.", "warning");
                                    },
                                    color: 'green',
                                    title: 'Call Customer'
                                },
                                {
                                    icon: Eye,
                                    label: 'Open Workspace',
                                    onClick: (row) => openFinanceTab(row.enquiryId, row.enquiry?.customer?.fullName || 'Booking'),
                                    color: 'blue',
                                    title: 'Open Workspace'
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
