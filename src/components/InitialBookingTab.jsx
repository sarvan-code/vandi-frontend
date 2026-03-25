import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import VehicleAutocomplete from './VehicleAutocomplete';
import { X, Car as CarIcon, IndianRupee, Calendar } from 'lucide-react';
import clsx from 'clsx';
import CustomerContactInfo from './CustomerContactInfo';

const InitialBookingTab = ({ enquiryId, enquiry, onBookingCreated, onEditCustomer }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        carId: '',
        carRegistration: '',
        agreedPrice: '',
        advanceAmount: '',
        advanceMode: 'CASH',
        advanceRefId: '',
        deliveryDate: '',
        payPartAmountBeforeDelivery: false,
        registrationType: 'SELF',
        nomineeName: '',
        nomineeAddress: '',
        nomineePhone: '',
        commitments: {
            rto: 'CUSTOMER',
            insurance: 'CUSTOMER',
            electrical: 'CUSTOMER',
            ac: 'CUSTOMER',
            dentPaint: 'CUSTOMER',
            tires: 'CUSTOMER'
        },
        legalChecklist: {
            testDrive: false,
            mechanicCheck: false,
            bodyLine: false,
            stepneyToolkit: false,
            tireCondition: false
        },
        documentsSubmitted: {
            photos: false,
            pan: false,
            aadhar: false
        },
        // New fields
        billNo: '',
        rtoPerson: '',
        remarks: '',
        engineNo: '',
        chassisNo: '',
        color: '',
        mfgYear: '',
        kilometerage: '',
        priceBreakdown: {
            vehiclePrice: '',
            rtoCharges: '',
            insurance: '',
            secondKey: ''
        },
        financeDetails: {
            companyName: '',
            amountFinanced: ''
        },
        warrantyApplied: false
    });

    const [selectedCar, setSelectedCar] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (enquiry) {
            // Auto-fill car from last follow-up if available for new booking
            const followUps = enquiry.followUps || [];
            if (followUps.length > 0 && !formData.carId) {
                const lastFollowUp = followUps[followUps.length - 1];
                if (lastFollowUp.followupCarId && lastFollowUp.car) {
                    setFormData(prev => ({
                        ...prev,
                        carId: lastFollowUp.followupCarId,
                        carRegistration: lastFollowUp.car.registrationNumber || ''
                    }));
                    setSelectedCar(lastFollowUp.car);
                }
            }
        }
    }, [enquiry]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.carId || !formData.agreedPrice || !formData.advanceAmount) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (parseFloat(formData.advanceAmount) > parseFloat(formData.agreedPrice)) {
            showToast('Advance amount cannot exceed agreed price', 'error');
            return;
        }

        setSubmitting(true);

        try {
            // Create new booking
            const response = await api.post('/bookings', {
                enquiryId,
                carId: formData.carId,
                agreedPrice: parseFloat(formData.agreedPrice),
                advanceAmount: parseFloat(formData.advanceAmount),
                advanceMode: formData.advanceMode,
                advanceRefId: formData.advanceRefId,
                commitments: formData.commitments,
                deliveryDate: formData.deliveryDate,
                payPartAmountBeforeDelivery: formData.payPartAmountBeforeDelivery,
                registrationType: formData.registrationType,
                nomineeName: formData.registrationType === 'OTHER' ? formData.nomineeName : null,
                nomineeAddress: formData.registrationType === 'OTHER' ? formData.nomineeAddress : null,
                nomineePhone: formData.registrationType === 'OTHER' ? formData.nomineePhone : null,
                documentsSubmitted: formData.documentsSubmitted,
                // New fields
                billNo: formData.billNo,
                priceBreakdown: formData.priceBreakdown,
                financeDetails: formData.financeDetails,
                rtoPerson: formData.rtoPerson,
                remarks: formData.remarks,
                engineNo: formData.engineNo,
                chassisNo: formData.chassisNo,
                color: formData.color,
                mfgYear: formData.mfgYear,
                kilometerage: formData.kilometerage,
                warrantyApplied: formData.warrantyApplied
            });
            showToast('Booking created successfully!', 'success');
            onBookingCreated(response.data);
        } catch (error) {
            console.error('Error saving booking:', error);
            showToast(error.response?.data?.error || 'Error saving booking', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const netBenefit = selectedCar ? (selectedCar.maximumRetailPrice || 0) - (selectedCar.discountAmount || 0) : 0;
    const balanceAmount = formData.agreedPrice && formData.advanceAmount
        ? parseFloat(formData.agreedPrice) - parseFloat(formData.advanceAmount)
        : 0;
    const totalNegotiatedDiscount = formData.agreedPrice ? netBenefit - parseFloat(formData.agreedPrice) : 0;


    return (
        <form onSubmit={handleSubmit} className="space-y-12 animate-fade-in">
            {/* Select Vehicle */}
            <div className="card p-4 sm:p-8 relative overflow-hidden group border-[var(--border)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                        <CarIcon size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Select Car</h3>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Select a car from stock</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="form-label ml-1">
                                Search for Car
                            </label>
                            <VehicleAutocomplete
                                value={formData.carRegistration}
                                onChange={(val) => {
                                    if (typeof val === 'object' && val !== null) {
                                        setFormData({
                                            ...formData,
                                            carId: val.carId,
                                            carRegistration: val.registrationNumber,
                                            // Pre-fill some defaults if available
                                            engineNo: val.engineNo || '',
                                            chassisNo: val.chassisNo || '',
                                            color: val.color || '',
                                            mfgYear: val.manufacturingYear || '',
                                            kilometerage: val.kilometerage || ''
                                        });
                                        setSelectedCar(val);
                                    } else {
                                        setFormData({
                                            ...formData,
                                            carRegistration: val,
                                            carId: ''
                                        });
                                        setSelectedCar(null);
                                    }
                                }}
                                placeholder="Search by ID, make or model..."
                            />
                        </div>

                        {/* Extended Car Details */}
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Engine No</label>
                                <input 
                                    type="text" 
                                    value={formData.engineNo}
                                    onChange={(e) => setFormData({...formData, engineNo: e.target.value})}
                                    className="input-field p-2 text-xs font-bold"
                                    placeholder="Engine number..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Chassis No</label>
                                <input 
                                    type="text" 
                                    value={formData.chassisNo}
                                    onChange={(e) => setFormData({...formData, chassisNo: e.target.value})}
                                    className="input-field p-2 text-xs font-bold"
                                    placeholder="Chassis number..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Color / Year</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={formData.color}
                                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                                        className="input-field p-2 text-xs font-bold w-1/2"
                                        placeholder="Color"
                                    />
                                    <input 
                                        type="text" 
                                        value={formData.mfgYear}
                                        onChange={(e) => setFormData({...formData, mfgYear: e.target.value})}
                                        className="input-field p-2 text-xs font-bold w-1/2"
                                        placeholder="Year"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">Kilometers</label>
                                <input 
                                    type="number" 
                                    value={formData.kilometerage}
                                    onChange={(e) => setFormData({...formData, kilometerage: e.target.value})}
                                    className="input-field p-2 text-xs font-bold"
                                    placeholder="KM reading..."
                                />
                            </div>
                        </div>
                    </div>

                    {selectedCar && (
                        <div className="bg-[var(--bg-tertiary)] p-6 rounded-xl border border-[var(--border)] shadow-sm animate-in zoom-in-95 duration-300 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2">Selected Car</p>
                                <h4 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
                                    {selectedCar.make} {selectedCar.model}
                                </h4>
                                <p className="text-[var(--text-muted)] font-bold mb-4 text-xs">{selectedCar.variant}</p>

                                <div className="space-y-2 pt-4 border-t border-[var(--border)]">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-[var(--text-muted)] font-bold uppercase tracking-tighter">Registration</span>
                                        <span className="font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] px-2 py-1 rounded border border-[var(--border)] uppercase">
                                            {selectedCar.registrationNumber || 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-[var(--text-muted)] font-bold uppercase tracking-tighter">Showroom Price</span>
                                        <span className="font-bold text-[var(--text-primary)]">₹{selectedCar.maximumRetailPrice?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs pt-2 mt-2 border-t border-[var(--border)]/50">
                                        <span className="text-emerald-600 font-bold uppercase tracking-tighter">Final Price</span>
                                        <span className="text-lg font-bold text-emerald-600">
                                            ₹{(selectedCar.maximumRetailPrice - (selectedCar.discountAmount || 0)).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="space-y-3">
                        <label className="form-label ml-1">Vehicle Price (₹)</label>
                        <input
                            type="number"
                            value={formData.priceBreakdown.vehiclePrice}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                priceBreakdown: { ...formData.priceBreakdown, vehiclePrice: e.target.value },
                                agreedPrice: e.target.value // Sync with total for simple flow if needed
                            })}
                            className="input-field p-3 font-bold"
                            placeholder="Basic price..."
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="form-label ml-1">RTO Charges (₹)</label>
                        <input
                            type="number"
                            value={formData.priceBreakdown.rtoCharges}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                priceBreakdown: { ...formData.priceBreakdown, rtoCharges: e.target.value } 
                            })}
                            className="input-field p-3 font-bold"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="form-label ml-1">Insurance (₹)</label>
                        <input
                            type="number"
                            value={formData.priceBreakdown.insurance}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                priceBreakdown: { ...formData.priceBreakdown, insurance: e.target.value } 
                            })}
                            className="input-field p-3 font-bold"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="form-label ml-1">Bill / SL No</label>
                        <input
                            type="text"
                            value={formData.billNo}
                            onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                            className="input-field p-3 font-bold"
                            placeholder="e.g. 5042"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="space-y-3">
                        <label className="form-label ml-1">
                            Final Negotiated Price (₹)
                        </label>
                        <input
                            type="number"
                            value={formData.agreedPrice}
                            onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                            className="input-field p-3 font-bold text-lg border-emerald-500/30 bg-emerald-50/10"
                            placeholder="Final Value..."
                            required
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="form-label ml-1">
                            Advance Amount (₹)
                        </label>
                        <input
                            type="number"
                            value={formData.advanceAmount}
                            onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                            className="input-field p-3 font-bold text-lg"
                            placeholder="Enter advance amount..."
                            required
                        />
                    </div>
                    <div className="bg-[var(--bg-tertiary)] p-6 rounded-xl border border-[var(--border)] flex flex-col justify-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Balance Amount</p>
                        <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                            ₹{balanceAmount.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                {/* Finance Section */}
                <div className="bg-[var(--bg-tertiary)] p-6 rounded-xl border border-[var(--border)] mb-10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Finance Details (Optional)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                            type="text" 
                            placeholder="Finance Company Name"
                            value={formData.financeDetails.companyName}
                            onChange={(e) => setFormData({
                                ...formData,
                                financeDetails: { ...formData.financeDetails, companyName: e.target.value }
                            })}
                            className="input-field p-3 text-sm font-bold"
                        />
                        <input 
                            type="number" 
                            placeholder="Amount to be Financed"
                            value={formData.financeDetails.amountFinanced}
                            onChange={(e) => setFormData({
                                ...formData,
                                financeDetails: { ...formData.financeDetails, amountFinanced: e.target.value }
                            })}
                            className="input-field p-3 text-sm font-bold"
                        />
                    </div>
                </div>

                {/* Responsibility Options */}
                <div className="mt-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="p-3 card bg-[var(--bg-tertiary)] border-[var(--border)] shadow-none">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-tight">Warranty</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={formData.warrantyApplied}
                                        onChange={(e) => setFormData({...formData, warrantyApplied: e.target.checked})}
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                                </label>
                            </div>
                        </div>
                        <div className="p-3 card bg-[var(--bg-tertiary)] border-[var(--border)] shadow-none col-span-2">
                            <input 
                                type="text" 
                                placeholder="RTO Person Name/Contact (Optional)"
                                value={formData.rtoPerson}
                                onChange={(e) => setFormData({...formData, rtoPerson: e.target.value})}
                                className="bg-transparent w-full text-xs font-bold focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <textarea 
                        placeholder="Additional Remarks / Notes..."
                        value={formData.remarks}
                        onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                        className="input-field p-3 text-xs font-bold w-full h-16 resize-none"
                    />
                </div>

            {/* Regulatory & Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* RTO Options */}
                <div className="card p-4 sm:p-8 border border-[var(--border)] flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-amber-600/10 rounded-lg flex items-center justify-center text-amber-600">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Registration Details</h3>
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">RTO and Owner info</p>
                        </div>
                    </div>

                    <div className="space-y-8 flex-1">
                        {enquiry?.customer && (
                            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
                                <CustomerContactInfo 
                                    customer={enquiry.customer} 
                                    onEdit={onEditCustomer} 
                                />
                            </div>
                        )}

                        <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl w-fit border border-[var(--border)]">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, registrationType: 'SELF' })}
                                className={clsx(
                                    "px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    formData.registrationType === 'SELF' ? "bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                )}
                            >
                                Self
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, registrationType: 'OTHER' })}
                                className={clsx(
                                    "px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    formData.registrationType === 'OTHER' ? "bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                )}
                            >
                                Nominee
                            </button>
                        </div>

                        {formData.registrationType === 'OTHER' && (
                            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <input
                                    type="text"
                                    value={formData.nomineeName}
                                    onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                                    placeholder="Nominee Full Name"
                                    className="input-field p-3 font-bold text-xs"
                                    required
                                />
                                <input
                                    type="tel"
                                    value={formData.nomineePhone}
                                    onChange={(e) => setFormData({ ...formData, nomineePhone: e.target.value })}
                                    placeholder="Nominee Contact Number"
                                    className="input-field p-3 font-bold text-xs"
                                    required
                                />
                                <textarea
                                    value={formData.nomineeAddress}
                                    onChange={(e) => setFormData({ ...formData, nomineeAddress: e.target.value })}
                                    placeholder="Nominee Permanent Address"
                                    className="input-field p-3 font-bold text-xs h-20 resize-none"
                                    required
                                ></textarea>
                            </div>
                        )}

                        <div className="pt-6 border-t border-[var(--border)]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Documents list</p>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(formData.documentsSubmitted).map(([key, value]) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                documentsSubmitted: { ...formData.documentsSubmitted, [key]: e.target.checked }
                                            })}
                                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                                        />
                                        <span className={clsx(
                                            "text-[10px] font-bold uppercase tracking-tight",
                                            value ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                                        )}>
                                            {key === 'photos' ? 'Photos (2 Nos)' : key}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Verification */}
                <div className="card p-4 sm:p-8 border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                            <X size={20} className="rotate-45" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Vehicle Inspection</h3>
                            <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mt-0.5">Verification checklist</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(formData.legalChecklist).map(([key, value]) => (
                            <label key={key} className="flex items-center p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer group border border-[var(--border)]">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        legalChecklist: { ...formData.legalChecklist, [key]: e.target.checked }
                                    })}
                                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer mr-4"
                                />
                                <span className={clsx(
                                    "text-xs font-bold tracking-tight uppercase",
                                    value ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                                )}>
                                    {key === 'testDrive' && 'Test Drive Completed'}
                                    {key === 'mechanicCheck' && 'Mechanic Verification'}
                                    {key === 'bodyLine' && 'Body & Paint Inspection'}
                                    {key === 'stepneyToolkit' && 'Spare Tire & Tools'}
                                    {key === 'tireCondition' && 'Tire Condition'}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-[var(--border)] space-y-6">
                        <div>
                            <label className="form-label mb-3 block text-center uppercase tracking-widest text-[9px]">
                                Delivery Date
                            </label>
                            <input
                                type="date"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                className="input-field p-3 font-bold flex justify-center text-[var(--accent)] uppercase tracking-wider text-center mx-auto w-[220px]"
                            />
                        </div>

                        <label className="flex items-center justify-center gap-3 cursor-pointer p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)]">
                            <input
                                type="checkbox"
                                checked={formData.payPartAmountBeforeDelivery}
                                onChange={(e) => setFormData({ ...formData, payPartAmountBeforeDelivery: e.target.checked })}
                                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-[var(--text-primary)]">Payment before delivery agreed</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Submit Action */}
            <div className="flex flex-col items-center gap-4 pt-8 border-t border-[var(--border)]">
                <p className="text-[10px] font-bold text-[var(--text-muted)] max-w-[400px] text-center uppercase tracking-tight leading-relaxed">
                    By confirming, you authorize the booking and financial commitment for this vehicle.
                </p>
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-sm sm:text-base px-8 sm:px-16 py-3 sm:py-4 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                    {submitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <IndianRupee size={20} /> Confirm Booking
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default InitialBookingTab;
