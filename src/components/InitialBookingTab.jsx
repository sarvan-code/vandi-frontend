import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import VehicleAutocomplete from './VehicleAutocomplete';
import { X } from 'lucide-react';

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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Car Selection */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Car Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Car *
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
                                        carId: '' // Clear ID if user is typing manually
                                    });
                                    setSelectedCar(null);
                                }
                            }}
                            placeholder="Type registration number, make or model..."
                        />
                    </div>
                    {selectedCar && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 font-semibold mb-2">Selected Vehicle</p>
                            <p className="font-bold text-blue-900">{selectedCar.make} {selectedCar.model} {selectedCar.variant}</p>
                            <p className="text-sm text-gray-500 mb-3">{selectedCar.registrationNumber}</p>

                            <div className="grid grid-cols-1 gap-1 pt-2 border-t border-blue-100">
                                {selectedCar.maximumRetailPrice && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">MRP:</span>
                                        <span className="font-medium text-gray-900">₹{selectedCar.maximumRetailPrice.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {selectedCar.discountAmount && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Reversed Price:</span>
                                        <span className="font-medium text-red-600">₹{selectedCar.discountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {selectedCar.maximumRetailPrice && selectedCar.discountAmount && (
                                    <div className="flex justify-between text-sm pt-1 border-t border-blue-50 mt-1">
                                        <span className="text-gray-700 font-medium">Net Benefit:</span>
                                        <span className="font-bold text-green-700">
                                            ₹{(selectedCar.maximumRetailPrice - selectedCar.discountAmount).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Details */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Financial Negotiation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Agreed Price * (₹)
                        </label>
                        <input
                            type="number"
                            value={formData.agreedPrice}
                            onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            required

                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Advance Amount * (₹)
                        </label>
                        <input
                            type="number"
                            value={formData.advanceAmount}
                            onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            required

                        />
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Balance Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                            ₹{balanceAmount.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                {selectedCar && formData.agreedPrice && (
                    <div className="mt-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-orange-700 font-medium">Total Negotiated Discount</p>
                                <p className="text-xs text-orange-600">(Net Benefit - Agreed Price)</p>
                            </div>
                            <p className="text-2xl font-bold text-orange-700">
                                ₹{totalNegotiatedDiscount.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Commitments */}
                <div className="mt-6">
                    <h4 className="font-medium mb-3">Responsibility Matrix</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(formData.commitments).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <select
                                    value={value}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        commitments: { ...formData.commitments, [key]: e.target.value }
                                    })}
                                    className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                                >
                                    <option value="COMPANY">Company</option>
                                    <option value="CUSTOMER">Customer</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RTO Details */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">RTO / Registration Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Registration Type *
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="SELF"
                                    checked={formData.registrationType === 'SELF'}
                                    onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                                    className="mr-2"
                                />
                                Self (Customer)
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="OTHER"
                                    checked={formData.registrationType === 'OTHER'}
                                    onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                                    className="mr-2"
                                />
                                Other (Nominee)
                            </label>
                        </div>
                    </div>

                    {formData.registrationType === 'OTHER' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-50 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nominee Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nomineeName}
                                    onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nominee Address *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nomineeAddress}
                                    onChange={(e) => setFormData({ ...formData, nomineeAddress: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nominee Phone *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.nomineePhone}
                                    onChange={(e) => setFormData({ ...formData, nomineePhone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Documents Checklist */}
                    <div>
                        <h4 className="font-medium mb-2">Documents Checklist</h4>
                        <div className="flex gap-4">
                            {Object.entries(formData.documentsSubmitted).map(([key, value]) => (
                                <label key={key} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            documentsSubmitted: { ...formData.documentsSubmitted, [key]: e.target.checked }
                                        })}
                                        className="mr-2"
                                    />
                                    {key === 'photos' ? '2 Photos' : key.toUpperCase()}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Advance Payment */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Advance Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Mode *
                        </label>
                        <select
                            value={formData.advanceMode}
                            onChange={(e) => setFormData({ ...formData, advanceMode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                        >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction/Ref ID
                        </label>
                        <input
                            type="text"
                            value={formData.advanceRefId}
                            onChange={(e) => setFormData({ ...formData, advanceRefId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"

                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Delivery Date
                        </label>
                        <div className="relative group">
                            <input
                                type="date"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 pr-10"
                            />
                            {formData.deliveryDate && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, deliveryDate: '' })}
                                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.payPartAmountBeforeDelivery}
                            onChange={(e) => setFormData({ ...formData, payPartAmountBeforeDelivery: e.target.checked })}
                            className="mr-2"
                        />
                        <span className="text-sm">Customer willing to pay part amount before delivery</span>
                    </label>
                </div>
            </div>

            {/* Legal Checklist */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Customer Delivery Commitment</h3>
                <div className="space-y-2">
                    {Object.entries(formData.legalChecklist).map(([key, value]) => (
                        <label key={key} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    legalChecklist: { ...formData.legalChecklist, [key]: e.target.checked }
                                })}
                                className="mr-2"
                            />
                            <span className="text-sm">
                                {key === 'testDrive' && 'Test Drive taken?'}
                                {key === 'mechanicCheck' && 'Own Mechanic checked?'}
                                {key === 'bodyLine' && 'Body line & Dent/Scratch conditions verified?'}
                                {key === 'stepneyToolkit' && 'Stepney & Tool kit checked?'}
                                {key === 'tireCondition' && 'Tire condition verified?'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {submitting
                        ? 'Creating Booking...'
                        : 'Submit Advance & Confirm Booking'
                    }
                </button>
            </div>
        </form>
    );
};

export default InitialBookingTab;
