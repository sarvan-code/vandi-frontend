import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Eye, Edit, Trash, Calendar, User, Phone, MapPin, Briefcase, Info, Car, Wallet, ArrowRightLeft, X, Plus } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import Table from '../components/Table';
import CustomerSearch from '../components/CustomerSearch';
import EnquirySearch from '../components/EnquirySearch';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useOptions } from '../context/OptionsContext';
import ConfirmDialog from '../components/ConfirmDialog';
import VehicleAutocomplete from '../components/VehicleAutocomplete';
import FloatingActionPanel from '../components/FloatingActionPanel';

const processEnquiryData = (rawEnquiries) => {
    if (!Array.isArray(rawEnquiries)) return [];

    return rawEnquiries.map(enquiry => ({
        ...enquiry,
        carDetailsDescription: enquiry.carDetails?.length > 0
            ? enquiry.carDetails.map(car => `${car.carBrand} - ${car.carType} - ${car.carVariant}`).join(', ')
            : 'Any'
    }));
};

const FollowUps = () => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const initialEnquiryId = queryParams.get('enquiryId');

    const [followUps, setFollowUps] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFollowUp, setCurrentFollowUp] = useState(null);

    // Options Context
    const { getOptionList, getDependentOptions } = useOptions();
    // Helper to get options
    const getOpt = (key) => getOptionList(key);

    const [filteredFollowupTypes, setFilteredFollowupTypes] = useState([]);

    // Filter state
    const [filterEnquiryId, setFilterEnquiryId] = useState(initialEnquiryId);

    // Details State
    const [enquiryDetails, setEnquiryDetails] = useState(null);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalFollowUps, setTotalFollowUps] = useState(0);

    // Search States
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerEnquiries, setCustomerEnquiries] = useState([]);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, followUp: null });

    // Selected follow-up for floating action panel
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);

    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setFilterEnquiryId(params.get('enquiryId'));
        setPage(1); // Reset to first page
    }, [location.search]);

    useEffect(() => {
        fetchFollowUps();
        if (filterEnquiryId) {
            fetchEnquiryDetails(filterEnquiryId);
        } else {
            setEnquiryDetails(null);
        }
    }, [page, pageSize, filterEnquiryId]);

    const fetchFollowUps = async () => {
        try {
            let url = `/follow-ups?page=${page}&pageSize=${pageSize}`;
            if (filterEnquiryId) {
                url += `&enquiryId=${filterEnquiryId}`;
            }
            const response = await api.get(url);
            if (response.data.data && response.data.meta) {
                setFollowUps(response.data.data);
                setTotalPages(response.data.meta.totalPages);
                setTotalFollowUps(response.data.meta.total);
            } else {
                setFollowUps(response.data);
            }
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
            // alert('Failed to fetch follow-ups');
        }
    };

    const fetchEnquiryDetails = async (id) => {
        try {
            const response = await api.get(`/enquiries/${id}`);
            if (response.data) {
                const formattedData = processEnquiryData([response.data]);
                setEnquiryDetails(...formattedData);
            }
        } catch (error) {
            console.error("Error fetching enquiry details:", error);
        }
    };

    const searchCustomers = async (searchTerm) => {
        try {
            const response = await api.get(`/customers?search=${searchTerm}`, { hideLoader: true });
            if (response.data.data) {
                setCustomers(response.data.data);
            } else {
                setCustomers([]);
            }
        } catch (error) {
            console.error('Error searching customers:', error);
        }
    };

    const handleCustomerSelect = async (customer) => {
        setSelectedCustomer(customer);
        setSelectedEnquiry(null); // Reset enquiry when customer changes
        setCustomerEnquiries([]);

        if (customer) {
            try {
                const ACTIVE_STATUSES = [
                    "new", "will-come-later", "in-price-negotiation",
                    "price-high", "price-low", "plan-postponed", "not-interested"
                ];

                const response = await api.get(`/enquiries?customerId=${customer.customerId}&pageSize=50`);
                if (response.data.data) {
                    // Filter by active statuses
                    const activeOnly = response.data.data.filter(e => ACTIVE_STATUSES.includes(e.status));
                    const formattedData = processEnquiryData(activeOnly);
                    setCustomerEnquiries(formattedData);

                    // Auto-select if only one active enquiry
                    if (formattedData.length === 1) {
                        const enq = formattedData[0];
                        setSelectedEnquiry(enq);
                        setCurrentFollowUp(prev => ({ ...prev, enquiryId: enq.enquiryId }));
                    }
                }
            } catch (error) {
                console.error("Error fetching customer enquiries", error);
            }
        }
    };

    const handleEnquirySelect = (enquiry) => {
        setSelectedEnquiry(enquiry);
        if (enquiry) {
            setCurrentFollowUp({ ...currentFollowUp, enquiryId: enquiry.enquiryId });
        } else {
            setCurrentFollowUp({ ...currentFollowUp, enquiryId: '' });
        }
    };

    const handleEdit = (followUp) => {
        // Clone to avoid mutating state directly, though not strictly necessary here since we set state fresh
        setCurrentFollowUp({ ...followUp });
        setIsViewMode(false);
        setSelectedCustomer(null);
        setSelectedEnquiry(null);
        setIsModalOpen(true);
    };

    const handleView = (followUp) => {
        setCurrentFollowUp(followUp);
        setIsViewMode(true);
        setSelectedCustomer(null);
        setSelectedEnquiry(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (followUp) => {
        setDeleteConfirm({ isOpen: true, followUp });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.followUp) return;

        try {
            await api.delete(`/follow-ups/${deleteConfirm.followUp.followUpId}`);
            showToast('Follow-up deleted successfully', 'success');
            fetchFollowUps();
        } catch (error) {
            console.error("Error deleting follow-up", error);
            showToast("Failed to delete follow-up", "error");
        } finally {
            setDeleteConfirm({ isOpen: false, followUp: null });
        }
    };

    // Dependent Options Effect
    useEffect(() => {
        if (currentFollowUp?.followupMode) {
            const types = getDependentOptions('FOLLOWUP_TYPES', 'FOLLOWUP_MODES', currentFollowUp.followupMode);
            setFilteredFollowupTypes(types || []);
        } else {
            setFilteredFollowupTypes([]);
        }
    }, [currentFollowUp?.followupMode, getDependentOptions]);


    const VEHICLE_ACTIONS = ["general-query", "inform-on-available"];
    const NEXT_VISIT_ACTIONS = ["will-come-on-available"];
    const handleSave = async (e) => {
        e.preventDefault();

        if (!currentFollowUp.enquiryId) {
            showToast("Please select an enquiry", "warning");
            return;
        }

        // Validate Follow-up fields
        if (!currentFollowUp.followupMode || !currentFollowUp?.followupType || !currentFollowUp?.followupActionDone || !currentFollowUp?.followupResults) {
            showToast("All Follow-up fields (Mode, Type, Action, and Results) are mandatory.", "warning");
            return;
        }

        const isVehicleRelated = VEHICLE_ACTIONS.includes(currentFollowUp.followupActionDone?.toLowerCase());
        if (!isVehicleRelated && !currentFollowUp.car) {
            showToast("Vehicle Number is mandatory for the selected Action.", "warning");
            return;
        }

        const isNextVisitRelated = NEXT_VISIT_ACTIONS.includes(currentFollowUp.followupResults?.toLowerCase());
        if (!isNextVisitRelated && !currentFollowUp.nextVisitDate) {
            showToast("Next Visit Date is mandatory.", "warning");
            return;
        }

        try {
            // Construct minimal payload to avoid 400 Bad Request with relations
            const payload = {
                enquiryId: currentFollowUp.enquiryId,
                agentId: currentFollowUp.agentId || user?.userId,
                followupMode: currentFollowUp.followupMode,
                followupType: currentFollowUp.followupType,
                followupActionDone: currentFollowUp.followupActionDone,
                car: currentFollowUp.car,
                followupResults: currentFollowUp.followupResults,
                nextVisitDate: currentFollowUp.nextVisitDate ? new Date(currentFollowUp.nextVisitDate).toISOString() : null,
                followupRemarks: currentFollowUp.followupRemarks,
            };

            if (currentFollowUp.followUpId) {
                // Edit Mode
                await api.put(`/follow-ups/${currentFollowUp.followUpId}`, payload);
            } else {
                // Create Mode
                if (!payload.agentId) {
                    showToast("Error: Could not determine current agent (user). Please log in again.", "error");
                    return;
                }
                await api.post('/follow-ups', payload);
            }
            setIsModalOpen(false);
            fetchFollowUps();
        } catch (error) {
            console.error('Error saving follow-up:', error);
            showToast('Failed to save follow-up. Check console for details.', 'error');
        }
    };

    const columns = [
        {
            key: 'customer',
            label: 'Stakeholder Identity',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-[var(--text-primary)]">{row.enquiry?.customer?.fullName || 'N/A'}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{row.enquiry?.customer?.phone}</span>
                </div>
            )
        },
        {
            key: 'followupMode',
            label: 'Interaction Channel',
            render: (row) => (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)]">
                    {row.followupMode}
                </span>
            )
        },
        {
            key: 'followupActionDone',
            label: 'Follow-up Action',
            render: (row) => (
                <span className="text-sm font-medium text-[var(--text-primary)]">{row.followupActionDone}</span>
            )
        },
        {
            key: 'followupResults',
            label: 'Engagement Outcome',
            render: (row) => (
                <span className={clsx(
                    "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                    row.followupResults === 'Interested' ? 'bg-emerald-100 text-emerald-700' :
                        row.followupResults === 'Pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                )}>
                    {row.followupResults || 'UNDETERMINED'}
                </span>
            )
        },
        {
            key: 'followupRemarks',
            label: 'Discussion Notes',
            render: (row) => <span className="text-xs text-[var(--text-secondary)] truncate block max-w-[200px] italic">"{row.followupRemarks}"</span>
        },
        {
            key: 'nextVisitDate',
            label: 'Next Follow-up',
            render: (row) => (
                row.nextVisitDate ? (
                    <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
                        <Calendar size={14} />
                        <span className="text-xs">{new Date(row.nextVisitDate).toLocaleDateString()}</span>
                    </div>
                ) : <span className="text-[var(--text-muted)]">—</span>
            )
        }
    ];

    return (
        <div>
            {/* Summary Details Section */}
            {enquiryDetails && (
                <div className="mb-10 animate-fade-in-up">
                    <div
                        className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] shadow-md overflow-hidden relative group"
                    >
                        <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent)]/10 group-hover:bg-[var(--accent)]/20 transition-all"></div>

                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* Client Identification */}
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                                    <div className="p-2 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)]">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Stakeholder Identity</h3>
                                        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Primary Contact & Classification</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Full Legal Name</p>
                                        <p className="text-lg font-semibold text-[var(--text-primary)]">{enquiryDetails.customer?.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Business Classification</p>
                                        <span className={clsx(
                                            "inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider",
                                            enquiryDetails.customer?.customerType === 'Customer' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        )}>
                                            {enquiryDetails.customer?.customerType || 'PROSPECT'}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Communication Channel</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-3">
                                            {enquiryDetails.customer?.phone}
                                            {enquiryDetails.customer?.altPhone && <span className="text-[var(--text-muted)] font-normal text-xs"> / {enquiryDetails.customer?.altPhone}</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Acquisition Context */}
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                                    <div className="p-2 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)]">
                                        <Car size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Acquisition Context</h3>
                                        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Requirement Profile & lifecycle</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Vehicle Match</p>
                                        <p className="text-sm font-bold text-[var(--accent)] lg:truncate" title={enquiryDetails.carDetails?.map(car => car.carModel).join(' • ')}>
                                            {enquiryDetails.carDetails && enquiryDetails.carDetails.length > 0
                                                ? enquiryDetails.carDetails.map(car => car.carModel).join(' • ')
                                                : 'UNSPECIFIED ASSET'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Current Lifecycle</p>
                                        <span className={clsx(
                                            "inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider",
                                            enquiryDetails.status === 'new' ? 'bg-indigo-100 text-indigo-700' :
                                                enquiryDetails.status === 'purchased' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                        )}>
                                            {enquiryDetails.status?.replace(/-/g, ' ')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Allocated Budget</p>
                                        <p className="text-sm font-bold">{enquiryDetails.budgetRange || 'OPEN BUDGET'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-8 animate-fade-in">
                <div>
                    <h1 className="text-4xl font-semibold mb-2 text-[var(--text-primary)]">Follow-ups</h1>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Traceable communication logs and customer engagement history.</p>
                </div>

                <div className="flex items-center gap-3">
                    {filterEnquiryId && (
                        <button
                            onClick={() => navigate('/follow-ups')}
                            className="btn-secondary px-6"
                        >
                            Global View
                        </button>
                    )}
                    <button
                        onClick={() => {
                            const newFollowUp = {};
                            if (filterEnquiryId && enquiryDetails) {
                                if (enquiryDetails.customer) {
                                    setSelectedCustomer(enquiryDetails.customer);
                                }
                                setSelectedEnquiry(enquiryDetails);
                                newFollowUp.enquiryId = enquiryDetails.enquiryId;
                            } else {
                                setSelectedCustomer(null);
                                setSelectedEnquiry(null);
                            }
                            setCurrentFollowUp(newFollowUp);
                            setIsViewMode(false);
                            setIsModalOpen(true);
                        }}
                        className="btn-primary flex items-center gap-3 !py-2 !px-6"
                    >
                        <Plus size={18} /> New Interaction
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <div className="mb-12 animate-fade-in-up">
                    <div className="bg-[var(--surface)] p-1 rounded-[2.5rem] shadow-2xl border border-[var(--border)] overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent)] transition-all"></div>
                        <div className="p-8 space-y-10">
                            <div className="flex justify-between items-start pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                                        {isViewMode ? 'Interaction Details' : (currentFollowUp?.followUpId ? 'Update Interaction' : 'New Interaction')}
                                    </h2>
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-1">Logged communication and engagement outcomes</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-muted)]"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-8">
                                <fieldset disabled={isViewMode} className="contents">
                                    {/* Enquiry Selection */}
                                    {!currentFollowUp?.followUpId && !isViewMode && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-[var(--bg-tertiary)] rounded-lg border shadow-sm" style={{ borderColor: 'var(--border)' }}>
                                            <div className="space-y-3">
                                                <label className="form-label">Select Customer</label>
                                                <CustomerSearch
                                                    customers={customers}
                                                    onSearch={searchCustomers}
                                                    onSelect={handleCustomerSelect}
                                                    selectedCustomer={selectedCustomer}
                                                    disabled={!!filterEnquiryId}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="form-label">Select Enquiry</label>
                                                <EnquirySearch
                                                    enquiries={filterEnquiryId ? [enquiryDetails] : customerEnquiries}
                                                    onSelect={handleEnquirySelect}
                                                    selectedEnquiry={selectedEnquiry}
                                                    disabled={!selectedCustomer || !!filterEnquiryId}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(currentFollowUp?.followUpId || isViewMode) && (
                                        <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-3xl gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-[var(--accent)] text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-[var(--accent)]/20">
                                                    {currentFollowUp.enquiry?.customer?.fullName?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-2">Authenticated Stakeholder</p>
                                                    <h4 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] leading-none">{currentFollowUp.enquiry?.customer?.fullName || 'UNREGISTERED'}</h4>
                                                    <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">{currentFollowUp.enquiry?.customer?.phone}</p>
                                                </div>
                                            </div>
                                            <div className="md:text-right px-6 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1">Portfolio Lifecycle</p>
                                                <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
                                                    {currentFollowUp.enquiry?.status || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="form-label">Interaction Mode <span className="text-red-500">*</span></label>
                                            <select
                                                className="input-field"
                                                value={currentFollowUp?.followupMode || ''}
                                                onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupMode: e.target.value })}
                                            >
                                                <option value="">Select Mode...</option>
                                                {getOpt('FOLLOWUP_MODES').map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="form-label">Interaction Type <span className="text-red-500">*</span></label>
                                            <select
                                                className="input-field disabled:opacity-50"
                                                value={currentFollowUp?.followupType || ''}
                                                onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupType: e.target.value })}
                                                disabled={!currentFollowUp?.followupMode}
                                            >
                                                <option value="">{currentFollowUp?.followupMode ? 'Select Type...' : 'Select Mode First...'}</option>
                                                {filteredFollowupTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="form-label">Action Performed <span className="text-red-500">*</span></label>
                                            <select
                                                className="input-field"
                                                value={currentFollowUp?.followupActionDone || ''}
                                                onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupActionDone: e.target.value })}
                                            >
                                                <option value="">Select Action...</option>
                                                {getOpt('FOLLOWUP_ACTIONS').map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="form-label">
                                                Vehicle Number {VEHICLE_ACTIONS.includes(currentFollowUp?.followupActionDone?.toLowerCase()) ? <span className="text-[var(--text-muted)] font-normal font-sans ml-1">(Optional)</span> : <span className="text-red-500">*</span>}
                                            </label>
                                            <VehicleAutocomplete
                                                className="!mt-0"
                                                placeholder="Search by registration number..."
                                                value={currentFollowUp?.car?.registrationNumber || ''}
                                                onChange={(car) => setCurrentFollowUp({ ...currentFollowUp, car: car || null })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <label className="form-label">Follow-up Result <span className="text-red-500">*</span></label>
                                            <select
                                                className="input-field"
                                                value={currentFollowUp?.followupResults || ''}
                                                onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupResults: e.target.value })}
                                            >
                                                <option value="">Select Result...</option>
                                                {getOpt('FOLLOWUP_RESULTS').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="form-label">Next Visit/Follow-up Date
                                                {NEXT_VISIT_ACTIONS.includes(currentFollowUp?.followupResults?.toLowerCase()) ? <span className="text-[var(--text-muted)] font-normal font-sans ml-1">(Optional)</span> : <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="input-field"
                                                min={getMinDateTime()}
                                                value={currentFollowUp?.nextVisitDate ? new Date(currentFollowUp.nextVisitDate).toISOString().slice(0, 16) : ''}
                                                onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, nextVisitDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="form-label">Interaction Remarks</label>
                                            <textarea
                                                className="input-field min-h-[42px] py-2 resize-none"
                                                placeholder="Key discussion points..."
                                                value={currentFollowUp?.followupRemarks || ''}
                                                onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupRemarks: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </fieldset>

                                <div className="flex justify-end gap-5 pt-10 border-t border-[var(--border)]">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-8 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-all shadow-sm"
                                    >
                                        {isViewMode ? 'Exit Transcript' : 'Discard Record'}
                                    </button>
                                    {!isViewMode && (
                                        <button
                                            type="submit"
                                            className="btn-primary px-10 py-3 shadow-lg shadow-[var(--accent)]/20"
                                        >
                                            Authenticate & Save Record
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative">
                <Table
                    columns={columns}
                    data={followUps}
                    onRowClick={(followUp) => setSelectedFollowUp(followUp)}
                    selectedRow={selectedFollowUp?.followUpId}
                    rowKey="followUpId"
                />

                <FloatingActionPanel
                    selectedItem={selectedFollowUp}
                    onClose={() => setSelectedFollowUp(null)}
                    title={selectedFollowUp?.enquiry?.customer?.fullName}
                    subtitle={selectedFollowUp?.enquiry?.customer?.phone}
                    actions={[
                        {
                            icon: Phone,
                            label: 'Call Customer',
                            onClick: (row) => {
                                const phone = row.enquiry?.customer?.phone;
                                if (phone) {
                                    window.open(`tel:${phone}`, '_self');
                                } else {
                                    showToast("No phone number available.", "warning");
                                }
                            },
                            color: 'green',
                            title: 'Call Customer'
                        },
                        {
                            icon: Eye,
                            label: 'View Details',
                            onClick: handleView,
                            color: 'gray',
                            title: 'View Details'
                        },
                        {
                            icon: Edit,
                            label: 'Edit Follow-up',
                            onClick: handleEdit,
                            color: 'blue',
                            title: 'Edit Follow-up'
                        },
                        {
                            icon: Briefcase,
                            label: 'View Enquiry',
                            onClick: (row) => navigate(`/enquiries?enquiryId=${row.enquiryId}`),
                            color: 'indigo',
                            title: 'Go to Enquiry Page'
                        },
                        {
                            icon: Trash,
                            label: 'Delete Follow-up',
                            onClick: handleDelete,
                            color: 'red',
                            title: 'Delete Follow-up'
                        }
                    ]}
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
                            Showing <span className="font-bold text-[var(--text-primary)]">{(page - 1) * pageSize + 1}</span> to <span className="font-bold text-[var(--text-primary)]">{Math.min(page * pageSize, totalFollowUps)}</span> of <span className="font-bold text-[var(--text-primary)]">{totalFollowUps}</span> results
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <label htmlFor="pageSize" className="text-xs font-medium text-[var(--text-secondary)]">Rows per page:</label>
                            <select
                                id="pageSize"
                                value={pageSize || 10}
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
                                <ChevronDown size={16} className="rotate-90" />
                            </button>
                            <div className="text-xs font-bold text-[var(--text-primary)] px-2">
                                {page} / {totalPages}
                            </div>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-md border border-[var(--border)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 transition-colors"
                            >
                                <ChevronDown size={16} className="-rotate-90" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, followUp: null })}
                onConfirm={confirmDelete}
                title="Delete Follow-up"
                message="Are you sure you want to delete this follow-up? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

        </div >
    );
};


export default FollowUps;
