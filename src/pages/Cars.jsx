import React, { useState, useEffect, useContext } from 'react';
import { Edit, Filter } from 'lucide-react';
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
    const { getOptionList, vehicleBrands, vehicleTypes, vehicleModels, vehicleVariants, branches, loading: optionsLoading } = useOptions();
    const { user } = useContext(AuthContext);
    const inventoryStatuses = getOptionList('INVENTORY_STATUSES');

    const globalRoles = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE', 'HR_MGR', 'HR_ASSIS', 'AUTH_USER', 'GUEST'];
    const isGlobalUser = globalRoles.includes(user?.role);
    const canManageCars = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(user?.role);

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

    const handleEdit = (car) => {
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

    // Helper logic for filtered dropdowns (one car only)
    const brandTerm = (currentCar?.make || '').trim().toLowerCase();
    const selectedBrandObj = vehicleBrands.find(b => {
        if (!brandTerm) return false;
        const bn = b.name.toLowerCase();
        return bn === brandTerm || bn.includes(brandTerm) || brandTerm.includes(bn);
    });

    const typeTerm = (currentCar?.carType || '').trim().toLowerCase();
    const selectedTypeObj = vehicleTypes.find(t => t.name.toLowerCase() === typeTerm);

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

    const modelTerm = (currentCar?.model || '').trim().toLowerCase();
    const selectedModelObj = filteredModels.find(m => {
        if (!modelTerm) return false;
        const mn = m.name.toLowerCase();
        return mn === modelTerm;
    });

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
                        onClick={() => { setCurrentCar({}); setIsModalOpen(true); }}
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
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-800 mb-2">Vehicle Details</label>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Brand</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                value={currentCar?.make || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, make: e.target.value, carType: '', model: '', variant: '' })}
                                required
                            >
                                <option value="">Select Brand</option>
                                {vehicleBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Type</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                value={currentCar?.carType || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, carType: e.target.value, model: '', variant: '' })}
                                required
                            >
                                <option value="">Select Type</option>
                                {availableTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Model</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                value={currentCar?.model || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, model: e.target.value, variant: '' })}
                                required
                            >
                                <option value="">Select Model</option>
                                {filteredModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Variant</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2"
                                value={currentCar?.variant || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, variant: e.target.value })}
                            >
                                <option value="">Select Variant</option>
                                {filteredVariants.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                            </select>
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
