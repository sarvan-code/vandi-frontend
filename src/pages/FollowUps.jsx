import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Eye, Edit, Trash, Calendar, User, Phone, MapPin, Briefcase, Info, Car, Wallet, ArrowRightLeft, X } from 'lucide-react';
import api from '../api';
import Table from '../components/Table';
import CustomerSearch from '../components/CustomerSearch';
import EnquirySearch from '../components/EnquirySearch';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useOptions } from '../context/OptionsContext';
import ConfirmDialog from '../components/ConfirmDialog';

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
    const { getOptionList } = useOptions();
    // Helper to get options
    const getOpt = (key) => getOptionList(key);

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
            const response = await api.get(`/customers?search=${searchTerm}`);
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

        const isGeneralQuery = (currentFollowUp.followupActionDone || "").toLowerCase() === "general-query";
        if (!isGeneralQuery && !currentFollowUp.followupCar) {
            showToast("Vehicle Number is mandatory for the selected Action.", "warning");
            return;
        }

        if (!currentFollowUp.nextVisitDate) {
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
                followupCar: currentFollowUp.followupCar,
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
        { key: 'agent', label: 'Done By', render: (row) => row.agent?.fullName || 'N/A' },
        {
            key: 'followupMode', label: 'Mode', render: (row) => (
                <span className="capitalize">{row.followupMode}</span>
            )
        },
        { key: 'followupType', label: 'Type' },
        { key: 'followupActionDone', label: 'Action' },
        { key: 'followupCar', label: 'Vehicle' },
        {
            key: 'followupResults', label: 'Results', render: (row) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${row.followupResults === 'Booked' ? 'bg-green-100 text-green-800' : ''}
                    ${row.followupResults === 'Closed' ? 'bg-gray-100 text-gray-800' : ''}
                    ${row.followupResults === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${!row.followupResults || row.followupResults === '' ? 'bg-gray-50 text-gray-500' : ''}
                `}>
                    {row.followupResults || 'N/A'}
                </span>
            )
        },
        { key: 'followupRemarks', label: 'Remarks', render: (row) => <span className="text-xs text-gray-500 truncate block max-w-[150px]">{row.followupRemarks}</span> },
        { key: 'nextVisitDate', label: 'Next Visit', render: (row) => row.nextVisitDate ? <span className="text-blue-600 font-medium">{new Date(row.nextVisitDate).toLocaleDateString()}</span> : '-' },
        { key: 'updatedAt', label: 'Updated At', render: (row) => new Date(row.updatedAt).toLocaleString() },
        {
            key: 'actions', label: 'Actions', render: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleView(row);
                        }}
                        className="text-gray-600 hover:text-gray-900 bg-gray-50 px-2 py-1 rounded-md text-sm border border-gray-200"
                        title="View Details"
                    >
                        <Eye size={16} />
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
                        className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded-md text-sm border border-red-200"
                    >
                        <Trash size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div>
            {/* Details Section */}
            {enquiryDetails && (
                <div className="bg-white shadow-lg rounded-xl mb-6 overflow-hidden border border-indigo-50">
                    <div
                        className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    >
                        <div className="flex items-center gap-2 text-indigo-900">
                            <Info size={20} />
                            <h2 className="text-lg font-semibold">Enquiry & Customer Snapshot</h2>
                        </div>
                        {isDetailsExpanded ? <ChevronUp className="h-5 w-5 text-indigo-500" /> : <ChevronDown className="h-5 w-5 text-indigo-500" />}
                    </div>

                    {isDetailsExpanded && (
                        <div className="px-6 py-6 sm:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                                {/* Divider for large screens */}
                                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 transform -translate-x-1/2"></div>

                                {/* Customer Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100">
                                        <User className="text-blue-500" size={18} />
                                        <h3 className="text-md font-bold text-gray-800">Customer Details</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div>
                                            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</dt>
                                            <dd className="mt-1 text-sm font-medium text-gray-900">{enquiryDetails.customer?.fullName}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</dt>
                                            <dd className={`mt-1 text-xs inline-flex font-semibold px-2 py-0.5 rounded-full ${enquiryDetails.customer?.customerType === 'Customer' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {enquiryDetails.customer?.customerType}
                                            </dd>
                                        </div>
                                        <div className="col-span-2">
                                            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <Phone size={12} /> Contact
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {enquiryDetails.customer?.phone}
                                                {enquiryDetails.customer?.altPhone && <span className="text-gray-500"> / {enquiryDetails.customer?.altPhone}</span>}
                                            </dd>
                                        </div>
                                        <div className="col-span-2">
                                            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <MapPin size={12} /> Address
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 truncate">
                                                {enquiryDetails.customer?.address || 'N/A'}, {enquiryDetails.customer?.city}
                                            </dd>
                                        </div>
                                        {enquiryDetails.customer?.profession && (
                                            <div>
                                                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Briefcase size={12} /> Profession
                                                </dt>
                                                <dd className="mt-1 text-sm text-gray-900">{enquiryDetails.customer?.profession}</dd>
                                            </div>
                                        )}
                                        {enquiryDetails.customer?.source && (
                                            <div>
                                                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{enquiryDetails.customer?.source}</dd>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Enquiry Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100">
                                        <Car className="text-purple-500" size={18} />
                                        <h3 className="text-md font-bold text-gray-800">Enquiry Info</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div className="col-span-2">
                                            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Car Interest</dt>

                                            <dd className="mt-1 text-sm font-bold text-indigo-700">
                                                {enquiryDetails.carDetails && enquiryDetails.carDetails.length > 0
                                                    ? enquiryDetails.carDetails
                                                        .map(car => `${car.carBrand} - ${car.carType} - ${car.carModel} ${car.carVariant}`)
                                                        .join(' | ') // Joins all strings with ' | ' as a separator
                                                    : 'ANY'
                                                }
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <Wallet size={12} /> Budget
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">{enquiryDetails.budgetRange || 'N/A'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</dt>
                                            <dd className={`mt-1 text-xs inline-flex font-semibold px-2 py-0.5 rounded-full 
                                                ${enquiryDetails.status === 'new' ? 'bg-blue-100 text-blue-800' : ''}
                                                ${enquiryDetails.status === 'purchased' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                                            `}>
                                                {enquiryDetails.status}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enquiry Type</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{enquiryDetails.enquiryType || 'Buy'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Mode</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{enquiryDetails.paymentMode || 'N/A'}</dd>
                                        </div>
                                        {enquiryDetails.exchange && (
                                            <div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-100">
                                                <dt className="text-xs font-semibold text-yellow-700 uppercase tracking-wider flex items-center gap-1">
                                                    <ArrowRightLeft size={12} /> Exchange
                                                </dt>
                                                <dd className="mt-1 text-sm text-yellow-900">{enquiryDetails.exchangeDetail}</dd>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {filterEnquiryId ? 'Enquiry Follow Ups' : 'Follow Ups'}
                </h1>
                <div className="flex gap-2">
                    {filterEnquiryId && (
                        <button
                            onClick={() => navigate('/follow-ups')}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Display All Followups
                        </button>
                    )}
                    <button
                        onClick={() => {
                            const newFollowUp = {};

                            // Context Aware Pre-fill
                            if (filterEnquiryId && enquiryDetails) {
                                // Pre-fill customer
                                if (enquiryDetails.customer) {
                                    setSelectedCustomer(enquiryDetails.customer);
                                }
                                // Pre-fill enquiry
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
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Calendar size={18} /> Schedule Follow-up
                    </button>
                </div>
            </div>

            {/* Form Block (Collapsible) */}
            {isModalOpen && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 relative animate-fade-in-down border-l-4 border-amber-500">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        {isViewMode ? 'Follow-up Details' : (currentFollowUp?.followUpId ? 'Edit Follow-up' : 'Schedule Follow-up')}
                    </h2>

                    <form onSubmit={handleSave} className="space-y-4">
                        <fieldset disabled={isViewMode} className="contents">
                            {/* In Add Mode, show selection. If context is locked, we still show them but disabled */}
                            {!currentFollowUp?.followUpId && !isViewMode && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                                        <CustomerSearch
                                            customers={customers}
                                            onSearch={searchCustomers}
                                            onSelect={handleCustomerSelect}
                                            selectedCustomer={selectedCustomer}
                                            disabled={!!filterEnquiryId}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Enquiry</label>
                                        <EnquirySearch
                                            enquiries={filterEnquiryId ? [enquiryDetails] : customerEnquiries} // Show only the active enquiry if filtered
                                            onSelect={handleEnquirySelect}
                                            selectedEnquiry={selectedEnquiry}
                                            disabled={!selectedCustomer || !!filterEnquiryId}
                                        />
                                    </div>
                                </div>
                            )}

                            {(currentFollowUp?.followUpId || isViewMode) && (
                                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-2 border border-blue-100 flex justify-between items-center">
                                    <div>
                                        <p>
                                            <span className="font-semibold">Customer:</span> {currentFollowUp.enquiry?.customer?.fullName || 'N/A'}
                                            {currentFollowUp.enquiry?.customer?.phone && <span className="ml-1 text-gray-500 text-xs">({currentFollowUp.enquiry.customer.phone})</span>}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Enquiry:</span> {(() => {
                                                const firstCar = currentFollowUp.enquiry?.carDetails?.[0];
                                                if (firstCar) return `${firstCar.carBrand} - ${firstCar.carType} - ${firstCar.carModel} ${firstCar.carVariant}`;
                                                return currentFollowUp.enquiry?.carInterest || 'N/A';
                                            })()}
                                            <span className="mx-2 text-gray-300">|</span>
                                            <span className="font-semibold">Status:</span>
                                            <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] uppercase font-bold">
                                                {currentFollowUp.enquiry?.status || 'N/A'}
                                            </span>
                                        </p>
                                    </div>
                                    {isViewMode && (
                                        <div className="text-right">
                                            <p className="text-xs text-blue-600 uppercase font-semibold">Follow-up ID</p>
                                            <p>{currentFollowUp.followUpId}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mode <span className="text-red-500">*</span></label>
                                    <select
                                        className="mt-1 block w-full border p-2 rounded-md"
                                        value={currentFollowUp?.followupMode || ''}
                                        onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupMode: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {getOpt('FOLLOWUP_MODES').map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type <span className="text-red-500">*</span></label>
                                    <select
                                        className="mt-1 block w-full border p-2 rounded-md"
                                        value={currentFollowUp?.followupType || ''}
                                        onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupType: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {getOpt('FOLLOWUP_TYPES').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Action Done <span className="text-red-500">*</span></label>
                                    <select
                                        className="mt-1 block w-full border p-2 rounded-md"
                                        value={currentFollowUp?.followupActionDone || ''}
                                        onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupActionDone: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {getOpt('FOLLOWUP_ACTIONS').map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Vehicle (Used for Visit) {(currentFollowUp?.followupActionDone || "").toLowerCase() === "general-query" ? <span className="text-gray-400 font-normal">(Optional)</span> : <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        className="mt-1 block w-full border p-2 rounded-md"
                                        placeholder="Enter vehicle number"
                                        value={currentFollowUp?.followupCar || ''}
                                        onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupCar: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Results <span className="text-red-500">*</span></label>
                                    <select
                                        className="mt-1 block w-full border p-2 rounded-md"
                                        value={currentFollowUp?.followupResults || ''}
                                        onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupResults: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {getOpt('FOLLOWUP_RESULTS').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Next Visit Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        className="mt-1 block w-full border p-2 rounded-md"
                                        value={currentFollowUp?.nextVisitDate ? new Date(currentFollowUp.nextVisitDate).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, nextVisitDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                                <textarea
                                    className="mt-1 block w-full border p-2 rounded-md"
                                    rows="3"
                                    value={currentFollowUp?.followupRemarks || ''}
                                    onChange={(e) => setCurrentFollowUp({ ...currentFollowUp, followupRemarks: e.target.value })}
                                ></textarea>
                            </div>
                        </fieldset>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            {!isViewMode && (
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Save Follow-up
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 bg-white"
                            >
                                {isViewMode ? 'Close' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <Table columns={columns} data={followUps} />

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">Previous</button>
                    <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">Next</button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalFollowUps)}</span> of <span className="font-medium">{totalFollowUps}</span> results</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <label htmlFor="pageSize" className="mr-2 text-sm text-gray-700">Rows per page:</label>
                            <select id="pageSize" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="block w-full rounded-md border-gray-300 py-1.5 text-base leading-5 text-gray-900 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-blue-500 sm:text-sm">
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100"><span className="sr-only">Previous</span><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg></button>
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">{page} / {totalPages}</span>
                            <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100"><span className="sr-only">Next</span><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg></button>
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
