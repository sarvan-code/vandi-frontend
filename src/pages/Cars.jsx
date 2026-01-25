import React, { useState, useEffect, useContext } from 'react';
import { Edit, Filter, Plus, X } from 'lucide-react';
import api from '../api';
import Table from '../components/Table';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { useOptions } from '../context/OptionsContext';
import { AuthContext } from '../context/AuthContext';

const Cars = () => {
    const { showToast } = useToast();
    const [cars, setCars] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCar, setCurrentCar] = useState(null);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const { getOptionList, vehicleBrands, vehicleTypes, vehicleModels, vehicleVariants, branches, loading: optionsLoading, refreshVehicles } = useOptions();
    const { user } = useContext(AuthContext);
    const inventoryStatuses = getOptionList('INVENTORY_STATUSES');

    const globalRoles = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE', 'HR_MGR', 'HR_ASSIS', 'AUTH_USER', 'GUEST'];
    const isGlobalUser = globalRoles.includes(user?.role);
    const canManageCars = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE', 'SALES_MGR'].includes(user?.role);

    useEffect(() => {
        fetchCars();
    }, [selectedBranchId]);

    const fetchCars = async () => {
        try {
            const response = await api.get('/cars', { params: { branchId: selectedBranchId } });
            setCars(response.data);
        } catch (error) {
            console.error('Error fetching cars:', error);
        }
    };

    // Manual Entry States
    const [manualEntry, setManualEntry] = useState({
        make: false,
        carType: false,
        model: false,
        variant: false
    });

    // Temp storage for new values before they are created
    const [newMasterValues, setNewMasterValues] = useState({
        make: '',
        carType: '',
        model: '',
        variant: ''
    });

    const handleCreateMaster = async (type) => {
        try {
            let payload = {};
            let endpoint = '';
            let newValue = '';

            switch (type) {
                case 'Brand':
                    newValue = newMasterValues.make;
                    if (!newValue) return showToast('Please enter a Brand name', 'warning');
                    payload = { name: newValue };
                    endpoint = '/vehicles/brands';
                    break;
                case 'Type':
                    newValue = newMasterValues.carType;
                    if (!newValue) return showToast('Please enter a Type', 'warning');
                    payload = { name: newValue };
                    endpoint = '/vehicles/types';
                    break;
                case 'Model':
                    newValue = newMasterValues.model;
                    if (!newValue) return showToast('Please enter a Model name', 'warning');
                    if (!currentCar.make || !selectedBrandObj) return showToast('Please select a valid Brand first', 'warning');
                    if (!currentCar.carType || !selectedTypeObj) return showToast('Please select a valid Type first', 'warning');

                    payload = {
                        name: newValue,
                        brandId: selectedBrandObj.id,
                        typeId: selectedTypeObj.id
                    };
                    endpoint = '/vehicles/models';
                    break;
                case 'Variant':
                    newValue = newMasterValues.variant;
                    if (!newValue) return showToast('Please enter a Variant name', 'warning');
                    if (!currentCar.model || !selectedModelObj) return showToast('Please select a valid Model first', 'warning');

                    payload = {
                        name: newValue,
                        modelId: selectedModelObj.id
                    };
                    endpoint = '/vehicles/variants';
                    break;
                default:
                    return;
            }

            const response = await api.post(endpoint, payload);
            showToast(`${type} created successfully!`, 'success');

            // Refresh options in background
            await refreshVehicles();

            // Auto-select the new value and close manual entry
            switch (type) {
                case 'Brand':
                    setManualEntry(prev => ({ ...prev, make: false }));
                    setNewMasterValues(prev => ({ ...prev, make: '' }));
                    setCurrentCar(prev => ({ ...prev, make: newValue }));
                    break;
                case 'Type':
                    setManualEntry(prev => ({ ...prev, carType: false }));
                    setNewMasterValues(prev => ({ ...prev, carType: '' }));
                    setCurrentCar(prev => ({ ...prev, carType: newValue }));
                    break;
                case 'Model':
                    setManualEntry(prev => ({ ...prev, model: false }));
                    setNewMasterValues(prev => ({ ...prev, model: '' }));
                    // Since model depends on brand/type, these should be set already
                    setCurrentCar(prev => ({ ...prev, model: newValue }));
                    break;
                case 'Variant':
                    setManualEntry(prev => ({ ...prev, variant: false }));
                    setNewMasterValues(prev => ({ ...prev, variant: '' }));
                    setCurrentCar(prev => ({ ...prev, variant: newValue }));
                    break;
            }

        } catch (error) {
            console.error(`Error creating ${type}:`, error);
            showToast(`Failed to create ${type}`, 'error');
        }
    };

    const handleCancelMaster = (type) => {
        switch (type) {
            case 'Brand':
                setManualEntry(prev => ({ ...prev, make: false }));
                setNewMasterValues(prev => ({ ...prev, make: '' }));
                setCurrentCar(prev => ({ ...prev, make: '' }));
                break;
            case 'Type':
                setManualEntry(prev => ({ ...prev, carType: false }));
                setNewMasterValues(prev => ({ ...prev, carType: '' }));
                setCurrentCar(prev => ({ ...prev, carType: '' }));
                break;
            case 'Model':
                setManualEntry(prev => ({ ...prev, model: false }));
                setNewMasterValues(prev => ({ ...prev, model: '' }));
                setCurrentCar(prev => ({ ...prev, model: '' }));
                break;
            case 'Variant':
                setManualEntry(prev => ({ ...prev, variant: false }));
                setNewMasterValues(prev => ({ ...prev, variant: '' }));
                setCurrentCar(prev => ({ ...prev, variant: '' }));
                break;
            default:
                break;
        }
    };

    const handleEdit = (car) => {
        // Reset manual states
        setManualEntry({ make: false, carType: false, model: false, variant: false });
        setNewMasterValues({ make: '', carType: '', model: '', variant: '' });
        setCurrentCar(car);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentCar.carId) {
                await api.put(`/cars/${currentCar.carId}`, currentCar);
            } else {
                await api.post('/cars', currentCar);
            }
            setIsModalOpen(false);
            fetchCars();
        } catch (error) {
            console.error('Error saving car:', error);
            showToast('Failed to save car', 'error');
        }
    };

    const columns = [
        { key: 'registrationNumber', label: 'Reg. Number', render: (row) => row.registrationNumber || '-' },
        { key: 'make', label: 'Brand' },
        { key: 'carType', label: 'Type' },
        { key: 'model', label: 'Model' },
        { key: 'variant', label: 'Variant' },
        { key: 'maximumRetailPrice', label: 'MRP', render: (row) => row.maximumRetailPrice ? `₹${row.maximumRetailPrice.toLocaleString()}` : '-' },
        { key: 'discountAmount', label: 'Discount', render: (row) => row.discountAmount ? `₹${row.discountAmount.toLocaleString()}` : '-' },
        {
            key: 'finalPrice', label: 'Final Price', render: (row) => {
                const final = (row.maximumRetailPrice || 0) - (row.discountAmount || 0);
                return final > 0 ? `₹${final.toLocaleString()}` : '-';
            }
        },
        { key: 'inventoryStatus', label: 'Status' },
        { key: 'branch', label: 'Branch', render: (row) => row.branch?.displayName || '-' },
        ...(canManageCars ? [{
            key: 'actions', label: 'Actions', render: (row) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row);
                    }}
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded-md text-sm border border-blue-200"
                    title="Edit Car"
                >
                    <Edit size={16} />
                </button>
            )
        }] : [])
    ];

    // Helper logic for filtered dropdowns
    const brandTerm = (currentCar?.make || '').trim().toLowerCase();
    const selectedBrandObj = vehicleBrands.find(b => b.name.toLowerCase() === brandTerm);
    // If brand is manual or not found, we don't have an ID

    // Type Logic: If brand is selected, we could filter types if we wanted strict hierarchy, 
    // but often Type is independent or loosely coupled filters.
    // However, for strict model filtering, we usually need both.
    // Use heuristic: availableTypes is ALL unless we strictly enforce hierarchy.
    // Given the prompt "mostly they will enter single entry remaining values... dropdown", 
    // let's try to keep dropdowns useful.

    // Logic: 
    // If Brand is Selected -> availableTypes = Types associated with that Brand's models? 
    // OR just show all Types? Usually showing all Types is safer if Brand is new.
    // Existing logic was restrictive:
    const typesForBrand = selectedBrandObj
        ? new Set(vehicleModels.filter(m => m.brandId === selectedBrandObj.id).map(m => m.typeId))
        : null;
    const availableTypes = (selectedBrandObj && typesForBrand && typesForBrand.size > 0)
        ? vehicleTypes.filter(t => typesForBrand.has(t.id))
        : vehicleTypes; // Fallback to all types if Brand allows it or no models yet

    const typeTerm = (currentCar?.carType || '').trim().toLowerCase();
    const selectedTypeObj = vehicleTypes.find(t => t.name.toLowerCase() === typeTerm);

    // Model Logic
    const filteredModels = vehicleModels.filter(m => {
        // If Brand is Manual -> No filtered models (dropdown empty), must be manual.
        if (!selectedBrandObj) return false;

        // If Type is Manual -> No filtered models (unless we ignore type?)
        // Usually Model depends on Brand. Type is attribute. 
        // Existing logic used both. Let's keep strictness if both exist.
        if (selectedTypeObj) {
            return m.brandId === selectedBrandObj.id && m.typeId === selectedTypeObj.id;
        }
        return m.brandId === selectedBrandObj.id; // Allow filtering just by Brand
    });

    // Variant Logic
    const modelTerm = (currentCar?.model || '').trim().toLowerCase();
    const selectedModelObj = filteredModels.find(m => m.name.toLowerCase() === modelTerm);

    // If Model is manual -> No filtered variants
    const filteredVariants = vehicleVariants.filter(v => {
        if (!selectedModelObj) return false;
        return v.modelId === selectedModelObj.id;
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Cars</h1>
                    {isGlobalUser && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                className="text-sm border-none focus:ring-0 bg-transparent"
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
                </div>
                {canManageCars && (
                    <button
                        onClick={() => { setCurrentCar({}); setManualEntry({ make: false, carType: false, model: false, variant: false }); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add Car
                    </button>
                )}
            </div>

            <Table columns={columns} data={cars} />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentCar?.carId ? 'Edit Car' : 'Add Car'}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Reg. Number</label>
                            <input
                                type="text"
                                placeholder="MH12AB1234"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 uppercase"
                                value={currentCar?.registrationNumber || ''}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase().replace(/\s+/g, '');
                                    setCurrentCar({ ...currentCar, registrationNumber: val });
                                }}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Inventory Status</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                value={currentCar?.inventoryStatus || 'UPCOMING'}
                                onChange={(e) => setCurrentCar({ ...currentCar, inventoryStatus: e.target.value })}
                            >
                                {inventoryStatuses.map(status => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">MRP (₹)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                value={currentCar?.maximumRetailPrice || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, maximumRetailPrice: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Discount (₹)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                value={currentCar?.discountAmount || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, discountAmount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-800 mb-2">Vehicle Details</label>
                        </div>

                        {/* BRAND */}
                        <div className='col-span-2 md:col-span-1'>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Brand</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                value={manualEntry.make ? '__OTHER__' : (currentCar?.make || '')}
                                onChange={(e) => {
                                    if (e.target.value === '__OTHER__') {
                                        setManualEntry(prev => ({ ...prev, make: true }));
                                        setCurrentCar({ ...currentCar, make: '' }); // Reset actual value to empty until they type and save
                                    } else {
                                        setManualEntry(prev => ({ ...prev, make: false }));
                                        setCurrentCar({ ...currentCar, make: e.target.value, carType: '', model: '', variant: '' });
                                        setNewMasterValues(prev => ({ ...prev, make: '' }));
                                    }
                                }}
                                required
                            >
                                <option value="">Select Brand</option>
                                {vehicleBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                <option value="__OTHER__">Other (Add New)</option>
                            </select>
                            {manualEntry.make && (
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm border p-2 pr-10"
                                        placeholder="Enter New Brand"
                                        value={newMasterValues.make}
                                        onChange={(e) => setNewMasterValues({ ...newMasterValues, make: e.target.value })}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleCreateMaster('Brand')}
                                            className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 focus:outline-none"
                                            title="Save to Master"
                                        >
                                            <Plus className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCancelMaster('Brand')}
                                            className="bg-gray-200 text-gray-600 p-1 rounded-full hover:bg-gray-300 focus:outline-none"
                                            title="Cancel"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* TYPE */}
                        <div className='col-span-2 md:col-span-1'>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Type</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                value={manualEntry.carType ? '__OTHER__' : (currentCar?.carType || '')}
                                onChange={(e) => {
                                    if (e.target.value === '__OTHER__') {
                                        setManualEntry(prev => ({ ...prev, carType: true }));
                                        setCurrentCar({ ...currentCar, carType: '' });
                                    } else {
                                        setManualEntry(prev => ({ ...prev, carType: false }));
                                        setCurrentCar({ ...currentCar, carType: e.target.value, model: '', variant: '' });
                                        setNewMasterValues(prev => ({ ...prev, carType: '' }));
                                    }
                                }}
                                required={!manualEntry.make} // If brand is manual, type is free text which is required in input below
                            >
                                <option value="">Select Type</option>
                                {availableTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                <option value="__OTHER__">Other (Add New)</option>
                            </select>
                            {manualEntry.carType && (
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm border p-2 pr-10"
                                        placeholder="Enter New Type"
                                        value={newMasterValues.carType}
                                        onChange={(e) => setNewMasterValues({ ...newMasterValues, carType: e.target.value })}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleCreateMaster('Type')}
                                            className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 focus:outline-none"
                                            title="Save to Master"
                                        >
                                            <Plus className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCancelMaster('Type')}
                                            className="bg-gray-200 text-gray-600 p-1 rounded-full hover:bg-gray-300 focus:outline-none"
                                            title="Cancel"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODEL */}
                        <div className='col-span-2 md:col-span-1'>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Model</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                value={manualEntry.model ? '__OTHER__' : (currentCar?.model || '')}
                                onChange={(e) => {
                                    if (e.target.value === '__OTHER__') {
                                        setManualEntry(prev => ({ ...prev, model: true }));
                                        setCurrentCar({ ...currentCar, model: '' });
                                    } else {
                                        setManualEntry(prev => ({ ...prev, model: false }));
                                        setCurrentCar({ ...currentCar, model: e.target.value, variant: '' });
                                        setNewMasterValues(prev => ({ ...prev, model: '' }));
                                    }
                                }}
                                required={!manualEntry.make}
                            >
                                <option value="">{selectedBrandObj ? 'Select Model' : 'Select Brand First...'}</option>
                                {filteredModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                <option value="__OTHER__">Other (Add New)</option>
                            </select>
                            {manualEntry.model && (
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm border p-2 pr-10"
                                        placeholder="Enter New Model"
                                        value={newMasterValues.model}
                                        onChange={(e) => setNewMasterValues({ ...newMasterValues, model: e.target.value })}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleCreateMaster('Model')}
                                            className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 focus:outline-none"
                                            title="Save to Master"
                                        >
                                            <Plus className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCancelMaster('Model')}
                                            className="bg-gray-200 text-gray-600 p-1 rounded-full hover:bg-gray-300 focus:outline-none"
                                            title="Cancel"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* VARIANT */}
                        <div className='col-span-2 md:col-span-1'>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Variant</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                value={manualEntry.variant ? '__OTHER__' : (currentCar?.variant || '')}
                                onChange={(e) => {
                                    if (e.target.value === '__OTHER__') {
                                        setManualEntry(prev => ({ ...prev, variant: true }));
                                        setCurrentCar({ ...currentCar, variant: '' });
                                    } else {
                                        setManualEntry(prev => ({ ...prev, variant: false }));
                                        setCurrentCar({ ...currentCar, variant: e.target.value });
                                        setNewMasterValues(prev => ({ ...prev, variant: '' }));
                                    }
                                }}
                            >
                                <option value="">{selectedModelObj ? 'Select Variant' : 'Select Model First...'}</option>
                                {filteredVariants.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                <option value="__OTHER__">Other (Add New)</option>
                            </select>
                            {manualEntry.variant && (
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm border p-2 pr-10"
                                        placeholder="Enter New Variant"
                                        value={newMasterValues.variant}
                                        onChange={(e) => setNewMasterValues({ ...newMasterValues, variant: e.target.value })}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleCreateMaster('Variant')}
                                            className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 focus:outline-none"
                                            title="Save to Master"
                                        >
                                            <Plus className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCancelMaster('Variant')}
                                            className="bg-gray-200 text-gray-600 p-1 rounded-full hover:bg-gray-300 focus:outline-none"
                                            title="Cancel"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Branch</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={currentCar?.branchId || ''}
                            onChange={(e) => setCurrentCar({ ...currentCar, branchId: e.target.value })}
                            required
                        >
                            <option value="">Select Branch</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.displayName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse bg-white pt-4 border-t">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Save Car
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Cars;
