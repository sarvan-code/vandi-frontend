import React, { useState, useEffect, useContext } from 'react';
import { Edit, Filter, Plus, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import Table from '../components/Table';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { useOptions } from '../context/OptionsContext';
import { AuthContext } from '../context/AuthContext';
import FloatingActionPanel from '../components/FloatingActionPanel';
import ConfirmDialog from '../components/ConfirmDialog';

const Cars = () => {
    const { showToast } = useToast();
    const [cars, setCars] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCar, setCurrentCar] = useState(null);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const { getOptionList, vehicleBrands, vehicleTypes, vehicleModels, vehicleVariants, branches, loading: optionsLoading, refreshVehicles } = useOptions();
    const { user } = useContext(AuthContext);
    const inventoryStatuses = getOptionList('INVENTORY_STATUSES');

    // Selected car for floating action panel
    const [selectedCarRow, setSelectedCarRow] = useState(null);
    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, car: null });

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });

    const globalRoles = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE', 'HR_MGR', 'HR_ASSIS', 'AUTH_USER', 'GUEST'];
    const isGlobalUser = globalRoles.includes(user?.role);
    const canManageCars = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE', 'SALES_MGR'].includes(user?.role);

    useEffect(() => {
        fetchCars(pagination.page);
    }, [selectedBranchId, pagination.page]);

    const fetchCars = async (page = 1) => {
        try {
            const response = await api.get('/cars', {
                params: {
                    branchId: selectedBranchId,
                    page,
                    pageSize: pagination.pageSize
                }
            });
            setCars(response.data.data);
            setPagination(prev => ({
                ...prev,
                page: response.data.meta.page,
                total: response.data.meta.total,
                totalPages: response.data.meta.totalPages
            }));
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
            fetchCars(pagination.page);
        } catch (error) {
            console.error('Error saving car:', error);
            showToast('Failed to save car', 'error');
        }
    };

    const handleDelete = (car) => {
        setDeleteConfirm({ isOpen: true, car });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.car) return;
        try {
            await api.delete(`/cars/${deleteConfirm.car.carId}`);
            showToast('Car deleted successfully', 'success');
            setSelectedCarRow(null);
            fetchCars(pagination.page);
        } catch (error) {
            console.error('Error deleting car:', error);
            showToast('Failed to delete car', 'error');
        } finally {
            setDeleteConfirm({ isOpen: false, car: null });
        }
    };

    const columns = [
        {
            key: 'registrationNumber',
            label: 'Registration Number',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[var(--text-primary)]">{row.registrationNumber || 'UNREGISTERED'}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{row.vin || 'NO VIN RECORDED'}</span>
                </div>
            )
        },
        { key: 'make', label: 'Manufacturer' },
        { key: 'model', label: 'Technical Model' },
        {
            key: 'specification',
            label: 'Specification / Color',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{row.variant || 'Standard'}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-tighter">{row.color || 'No Color'} • {row.manufacturingYear}</span>
                </div>
            )
        },
        {
            key: 'maximumRetailPrice',
            label: 'Price',
            render: (row) => (
                <span className="font-bold text-[var(--text-secondary)]">{row.maximumRetailPrice ? `₹${row.maximumRetailPrice.toLocaleString('en-IN')}` : '—'}</span>
            )
        },
        {
            key: 'inventoryStatus',
            label: 'Status',
            render: (row) => (
                <span className={clsx(
                    "rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-all border",
                    row.inventoryStatus === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        row.inventoryStatus === 'Booked' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                )}>
                    {row.inventoryStatus}
                </span>
            )
        }
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
        <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-8">
                <div>
                    <h1 className="text-4xl font-semibold mb-2 text-[var(--text-primary)]">Inventory</h1>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Manage your vehicle fleet, specifications, and availability.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isGlobalUser && (
                        <div className="search-box !w-auto">
                            <Filter size={18} className="search-icon" />
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
                    {canManageCars && (
                        <button
                            onClick={() => {
                                setCurrentCar({
                                    registrationNumber: '',
                                    make: '',
                                    carType: '',
                                    model: '',
                                    variant: '',
                                    vin: '',
                                    engineNumber: '',
                                    color: '',
                                    manufacturingYear: new Date().getFullYear(),
                                    purchaseDate: '',
                                    purchasePrice: 0,
                                    maximumRetailPrice: 0,
                                    discountAmount: 0,
                                    inventoryStatus: 'Available',
                                    branchId: user.branchId || ''
                                });
                                setManualEntry({ make: false, carType: false, model: false, variant: false });
                                setNewMasterValues({ make: '', carType: '', model: '', variant: '' });
                                setIsModalOpen(true);
                            }}
                            className="btn-primary flex items-center gap-3 !py-2 !px-6"
                        >
                            <Plus size={18} /> New Asset
                        </button>
                    )}
                </div>
            </div>

            <div className="relative">
                <Table
                    columns={columns}
                    data={cars}
                    onRowClick={(row) => setSelectedCarRow(row)}
                    selectedRow={selectedCarRow?.carId}
                    rowKey="carId"
                />

                <FloatingActionPanel
                    selectedItem={selectedCarRow}
                    onClose={() => setSelectedCarRow(null)}
                    title={selectedCarRow?.registrationNumber || 'No Reg. Number'}
                    subtitle={`${selectedCarRow?.make} ${selectedCarRow?.model} ${selectedCarRow?.variant}`}
                    actions={[
                        {
                            icon: Edit,
                            label: user?.role === 'SALES_REP' ? 'View Details' : 'Details',
                            onClick: handleEdit,
                            color: 'blue',
                            title: user?.role === 'SALES_REP' ? 'View Vehicle Details' : 'Edit Vehicle'
                        },
                        ...(['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(user?.role) ? [
                            {
                                icon: Trash2,
                                label: 'Delete',
                                onClick: handleDelete,
                                color: 'red',
                                title: 'Delete Vehicle'
                            }
                        ] : [])
                    ]}
                />
            </div>

            {/* Standardized Pagination Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-8 mb-12 animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-4 py-2 rounded-lg border border-[var(--border)] shadow-sm">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            Showing: <span className="text-[var(--accent)]">{(pagination.page - 1) * pagination.pageSize + 1}</span> — <span className="text-[var(--accent)]">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span>
                            <span className="mx-2 text-[var(--border)]">|</span>
                            Total Records: <span className="text-[var(--text-primary)]">{pagination.total}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="pageSize" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Page Size</label>
                        <select
                            id="pageSize"
                            value={pagination.pageSize}
                            onChange={(e) => {
                                setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }));
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
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                        disabled={pagination.page === 1}
                        className="btn-secondary p-2.5 disabled:opacity-30 disabled:cursor-not-allowed border border-[var(--border)]"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-primary)] min-w-[80px] text-center shadow-sm">
                        {pagination.page} / {pagination.totalPages}
                    </div>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
                        disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                        className="btn-secondary p-2.5 disabled:opacity-30 disabled:cursor-not-allowed border border-[var(--border)]"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={user?.role === 'SALES_REP' ? 'Vehicle Details' : (currentCar?.carId ? 'Edit Vehicle' : 'Add New Vehicle')}
            >
                <form onSubmit={handleSave} className="space-y-8">
                    <fieldset disabled={user?.role === 'SALES_REP'} className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 md:col-span-1 space-y-2">
                                <label className="form-label">Registration Number</label>
                                <input
                                    type="text"
                                    placeholder="MH12AB1234"
                                    className="input-field uppercase font-bold"
                                    value={currentCar?.registrationNumber || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase().replace(/\s+/g, '');
                                        setCurrentCar({ ...currentCar, registrationNumber: val });
                                    }}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1 space-y-2">
                                <label className="form-label">Inventory Status</label>
                                <select
                                    className="input-field font-semibold"
                                    value={currentCar?.inventoryStatus || 'UPCOMING'}
                                    onChange={(e) => setCurrentCar({ ...currentCar, inventoryStatus: e.target.value })}
                                >
                                    {inventoryStatuses.map(status => (
                                        <option key={status.value} value={status.value}>{status.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-1 space-y-2">
                                <label className="form-label">Maximum Retail Price (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="input-field font-bold"
                                    value={currentCar?.maximumRetailPrice || ''}
                                    onChange={(e) => setCurrentCar({ ...currentCar, maximumRetailPrice: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1 space-y-2">
                                <label className="form-label">Negotiated Discount Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="input-field font-bold text-rose-600"
                                    value={currentCar?.discountAmount || ''}
                                    onChange={(e) => setCurrentCar({ ...currentCar, discountAmount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 p-6 rounded-xl border shadow-inner mb-8 bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border)' }}>
                            <div className="col-span-2 flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                                    <Filter size={14} />
                                </div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Technical Specifications</label>
                            </div>

                            {/* BRAND */}
                            <div className='col-span-2 md:col-span-1 space-y-2'>
                                <label className="form-label">Manufacturer Brand</label>
                                <select
                                    className="input-field font-semibold"
                                    value={manualEntry.make ? '__OTHER__' : (currentCar?.make || '')}
                                    onChange={(e) => {
                                        if (e.target.value === '__OTHER__') {
                                            setManualEntry(prev => ({ ...prev, make: true }));
                                            setCurrentCar({ ...currentCar, make: '' });
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
                                    <div className="mt-3 relative">
                                        <input
                                            type="text"
                                            className="input-field pr-24"
                                            placeholder="Enter New Brand"
                                            value={newMasterValues.make}
                                            onChange={(e) => setNewMasterValues({ ...newMasterValues, make: e.target.value })}
                                        />
                                        <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleCreateMaster('Brand')}
                                                className="bg-indigo-600 text-white p-1.5 rounded-xl hover:bg-indigo-700 shadow-md transition-all"
                                                title="Save to Master"
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCancelMaster('Brand')}
                                                className="bg-slate-200 text-slate-600 p-1.5 rounded-xl hover:bg-slate-300 transition-all"
                                                title="Cancel"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* TYPE */}
                            <div className='col-span-2 md:col-span-1 space-y-2'>
                                <label className="form-label">Vehicle Segment</label>
                                <select
                                    className="input-field font-semibold"
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
                                    required={!manualEntry.make}
                                >
                                    <option value="">Select Type</option>
                                    {availableTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    <option value="__OTHER__">Other (Add New)</option>
                                </select>
                                {manualEntry.carType && (
                                    <div className="mt-3 relative">
                                        <input
                                            type="text"
                                            className="input-field pr-24"
                                            placeholder="Enter New Type"
                                            value={newMasterValues.carType}
                                            onChange={(e) => setNewMasterValues({ ...newMasterValues, carType: e.target.value })}
                                        />
                                        <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleCreateMaster('Type')}
                                                className="bg-indigo-600 text-white p-1.5 rounded-xl hover:bg-indigo-700 shadow-md transition-all"
                                                title="Save to Master"
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCancelMaster('Type')}
                                                className="bg-slate-200 text-slate-600 p-1.5 rounded-xl hover:bg-slate-300 transition-all"
                                                title="Cancel"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* MODEL */}
                            <div className='col-span-2 md:col-span-1 space-y-2'>
                                <label className="form-label">Model Name</label>
                                <select
                                    className="input-field font-semibold"
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
                                    <div className="mt-3 relative">
                                        <input
                                            type="text"
                                            className="input-field pr-24"
                                            placeholder="Enter New Model"
                                            value={newMasterValues.model}
                                            onChange={(e) => setNewMasterValues({ ...newMasterValues, model: e.target.value })}
                                        />
                                        <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleCreateMaster('Model')}
                                                className="bg-indigo-600 text-white p-1.5 rounded-xl hover:bg-indigo-700 shadow-md transition-all"
                                                title="Save to Master"
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCancelMaster('Model')}
                                                className="bg-slate-200 text-slate-600 p-1.5 rounded-xl hover:bg-slate-300 transition-all"
                                                title="Cancel"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* VARIANT */}
                            <div className='col-span-2 md:col-span-1 space-y-2'>
                                <label className="form-label">Trim / Variant</label>
                                <select
                                    className="input-field font-semibold"
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
                                    <div className="mt-3 relative">
                                        <input
                                            type="text"
                                            className="input-field pr-24"
                                            placeholder="Enter New Variant"
                                            value={newMasterValues.variant}
                                            onChange={(e) => setNewMasterValues({ ...newMasterValues, variant: e.target.value })}
                                        />
                                        <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleCreateMaster('Variant')}
                                                className="bg-indigo-600 text-white p-1.5 rounded-xl hover:bg-indigo-700 shadow-md transition-all"
                                                title="Save to Master"
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCancelMaster('Variant')}
                                                className="bg-slate-200 text-slate-600 p-1.5 rounded-xl hover:bg-slate-300 transition-all"
                                                title="Cancel"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!['SALES_MGR', 'SALES_REP'].includes(user?.role) && (
                            <div className="space-y-2">
                                <label className="form-label">Branch Store</label>
                                <select
                                    className="input-field font-semibold"
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
                        )}
                    </fieldset>

                    <div className="mt-10 flex flex-col sm:flex-row-reverse gap-4 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
                        {user?.role !== 'SALES_REP' && (
                            <button
                                type="submit"
                                className="btn-primary px-12 py-3 text-[10px] font-bold uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-white"
                            >
                                Save Car
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn-secondary px-8"
                        >
                            {user?.role === 'SALES_REP' ? 'Close' : 'Cancel'}
                        </button>
                    </div>
                </form>
            </Modal>
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, car: null })}
                onConfirm={confirmDelete}
                title="Delete Car"
                message={`Are you sure you want to delete the car "${deleteConfirm.car?.registrationNumber || 'this car'}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

export default Cars;
