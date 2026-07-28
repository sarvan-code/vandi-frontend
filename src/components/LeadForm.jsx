import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Save, History, PlusCircle, X, Plus, Trash2, User, Phone, Mail, MapPin, Briefcase, Calendar, Car, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useOptions } from '../context/OptionsContext';
import VehicleAutocomplete from './VehicleAutocomplete';
import CustomerSearch from './CustomerSearch';
import clsx from 'clsx';
import Logo from './Logo';

const LeadForm = ({ onSave, onCancel, tabId, preloadedEnquiryId, preloadedCustomerId, preloadedPhone, preloadedBranchId, onTitleUpdate, preloadedFullData, onTabEmpty }) => {
    const { user } = useContext(AuthContext);
    const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(user?.role);
    const { getOptionList, getDependentOptions, vehicleBrands, vehicleTypes, vehicleModels, vehicleVariants, branches, loading: optionsLoading } = useOptions();
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const { showToast } = useToast();

    const [filteredFollowupTypes, setFilteredFollowupTypes] = useState([]);

    // ---- State ----
    const [loading, setLoading] = useState(false);

    // Search / Autocomplete State
    const [searchResults, setSearchResults] = useState([]);

    // Data Objects
    const [customer, setCustomer] = useState({
        fullName: '', phone: '', email: '',
        instaid: '', dateOfBirth: '', marriageDate: '', profession: '',
        referredBy: '', referredByName: '',
        address: '', district: '', state: '', country: '', landMark: '',
        remarks: '', customerType: 'Lead'
    });

    const [enquiry, setEnquiry] = useState({
        enquiryType: 'Buy',
        exchange: false, exchangeDetail: '',
        budgetRange: '', budgetRemarks: '',
        carDetailRemarks: '',
        fuelType: '', usageType: '', payment: '',
        customerType: 'Lead',
        status: 'new',
        carDetails: [], // [{carType, carBrand, carModel, carVariant}]
        assignedToUserId: user?.userId
    });

    const [followUp, setFollowUp] = useState({
        followupMode: '', followupType: '',
        followupActionDone: '', car: null,
        followupResults: '', followupRemarks: '',
        nextVisitDate: ''
    });

    // Smart Features
    const [activeEnquiryId, setActiveEnquiryId] = useState(null);
    const [isNewEnquiry, setIsNewEnquiry] = useState(true);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [showFollowUpHistory, setShowFollowUpHistory] = useState(false);
    const [showMoreCustomerDetails, setShowMoreCustomerDetails] = useState(false);

    // Initial Data for Change Detection
    const [initialCustomer, setInitialCustomer] = useState(null);
    const [initialEnquiry, setInitialEnquiry] = useState(null);

    // Auto-expand More Details if customer already has optional data
    useEffect(() => {
        const hasExtra = customer.email || customer.instaid || customer.dateOfBirth ||
            customer.marriageDate || customer.profession || customer.referredBy ||
            customer.referredByName || customer.address || customer.district ||
            customer.state || customer.country || customer.landMark;
        if (hasExtra) setShowMoreCustomerDetails(true);
    }, [customer.customerId]);

    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    useEffect(() => {
        // Load persistence
        if (tabId) {
            const saved = localStorage.getItem(`vandi_lead_form_${tabId}`);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.customer) {
                        const sanitizedCust = { ...data.customer };
                        Object.keys(sanitizedCust).forEach(k => {
                            if (sanitizedCust[k] === null) sanitizedCust[k] = '';
                        });
                        setCustomer(sanitizedCust);
                        // Notify workspace of customer name so tab title updates
                        if (sanitizedCust.fullName && onTitleUpdate) {
                            onTitleUpdate(sanitizedCust.fullName);
                        }
                    }
                    if (data.enquiry) {
                        const sanitizedEnq = { ...data.enquiry };
                        Object.keys(sanitizedEnq).forEach(k => {
                            if (sanitizedEnq[k] === null) sanitizedEnq[k] = '';
                        });
                        setEnquiry(sanitizedEnq);
                    }
                    if (data.followUp) {
                        const sanitizedFollow = { ...data.followUp };
                        Object.keys(sanitizedFollow).forEach(k => {
                            if (sanitizedFollow[k] === null) sanitizedFollow[k] = '';
                        });
                        setFollowUp(sanitizedFollow);
                    }
                    if (data.branchId) setSelectedBranchId(data.branchId);
                    if (data.activeEnquiryId) setActiveEnquiryId(data.activeEnquiryId);
                    if (data.isNewEnquiry !== undefined) setIsNewEnquiry(data.isNewEnquiry);
                    if (data.history) setHistory(data.history);
                } catch (e) {
                    console.error("Error loading persisted lead form", e);
                }
            }
        }
    }, [tabId]);

    // Save persistence
    useEffect(() => {
        if (tabId) {
            const dataToSave = {
                customer,
                enquiry,
                followUp,
                branchId: selectedBranchId,
                activeEnquiryId,
                isNewEnquiry,
                history,
                savedAt: Date.now() // Timestamp for stale detection
            };
            localStorage.setItem(`vandi_lead_form_${tabId}`, JSON.stringify(dataToSave));
        }
    }, [tabId, customer, enquiry, followUp, selectedBranchId, activeEnquiryId, isNewEnquiry, history]);

    // Helper to get options from context
    const getOpt = (key) => getOptionList(key);

    const handleCustomerSearch = async (term) => {
        if (isSuperUser && !selectedBranchId) {
            showToast("Please select a Branch first.", "warning");
            return;
        }
        try {
            const res = await api.get(`/leads/search?term=${term}${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`, { hideLoader: true });
            if (res.data.found && res.data.data) {
                setSearchResults(res.data.data);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Search error", error);
        }
    };

    const handleCustomerSelect = (flatCustomer) => {
        if (!flatCustomer) {
            // If cleared, we don't necessarily reset the entire customer object,
            // but we might want to if the user is explicitly starting over.
            // For now, let's just keep the phone number if they are typing.
            return;
        }

        const fullResult = searchResults.find(r =>
            (r.customer.customerId && r.customer.customerId === flatCustomer.customerId) ||
            (r.customer.phone === flatCustomer.phone)
        );

        if (fullResult) {
            handleSelectResult(fullResult);
        }
    };

    useEffect(() => {
        if (followUp.followupMode) {
            const types = getDependentOptions('FOLLOWUP_TYPES', 'FOLLOWUP_MODES', followUp.followupMode);
            setFilteredFollowupTypes(types);
        } else {
            setFilteredFollowupTypes([]);
        }
    }, [followUp.followupMode, getDependentOptions]);

    // -- Helper: Apply a full Enquiry row (from the Enquiries page) to form state --
    // This avoids any API call when we already have the data from the table.
    const applyEnquiryData = (enqRow) => {
        const custData = enqRow.customer || {};
        const sanitizedCust = {};
        Object.keys(custData).forEach(k => {
            sanitizedCust[k] = custData[k] === null ? '' : custData[k];
        });
        if (sanitizedCust.fullName && onTitleUpdate) onTitleUpdate(sanitizedCust.fullName);
        setCustomer(sanitizedCust);
        setInitialCustomer(JSON.stringify(sanitizedCust));

        const sanitizedEnq = {};
        Object.keys(enqRow).forEach(k => {
            if (k !== 'customer' && k !== 'followUps') {
                sanitizedEnq[k] = enqRow[k] === null ? '' : enqRow[k];
            }
        });
        sanitizedEnq.carDetails = enqRow.carDetails || [];
        sanitizedEnq.exchange = enqRow.exchange || false;
        sanitizedEnq.followUps = enqRow.followUps || []; // Needed for "View Previous"
        setEnquiry(sanitizedEnq);
        setInitialEnquiry(JSON.stringify(sanitizedEnq));
        setActiveEnquiryId(enqRow.enquiryId || null);
        setIsNewEnquiry(false);
        if (enqRow.branchId) setSelectedBranchId(enqRow.branchId);
    };

    // Load pre-loaded enquiry if provided
    useEffect(() => {
        // === PRIORITY 1: Fresh localStorage data (< 24h) ===
        const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
        const saved = localStorage.getItem(`vandi_lead_form_${tabId}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                const isStale = !data.savedAt || (Date.now() - data.savedAt) > STALE_THRESHOLD_MS;
                const hasCustomerData = data.customer && (data.customer.fullName || data.customer.phone);

                if (hasCustomerData && !isStale) {
                    // Fresh, real data in localStorage — hydrated on mount, no server call needed.
                    return;
                }

                // Stale — clear it so we can refresh
                if (isStale) {
                    localStorage.removeItem(`vandi_lead_form_${tabId}`);
                }
            } catch (e) { }
        }

        // === PRIORITY 2: Full enquiry data passed from the Enquiries page row ===
        if (preloadedFullData) {
            applyEnquiryData(preloadedFullData);
            return;
        }

        // === PRIORITY 3: Stale / no local data — fetch from search API ===
        if (preloadedEnquiryId || preloadedCustomerId || preloadedPhone) {
            setLoading(true);
            const loadPreloadedEnquiry = async () => {
                try {
                    if (preloadedPhone) {
                        const res = await api.get('/leads/search', {
                            params: { term: preloadedPhone, branchId: preloadedBranchId },
                            hideLoader: true
                        });

                        if (res.data.found && res.data.data && res.data.data.length > 0) {
                            handleSelectResult(res.data.data[0]);
                            setLoading(false);
                            return;
                        }

                        // Search returned empty — notify workspace to close this tab
                        console.warn('Search returned no results for preloaded enquiry. Closing tab.');
                        if (onTabEmpty) onTabEmpty();
                    }
                } catch (error) {
                    console.error('Error loading pre-loaded enquiry:', error);
                    showToast('Error loading enquiry data', 'error');
                } finally {
                    setLoading(false);
                }
            };
            loadPreloadedEnquiry();
        }
    }, [preloadedEnquiryId, preloadedCustomerId, preloadedPhone, preloadedBranchId, preloadedFullData]);

    const handleSelectResult = (result) => {
        const { customer: custData, activeEnquiry, history: histData } = result;
        const sanitizedCust = { ...custData };
        Object.keys(sanitizedCust).forEach(k => {
            if (sanitizedCust[k] === null) sanitizedCust[k] = '';
        });
        setCustomer(sanitizedCust);
        setInitialCustomer(JSON.stringify(sanitizedCust));
        // Inform workspace of the name
        if (sanitizedCust.fullName && onTitleUpdate) {
            onTitleUpdate(sanitizedCust.fullName);
        }
        setHistory([]); // Clear history when context changes
        setShowHistory(false);

        if (activeEnquiry) {
            showToast(`Found active enquiry (Status: ${activeEnquiry.status}). Loading it...`, "info");
            setActiveEnquiryId(activeEnquiry.enquiryId);
            if (activeEnquiry.branchId) setSelectedBranchId(activeEnquiry.branchId);
            const sanitizedEnq = { ...activeEnquiry };
            Object.keys(sanitizedEnq).forEach(k => {
                if (sanitizedEnq[k] === null) sanitizedEnq[k] = '';
            });
            setEnquiry(sanitizedEnq);
            setInitialEnquiry(JSON.stringify(sanitizedEnq));
            setIsNewEnquiry(false);
        } else {
            if (custData.branchId) setSelectedBranchId(custData.branchId);
            setActiveEnquiryId(null);
            setEnquiry({
                enquiryType: 'Buy',
                exchange: false, exchangeDetail: '',
                budgetRange: '', budgetRemarks: '',
                carDetailRemarks: '',
                fuelType: '', usageType: '', payment: '',
                customerType: 'Lead',
                status: 'new',
                carDetails: [],
                branchId: custData.branchId || selectedBranchId
            });
            setInitialEnquiry(null);
            setIsNewEnquiry(true);
        }
    };

    const fetchHistory = async () => {
        if (!customer.customerId) return;
        setIsHistoryLoading(true);
        try {
            const res = await api.get(`/leads/${customer.customerId}/history`, {
                params: { excludeEnquiryId: activeEnquiryId }
            });
            setHistory(res.data.data || []);
            setShowHistory(true);
        } catch (error) {
            console.error("Fetch history error", error);
            showToast("Failed to fetch lead history", "error");
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const VEHICLE_ACTIONS = ["general-query", "inform-on-available"];
    const NEXT_VISIT_ACTIONS = ["will-come-on-available"];
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customer.fullName || !customer.phone) {
            showToast("Customer Name and Phone Number are mandatory.", "warning");
            return;
        }

        if (isSuperUser && !selectedBranchId) {
            showToast("Please select a Branch for this Lead.", "warning");
            return;
        }

        if (!enquiry.carDetails || enquiry.carDetails.length === 0) {
            showToast("At least one set of Vehicle Details is mandatory.", "warning");
            return;
        }
        const hasValidCar = enquiry.carDetails.some(car => car.carType && car.carBrand);
        if (!hasValidCar) {
            showToast("Please provide at least one valid Vehicle (Brand and Type).", "warning");
            return;
        }

        if (!followUp.followupMode || !followUp.followupType || !followUp.followupActionDone || !followUp.followupResults) {
            showToast("All Follow-up fields (Mode, Type, Action, and Results) are mandatory.", "warning");
            return;
        }

        const isVehicleRelated = VEHICLE_ACTIONS.includes(followUp.followupActionDone?.toLowerCase());
        if (!isVehicleRelated && !followUp.car) {
            showToast("Vehicle Number is mandatory for the selected Follow-up Action.", "warning");
            return;
        }

        const isNextVisitRelated = NEXT_VISIT_ACTIONS.includes(followUp.followupResults?.toLowerCase());
        if (!isNextVisitRelated && !followUp.nextVisitDate) {
            showToast("Next Visit Date is mandatory.", "warning");
            return;
        }

        setLoading(true);
        const currentCustJSON = JSON.stringify(customer);
        const currentEnqJSON = JSON.stringify(enquiry);
        const skipCustomerUpdate = customer.customerId && initialCustomer === currentCustJSON;
        const skipEnquiryUpdate = !isNewEnquiry && initialEnquiry === currentEnqJSON;
        try {
            const payload = {
                customer,
                enquiry: {
                    ...enquiry,
                    enquiryId: activeEnquiryId,
                    branchId: selectedBranchId || undefined
                },
                followUp,
                isNewEnquiry,
                skipCustomerUpdate,
                skipEnquiryUpdate
            };
            await api.post('/leads/process', payload);
            if (tabId) localStorage.removeItem(`vandi_lead_form_${tabId}`);
            onSave();
        } catch (error) {
            console.error("Save failed", error);
            showToast("Failed to save lead: " + (error.response?.data?.error || error.message), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleForceNewEnquiry = () => {
        setIsNewEnquiry(true);
        setActiveEnquiryId(null);
        setEnquiry({
            enquiryType: 'Buy',
            exchange: false, exchangeDetail: '',
            budgetRange: '', budgetRemarks: '',
            carDetailRemarks: '',
            fuelType: '', usageType: '', payment: '',
            customerType: 'Lead',
            status: 'new',
            carDetails: []
        });
    };

    return (
        <div className="h-full flex flex-col p-4 overflow-y-auto custom-scrollbar" style={{ background: 'var(--bg-primary)' }}>
            <form onSubmit={handleSubmit} className="flex-1 space-y-6" autoComplete="off">

                {/* Customer Details Section */}
                <div className="card p-4 md:p-6 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-4 border-b gap-4" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'var(--accent)' }}>
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Customer Details</h3>
                                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>Name and Phone Number</p>
                            </div>
                        </div>

                        {isSuperUser && (
                            <div className="relative">
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(e.target.value)}
                                    className="input-field py-2 px-4 text-xs font-bold text-slate-600 min-w-[150px]"
                                    required
                                >
                                    <option value="">-- Select Branch --</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.displayName}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Global search removed as it is now integrated into the Phone Number field */}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <CustomerSearch
                            label="Phone Number *"
                            customers={searchResults.map(r => r.customer)}
                            onSearch={handleCustomerSearch}
                            onSelect={handleCustomerSelect}
                            onSearchTermChange={(phone) => setCustomer({ ...customer, phone })}
                            selectedCustomer={customer.customerId ? customer : null}

                        />
                        <div className="space-y-1">
                            <label className="form-label">Full Name *</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input className="input-field !pl-10" placeholder="John Doe" value={customer.fullName} onChange={e => setCustomer({ ...customer, fullName: e.target.value })} required />
                            </div>
                        </div>
                    </div>

                    {/* More Details Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowMoreCustomerDetails(v => !v)}
                        className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
                    >
                        {showMoreCustomerDetails ? (
                            <>
                                <ChevronUp size={14} className="transition-transform" />
                                Hide Details
                            </>
                        ) : (
                            <>
                                <ChevronDown size={14} className="transition-transform" />
                                More Details
                            </>
                        )}
                    </button>

                    {/* Collapsible Extra Customer Fields */}
                    {showMoreCustomerDetails && (
                        <div className="mt-4 space-y-5 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div className="space-y-1">
                                    <label className="form-label">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                        <input className="input-field !pl-10" placeholder="john@example.com" value={customer.email || ''} onChange={e => setCustomer({ ...customer, email: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="form-label">Social Media</label>
                                    <input className="input-field" placeholder="@username" value={customer.instaid || ''} onChange={e => setCustomer({ ...customer, instaid: e.target.value })} />
                                </div>

                                <div className="space-y-1">
                                    <label className="form-label">Date of Birth</label>
                                    <div className="relative group/date">
                                        <input type="date" className="input-field pr-8" max={new Date().toISOString().split("T")[0]} value={customer.dateOfBirth || ''} onChange={e => setCustomer({ ...customer, dateOfBirth: e.target.value })} />
                                        {customer.dateOfBirth && (
                                            <button type="button" onClick={() => setCustomer({ ...customer, dateOfBirth: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--danger)]">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="form-label">Anniversary</label>
                                    <div className="relative group/date">
                                        <input type="date" className="input-field pr-8" max={new Date().toISOString().split("T")[0]} value={customer.marriageDate || ''} onChange={e => setCustomer({ ...customer, marriageDate: e.target.value })} />
                                        {customer.marriageDate && (
                                            <button type="button" onClick={() => setCustomer({ ...customer, marriageDate: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--danger)]">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="form-label">Profession</label>
                                    <select className="input-field h-[38px]" value={customer.profession || ''} onChange={e => setCustomer({ ...customer, profession: e.target.value })}>
                                        <option value="">Select Profession</option>
                                        {getOpt('PROFESSIONS').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="form-label">Type</label>
                                    <select className="input-field" value={customer.customerType || 'Lead'} onChange={e => setCustomer({ ...customer, customerType: e.target.value })}>
                                        <option value="Lead">Lead</option>
                                        <option value="Customer">Customer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                                <label className="form-label mb-2">Referral Information</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <select className="input-field h-[38px]" value={customer.referredBy || ''} onChange={e => setCustomer({ ...customer, referredBy: e.target.value })}>
                                        <option value="">Select Referral Source</option>
                                        {getOpt('REFERRAL_SOURCES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                                    </select>
                                    <input className="input-field" placeholder="Referrer Name / Details" value={customer.referredByName || ''} onChange={e => setCustomer({ ...customer, referredByName: e.target.value })} />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                                <label className="form-label mb-2 flex items-center gap-2">
                                    <MapPin size={12} /> Address
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <input className="input-field md:col-span-2" placeholder="Street Address / Area" value={customer.address || ''} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
                                    <input className="input-field" placeholder="Landmark" value={customer.landMark || ''} onChange={e => setCustomer({ ...customer, landMark: e.target.value })} />
                                    <input className="input-field" placeholder="District" value={customer.district || ''} onChange={e => setCustomer({ ...customer, district: e.target.value })} />
                                    <input className="input-field" placeholder="State" value={customer.state || ''} onChange={e => setCustomer({ ...customer, state: e.target.value })} />
                                    <input className="input-field" placeholder="Country" value={customer.country || ''} onChange={e => setCustomer({ ...customer, country: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Enquiry Details Section */}
                <div className="card p-4 md:p-6 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-4 border-b gap-4" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: isNewEnquiry ? 'var(--success)' : 'var(--accent)' }}>
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {isNewEnquiry ? 'New Enquiry' : 'Update Enquiry'}
                                </h3>
                                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                    {isNewEnquiry ? 'New Enquiry' : 'Updating Details'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {!isNewEnquiry && (
                                <button
                                    type="button"
                                    onClick={handleForceNewEnquiry}
                                    disabled={!!activeEnquiryId}
                                    className="btn-secondary !py-1.5 !px-3 text-xs"
                                >
                                    <PlusCircle size={14} /> New Instead
                                </button>
                            )}
                            {(customer.customerId) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!showHistory && history.length === 0) fetchHistory();
                                        setShowHistory(!showHistory);
                                    }}
                                    className="btn-secondary !py-1.5 !px-3 text-xs"
                                    disabled={isHistoryLoading}
                                >
                                    <History size={14} className={isHistoryLoading ? 'animate-spin' : ''} />
                                    {isHistoryLoading ? 'Loading...' : (showHistory ? 'Hide History' : 'History')}
                                </button>
                            )}
                        </div>
                    </div>

                    {showHistory && (
                        <div className="mb-6 bg-[var(--bg-secondary)] p-6 rounded-[2rem] border border-dashed border-[var(--border)] text-sm animate-in fade-in slide-in-from-top-4">
                            <h4 className="font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-[0.2em] mb-4">Enquiry History</h4>
                            {history.length > 0 ? (
                                <ul className="space-y-3">
                                    {history.map(h => (
                                        <li key={h.enquiryId} className="flex flex-wrap items-center gap-3 p-4 rounded-2xl shadow-sm border transition-all hover:border-[var(--accent)]/30"
                                            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                                            {h.branch && <span className="font-bold text-[10px] px-3 py-1 rounded-lg uppercase tracking-wider" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{h.branch.displayName}</span>}
                                            <span className="font-bold text-[var(--accent)]">{h.enquiryType}</span>
                                            <span style={{ color: 'var(--border)' }}>|</span>
                                            {h.carDetails && h.carDetails.length > 0 ? (
                                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}> {h.carDetails.map(c => `${c.carBrand} ${c.carModel}`).join(', ')}</span>
                                            ) : <span className="italic" style={{ color: 'var(--text-muted)' }}>No Vehicle Selected</span>}
                                            <div className="flex-1"></div>
                                            <span className={clsx("px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-sm",
                                                h.status === 'converted' ? 'bg-emerald-500/10 text-emerald-600' :
                                                    h.status === 'lost' ? 'bg-rose-500/10 text-rose-600' :
                                                        'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                                            )}> {h.status} </span>
                                            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="italic text-slate-400 text-center py-2">No past enquiries found for this customer.</p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="space-y-1">
                            <label className="form-label">Enquiry Type</label>
                            <div className="flex gap-4 p-1 bg-[var(--bg-tertiary)] rounded-md">
                                <label className={clsx(
                                    "flex-1 flex items-center justify-center py-1.5 rounded cursor-pointer transition-all font-semibold text-xs",
                                    enquiry.enquiryType === 'Buy' ? 'bg-[var(--bg-secondary)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                )}>
                                    <input type="radio" name="enquiryType" value="Buy" checked={enquiry.enquiryType === 'Buy'} onChange={e => setEnquiry({ ...enquiry, enquiryType: e.target.value })} className="hidden" />
                                    Buy
                                </label>
                                <label className={clsx(
                                    "flex-1 flex items-center justify-center py-1.5 rounded cursor-pointer transition-all font-semibold text-xs",
                                    enquiry.enquiryType === 'Sell' ? 'bg-[var(--bg-secondary)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                )}>
                                    <input type="radio" name="enquiryType" value="Sell" checked={enquiry.enquiryType === 'Sell'} onChange={e => setEnquiry({ ...enquiry, enquiryType: e.target.value })} className="hidden" />
                                    Sell
                                </label>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="form-label">Status</label>
                            <div className="input-field bg-[var(--bg-tertiary)] h-[38px] flex items-center font-bold text-[var(--text-muted)] uppercase cursor-not-allowed">
                                {enquiry.status || 'new'}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="form-label">Assigned To</label>
                            <div className="input-field bg-[var(--bg-tertiary)] h-[38px] flex items-center font-bold text-[var(--text-primary)] cursor-not-allowed">
                                {isNewEnquiry ? (user?.fullName || '—') : (enquiry.assignedTo?.fullName || '—')}
                            </div>
                            <input type="hidden" value={isNewEnquiry ? user?.userId : (enquiry.assignedToUserId || '')} />
                        </div>
                    </div>

                    <div className="bg-[var(--bg-tertiary)]/50 p-5 rounded-lg border border-[var(--border)] mb-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                            <label className="form-label !mb-0 flex items-center gap-2">
                                <Car size={16} className="text-[var(--accent)]" /> Selected Cars
                            </label>
                            <button type="button" onClick={() => {
                                const mk = [...(enquiry.carDetails || [])];
                                mk.push({ carType: '', carBrand: '', carModel: '', carVariant: '' });
                                setEnquiry({ ...enquiry, carDetails: mk });
                            }} className="btn-primary !py-1.5 !px-3 text-xs">
                                <Plus size={14} /> Add Vehicle
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(enquiry.carDetails || []).map((car, idx) => {
                                const typeTerm = (car.carType || '').trim().toLowerCase();
                                const selectedTypeObj = vehicleTypes.find(t => t.name.toLowerCase() === typeTerm);
                                const brandTerm = (car.carBrand || '').trim().toLowerCase();
                                const selectedBrandObj = vehicleBrands.find(b => b.name.toLowerCase() === brandTerm);
                                const typesForBrand = selectedBrandObj
                                    ? new Set(vehicleModels.filter(m => m.brandId === selectedBrandObj.id).map(m => m.typeId))
                                    : null;
                                const availableTypes = typesForBrand
                                    ? vehicleTypes.filter(t => typesForBrand.has(t.id))
                                    : vehicleTypes;
                                const filteredModels = vehicleModels.filter(m => selectedBrandObj && m.brandId === selectedBrandObj.id && selectedTypeObj && m.typeId === selectedTypeObj.id);
                                const modelTerm = (car.carModel || '').trim().toLowerCase();
                                const selectedModelObj = filteredModels.find(m => m.name.toLowerCase() === modelTerm);
                                const filteredVariants = vehicleVariants.filter(v => selectedModelObj && v.modelId === selectedModelObj.id);

                                return (
                                    <div key={idx} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 p-4 bg-[var(--bg-secondary)] rounded-md border border-[var(--border)] shadow-sm relative group transition-all hover:shadow-md">
                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-[var(--text-muted)] pl-1">Brand</label>
                                            <select className="input-field py-1 px-2 text-xs h-8" value={car.carBrand || ''} onChange={e => {
                                                const mk = [...enquiry.carDetails];
                                                mk[idx].carBrand = e.target.value; mk[idx].carType = ''; mk[idx].carModel = ''; mk[idx].carVariant = '';
                                                setEnquiry({ ...enquiry, carDetails: mk });
                                            }}>
                                                <option value="">Select Brand</option>
                                                {vehicleBrands.map((b, i) => <option key={b.id || i} value={b.name}>{b.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-[var(--text-muted)] pl-1">Type</label>
                                            <select className="input-field py-1 px-2 text-xs h-8" value={car.carType || ''} onChange={e => {
                                                const mk = [...enquiry.carDetails];
                                                mk[idx].carType = e.target.value; mk[idx].carModel = ''; mk[idx].carVariant = '';
                                                setEnquiry({ ...enquiry, carDetails: mk });
                                            }}>
                                                <option value="">Select Type</option>
                                                {availableTypes.map((t, i) => <option key={t.id || i} value={t.name}>{t.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-[var(--text-muted)] pl-1">Model</label>
                                            <select className="input-field py-1 px-2 text-xs h-8" value={car.carModel || ''} onChange={e => {
                                                const mk = [...enquiry.carDetails]; mk[idx].carModel = e.target.value; mk[idx].carVariant = '';
                                                setEnquiry({ ...enquiry, carDetails: mk });
                                            }}>
                                                <option value="">Select Model</option>
                                                {filteredModels.map((m, i) => <option key={m.id || i} value={m.name}>{m.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] uppercase font-bold text-[var(--text-muted)] pl-1">Variant</label>
                                            <select className="input-field py-1 px-2 text-xs h-8" value={car.carVariant || ''} onChange={e => {
                                                const mk = [...enquiry.carDetails]; mk[idx].carVariant = e.target.value;
                                                setEnquiry({ ...enquiry, carDetails: mk });
                                            }}>
                                                <option value="">Select Variant</option>
                                                {filteredVariants.map((v, i) => <option key={v.id || i} value={v.name}>{v.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="flex items-end justify-end pb-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const mk = enquiry.carDetails.filter((_, i) => i !== idx);
                                                    setEnquiry({ ...enquiry, carDetails: mk });
                                                }}
                                                className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1.5 rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3">
                            <input className="input-field w-full text-xs" placeholder="Additional Vehicle Remarks..." value={enquiry.carDetailRemarks || ''} onChange={e => setEnquiry({ ...enquiry, carDetailRemarks: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="space-y-1">
                            <label className="form-label">Budget</label>
                            <select className="input-field h-[38px] font-semibold" value={enquiry.budgetRange || ''} onChange={e => setEnquiry({ ...enquiry, budgetRange: e.target.value })}>
                                <option value="">Select Budget Range</option>
                                {getOpt('BUDGET_RANGES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="form-label">Budget Remarks</label>
                            <input className="input-field" placeholder="Specific budget constraints..." value={enquiry.budgetRemarks || ''} onChange={e => setEnquiry({ ...enquiry, budgetRemarks: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <select className="input-field w-full" value={enquiry.fuelType || ''} onChange={e => setEnquiry({ ...enquiry, fuelType: e.target.value })}>
                            <option value="">Fuel Type</option>
                            {getOpt('FUEL_TYPES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                        </select>
                        <select className="input-field w-full" value={enquiry.usageType || ''} onChange={e => setEnquiry({ ...enquiry, usageType: e.target.value })}>
                            <option value="">Usage Type</option>
                            {getOpt('USAGE_TYPES').map((u, i) => <option key={u.value || i} value={u.value}>{u.label}</option>)}
                        </select>
                        <select className="input-field w-full" value={enquiry.payment || ''} onChange={e => setEnquiry({ ...enquiry, payment: e.target.value })}>
                            <option value="">Payment Mode</option>
                            {getOpt('PAYMENT_MODES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="border-t border-dashed pt-5 mt-5" style={{ borderColor: 'var(--border)' }}>
                        <label className="flex items-center gap-3 font-semibold text-[var(--text-primary)] cursor-pointer w-fit p-1.5 hover:bg-[var(--bg-tertiary)] rounded transition-colors">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                                checked={enquiry.exchange || false}
                                onChange={e => setEnquiry({ ...enquiry, exchange: e.target.checked })}
                            />
                            Exchange Vehicle?
                        </label>
                        {enquiry.exchange && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                <input className="input-field" placeholder="Describe Exchange Vehicle..." value={enquiry.exchangeDetail || ''} onChange={e => setEnquiry({ ...enquiry, exchangeDetail: e.target.value })} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Follow-up Section */}
                <div className="card p-4 md:p-6 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-4 border-b gap-4" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'var(--warning)' }}>
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Follow-up Steps</h3>
                                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>Interaction History & Next Steps</p>
                            </div>
                        </div>

                        {enquiry.followUps && enquiry.followUps.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowFollowUpHistory(!showFollowUpHistory)}
                                className="btn-secondary !py-1.5 !px-3 text-xs"
                            >
                                <History size={14} /> {showFollowUpHistory ? 'Hide Previous' : 'View Previous'}
                            </button>
                        )}
                    </div>

                    {
                        showFollowUpHistory && enquiry.followUps && (
                            <div className="mb-6 bg-amber-50/50 rounded-2xl border border-amber-100 overflow-scroll animate-in fade-in slide-in-from-top-4">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-amber-100/30 text-amber-900 font-bold border-b border-amber-100 uppercase tracking-wider">
                                        <tr>
                                            <th className="p-3">Date / Agent</th>
                                            <th className="p-3">Context</th>
                                            <th className="p-3">Action</th>
                                            <th className="p-3">Outcome</th>
                                            <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-amber-900/60">Next Follow-up</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100/50">
                                        {enquiry.followUps.map((f, idx) => (
                                            <tr key={f.followUpId || idx} className="hover:bg-amber-50/80 transition-all duration-300">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{new Date(f.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-[10px] font-bold text-amber-600/60 uppercase tracking-widest mt-1" title={f.agent?.fullName}>{f.agent?.fullName || 'N/A'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-700 text-xs">{f.followupMode}</div>
                                                    <div className="text-[10px] font-medium text-slate-400 mt-0.5">{f.followupType}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-xs" style={{ color: 'var(--text-secondary)' }}>{f.followupActionDone}</div>
                                                    {f.car && <div className="font-bold border uppercase text-[9px] px-2 py-0.5 rounded-lg w-fit mt-2 shadow-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--accent)' }}>{f.car?.registrationNumber}</div>}
                                                </td>
                                                <td className="p-4">
                                                    <div className={clsx(
                                                        "font-bold uppercase text-[9px] px-3 py-1 rounded-full w-fit mb-2 shadow-sm tracking-widest",
                                                        f.followupResults === 'not-interested' ? 'bg-red-50 text-red-600' :
                                                            f.followupResults === 'sale-closed' ? 'bg-emerald-50 text-emerald-600' :
                                                                'bg-amber-50 text-amber-600'
                                                    )}>
                                                        {f.followupResults}
                                                    </div>
                                                    <div className="text-slate-500 italic text-[10px] max-w-[180px] line-clamp-2 leading-relaxed">"{f.followupRemarks}"</div>
                                                </td>
                                                <td className="p-4 font-mono font-bold text-slate-600 text-[11px]">
                                                    {f.nextVisitDate ? new Date(f.nextVisitDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    }

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="space-y-1">
                            <label className="form-label">Follow-up Mode *</label>
                            <select className="input-field font-semibold text-xs h-[38px]" value={followUp.followupMode || ''} onChange={e => setFollowUp({ ...followUp, followupMode: e.target.value })}>
                                <option value="">Select Mode...</option>
                                {getOpt('FOLLOWUP_MODES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="form-label">Follow-up Type *</label>
                            <select
                                className="input-field font-semibold text-xs h-[38px]"
                                value={followUp.followupType || ''}
                                onChange={(e) => setFollowUp({ ...followUp, followupType: e.target.value })}
                                disabled={!followUp.followupMode}
                            >
                                <option value="">{followUp.followupMode ? 'Select Category' : 'Awaiting Mode...'}</option>
                                {filteredFollowupTypes.map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="space-y-1">
                            <label className="form-label">Follow-up Action *</label>
                            <select className="input-field text-xs font-semibold h-[38px]" value={followUp.followupActionDone || ''} onChange={e => setFollowUp({ ...followUp, followupActionDone: e.target.value })}>
                                <option value="">Select Action</option>
                                {getOpt('FOLLOWUP_ACTIONS').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="form-label">
                                Vehicle {VEHICLE_ACTIONS.includes(followUp.followupActionDone?.toLowerCase()) ? "(Optional)" : "*"}
                            </label>
                            <VehicleAutocomplete
                                placeholder="Registration Number..."
                                value={followUp.car?.registrationNumber || ''}
                                onChange={(car) => setFollowUp({ ...followUp, car: car || null })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div className="space-y-1">
                            <label className="form-label">Follow-up Result *</label>
                            <select className="input-field font-semibold text-xs h-[38px]" value={followUp.followupResults || ''} onChange={e => setFollowUp({ ...followUp, followupResults: e.target.value })}>
                                <option value="">Select Outcome...</option>
                                {getOpt('FOLLOWUP_RESULTS').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="form-label">
                                Next Follow-up Date {NEXT_VISIT_ACTIONS.includes(followUp.followupResults?.toLowerCase()) ? "(Optional)" : "*"}
                            </label>
                            <div className="relative group/date">
                                <input type="datetime-local" className="input-field !pr-10 h-[38px]" value={followUp.nextVisitDate || ''} min={getMinDateTime()} onChange={e => setFollowUp({ ...followUp, nextVisitDate: e.target.value })} />
                                {followUp.nextVisitDate && (
                                    <button type="button" onClick={() => setFollowUp({ ...followUp, nextVisitDate: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--danger)]">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="form-label mb-2 block">Remarks</label>
                        <textarea
                            className="input-field min-h-[80px] text-sm"
                            rows={3}
                            placeholder="Add internal remarks here..."
                            value={followUp.followupRemarks || ''}
                            onChange={e => setFollowUp({ ...followUp, followupRemarks: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 pb-10">
                    <button type="button" onClick={() => {
                        if (tabId) localStorage.removeItem(`vandi_lead_form_${tabId}`);
                        onCancel();
                    }} className="btn-secondary !px-8 h-10 font-bold uppercase text-[10px] tracking-widest" disabled={loading}>
                        <X size={14} /> Cancel
                    </button>
                    <button type="submit" className="btn-primary !px-12 h-10 font-bold uppercase text-[10px] tracking-widest shadow-md active:scale-[0.98]" disabled={loading}>
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={16} />}
                        <span>{loading ? 'Saving...' : 'Save Enquiry'}</span>
                    </button>
                </div>
            </form >
        </div >
    );
};

export default LeadForm;
