import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import VehicleAutocomplete from './VehicleAutocomplete';
import { X, Car as CarIcon, DollarSign, Calendar } from 'lucide-react';
import clsx from 'clsx';

const InitialBookingTab = ({ enquiryId, onBookingCreated }) => {
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
        }
    });

    const [selectedCar, setSelectedCar] = useState(null);
    const [enquiry, setEnquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [enquiryId]);

    const fetchData = async () => {
        try {
            // Fetch enquiry details
            const enquiryResponse = await api.get(`/enquiries/${enquiryId}`);
            setEnquiry(enquiryResponse.data);

            // Auto-fill car from last follow-up if available for new booking
            const followUps = enquiryResponse.data.followUps || [];
            if (followUps.length > 0) {
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

            setLoading(false);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            showToast('Error loading enquiry data', 'error');
            setLoading(false);
        }
    };

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
                documentsSubmitted: formData.documentsSubmitted
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

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-12 animate-fade-in">
            {/* Select Vehicle */}
            <div className="card p-8 relative overflow-hidden group border-[var(--border)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                        <CarIcon size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Asset Selection</h3>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Identify Vehicle from Inventory</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="form-label ml-1">
                            Search Inventory
                        </label>
                        <VehicleAutocomplete
                            value={formData.carRegistration}
                            onChange={(val) => {
                                if (typeof val === 'object' && val !== null) {
                                    setFormData({
                                        ...formData,
                                        carId: val.carId,
                                        carRegistration: val.registrationNumber
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

                    {selectedCar && (
                        <div className="bg-[var(--bg-tertiary)] p-6 rounded-xl border border-[var(--border)] shadow-sm animate-in zoom-in-95 duration-300 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2">Selected Asset</p>
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
                                        <span className="text-[var(--text-muted)] font-bold uppercase tracking-tighter">Standard Price</span>
                                        <span className="font-bold text-[var(--text-primary)]">₹{selectedCar.maximumRetailPrice?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs pt-2 mt-2 border-t border-[var(--border)]/50">
                                        <span className="text-emerald-600 font-bold uppercase tracking-tighter">Net Value</span>
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
            <div className="card p-8 border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-emerald-600/10 rounded-lg flex items-center justify-center text-emerald-600">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Financial Terms</h3>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Revenue & Commitment Details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="space-y-3">
                        <label className="form-label ml-1">
                            Agreed Price (₹)
                        </label>
                        <input
                            type="number"
                            value={formData.agreedPrice}
                            onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                            className="input-field p-3 font-bold text-lg"
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

                {selectedCar && formData.agreedPrice && (
                    <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-xl border border-rose-100 dark:border-rose-900/20 animate-in fade-in slide-in-from-bottom-2 mb-10">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600">
                                    <DollarSign size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-rose-900 dark:text-rose-400 uppercase tracking-tight">Negotiated Discount</p>
                                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Reduction from Standard MRP</p>
                                </div>
                            </div>
                            <p className="text-2xl font-extrabold text-rose-600 tracking-tight">
                                ₹{totalNegotiatedDiscount.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Responsibility Options */}
                <div className="mt-8">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-6 text-center flex items-center justify-center gap-4">
                        <span className="w-8 h-[1px] bg-[var(--border)]"></span>
                        Service Responsibilities
                        <span className="w-8 h-[1px] bg-[var(--border)]"></span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Object.entries(formData.commitments).map(([key, value]) => (
                            <div key={key} className="p-3 card bg-[var(--bg-tertiary)] border-[var(--border)] shadow-none hover:bg-[var(--bg-secondary)] transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <select
                                        value={value}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            commitments: { ...formData.commitments, [key]: e.target.value }
                                        })}
                                        className="bg-transparent font-bold text-[9px] text-[var(--accent)] uppercase tracking-wider focus:outline-none cursor-pointer"
                                    >
                                        <option value="COMPANY">Showroom</option>
                                        <option value="CUSTOMER">Customer</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Regulatory & Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* RTO Options */}
                <div className="card p-8 border border-[var(--border)] flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-amber-600/10 rounded-lg flex items-center justify-center text-amber-600">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Compliance Profile</h3>
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">RTO & Legal Provisioning</p>
                        </div>
                    </div>

                    <div className="space-y-8 flex-1">
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
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Verification Checklist</p>
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
                <div className="card p-8 border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                            <X size={20} className="rotate-45" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Asset Validation</h3>
                            <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mt-0.5">Mandatory Inspection Points</p>
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
                                    {key === 'stepneyToolkit' && 'Inventory Checklist'}
                                    {key === 'tireCondition' && 'Wheel Alignment & Wear'}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-[var(--border)] space-y-6">
                        <div>
                            <label className="form-label mb-3 block text-center uppercase tracking-widest text-[9px]">
                                Proposed Delivery Date
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
                            <span className="text-[10px] font-bold uppercase tracking-tight text-[var(--text-primary)]">Pre-Delivery Settlement Agreed</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Submit Action */}
            <div className="flex flex-col items-center gap-4 pt-8 border-t border-[var(--border)]">
                <p className="text-[10px] font-bold text-[var(--text-muted)] max-w-[400px] text-center uppercase tracking-tight leading-relaxed">
                    By confirming, you authorize the formal booking record and initial financial commitment for this asset.
                </p>
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-base px-16 py-4 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                    {submitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <DollarSign size={20} /> Authorize Booking
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default InitialBookingTab;
