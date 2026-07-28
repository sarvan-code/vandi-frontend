import React, { useState, useEffect, useContext } from 'react';
import { Filter, Plus, X } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import Modal from './Modal';
import { useOptions } from '../context/OptionsContext';
import { AuthContext } from '../context/AuthContext';

const CarEditModal = ({ isOpen, onClose, car, onSave, restrictedMode = false }) => {
    const { showToast } = useToast();
    const { getOptionList, vehicleBrands, vehicleTypes, vehicleModels, vehicleVariants, branches, refreshVehicles } = useOptions();
    const { user } = useContext(AuthContext);
    
    const [currentCar, setCurrentCar] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Manual Entry States (for adding new master data)
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
        modelTypeId: '',
        variant: ''
    });

    const inventoryStatuses = getOptionList('INVENTORY_STATUSES');

    useEffect(() => {
        if (car) {
            setCurrentCar({ ...car });
            // Reset manual states
            setManualEntry({ make: false, carType: false, model: false, variant: false });
            setNewMasterValues({ make: '', carType: '', model: '', variant: '' });
        }
    }, [car, isOpen]);

    const handleCreateMaster = async (type) => {
        try {
            let payload = {};
            let endpoint = '';
            let newValue = '';

            switch (type) {
                case 'Model':
                    newValue = newMasterValues.model;
                    const brandTermForModel = (currentCar?.make || '').trim().toLowerCase();
                    const brandObj = vehicleBrands.find(b => b.name.toLowerCase() === brandTermForModel);
                    const selectedTypeIdForModel = newMasterValues.modelTypeId;

                    if (!newValue) return showToast('Please enter a Model name', 'warning');
                    if (!brandObj) return showToast('Please select a valid Brand first', 'warning');
                    if (!selectedTypeIdForModel) return showToast('Please select a valid Type first', 'warning');

                    payload = { name: newValue, brandId: brandObj.id, typeId: selectedTypeIdForModel };
                    endpoint = '/vehicles/models';
                    break;
                case 'Variant':
                    newValue = newMasterValues.variant;
                    const modelTermForVariant = (currentCar?.model || '').trim().toLowerCase();
                    const modelObj = vehicleModels.find(m => m.name.toLowerCase().trim() === modelTermForVariant);

                    if (!newValue) return showToast('Please enter a Variant name', 'warning');
                    if (!modelObj) return showToast('Please select a valid Model first', 'warning');

                    payload = { name: newValue, modelId: modelObj.id };
                    endpoint = '/vehicles/variants';
                    break;
                default:
                    return;
            }

            await api.post(endpoint, payload);
            showToast(`${type} created successfully!`, 'success');
            await refreshVehicles();

            // Auto-select and close manual entry
            if (type === 'Model') {
                setManualEntry(prev => ({ ...prev, model: false }));
                const matchingTypeObj = vehicleTypes.find(t => t.id === Number(newMasterValues.modelTypeId));
                setCurrentCar(prev => ({ ...prev, model: newValue, carType: matchingTypeObj ? matchingTypeObj.name : prev.carType }));
            } else if (type === 'Variant') {
                setManualEntry(prev => ({ ...prev, variant: false }));
                setCurrentCar(prev => ({ ...prev, variant: newValue }));
            }
        } catch (error) {
            console.error(`Error creating ${type}:`, error);
            showToast(`Failed to create ${type}`, 'error');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let response;
            if (currentCar.carId) {
                response = await api.put(`/cars/${currentCar.carId}`, currentCar);
            } else {
                response = await api.post('/cars', currentCar);
            }
            onSave(response.data);
            showToast('Car saved successfully', 'success');
            onClose();
        } catch (error) {
            console.error('Error saving car:', error);
            showToast(error.response?.data?.error || 'Failed to save car', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const brandTerm = (currentCar?.make || '').trim().toLowerCase();
    const selectedBrandObj = vehicleBrands.find(b => b.name.toLowerCase() === brandTerm);
    
    const typesForBrand = selectedBrandObj
        ? new Set(vehicleModels.filter(m => m.brandId === selectedBrandObj.id).map(m => m.typeId))
        : null;

    const availableTypes = selectedBrandObj
        ? vehicleTypes.filter(t => typesForBrand.has(t.id))
        : [];

    const filteredModels = vehicleModels.filter(m => {
        if (!selectedBrandObj) return false;
        const typeTerm = (currentCar?.carType || '').trim().toLowerCase();
        const selectedTypeObj = vehicleTypes.find(t => t.name.toLowerCase() === typeTerm);
        if (selectedTypeObj) {
            return m.brandId === selectedBrandObj.id && m.typeId === selectedTypeObj.id;
        }
        return m.brandId === selectedBrandObj.id;
    });

    const modelTerm = (currentCar?.model || '').trim().toLowerCase();
    const selectedModelObj = vehicleModels.find(m => m.name.toLowerCase().trim() === modelTerm && Number(m.brandId) === Number(selectedBrandObj?.id));

    const filteredVariants = vehicleVariants.filter(v => {
        if (!selectedModelObj) return false;
        return v.modelId === selectedModelObj.id;
    });

    if (!currentCar) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={restrictedMode ? 'Edit Car Details' : (user?.role === 'SALES_REP' ? 'Vehicle Details' : (currentCar?.carId ? 'Edit Vehicle' : 'Add New Vehicle'))}
        >
            <form onSubmit={handleSave} className="space-y-8">
                <fieldset disabled={user?.role === 'SALES_REP' && !restrictedMode} className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <label className="form-label">Registration Number</label>
                            <input
                                type="text"
                                placeholder="MH12AB1234"
                                className="input-field uppercase font-bold"
                                disabled={restrictedMode}
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
                                disabled={restrictedMode}
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
                                disabled={restrictedMode}
                                value={currentCar?.maximumRetailPrice || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, maximumRetailPrice: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <label className="form-label">Discount Amount (₹)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="input-field font-bold text-rose-600"
                                disabled={restrictedMode}
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
                                disabled={restrictedMode}
                                value={currentCar?.make || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, make: e.target.value, carType: '', model: '', variant: '' })}
                                required
                            >
                                <option value="">Select Brand</option>
                                {vehicleBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>

                        {/* TYPE */}
                        <div className='col-span-2 md:col-span-1 space-y-2'>
                            <label className="form-label">Vehicle Segment</label>
                            <select
                                className="input-field font-semibold"
                                disabled={restrictedMode}
                                value={currentCar?.carType || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, carType: e.target.value, model: '', variant: '' })}
                                required
                            >
                                <option value="">Select Type</option>
                                {availableTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>

                        {/* MODEL */}
                        <div className='col-span-2 md:col-span-1 space-y-2'>
                            <label className="form-label">Model Name</label>
                            <select
                                className="input-field font-semibold"
                                disabled={restrictedMode}
                                value={manualEntry.model ? '__OTHER__' : (currentCar?.model || '')}
                                onChange={(e) => {
                                    if (e.target.value === '__OTHER__') {
                                        setManualEntry(prev => ({ ...prev, model: true }));
                                        setCurrentCar({ ...currentCar, model: '' });
                                        const typeObj = vehicleTypes.find(t => t.name.toLowerCase() === (currentCar?.carType || '').trim().toLowerCase());
                                        setNewMasterValues(prev => ({ ...prev, modelTypeId: typeObj ? typeObj.id : '' }));
                                    } else {
                                        setManualEntry(prev => ({ ...prev, model: false }));
                                        setCurrentCar({ ...currentCar, model: e.target.value, variant: '' });
                                    }
                                }}
                                required
                            >
                                <option value="">{selectedBrandObj ? 'Select Model' : 'Select Brand First...'}</option>
                                {filteredModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                {!restrictedMode && <option value="__OTHER__">Other (Add New)</option>}
                            </select>
                            {manualEntry.model && !restrictedMode && (
                                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl relative space-y-3 shadow-inner">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1.5 block">Vehicle Segment</label>
                                        <select
                                            className="input-field py-2 text-sm"
                                            value={newMasterValues.modelTypeId || ''}
                                            onChange={(e) => setNewMasterValues({ ...newMasterValues, modelTypeId: e.target.value })}
                                        >
                                            <option value="">Select Type</option>
                                            {vehicleTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="input-field pr-24"
                                            placeholder="Enter New Model"
                                            value={newMasterValues.model}
                                            onChange={(e) => setNewMasterValues({ ...newMasterValues, model: e.target.value })}
                                        />
                                        <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                                            <button type="button" onClick={() => handleCreateMaster('Model')} className="bg-indigo-600 text-white p-1.5 rounded-xl"><Plus size={16} /></button>
                                            <button type="button" onClick={() => setManualEntry(p => ({ ...p, model: false }))} className="bg-slate-200 text-slate-600 p-1.5 rounded-xl"><X size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* VARIANT */}
                        <div className='col-span-2 md:col-span-1 space-y-2'>
                            <label className="form-label">Trim / Variant</label>
                            <select
                                className="input-field font-semibold"
                                disabled={restrictedMode}
                                value={manualEntry.variant ? '__OTHER__' : (currentCar?.variant || '')}
                                onChange={(e) => {
                                    if (e.target.value === '__OTHER__') {
                                        setManualEntry(prev => ({ ...prev, variant: true }));
                                        setCurrentCar({ ...currentCar, variant: '' });
                                    } else {
                                        setManualEntry(prev => ({ ...prev, variant: false }));
                                        setCurrentCar({ ...currentCar, variant: e.target.value });
                                    }
                                }}
                            >
                                <option value="">{selectedModelObj ? 'Select Variant' : 'Select Model First...'}</option>
                                {filteredVariants.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                {!restrictedMode && <option value="__OTHER__">Other (Add New)</option>}
                            </select>
                            {manualEntry.variant && !restrictedMode && (
                                <div className="mt-3 relative">
                                    <input
                                        type="text"
                                        className="input-field pr-24"
                                        placeholder="Enter New Variant"
                                        value={newMasterValues.variant}
                                        onChange={(e) => setNewMasterValues({ ...newMasterValues, variant: e.target.value })}
                                    />
                                    <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                                        <button type="button" onClick={() => handleCreateMaster('Variant')} className="bg-indigo-600 text-white p-1.5 rounded-xl"><Plus size={16} /></button>
                                        <button type="button" onClick={() => setManualEntry(p => ({ ...p, variant: false }))} className="bg-slate-200 text-slate-600 p-1.5 rounded-xl"><X size={16} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 p-6 rounded-xl border shadow-inner mb-8 bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border)' }}>
                        <div className="col-span-2 flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-slate-500/10 rounded-lg flex items-center justify-center text-[var(--text-secondary)]">
                                <Filter size={14} />
                            </div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Identification & Usage</label>
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <label className="form-label">Color Description</label>
                            <input
                                type="text"
                                placeholder="e.g. Pearl White"
                                className="input-field font-semibold"
                                value={currentCar?.color || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, color: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <label className="form-label">Manufacturing Year</label>
                            <input
                                type="text"
                                placeholder="YYYY"
                                className="input-field font-semibold"
                                maxLength="4"
                                value={currentCar?.mfgYear || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, mfgYear: e.target.value.replace(/\D/g, '') })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <label className="form-label">Engine Number</label>
                            <input
                                type="text"
                                className="input-field font-semibold uppercase"
                                placeholder="Engine No."
                                value={currentCar?.engineNo || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, engineNo: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <label className="form-label">Chassis Number / VIN</label>
                            <input
                                type="text"
                                className="input-field font-semibold uppercase"
                                placeholder="Chassis No."
                                value={currentCar?.chassisNo || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, chassisNo: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="form-label">Odometer Reading (KM)</label>
                            <input
                                type="number"
                                placeholder="0"
                                min="0"
                                className="input-field font-semibold"
                                value={currentCar?.kilometerage || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, kilometerage: e.target.value ? parseInt(e.target.value, 10) : '' })}
                            />
                        </div>
                    </div>

                    {!restrictedMode && !['SALES_MGR', 'SALES_REP', 'BRANCH_MGR'].includes(user?.role) && (
                        <div className="space-y-2">
                            <label className="form-label">Branch Store</label>
                            <select
                                className="input-field font-semibold"
                                value={currentCar?.branchId || ''}
                                onChange={(e) => setCurrentCar({ ...currentCar, branchId: e.target.value })}
                                required
                            >
                                <option value="">Select Branch</option>
                                {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.displayName}</option>)}
                            </select>
                        </div>
                    )}
                </fieldset>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                    <button type="button" onClick={onClose} className="btn-secondary px-6">Cancel</button>
                    {(restrictedMode || user?.role !== 'SALES_REP') && (
                        <button type="submit" disabled={submitting} className="btn-primary px-8 flex items-center gap-2">
                            {submitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                            {currentCar.carId ? 'Update Assets' : 'Create Asset'}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
};

export default CarEditModal;
