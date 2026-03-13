import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash, X, Plus, Calendar, Building, Briefcase, ClipboardList, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import Table from '../components/Table';
import CustomerSearch from '../components/CustomerSearch';
import CustomerProfile from '../components/CustomerProfile';
import EnquirySnapshot from '../components/EnquirySnapshot';
import { useToast } from '../context/ToastContext';
import { useOptions } from '../context/OptionsContext';
import { AuthContext } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import ConfirmDialog from '../components/ConfirmDialog';
import FloatingActionPanel from '../components/FloatingActionPanel';


const Enquiries = () => {
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const initialCustomerId = queryParams.get('customerId');
    const { getOptionList, vehicleBrands, vehicleTypes, vehicleModels, vehicleVariants, branches, loading: optionsLoading } = useOptions();
    const { user } = useContext(AuthContext);
    const { openWorkspaceWithEnquiry } = useWorkspace();
    const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(user?.role);


    const [enquiries, setEnquiries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isViewMode, setIsViewMode] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Branch state
    const [selectedBranchId, setSelectedBranchId] = useState('');

    // Initialize enquiry state with all fields to avoid undefined errors
    const [currentEnquiry, setCurrentEnquiry] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Filter state
    const [filterCustomerId, setFilterCustomerId] = useState(initialCustomerId);
    const [selectedStatus, setSelectedStatus] = useState('new');
    const [selectedAssignedToUserId, setSelectedAssignedToUserId] = useState('');
    const [assignableUsers, setAssignableUsers] = useState([]);

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, enquiry: null });

    // Selected enquiry for floating action panel
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    // Customer Profile Detail State
    const [customerProfile, setCustomerProfile] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEnquiries, setTotalEnquiries] = useState(0);
    
    // Quick add customer state
    const [lastTypedSearch, setLastTypedSearch] = useState('');
    const [quickAddFullName, setQuickAddFullName] = useState('');
    const [isQuickSaving, setIsQuickSaving] = useState(false);

    // Update filter when URL changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setFilterCustomerId(params.get('customerId'));
        setPage(1); // Reset to first page on filter change
    }, [location.search]);

    useEffect(() => {
        fetchEnquiries();
        fetchAssignableUsers();
        if (filterCustomerId) {
            setIsEditMode(true);
            setCurrentEnquiry(null);
            fetchCustomerProfile(filterCustomerId);
        } else {
            setCustomerProfile(null);
        }
    }, [page, pageSize, filterCustomerId, selectedBranchId, selectedStatus, selectedAssignedToUserId, isSuperUser]);

    const fetchBranches = null; // Removed in favor of OptionsContext

    // Helper for options
    const getOpt = (key) => getOptionList(key);

    const fetchEnquiries = async () => {
        try {
            let url = `/enquiries?page=${page}&pageSize=${pageSize}`;
            if (filterCustomerId) {
                url += `&customerId=${filterCustomerId}`;
            }
            if (selectedBranchId) {
                url += `&branchId=${selectedBranchId}`;
            }
            if (selectedStatus) {
                url += `&status=${selectedStatus}`;
            }
            if (selectedAssignedToUserId) {
                url += `&assignedToUserId=${selectedAssignedToUserId}`;
            }
            const response = await api.get(url);
            if (response.data.data && response.data.meta) {
                setEnquiries(response.data.data);
                setTotalPages(response.data.meta.totalPages);
                setTotalEnquiries(response.data.meta.total);
            } else {
                setEnquiries(response.data);
            }
        } catch (error) {
            console.error('Error fetching enquiries:', error);
        }
    };

    const fetchAssignableUsers = async () => {
        try {
            const response = await api.get('/users/assignable');
            setAssignableUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch assignable users", error);
        }
    };

    const fetchCustomerProfile = async (id) => {
        try {
            const response = await api.get(`/customers/${id}`);
            setCustomerProfile(response.data);
        } catch (error) {
            console.error("Error fetching customer profile:", error);
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

    const handleQuickAddCustomer = async () => {
        if (!quickAddFullName || !lastTypedSearch) {
            showToast("Please provide both name and phone number.", "warning");
            return;
        }

        setIsQuickSaving(true);
        try {
            const response = await api.post('/customers', {
                fullName: quickAddFullName,
                phone: lastTypedSearch,
                customerType: 'Individual' // Default for quick add
            });
            const newCustomer = response.data;
            showToast('Customer created and selected!', 'success');
            
            // Auto-select the new customer
            handleCustomerSelect(newCustomer);
            
            // Clear quick add state
            setQuickAddFullName('');
        } catch (error) {
            console.error('Error quick adding customer:', error);
            showToast(error.response?.data?.error || 'Failed to quick add customer', 'error');
        } finally {
            setIsQuickSaving(false);
        }
    };

    const handleEdit = (enquiry) => {
        // Ensure carDetails is an array and fields exist
        setCurrentEnquiry({
            ...enquiry,
            carDetails: enquiry.carDetails || [],
            exchange: enquiry.exchange || false,
        });
        setIsViewMode(false);
        if (enquiry.customer) {
            setSelectedCustomer(enquiry.customer);
        } else {
            setSelectedCustomer(null);
        }
        setIsEditMode(true);
    };

    const handleView = (enquiry) => {
        setCurrentEnquiry({
            ...enquiry,
            carDetails: enquiry.carDetails || [],
            exchange: enquiry.exchange || false,
        });
        if (enquiry.customer) {
            setSelectedCustomer(enquiry.customer);
        }
        setIsViewMode(true);
        setIsEditMode(false);
    };

    const closeEnquiryBlock = () => {
        setCurrentEnquiry(null);
        setIsViewMode(false);
        setIsEditMode(false);
        setSelectedCustomer(null);
        if (filterCustomerId) {
            navigate('/enquiries');
        }
    };

    const handleDelete = async (enquiry) => {
        setDeleteConfirm({ isOpen: true, enquiry });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.enquiry) return;

        try {
            await api.delete(`/enquiries/${deleteConfirm.enquiry.enquiryId}`);
            showToast('Enquiry deleted successfully', 'success');
            fetchEnquiries();
        } catch (error) {
            console.error("Error deleting enquiry", error);
            showToast("Failed to delete enquiry", "error");
        } finally {
            setDeleteConfirm({ isOpen: false, enquiry: null });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!currentEnquiry.customerId) {
            showToast("Please select a customer", "warning");
            return;
        }

        // Validate Enquiry Vehicles
        if (!currentEnquiry.carDetails || currentEnquiry.carDetails.length === 0) {
            showToast("At least one set of Vehicle Details is mandatory.", "warning");
            return;
        }
        const hasValidCar = currentEnquiry.carDetails.some(car => car.carType && car.carBrand);
        if (!hasValidCar) {
            showToast("Please provide at least one valid Vehicle (Brand and Type).", "warning");
            return;
        }

        try {
            const dataToSave = {
                ...currentEnquiry,
                // Ensure carDetails are properly structured if changed
                carDetails: currentEnquiry.carDetails.map(({ carType, carBrand, carModel, carVariant }) => ({
                    carType, carBrand, carModel, carVariant
                })),
                // nextVisitDate is read-only in Enquiry, only feed through Follow-ups, but rename column
            };

            // Remove read-only relational fields before sending
            delete dataToSave.customer;
            delete dataToSave.followUps;
            delete dataToSave.createdAt;
            delete dataToSave.updatedAt;

            if (currentEnquiry.enquiryId) {
                await api.put(`/enquiries/${currentEnquiry.enquiryId}`, dataToSave);
            } else {
                await api.post('/enquiries', dataToSave);
            }
            setIsEditMode(false);
            fetchEnquiries();
        } catch (error) {
            console.error('Error saving enquiry:', error);
            showToast('Failed to save enquiry', 'error');
        }
    };

    const handleCustomerSelect = async (customer) => {
        setSelectedCustomer(customer);
        if (customer) {
            // Check for active enquiry
            if (!currentEnquiry.enquiryId) {
                try {
                    const ACTIVE_STATUSES = [
                        "new", "in-followup"
                    ];

                    const res = await api.get('/enquiries', {
                        params: { customerId: customer.customerId }
                    });

                    const enquiries = res.data.data || res.data || [];
                    const active = enquiries.find(e => ACTIVE_STATUSES.includes(e.status));

                    if (active) {
                        showToast(`This customer already has an active enquiry(Status: ${active.status}).Loading it...`, "info");
                        setCurrentEnquiry({
                            ...active,
                            carDetails: active.carDetails || [],
                            exchange: active.exchange || false,
                        });
                        return;
                    }
                } catch (error) {
                    console.error("Validation check failed", error);
                }
            }

            setCurrentEnquiry({ ...currentEnquiry, customerId: customer.customerId });
        } else {
            setCurrentEnquiry({ ...currentEnquiry, customerId: '' });
        }
    };

    const columns = [
        {
            key: 'customer', label: 'Customer', render: (row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-[var(--text-primary)]">{row.customer?.fullName || 'N/A'}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">{row.customer?.phone}</span>
                </div>
            )
        },
        {
            key: 'carDetails', label: 'Interested Vehicles',
            render: (row) => {
                if (!row.carDetails || row.carDetails.length === 0) return <span className="text-[var(--text-muted)] italic">General Interest</span>;
                const first = row.carDetails[0];
                const more = row.carDetails.length > 1 ? ` + ${row.carDetails.length - 1} more` : '';
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-[var(--text-primary)]">
                            {first.carBrand} {first.carModel}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                            {first.carVariant}{more} {row.carDetailRemarks}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'assignedTo', label: 'Assigned To',
            render: (row) => {
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-[var(--text-primary)]">{row.assignedTo?.fullName || 'N/A'}</span>
                    </div>
                )
            }
        },
        {
            key: 'lastFollowUp', label: 'Last Follow-up',
            render: (row) => {
                if (!row.followUps || row.followUps.length === 0) return <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">No Activity</span>;
                const last = row.followUps[0];
                return (
                    <div className="text-[10px] space-y-0.5">
                        <div className="font-bold text-[var(--text-primary)] uppercase tracking-tight">{last.agent?.fullName || 'Unknown'}</div>
                        <div className="text-[var(--text-secondary)] truncate max-w-[150px]" title={`${last.followupActionDone} (${last.followupResults})`}>
                            {last.followupActionDone}
                        </div>

                    </div>
                )
            }
        },
        {
            key: 'nextVisitDate',
            label: 'Next Follow-up',
            render: (row) => {
                if (!row.followUps || row.followUps.length === 0) return <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">No Activity</span>;
                const last = row.followUps[0];
                return last.nextVisitDate ? (
                    <div className="text-[10px] space-y-0.5">
                        <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
                            <span className="text-xs">{row.nextVisitDate ? new Date(row.nextVisitDate).toLocaleDateString() + ' ' + new Date(row.nextVisitDate).toLocaleTimeString() : '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[var(--text-muted)] font-semibold">{new Date(last.createdAt).toLocaleDateString()}</span>
                            {last.car?.registrationNumber && <span className="text-[var(--success)] font-bold">{last.car.registrationNumber}</span>}
                        </div>
                    </div>
                ) : <span className="text-[var(--text-muted)]">—</span>
            }
        },
        { key: 'createdAt', label: 'Added Date', render: (row) => <span className="text-[10px] font-medium text-[var(--text-muted)]">{new Date(row.createdAt).toLocaleDateString()}</span> }
    ];

    return (
        <div className="animate-fade-in">
            {(isViewMode || isEditMode) && (
                <div id="modal-container" className="mb-12 animate-fade-in space-y-8 scroll-mt-20">
                    {/* Enquiry Intake/Summary Block */}
                    {currentEnquiry && (
                        <div className="card p-4 md:p-8 border border-[var(--border)] shadow-xl relative overflow-visible animate-fade-in">
                            <button
                                onClick={closeEnquiryBlock}
                                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-muted)]"
                                title="Close"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ background: 'var(--accent)' }}>
                                        <ClipboardList size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                            {isViewMode ? 'Enquiry Details' : (currentEnquiry?.enquiryId ? 'Update Enquiry' : 'New Enquiry')}
                                        </h2>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            {isViewMode ? 'See enquiry details' : 'Enter car and customer details'}
                                        </p>
                                    </div>
                                </div>
                                {(isViewMode || currentEnquiry?.enquiryId) && (
                                    <div className="sm:ml-auto flex gap-6 text-[10px] font-bold uppercase tracking-wider">
                                        <div className="text-right">
                                            <div className="text-[var(--text-muted)] mb-0.5">Created By</div>
                                            <div className="text-[var(--text-primary)]">{currentEnquiry?.createdBy?.fullName || '—'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[var(--text-muted)] mb-0.5">Assigned To</div>
                                            <div className="text-[var(--accent)]">{currentEnquiry?.assignedTo?.fullName || '—'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isViewMode ? (
                                <>
                                    <div className="rounded-2xl p-6 mb-6 bg-[var(--bg-tertiary)] border border-[var(--border)]">
                                        <EnquirySnapshot
                                            enquiry={currentEnquiry}
                                            customer={selectedCustomer || customerProfile}
                                            getOptionList={getOptionList}
                                            showCustomer={false}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-6 border-t border-[var(--border)]">
                                        <button
                                            type="button"
                                            onClick={closeEnquiryBlock}
                                            className="btn-secondary px-8"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleSave} className="space-y-10">
                                    <fieldset disabled={isViewMode} className="contents text-left">
                                        {/* 1. Customer Selection */}
                                        <div className="p-6 rounded-lg mb-8 bg-[var(--bg-tertiary)] border" style={{ borderColor: 'var(--border)' }}>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                <div className="flex-grow">
                                                    <label className="form-label mb-3 block">Select Customer</label>
                                                    <CustomerSearch
                                                        customers={customers}
                                                        onSearch={searchCustomers}
                                                        onSelect={handleCustomerSelect}
                                                        onSearchTermChange={setLastTypedSearch}
                                                        selectedCustomer={selectedCustomer || customerProfile}
                                                        disabled={!!currentEnquiry?.enquiryId || isViewMode || (!!filterCustomerId && !currentEnquiry?.enquiryId)}
                                                    />
                                                </div>
                                                
                                                {/* Quick Add Form or Customer Name Display */}
                                                {!selectedCustomer && !customerProfile && lastTypedSearch.length >= 3 && customers.length === 0 && !currentEnquiry?.enquiryId && !isViewMode ? (
                                                    <div className="flex flex-col md:flex-row items-end gap-3 animate-fade-in-up">
                                                        <div className="flex-grow">
                                                            <label className="form-label mb-2 block text-[10px] uppercase">New Customer Name</label>
                                                            <input
                                                                type="text"
                                                                className="input-field h-10 font-bold"
                                                                placeholder="Enter Full Name..."
                                                                value={quickAddFullName}
                                                                onChange={(e) => setQuickAddFullName(e.target.value)}
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleQuickAddCustomer}
                                                            disabled={isQuickSaving || !quickAddFullName}
                                                            className="btn-primary !h-10 !py-0 px-6 flex items-center gap-2 whitespace-nowrap"
                                                        >
                                                            {isQuickSaving ? (
                                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                            ) : (
                                                                <>Quick Save</>
                                                            )}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    (currentEnquiry?.enquiryId || selectedCustomer || customerProfile) && (
                                                        <div className="text-right">
                                                            <label className="form-label mb-2 block">Customer Name</label>
                                                            <p className="text-sm font-bold px-4 py-2 rounded-md border shadow-sm" style={{ color: 'var(--text-primary)', background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                                                {selectedCustomer?.fullName || customerProfile?.fullName || currentEnquiry?.customer?.fullName || '—'}
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* 2. Basic Enquiry Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                                            <div>
                                                <label className="form-label mb-3 block">Enquiry Type</label>
                                                <div className="flex gap-4 p-1 bg-[var(--bg-tertiary)] rounded-md border" style={{ borderColor: 'var(--border)' }}>
                                                    {['Buy', 'Sell'].map(type => (
                                                        <label key={type} className={clsx(
                                                            "flex-1 flex items-center justify-center gap-3 py-2 rounded cursor-pointer transition-all font-bold text-sm",
                                                            currentEnquiry?.enquiryType === type
                                                                ? 'bg-[var(--bg-secondary)] text-[var(--accent)] shadow-sm'
                                                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                                        )}>
                                                            <input
                                                                type="radio" name="enquiryType" value={type}
                                                                checked={currentEnquiry?.enquiryType === type}
                                                                onChange={e => setCurrentEnquiry({ ...currentEnquiry, enquiryType: e.target.value })}
                                                                className="sr-only"
                                                            />
                                                            {type === 'Buy' ? <Plus size={16} /> : <Eye size={16} />}
                                                            {type === 'Buy' ? 'Buy' : 'Sell'}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="form-label mb-3 block">Enquiry Status</label>
                                                <div className="input-field h-10 flex items-center justify-center font-bold text-center capitalize bg-[var(--bg-tertiary)] cursor-not-allowed">
                                                    {currentEnquiry?.status || 'new'}
                                                </div>
                                            </div>

                                            {(!currentEnquiry?.enquiryId || (['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE', 'SALES_MGR'].includes(user?.role))) && (
                                                <div className="md:col-span-2">
                                                    <label className="form-label mb-3 block">Assigned To</label>
                                                    <select
                                                        className="input-field h-10 font-bold shadow-sm"
                                                        value={currentEnquiry?.assignedToUserId || ''}
                                                        onChange={e => setCurrentEnquiry({ ...currentEnquiry, assignedToUserId: e.target.value })}
                                                    >
                                                        <option value="">Select Assignee</option>
                                                        {assignableUsers.map(u => (
                                                            <option key={u.userId} value={u.userId}>
                                                                {u.fullName} {u.role ? `(${u.role})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="text-[10px] text-[var(--text-muted)] mt-2 italic font-medium">
                                                        Assign this enquiry to a specific sales representative.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. Vehicle Requirements */}
                                        <div className="p-6 rounded-lg mb-10 bg-[var(--bg-tertiary)] border" style={{ borderColor: 'var(--border)' }}>
                                            <div className="flex justify-between items-center mb-8">
                                                <div>
                                                    <label className="form-label block !mb-1">Vehicle Details</label>
                                                    <p className="text-[10px] text-[var(--text-muted)] font-medium italic">Brand, Model, and Variant preferences</p>
                                                </div>
                                                {!isViewMode && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const mk = [...(currentEnquiry.carDetails || [])];
                                                            mk.push({ carType: '', carBrand: '', carModel: '', carVariant: '' });
                                                            setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                        }}
                                                        className="btn-primary text-xs"
                                                    >
                                                        <Plus size={14} /> Add Vehicle
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-6">
                                                {(currentEnquiry.carDetails || []).map((car, idx) => {
                                                    const typeTerm = (car.carType || '').trim().toLowerCase();
                                                    const selectedTypeObj = vehicleTypes.find(t => t.name.toLowerCase() === typeTerm);

                                                    const brandTerm = (car.carBrand || '').trim().toLowerCase();
                                                    const selectedBrandObj = vehicleBrands.find(b => {
                                                        if (!brandTerm) return false;
                                                        const bn = b.name.toLowerCase();
                                                        return bn === brandTerm || bn.includes(brandTerm) || brandTerm.includes(bn);
                                                    });

                                                    const typesForBrand = selectedBrandObj
                                                        ? new Set(vehicleModels.filter(m => m.brandId === selectedBrandObj.id).map(m => m.typeId))
                                                        : null;
                                                    const availableTypes = typesForBrand
                                                        ? vehicleTypes.filter(t => typesForBrand.has(t.id))
                                                        : vehicleTypes;

                                                    const filteredModels = vehicleModels.filter(m => {
                                                        if (!selectedBrandObj || !selectedTypeObj) return false;
                                                        return m.brandId === selectedBrandObj.id && m.typeId === selectedTypeObj.id;
                                                    });

                                                    const modelTerm = (car.carModel || '').trim().toLowerCase();
                                                    const selectedModelObj = filteredModels.find(m => {
                                                        if (!modelTerm) return false;
                                                        const mn = m.name.toLowerCase();
                                                        return mn === modelTerm;
                                                    });

                                                    const filteredVariants = vehicleVariants.filter(v => {
                                                        if (!selectedModelObj) return false;
                                                        return v.modelId === selectedModelObj.id;
                                                    });

                                                    const variantTerm = (car.carVariant || '').trim().toLowerCase();
                                                    const selectedVariantObj = filteredVariants.find(v => {
                                                        if (!variantTerm) return false;
                                                        const vn = v.name.toLowerCase();
                                                        return vn === variantTerm;
                                                    });

                                                    return (
                                                        <div key={idx} className="card p-4 flex flex-wrap md:flex-nowrap gap-4 items-center bg-[var(--bg-secondary)] border shadow-sm" style={{ borderColor: 'var(--border)' }}>
                                                            <div className="flex-1 min-w-[150px]">
                                                                <select className="input-field text-xs h-9 py-0 font-semibold"
                                                                    value={selectedBrandObj?.name || car.carBrand || ''}
                                                                    onChange={e => {
                                                                        const mk = [...currentEnquiry.carDetails];
                                                                        mk[idx].carBrand = e.target.value;
                                                                        mk[idx].carType = '';
                                                                        mk[idx].carModel = '';
                                                                        mk[idx].carVariant = '';
                                                                        setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                                    }}>
                                                                    <option value="">Select Brand</option>
                                                                    {vehicleBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="flex-1 min-w-[150px]">
                                                                <select className="input-field text-xs h-9 py-0 font-semibold"
                                                                    value={selectedTypeObj?.name || car.carType || ''}
                                                                    onChange={e => {
                                                                        const mk = [...currentEnquiry.carDetails];
                                                                        mk[idx].carType = e.target.value;
                                                                        mk[idx].carModel = '';
                                                                        mk[idx].carVariant = '';
                                                                        setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                                    }}>
                                                                    <option value="">Body Type</option>
                                                                    {availableTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="flex-1 min-w-[150px]">
                                                                <select className="input-field text-xs h-9 py-0 font-semibold"
                                                                    value={selectedModelObj?.name || car.carModel || ''}
                                                                    onChange={e => {
                                                                        const mk = [...currentEnquiry.carDetails];
                                                                        mk[idx].carModel = e.target.value;
                                                                        mk[idx].carVariant = '';
                                                                        setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                                    }}>
                                                                    <option value="">Technical Model</option>
                                                                    {filteredModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="flex-1 min-w-[150px]">
                                                                <select className="input-field text-xs h-9 py-0 font-semibold"
                                                                    value={selectedVariantObj?.name || car.carVariant || ''}
                                                                    onChange={e => {
                                                                        const mk = [...currentEnquiry.carDetails]; mk[idx].carVariant = e.target.value; setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                                    }}>
                                                                    <option value="">Technical Specification</option>
                                                                    {filteredVariants.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                                                </select>
                                                            </div>

                                                            {!isViewMode && (
                                                                <button type="button" onClick={() => {
                                                                    const mk = currentEnquiry.carDetails.filter((_, i) => i !== idx);
                                                                    setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                                }} className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors"><Trash size={16} /></button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-10">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3 block">Remarks</label>
                                                <textarea
                                                    className="input-field min-h-[100px] p-4 text-sm font-medium"
                                                    placeholder="Capture additional context or specific customization requests..."
                                                    value={currentEnquiry.carDetailRemarks || ''}
                                                    onChange={e => setCurrentEnquiry({ ...currentEnquiry, carDetailRemarks: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* 4. Financial Parameters */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
                                            <div>
                                                <label className="form-label mb-3 block">Budget Range</label>
                                                <select
                                                    className="input-field h-10 cursor-pointer font-semibold shadow-sm"
                                                    value={currentEnquiry?.budgetRange || ''}
                                                    onChange={(e) => setCurrentEnquiry({ ...currentEnquiry, budgetRange: e.target.value })}
                                                >
                                                    <option value="">Select Range</option>
                                                    {getOpt('BUDGET_RANGES').map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="form-label">Budget Notes</label>
                                                <input
                                                    className="input-field"
                                                    placeholder="Flexible budget, loan needed..."
                                                    value={currentEnquiry?.budgetRemarks || ''}
                                                    onChange={e => setCurrentEnquiry({ ...currentEnquiry, budgetRemarks: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label">Fuel Preference</label>
                                                <select
                                                    className="input-field cursor-pointer"
                                                    value={currentEnquiry?.fuelType || ''}
                                                    onChange={(e) => setCurrentEnquiry({ ...currentEnquiry, fuelType: e.target.value })}
                                                >
                                                    <option value="">Select Fuel</option>
                                                    {getOpt('FUEL_TYPES').map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="form-label">Usage Purpose</label>
                                                <select
                                                    className="input-field cursor-pointer"
                                                    value={currentEnquiry?.usageType || ''}
                                                    onChange={(e) => setCurrentEnquiry({ ...currentEnquiry, usageType: e.target.value })}
                                                >
                                                    <option value="">Select Usage</option>
                                                    {getOpt('USAGE_TYPES').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="form-label">Payment Method</label>
                                                <select
                                                    className="input-field cursor-pointer"
                                                    value={currentEnquiry?.payment || ''}
                                                    onChange={(e) => setCurrentEnquiry({ ...currentEnquiry, payment: e.target.value })}
                                                >
                                                    <option value="">Select Payment</option>
                                                    {getOpt('PAYMENT_MODES').map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                                            <div className="flex items-center gap-4">
                                                <div
                                                    onClick={() => setCurrentEnquiry({ ...currentEnquiry, exchange: !currentEnquiry.exchange })}
                                                    className={`
                                                        w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300
                                                        ${currentEnquiry.exchange ? 'bg-indigo-600' : 'bg-slate-300'}
                                                    `}
                                                >
                                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 transform ${currentEnquiry.exchange ? 'translate-x-6' : ''}`}></div>
                                                </div>
                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Exchange Vehicle Included?</span>
                                            </div>
                                            {currentEnquiry.exchange && (
                                                <div className="mt-6 animate-fade-in-up">
                                                    <textarea
                                                        className="input-field min-h-[100px]"
                                                        placeholder="Provide details of the vehicle to be exchanged (Year, Model, Condition)..."
                                                        value={currentEnquiry.exchangeDetail || ''}
                                                        onChange={e => setCurrentEnquiry({ ...currentEnquiry, exchangeDetail: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </fieldset>

                                    <div className="flex flex-col sm:flex-row-reverse gap-3 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                                        {!isViewMode && (
                                            <button
                                                type="submit"
                                                className="btn-primary w-full sm:w-auto"
                                            >
                                                {currentEnquiry.enquiryId ? 'Update Enquiry' : 'Save Enquiry'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={closeEnquiryBlock}
                                            className="btn-secondary w-full sm:w-auto"
                                        >
                                            {isViewMode ? 'Close' : 'Cancel'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* 2. Customer Profile */}
                    {(customerProfile || selectedCustomer) && (
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <CustomerProfile customer={selectedCustomer || customerProfile} />
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-semibold mb-2 text-[var(--text-primary)]">Enquiries</h1>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Manage customer vehicle interests and purchase intentions.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isSuperUser && (
                        <div className="search-box !w-auto">
                            <Building size={18} className="search-icon" />
                            <select
                                className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-semibold text-[var(--text-primary)] min-w-[160px] cursor-pointer outline-none pl-10 h-10 shadow-sm"
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

                    <div className="search-box !w-auto">
                        <ClipboardList size={18} className="search-icon" />
                        <select
                            className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-semibold text-[var(--text-primary)] min-w-[160px] cursor-pointer outline-none pl-10 h-10 shadow-sm"
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="" disabled>Status Filter...</option>
                            {getOpt('ENQUIRY_STATUSES').map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="search-box !w-auto">
                        <Briefcase size={18} className="search-icon" />
                        <select
                            className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-semibold text-[var(--text-primary)] min-w-[160px] cursor-pointer outline-none pl-10 h-10 shadow-sm"
                            value={selectedAssignedToUserId}
                            onChange={(e) => {
                                setSelectedAssignedToUserId(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All Users</option>
                            {assignableUsers.map(u => (
                                <option key={u.userId} value={u.userId}>{u.fullName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        {filterCustomerId && (
                            <button
                                onClick={() => {
                                    setSelectedStatus('new');
                                    navigate('/enquiries');
                                }}
                                className="btn-secondary px-6"
                            >
                                Clear
                            </button>
                        )}
                        {user?.role !== 'SALES_REP' && (
                            <button
                                onClick={() => {
                                    setCurrentEnquiry({ status: 'new', enquiryType: 'Buy', carDetails: [], assignedToUserId: user?.userId });
                                    if (filterCustomerId && customerProfile) {
                                        setSelectedCustomer(customerProfile);
                                        setCurrentEnquiry(prev => ({ ...prev, customerId: customerProfile.customerId }));
                                    } else {
                                        setSelectedCustomer(null);
                                    }
                                    setIsViewMode(false);
                                    setIsEditMode(true);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="btn-primary !py-2 !px-6"
                            >
                                <Plus size={18} /> New Enquiry
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative">
                <Table
                    columns={columns}
                    data={enquiries}
                    onRowClick={(enquiry) => setSelectedEnquiry(enquiry)}
                    selectedRow={selectedEnquiry?.enquiryId}
                    rowKey="enquiryId"
                />

                <FloatingActionPanel
                    selectedItem={selectedEnquiry}
                    onClose={() => setSelectedEnquiry(null)}
                    title={selectedEnquiry?.customer?.fullName}
                    subtitle={selectedEnquiry?.customer?.phone}
                    actions={[
                        {
                            icon: Phone,
                            label: 'Call Customer',
                            onClick: (enq) => {
                                if (enq.customer?.phone) {
                                    window.open(`tel:${enq.customer.phone}`, '_self');
                                } else {
                                    showToast("No phone number available for this customer.", "warning");
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
                        // Show Edit only if active and not SALES_REP
                        ...(user?.role !== 'SALES_REP' && ['new', 'in-followup'].includes(selectedEnquiry?.status) ? [{
                            icon: Edit,
                            label: 'Edit Enquiry',
                            onClick: handleEdit,
                            color: 'blue',
                            title: 'Edit Enquiry'
                        }] : []),
                        // Show Lead Workspace only if authorized and active
                        ...((['SALES_REP', 'SALES_MGR', 'EXECUTIVE'].includes(user?.role) || isSuperUser) && ['new', 'in-followup'].includes(selectedEnquiry?.status) ? [{
                            icon: Briefcase,
                            label: 'Lead Workspace',
                            onClick: (enq) => openWorkspaceWithEnquiry(enq.enquiryId, enq.customerId, enq.customer?.phone, enq.branchId, enq),
                            color: 'indigo',
                            title: 'Open in Lead Workspace'
                        }] : []),
                        // Show Follow-ups only if not sales rep/mgr
                        ...(!['SALES_REP', 'SALES_MGR'].includes(user?.role) ? [{
                            icon: Calendar,
                            label: 'Follow-ups Page',
                            onClick: (enq) => navigate(`/follow-ups?enquiryId=${enq.enquiryId}`),
                            color: 'indigo',
                            title: 'Go to Follow-ups Page'
                        }] : []),
                        // Show Delete only if authorized and active
                        ...((!['SALES_REP', 'SALES_MGR'].includes(user?.role)) && ['new', 'in-followup'].includes(selectedEnquiry?.status) ? [{
                            icon: Trash,
                            label: 'Delete Enquiry',
                            onClick: handleDelete,
                            color: 'red',
                            title: 'Delete Enquiry'
                        }] : [])
                    ]}
                />
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-8 mb-12 animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-4 py-2 rounded-lg border border-[var(--border)] shadow-sm">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            Showing: <span className="text-[var(--accent)]">{(page - 1) * pageSize + 1}</span> — <span className="text-[var(--accent)]">{Math.min(page * pageSize, totalEnquiries)}</span>
                            <span className="mx-2 text-[var(--border)]">|</span>
                            Total Records: <span className="text-[var(--text-primary)]">{totalEnquiries}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="pageSize" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Page Size</label>
                        <select
                            id="pageSize"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="input-field py-1.5 px-3 text-sm w-20"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="btn-secondary p-2.5 disabled:opacity-30 disabled:cursor-not-allowed border border-[var(--border)]"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-primary)] min-w-[80px] text-center shadow-sm">
                        {page} / {totalPages}
                    </div>
                    <button
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="btn-secondary p-2.5 disabled:opacity-30 disabled:cursor-not-allowed border border-[var(--border)]"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>



            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, enquiry: null })}
                onConfirm={confirmDelete}
                title="Delete Enquiry"
                message={`Are you sure you want to delete this enquiry? This will also delete all its Follow-ups. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

        </div >
    );
};

export default Enquiries;
