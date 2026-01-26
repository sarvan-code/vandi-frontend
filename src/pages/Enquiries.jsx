import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash, X, Plus, Calendar, Building, Briefcase, ClipboardList } from 'lucide-react';
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

    // Update filter when URL changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setFilterCustomerId(params.get('customerId'));
        setPage(1); // Reset to first page on filter change
    }, [location.search]);

    useEffect(() => {
        fetchEnquiries();
        if (filterCustomerId) {
            setIsEditMode(true);
            setCurrentEnquiry(null);
            fetchCustomerProfile(filterCustomerId);
        } else {
            setCustomerProfile(null);
        }
    }, [page, pageSize, filterCustomerId, selectedBranchId, selectedStatus, isSuperUser]);

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
        { key: 'customer', label: 'Customer', render: (row) => row.customer?.fullName || 'N/A' },
        {
            key: 'contact', label: 'Contact', render: (row) => (
                <div className="flex flex-col text-xs">
                    <span>{row.customer?.phone}</span>
                    <span className="text-gray-400">{row.customer?.email}</span>
                </div>
            )
        },
        {
            key: 'status', label: 'Status', render: (row) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${row.status === 'new' ? 'bg-blue-100 text-blue-800' : ''}
                    ${row.status === 'in-followup' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${row.status === 'booking-pending' ? 'bg-purple-100 text-purple-800' : ''}
                    ${row.status === 'closed' ? 'bg-gray-100 text-gray-800' : ''}
                    ${!['new', 'in-followup', 'booking-pending', 'closed'].includes(row.status) ? 'bg-gray-100 text-gray-800' : ''}
`}>
                    {row.status}
                </span>
            )
        },
        {
            key: 'carDetails', label: 'Car Interest',
            render: (row) => {
                if (!row.carDetails || row.carDetails.length === 0) return 'Any';
                const first = row.carDetails[0];
                const more = row.carDetails.length > 1 ? ` + ${row.carDetails.length - 1} ` : '';
                return `${first.carBrand || ''} ${first.carModel || ''} ${first.carVariant ? `(${first.carVariant})` : ''}${more} `;
            }
        },
        { key: 'budgetRange', label: 'Budget' },

        {
            key: 'lastFollowUp', label: 'Last Update',
            render: (row) => {
                if (!row.followUps || row.followUps.length === 0) return <span className="text-gray-400 text-xs">-</span>;
                const last = row.followUps[0];
                return (
                    <div className="text-xs">
                        <div className="font-semibold text-gray-700">{last.agent?.fullName || 'Unknown'}</div>
                        <div className="text-gray-600 truncate max-w-[150px]" title={`${last.followupActionDone} (${last.followupResults})`}>
                            {last.followupActionDone} <span className={`font - medium ${last.followupResults === 'in-price-negotiation' ? 'text-green-600' :
                                last.followupResults === 'booking-handedover' ? 'text-red-600' : 'text-blue-600'
                                } `}>({last.followupResults})</span>
                        </div>
                        <div className="text-gray-400 text-[10px]">
                            <span className={`font - medium  text-green-600`}>
                                {last.car?.registrationNumber}</span> {new Date(last.createdAt).toLocaleDateString()}</div>
                    </div>
                )
            }
        },
        {
            key: 'nextVisitDate', label: 'Next Visit', render: (row) => {
                if (!row.followUps || row.followUps.length === 0) return <span className="text-gray-400 text-xs">-</span>;
                const last = row.followUps[0];
                return new Date(last.nextVisitDate).toLocaleDateString()
            }
        },
        { key: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString() }
    ];

    return (
        <div>
            {(isViewMode || isEditMode) && (
                <div id="modal-container" className="mb-6 animate-fade-in-down scroll-mt-20 space-y-4">
                    {/* 1. Enquiry Details Card - NOW AT TOP */}
                    {currentEnquiry && (
                        <div className={`bg-white rounded-lg shadow-lg p-6 relative border-l-4 ${currentEnquiry.enquiryId ? 'border-blue-500' : 'border-green-500'}`}>
                            <button
                                onClick={closeEnquiryBlock}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                title="Close Enquiry Details"
                            >
                                <X size={24} />
                            </button>

                            <h2 className="text-xl font-semibold mb-4 text-gray-800">
                                {isViewMode ? 'Enquiry Details' : (currentEnquiry.enquiryId ? 'Edit Enquiry' : 'New Enquiry')}
                            </h2>

                            {isViewMode ? (
                                <>
                                    <EnquirySnapshot
                                        enquiry={currentEnquiry}
                                        customer={selectedCustomer || customerProfile}
                                        getOptionList={getOptionList}
                                        showCustomer={false} // Hide repeated customer info
                                    />
                                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                        <button
                                            type="button"
                                            onClick={closeEnquiryBlock}
                                            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 bg-white"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleSave} className="space-y-4">
                                    <fieldset disabled={isViewMode} className="contents">
                                        {/* 1. Customer Selection */}
                                        <div className="bg-gray-50 rounded mb-3">
                                            <div className="flex justify-between items-end">
                                                <div className="flex-grow">
                                                    <CustomerSearch
                                                        customers={customers}
                                                        onSearch={searchCustomers}
                                                        onSelect={handleCustomerSelect}
                                                        selectedCustomer={selectedCustomer || customerProfile}
                                                        disabled={!!currentEnquiry?.enquiryId || isViewMode || (!!filterCustomerId && !currentEnquiry?.enquiryId)}
                                                    />
                                                </div>
                                                {isViewMode && currentEnquiry?.enquiryId && (
                                                    <div className="ml-4 text-right">
                                                        <p className="text-xs text-blue-600 uppercase font-semibold">Enquiry ID</p>
                                                        <p className="text-sm text-gray-600">{currentEnquiry.enquiryId}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 2. Basic Enquiry Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Enquiry Type</label>
                                                <div className="flex gap-4 mt-2">
                                                    <label className="flex items-center">
                                                        <input
                                                            type="radio" name="enquiryType" value="Buy"
                                                            checked={currentEnquiry?.enquiryType === 'Buy'}
                                                            onChange={e => setCurrentEnquiry({ ...currentEnquiry, enquiryType: e.target.value })}
                                                            className="mr-2"
                                                        /> Buy
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input
                                                            type="radio" name="enquiryType" value="Sell"
                                                            checked={currentEnquiry?.enquiryType === 'Sell'}
                                                            onChange={e => setCurrentEnquiry({ ...currentEnquiry, enquiryType: e.target.value })}
                                                            className="mr-2"
                                                        /> Sell
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                                <input
                                                    className="mt-1 block w-full border p-2 rounded-md bg-gray-50 text-gray-600 font-semibold uppercase cursor-not-allowed"
                                                    value={currentEnquiry?.status || 'new'}
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        {/* 3. Vehicle Details */}
                                        <div className="bg-blue-50 p-3 rounded mb-4 mt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="font-semibold text-gray-700 text-sm">Vehicle Details</label>
                                                {!isViewMode && (
                                                    <button type="button" onClick={() => {
                                                        const mk = [...(currentEnquiry.carDetails || [])];
                                                        mk.push({ carType: '', carBrand: '', carModel: '', carVariant: '' });
                                                        setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                    }} className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1"> <Plus size={14} /> Add </button>
                                                )}
                                            </div>
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
                                                    <div key={idx} className="flex gap-2 mb-2 items-end">
                                                        <select className="flex-1 border p-1 rounded text-sm"
                                                            value={selectedBrandObj?.name || car.carBrand || ''}
                                                            onChange={e => {
                                                                const mk = [...currentEnquiry.carDetails];
                                                                mk[idx].carBrand = e.target.value;
                                                                mk[idx].carType = '';
                                                                mk[idx].carModel = '';
                                                                mk[idx].carVariant = '';
                                                                setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                            }}>
                                                            <option value="">Brand...</option>
                                                            {vehicleBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                        </select>
                                                        <select className="flex-1 border p-1 rounded text-sm"
                                                            value={selectedTypeObj?.name || car.carType || ''}
                                                            onChange={e => {
                                                                const mk = [...currentEnquiry.carDetails];
                                                                mk[idx].carType = e.target.value;
                                                                mk[idx].carModel = '';
                                                                mk[idx].carVariant = '';
                                                                setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                            }}>
                                                            <option value="">Type...</option>
                                                            {availableTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                        </select>
                                                        <select className="flex-1 border p-1 rounded text-sm"
                                                            value={selectedModelObj?.name || car.carModel || ''}
                                                            onChange={e => {
                                                                const mk = [...currentEnquiry.carDetails];
                                                                mk[idx].carModel = e.target.value;
                                                                mk[idx].carVariant = '';
                                                                setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                            }}>
                                                            <option value="">Model...</option>
                                                            {filteredModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                                        </select>
                                                        <select className="flex-1 border p-1 rounded text-sm"
                                                            value={selectedVariantObj?.name || car.carVariant || ''}
                                                            onChange={e => {
                                                                const mk = [...currentEnquiry.carDetails]; mk[idx].carVariant = e.target.value; setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                            }}>
                                                            <option value="">Variant...</option>
                                                            {filteredVariants.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                                        </select>

                                                        {!isViewMode && (
                                                            <button type="button" onClick={() => {
                                                                const mk = currentEnquiry.carDetails.filter((_, i) => i !== idx);
                                                                setCurrentEnquiry({ ...currentEnquiry, carDetails: mk });
                                                            }} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash size={16} /></button>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            <input
                                                className="w-full border p-2 text-sm rounded mt-1"
                                                placeholder="Car Detail Remarks..."
                                                value={currentEnquiry.carDetailRemarks || ''}
                                                onChange={e => setCurrentEnquiry({ ...currentEnquiry, carDetailRemarks: e.target.value })}
                                            />
                                        </div>

                                        {/* 4. Additional Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Budget Range</label>
                                                <select
                                                    className="mt-1 block w-full border p-2 rounded-md"
                                                    value={currentEnquiry?.budgetRange || ''}
                                                    onChange={(e) => setCurrentEnquiry({ ...currentEnquiry, budgetRange: e.target.value })}
                                                >
                                                    <option value="">Select...</option>
                                                    {getOpt('BUDGET_RANGES').map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Budget Remarks</label>
                                                <input
                                                    className="mt-1 block w-full border p-2 rounded-md"
                                                    placeholder="Any specific budget details..."
                                                    value={currentEnquiry?.budgetRemarks || ''}
                                                    onChange={e => setCurrentEnquiry({ ...currentEnquiry, budgetRemarks: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Fuel Type</label>
                                                <select
                                                    className="mt-1 block w-full border p-2 rounded-md"
                                                    value={currentEnquiry?.fuelType || ''}
                                                    onChange={(e) => setCurrentEnquiry({ ...currentEnquiry, fuelType: e.target.value })}
                                                >
                                                    <option value="">Select...</option>
                                                    {getOpt('FUEL_TYPES').map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Usage Type</label>
                                                <select
                                                    className="mt-1 block w-full border p-2 rounded-md"
                                                    value={currentEnquiry?.usageType || ''}
                                                    onChange={(e) => setCurrentEnquiry({ ...currentEnquiry, usageType: e.target.value })}
                                                >
                                                    <option value="">Select...</option>
                                                    {getOpt('USAGE_TYPES').map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                                                <select
                                                    className="mt-1 block w-full border p-2 rounded-md"
                                                    value={currentEnquiry?.payment || ''}
                                                    onChange={(e) => setCurrentEnquiry({ ...currentEnquiry, payment: e.target.value })}
                                                >
                                                    <option value="">Select...</option>
                                                    {getOpt('PAYMENT_MODES').map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4 mt-4">
                                            <label className="flex items-center gap-2 font-medium text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={currentEnquiry.exchange || false}
                                                    onChange={e => setCurrentEnquiry({ ...currentEnquiry, exchange: e.target.checked })}
                                                /> Exchange Vehicle?
                                            </label>
                                            {currentEnquiry.exchange && (
                                                <input
                                                    className="mt-2 w-full border p-2 rounded"
                                                    placeholder="Exchange Vehicle Details"
                                                    value={currentEnquiry.exchangeDetail || ''}
                                                    onChange={e => setCurrentEnquiry({ ...currentEnquiry, exchangeDetail: e.target.value })}
                                                />
                                            )}
                                        </div>

                                    </fieldset>

                                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                        {!isViewMode && (
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Save
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={closeEnquiryBlock}
                                            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 bg-white"
                                        >
                                            {isViewMode ? 'Close' : 'Cancel'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* 2. Customer Profile - NOW AT BOTTOM */}
                    {(customerProfile || selectedCustomer) && (
                        <CustomerProfile customer={selectedCustomer || customerProfile} />
                    )}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between my-4 gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {isSuperUser && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                            <Building size={16} className="text-gray-400" />
                            <select
                                className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-gray-700 min-w-[120px]"
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

                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                        <ClipboardList size={16} className="text-gray-400" />
                        <select
                            className="flex-1 bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer min-w-[120px]"
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="" disabled>Select Status...</option>
                            {getOpt('ENQUIRY_STATUSES').map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {filterCustomerId && (
                        <button
                            onClick={() => {
                                setSelectedStatus('new');
                                navigate('/enquiries');
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap text-sm font-medium"
                        >
                            Display All Enquiry
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setCurrentEnquiry({ status: 'new', enquiryType: 'Buy', carDetails: [] });
                            if (filterCustomerId && customerProfile) {
                                setSelectedCustomer(customerProfile);
                                setCurrentEnquiry(prev => ({ ...prev, customerId: customerProfile.customerId }));
                            } else {
                                setSelectedCustomer(null);
                            }
                            setIsViewMode(false);
                            setIsEditMode(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium"
                    >
                        <Plus size={18} /> New Enquiry
                    </button>
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
                            icon: Eye,
                            label: 'View Details',
                            onClick: handleView,
                            color: 'gray',
                            title: 'View Details'
                        },
                        // Show Edit only if active
                        ...(['new', 'in-followup'].includes(selectedEnquiry?.status) ? [{
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
                            onClick: (enq) => openWorkspaceWithEnquiry(enq.enquiryId, enq.customerId, enq.customer?.phone, enq.branchId),
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
                            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalEnquiries)}</span> of{' '}
                            <span className="font-medium">{totalEnquiries}</span> results
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
