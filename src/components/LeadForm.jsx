import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Save, History, PlusCircle, Search, X, Plus, Trash2 } from 'lucide-react';
import { useOptions } from '../context/OptionsContext';
import VehicleAutocomplete from './VehicleAutocomplete';

const LeadForm = ({ onSave, onCancel, tabId, preloadedEnquiryId, preloadedCustomerId, preloadedPhone, preloadedBranchId }) => {
    const { user } = useContext(AuthContext);
    const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(user?.role);
    const { getOptionList, getDependentOptions, vehicleBrands, vehicleTypes, vehicleModels, vehicleVariants, branches, loading: optionsLoading } = useOptions();
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const { showToast } = useToast();

    const [filteredFollowupTypes, setFilteredFollowupTypes] = useState([]);

    // ---- State ----
    const [loading, setLoading] = useState(false);
    const [searchPhone, setSearchPhone] = useState('');

    // Search / Autocomplete State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

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
        carDetails: [] // [{carType, carBrand, carModel, carVariant}]
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

    // Initial Data for Change Detection
    const [initialCustomer, setInitialCustomer] = useState(null);
    const [initialEnquiry, setInitialEnquiry] = useState(null);

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
                    if (data.customer) setCustomer(data.customer);
                    if (data.enquiry) setEnquiry(data.enquiry);
                    if (data.followUp) setFollowUp(data.followUp);
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
                history
            };
            localStorage.setItem(`vandi_lead_form_${tabId}`, JSON.stringify(dataToSave));
        }
    }, [tabId, customer, enquiry, followUp, selectedBranchId, activeEnquiryId, isNewEnquiry, history]);

    // Helper to get options from context
    const getOpt = (key) => getOptionList(key);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                if (isSuperUser && !selectedBranchId) {
                    showToast("Please select a Branch first.", "warning");
                    setIsSearching(false);
                    return;
                }
                setIsSearching(true);
                try {
                    const res = await api.get(`/leads/search?term=${searchQuery}${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`);
                    if (res.data.found && res.data.data) {
                        setSearchResults(res.data.data);
                        setShowDropdown(true);
                    } else {
                        setSearchResults([]);
                        setShowDropdown(false);
                    }
                } catch (error) {
                    console.error("Search error", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, selectedBranchId, isSuperUser]);

    useEffect(() => {
        if (followUp.followupMode) {
            const types = getDependentOptions('FOLLOWUP_TYPES', 'FOLLOWUP_MODES', followUp.followupMode);
            setFilteredFollowupTypes(types);
        } else {
            setFilteredFollowupTypes([]);
        }
    }, [followUp.followupMode, getDependentOptions]);

    // Load pre-loaded enquiry if provided
    useEffect(() => {
        if (preloadedEnquiryId || preloadedCustomerId || preloadedPhone) {
            setLoading(true);
            const loadPreloadedEnquiry = async () => {
                try {
                    // Optimized Path: Smart Search (Now with Branch context)
                    if (preloadedPhone) {
                        const res = await api.get('/leads/search', {
                            params: {
                                term: preloadedPhone,
                                branchId: preloadedBranchId
                            }
                        });

                        if (res.data.found && res.data.data && res.data.data.length > 0) {
                            handleSelectResult(res.data.data[0]);
                            setLoading(false);
                            return;
                        }
                    }

                    // Fallback: If search fails or phone is missing, we log it.
                    // The "Legacy Path" has been removed per user instruction.
                    console.log("No active lead context found for preloaded data.");

                } catch (error) {
                    console.error('Error loading pre-loaded enquiry:', error);
                    showToast('Error loading enquiry data', 'error');
                } finally {
                    setLoading(false);
                }
            };
            loadPreloadedEnquiry();
        }
    }, [preloadedEnquiryId, preloadedCustomerId, preloadedPhone, preloadedBranchId]);

    const handleSelectResult = (result) => {
        const { customer: custData, activeEnquiry, history: histData } = result;
        const sanitizedCust = { ...custData };
        setCustomer(sanitizedCust);
        setInitialCustomer(JSON.stringify(sanitizedCust));
        setHistory([]); // Clear history when context changes
        setShowHistory(false);

        if (activeEnquiry) {
            showToast(`Found active enquiry (Status: ${activeEnquiry.status}). Loading it...`, "info");
            setActiveEnquiryId(activeEnquiry.enquiryId);
            if (activeEnquiry.branchId) setSelectedBranchId(activeEnquiry.branchId);
            const sanitizedEnq = { ...activeEnquiry };
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
        setShowDropdown(false);
        setSearchQuery('');
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

        const isGeneralQuery = (followUp.followupActionDone || "").toLowerCase() === "general-query";
        if (!isGeneralQuery && !followUp.car) {
            showToast("Vehicle Number is mandatory for the selected Follow-up Action.", "warning");
            return;
        }

        if (!followUp.nextVisitDate) {
            showToast("Next Visit / Contact Date is mandatory.", "warning");
            return;
        }

        setLoading(true);
        const currentCustJSON = JSON.stringify(customer);
        const currentEnqJSON = JSON.stringify(enquiry);
        const skipCustomerUpdate = customer.customerId && initialCustomer === currentCustJSON;
        const skipEnquiryUpdate = !isNewEnquiry && initialEnquiry === currentEnqJSON;
        console.log("followUp", followUp);
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
        <div className="h-full flex flex-col bg-gray-50 p-4 overflow-y-auto">
            <form onSubmit={handleSubmit} className="flex-1 space-y-4" autoComplete="off">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 relative">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">Customer Details</h3>
                        {isSuperUser && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Branch:</label>
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(e.target.value)}
                                    className="text-sm border rounded px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
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
                    <div className="mb-4 relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                name="lead_search"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Search Name or Phone to Auto-fill..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoComplete="nope"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-auto">
                                {searchResults.map((res) => (
                                    <div
                                        key={res.customer.customerId || res.customer.phone || res.customer.id}
                                        onClick={() => handleSelectResult(res)}
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-medium text-gray-800">{res.customer.fullName}</div>
                                            <div className="text-sm text-gray-500">{res.customer.phone}</div>
                                        </div>
                                        {res.activeEnquiry && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Active</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {isSearching && <div className="absolute right-10 top-2.5 text-xs text-gray-400">Searching...</div>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input className="border p-2 rounded" placeholder="Full Name" value={customer.fullName} onChange={e => setCustomer({ ...customer, fullName: e.target.value })} required />
                        <input
                            className={`border p-2 rounded ${customer.customerId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Phone Number"
                            value={customer.phone}
                            onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                            required
                            readOnly={!!customer.customerId}
                        />
                        <input className="border p-2 rounded" placeholder="Email" value={customer.email || ''} onChange={e => setCustomer({ ...customer, email: e.target.value })} />
                        <input className="border p-2 rounded" placeholder="Instagram ID" value={customer.instaid || ''} onChange={e => setCustomer({ ...customer, instaid: e.target.value })} />
                        <div>
                            <label className="text-xs text-gray-500">Date of Birth</label>
                            <input type="date" className="w-full border p-2 rounded" max={new Date().toISOString().split("T")[0]} value={customer.dateOfBirth || ''} onChange={e => setCustomer({ ...customer, dateOfBirth: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Marriage Date</label>
                            <input type="date" className="w-full border p-2 rounded" max={new Date().toISOString().split("T")[0]} value={customer.marriageDate || ''} onChange={e => setCustomer({ ...customer, marriageDate: e.target.value })} />
                        </div>
                        <select className="w-full border p-2 rounded text-sm h-[42px]" value={customer.profession} onChange={e => setCustomer({ ...customer, profession: e.target.value })}>
                            <option value="">Select Profession</option>
                            {getOpt('PROFESSIONS').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                        </select>
                        <select className="border p-2 rounded" value={customer.customerType || 'Lead'} onChange={e => setCustomer({ ...customer, customerType: e.target.value })}>
                            <option value="Lead">Lead</option>
                            <option value="Customer">Customer</option>
                        </select>
                    </div>

                    <div className="border-t pt-2 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referral</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select className="w-full border p-2 rounded text-sm h-[42px]" value={customer.referredBy} onChange={e => setCustomer({ ...customer, referredBy: e.target.value })}>
                                <option value="">Select Referral Source</option>
                                {getOpt('REFERRAL_SOURCES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                            <input className="border p-2 rounded" placeholder="Referrer Name" value={customer.referredByName || ''} onChange={e => setCustomer({ ...customer, referredByName: e.target.value })} />
                        </div>
                    </div>

                    <div className="border-t pt-2 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <input className="border p-2 rounded md:col-span-2" placeholder="Address Line" value={customer.address || ''} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
                            <input className="border p-2 rounded" placeholder="Landmark" value={customer.landMark || ''} onChange={e => setCustomer({ ...customer, landMark: e.target.value })} />
                            <input className="border p-2 rounded" placeholder="District" value={customer.district || ''} onChange={e => setCustomer({ ...customer, district: e.target.value })} />
                            <input className="border p-2 rounded" placeholder="State" value={customer.state || ''} onChange={e => setCustomer({ ...customer, state: e.target.value })} />
                            <input className="border p-2 rounded" placeholder="Country" value={customer.country || ''} onChange={e => setCustomer({ ...customer, country: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className={`bg-white p-4 rounded-lg shadow border-l-4 ${isNewEnquiry ? 'border-green-500' : 'border-purple-500'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {isNewEnquiry ? 'New Enquiry' : 'Active Enquiry'}
                        </h3>
                        {!isNewEnquiry && (
                            <button
                                type="button"
                                onClick={handleForceNewEnquiry}
                                disabled={!!activeEnquiryId}
                                className={`text - sm px - 3 py - 1 rounded - full flex items - center gap - 1 ${!!activeEnquiryId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'} `}
                            >
                                <PlusCircle className="h-4 w-4" /> Start New Instead
                            </button>
                        )}
                        {(customer.customerId) && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (!showHistory && history.length === 0) {
                                        fetchHistory();
                                    } else {
                                        setShowHistory(!showHistory);
                                    }
                                }}
                                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                disabled={isHistoryLoading}
                            >
                                <History className={`h-4 w-4 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                                {isHistoryLoading ? 'Loading...' : (showHistory ? 'Hide History' : 'View History')}
                            </button>
                        )}
                    </div>

                    {showHistory && (
                        <div className="mb-4 bg-gray-50 p-3 rounded text-sm text-gray-600">
                            <h4 className="font-medium mb-2">Past Enquiries:</h4>
                            {history.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1">
                                    {history.map(h => (
                                        <li key={h.enquiryId}>
                                            {h.branch && <span className="font-bold text-blue-700 mr-2">[{h.branch.displayName}]</span>}
                                            <span className="font-medium">{h.enquiryType}</span> -
                                            {h.carDetails && h.carDetails.length > 0 ? (
                                                <span> {h.carDetails.map(c => `${c.carBrand} ${c.carModel}`).join(', ')}</span>
                                            ) : ' No vehicle details'}
                                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${h.status === 'converted' ? 'bg-green-100 text-green-700' :
                                                h.status === 'lost' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-200 text-gray-600'
                                                }`}> {h.status} </span> - {new Date(h.createdAt).toLocaleDateString()}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="italic text-gray-400">No past enquiries found for this customer.</p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Enquiry Type</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center"><input type="radio" name="enquiryType" value="Buy" checked={enquiry.enquiryType === 'Buy'} onChange={e => setEnquiry({ ...enquiry, enquiryType: e.target.value })} className="mr-2" /> Buy</label>
                                <label className="flex items-center"><input type="radio" name="enquiryType" value="Sell" checked={enquiry.enquiryType === 'Sell'} onChange={e => setEnquiry({ ...enquiry, enquiryType: e.target.value })} className="mr-2" /> Sell</label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <input
                                className="mt-1 w-full border p-2 rounded text-sm bg-gray-50 text-gray-600 font-semibold uppercase cursor-not-allowed"
                                value={enquiry.status || 'new'}
                                readOnly
                                disabled
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-semibold text-gray-700 text-sm">Vehicle Details</label>
                            <button type="button" onClick={() => {
                                const mk = [...(enquiry.carDetails || [])];
                                mk.push({ carType: '', carBrand: '', carModel: '', carVariant: '' });
                                setEnquiry({ ...enquiry, carDetails: mk });
                            }} className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1"> <Plus size={14} /> Add </button>
                        </div>
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
                                <div key={idx} className="flex gap-2 mb-2 items-end">
                                    <select className="flex-1 border p-1 rounded text-sm" value={car.carBrand || ''} onChange={e => {
                                        const mk = [...enquiry.carDetails];
                                        mk[idx].carBrand = e.target.value; mk[idx].carType = ''; mk[idx].carModel = ''; mk[idx].carVariant = '';
                                        setEnquiry({ ...enquiry, carDetails: mk });
                                    }}>
                                        <option value="">Brand...</option>
                                        {vehicleBrands.map((b, i) => <option key={b.id || i} value={b.name}>{b.name}</option>)}
                                    </select>
                                    <select className="flex-1 border p-1 rounded text-sm" value={car.carType || ''} onChange={e => {
                                        const mk = [...enquiry.carDetails];
                                        mk[idx].carType = e.target.value; mk[idx].carModel = ''; mk[idx].carVariant = '';
                                        setEnquiry({ ...enquiry, carDetails: mk });
                                    }}>
                                        <option value="">Type...</option>
                                        {availableTypes.map((t, i) => <option key={t.id || i} value={t.name}>{t.name}</option>)}
                                    </select>
                                    <select className="flex-1 border p-1 rounded text-sm" value={car.carModel || ''} onChange={e => {
                                        const mk = [...enquiry.carDetails]; mk[idx].carModel = e.target.value; mk[idx].carVariant = '';
                                        setEnquiry({ ...enquiry, carDetails: mk });
                                    }}>
                                        <option value="">Model...</option>
                                        {filteredModels.map((m, i) => <option key={m.id || i} value={m.name}>{m.name}</option>)}
                                    </select>
                                    <select className="flex-1 border p-1 rounded text-sm" value={car.carVariant || ''} onChange={e => {
                                        const mk = [...enquiry.carDetails]; mk[idx].carVariant = e.target.value;
                                        setEnquiry({ ...enquiry, carDetails: mk });
                                    }}>
                                        <option value="">Variant...</option>
                                        {filteredVariants.map((v, i) => <option key={v.id || i} value={v.name}>{v.name}</option>)}
                                    </select>
                                    <button type="button" onClick={() => {
                                        const mk = enquiry.carDetails.filter((_, i) => i !== idx);
                                        setEnquiry({ ...enquiry, carDetails: mk });
                                    }} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </div>
                            );
                        })}
                        <input className="w-full border p-2 text-sm rounded mt-1" placeholder="Car Detail Remarks..." value={enquiry.carDetailRemarks || ''} onChange={e => setEnquiry({ ...enquiry, carDetailRemarks: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select className="w-full border p-2 rounded text-sm h-[42px]" value={enquiry.budgetRange || ''} onChange={e => setEnquiry({ ...enquiry, budgetRange: e.target.value })}>
                            <option value="">Budget Range</option>
                            {getOpt('BUDGET_RANGES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                        </select>
                        <input className="border p-2 rounded" placeholder="Budget Remarks" value={enquiry.budgetRemarks || ''} onChange={e => setEnquiry({ ...enquiry, budgetRemarks: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <select className="w-full border p-2 rounded text-sm h-[42px]" value={enquiry.fuelType || ''} onChange={e => setEnquiry({ ...enquiry, fuelType: e.target.value })}>
                            <option value="">Fuel Type</option>
                            {getOpt('FUEL_TYPES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                        </select>
                        <select className="border p-2 rounded h-[42px]" value={enquiry.usageType || ''} onChange={e => setEnquiry({ ...enquiry, usageType: e.target.value })}>
                            <option value="">Usage...</option>
                            {getOpt('USAGE_TYPES').map((u, i) => <option key={u.value || i} value={u.value}>{u.label}</option>)}
                        </select>
                        <select className="w-full border p-2 rounded text-sm h-[42px]" value={enquiry.payment || ''} onChange={e => setEnquiry({ ...enquiry, payment: e.target.value })}>
                            <option value="">Payment Mode</option>
                            {getOpt('PAYMENT_MODES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="border-t pt-2 mt-4">
                        <label className="flex items-center gap-2 font-medium text-gray-700">
                            <input type="checkbox" checked={enquiry.exchange || false} onChange={e => setEnquiry({ ...enquiry, exchange: e.target.checked })} /> Exchange Vehicle?
                        </label>
                        {enquiry.exchange && (
                            <input className="mt-2 w-full border p-2 rounded" placeholder="Exchange Vehicle Details" value={enquiry.exchangeDetail || ''} onChange={e => setEnquiry({ ...enquiry, exchangeDetail: e.target.value })} />
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">Schedule Follow-up</h3>
                        {enquiry.followUps && enquiry.followUps.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowFollowUpHistory(!showFollowUpHistory)}
                                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                                <History className="h-4 w-4" /> {showFollowUpHistory ? 'Hide Past Follow-ups' : 'View Past Follow-ups'}
                            </button>
                        )}
                    </div>

                    {showFollowUpHistory && enquiry.followUps && (
                        <div className="mb-4 bg-amber-50 rounded-lg border border-amber-100 overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-amber-100/50 text-amber-900 font-semibold border-b border-amber-200">
                                    <tr>
                                        <th className="p-2">Date / Agent</th>
                                        <th className="p-2">Mode / Type</th>
                                        <th className="p-2">Action / Car</th>
                                        <th className="p-2">Result / Remarks</th>
                                        <th className="p-2">Next Visit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100">
                                    {enquiry.followUps.map((f, idx) => (
                                        <tr key={f.followUpId || idx} className="hover:bg-amber-100/30">
                                            <td className="p-2 align-top">
                                                <div className="font-bold">{new Date(f.createdAt).toLocaleDateString()}</div>
                                                <div className="text-gray-500 truncate max-w-[100px]" title={f.agent?.fullName}>{f.agent?.fullName || 'Unknown'}</div>
                                            </td>
                                            <td className="p-2 align-top">
                                                <div className="font-medium">{f.followupMode}</div>
                                                <div className="text-gray-500">{f.followupType}</div>
                                            </td>
                                            <td className="p-2 align-top">
                                                <div className="font-medium">{f.followupActionDone}</div>
                                                {f.car && <div className="font-bold bg-blue-100 uppercase text-[10px] px-1.5 py-0.5 rounded w-fit mb-1">{f.car?.registrationNumber}</div>}
                                            </td>
                                            <td className="p-2 align-top">
                                                <div className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded w-fit mb-1 ${f.followupResults === 'not-interested' ? 'bg-red-100 text-red-700' :
                                                    f.followupResults === 'sale-closed' ? 'bg-green-100 text-green-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {f.followupResults}
                                                </div>
                                                <div className="text-gray-600 italic leading-tight">{f.followupRemarks}</div>
                                            </td>
                                            <td className="p-2 align-top font-medium text-gray-700">
                                                {f.nextVisitDate ? new Date(f.nextVisitDate).toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 font-medium">Mode <span className="text-red-500">*</span></label>
                            <select className="w-full border p-2 rounded text-sm h-[42px]" value={followUp.followupMode || ''} onChange={e => setFollowUp({ ...followUp, followupMode: e.target.value })}>
                                <option value="">Select...</option>
                                {getOpt('FOLLOWUP_MODES').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-medium">Type <span className="text-red-500">*</span></label>
                            <select
                                className="w-full border p-2 rounded text-sm h-[42px]"
                                value={followUp.followupType || ''}
                                onChange={e => setFollowUp({ ...followUp, followupType: e.target.value })}
                                disabled={!followUp.followupMode}
                            >
                                <option value="">{followUp.followupMode ? 'Select Type...' : 'Select Mode First...'}</option>
                                {filteredFollowupTypes.map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs text-gray-500 font-medium">Action Done <span className="text-red-500">*</span></label>
                            <select className="w-full border p-2 rounded text-sm h-[42px]" value={followUp.followupActionDone || ''} onChange={e => setFollowUp({ ...followUp, followupActionDone: e.target.value })}>
                                <option value="">Select...</option>
                                {getOpt('FOLLOWUP_ACTIONS').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500 font-medium">
                                Vehicle Number {(followUp.followupActionDone || "").toLowerCase() === "general-query" ? "(Optional)" : "*"}
                            </label>
                            <VehicleAutocomplete
                                placeholder="Enter Vehicle Number"
                                value={followUp.car?.registrationNumber || ''}
                                onChange={(car) => setFollowUp({ ...followUp, car: car || null })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs text-gray-500 font-medium">Results <span className="text-red-500">*</span></label>
                            <select className="w-full border p-2 rounded text-sm h-[42px]" value={followUp.followupResults} onChange={e => setFollowUp({ ...followUp, followupResults: e.target.value })}>
                                <option value="">Select...</option>
                                {getOpt('FOLLOWUP_RESULTS').map((o, i) => <option key={o.value || i} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-medium">Next Visit / Contact <span className="text-red-500">*</span></label>
                            <input type="datetime-local" className="w-full border p-2 rounded" value={followUp.nextVisitDate || ''} min={getMinDateTime()} onChange={e => setFollowUp({ ...followUp, nextVisitDate: e.target.value })} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <textarea className="w-full border p-2 rounded" rows={2} placeholder="Follow-up Remarks..." value={followUp.followupRemarks || ''} onChange={e => setFollowUp({ ...followUp, followupRemarks: e.target.value })} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => {
                        if (tabId) localStorage.removeItem(`vandi_lead_form_${tabId}`);
                        onCancel();
                    }} className="px-6 py-2 border border-blue-100 bg-blue-50 text-blue-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-medium transition-colors" disabled={loading}>Close Tab</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2" disabled={loading}>
                        <Save className="h-5 w-5" /> {loading ? 'Saving...' : 'Save Lead'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LeadForm;
