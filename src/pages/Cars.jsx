import React, { useState, useEffect, useContext } from 'react';
import { Edit, Filter, Plus, X, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import Table from '../components/Table';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { useOptions } from '../context/OptionsContext';
import { AuthContext } from '../context/AuthContext';
import FloatingActionPanel from '../components/FloatingActionPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import CarEditModal from '../components/CarEditModal';

const Cars = () => {
    const { showToast } = useToast();
    const [cars, setCars] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCar, setCurrentCar] = useState(null);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedInventoryStatus, setSelectedInventoryStatus] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({ branchId: '', inventoryStatus: '' });
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
    const canManageCars = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE', 'SALES_MGR', 'BRANCH_MGR'].includes(user?.role);

    useEffect(() => {
        fetchCars(pagination.page);
    }, [appliedFilters, pagination.page]);

    const fetchCars = async (page = 1) => {
        try {
            const response = await api.get('/cars', {
                params: {
                    branchId: appliedFilters.branchId,
                    inventoryStatus: appliedFilters.inventoryStatus,
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

    const handleSearch = () => {
        setAppliedFilters({ branchId: selectedBranchId, inventoryStatus: selectedInventoryStatus });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleClearFilters = () => {
        setSelectedBranchId('');
        setSelectedInventoryStatus('');
        setAppliedFilters({ branchId: '', inventoryStatus: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleEdit = (car) => {
        setCurrentCar(car);
        setIsModalOpen(true);
    };

    const handleSave = (updatedCar) => {
        fetchCars(pagination.page);
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

    // Strict filtering based on Selected Manufacturer Brand
    const availableTypes = selectedBrandObj
        ? vehicleTypes.filter(t => typesForBrand.has(t.id))
        : [];

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
    const selectedModelObj = vehicleModels.find(m => m.name.toLowerCase().trim() === modelTerm && Number(m.brandId) === Number(selectedBrandObj?.id));

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
                        <Filter size={18} className="search-icon" />
                        <select
                            className="bg-transparent border border-[var(--border)] rounded-md focus:ring-1 focus:ring-[var(--accent)] text-sm font-semibold text-[var(--text-primary)] min-w-[160px] cursor-pointer outline-none pl-10 h-10 shadow-sm"
                            value={selectedInventoryStatus}
                            onChange={(e) => setSelectedInventoryStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {inventoryStatuses.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSearch}
                        className="btn-primary !h-10 !py-0 px-6 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                    >
                        <Search size={18} /> Search
                    </button>

                    {(appliedFilters.branchId || appliedFilters.inventoryStatus) && (
                        <button
                            onClick={handleClearFilters}
                            className="btn-secondary px-6 !h-10 !py-0 flex items-center gap-2"
                        >
                            <X size={16} /> Clear
                        </button>
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
                                    engineNo: '',
                                    color: '',
                                    manufacturingYear: new Date().getFullYear(),
                                    purchaseDate: '',
                                    purchasePrice: 0,
                                    maximumRetailPrice: 0,
                                    discountAmount: 0,
                                    inventoryStatus: 'Available',
                                    branchId: user.branchId || ''
                                });
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

            <CarEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                car={currentCar}
                onSave={handleSave}
            />
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
