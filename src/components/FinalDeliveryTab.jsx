import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, FileText, Car as CarIcon, User } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

const FinalDeliveryTab = ({ booking, onUpdate, onComplete, readOnly = false }) => {
    const { showToast } = useToast();
    const [finalPayment, setFinalPayment] = useState({
        amount: booking.balanceAmount || 0,
        mode: 'CASH',
        referenceId: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [acceptanceChecked, setAcceptanceChecked] = useState(false);
    const [rtoData, setRtoData] = useState({
        registrationType: 'SELF',
        nomineeName: '',
        nomineeAddress: '',
        nomineePhone: '',
        documentsSubmitted: {
            photos: false,
            pan: false,
            aadhar: false
        }
    });

    useEffect(() => {
        if (booking?.registration) {
            setRtoData({
                registrationType: booking.registration.registrationType || 'SELF',
                nomineeName: booking.registration.nomineeName || '',
                nomineeAddress: booking.registration.nomineeAddress || '',
                nomineePhone: booking.registration.nomineePhone || '',
                documentsSubmitted: booking.registration.documentsSubmitted || {
                    photos: false,
                    pan: false,
                    aadhar: false
                }
            });
        }
    }, [booking]);

    const handleCompleteDelivery = async () => {
        if (!acceptanceChecked) {
            showToast('Please confirm customer acceptance', 'error');
            return;
        }

        if (finalPayment.amount > 0 && finalPayment.amount !== booking.balanceAmount) {
            showToast('Final payment amount must match pending balance', 'error');
            return;
        }

        setSubmitting(true);

        try {
            await api.post(`/bookings/${booking.id}/complete`, {
                finalAmount: finalPayment.amount,
                finalMode: finalPayment.mode,
                finalRefId: finalPayment.referenceId
            });

            showToast('Delivery completed successfully!', 'success');
            onUpdate();

            // If we are in the overlay, trigger auto-close
            if (onComplete) {
                setTimeout(() => {
                    onComplete();
                }, 1500);
            }
        } catch (error) {
            console.error('Error completing delivery:', error);
            showToast(error.response?.data?.error || 'Error completing delivery', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRTOUpdate = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/bookings/${booking.id}`, {
                registrationType: rtoData.registrationType,
                nomineeName: rtoData.registrationType === 'OTHER' ? rtoData.nomineeName : null,
                nomineeAddress: rtoData.registrationType === 'OTHER' ? rtoData.nomineeAddress : null,
                nomineePhone: rtoData.registrationType === 'OTHER' ? rtoData.nomineePhone : null,
                documentsSubmitted: rtoData.documentsSubmitted
            });
            showToast('RTO details updated successfully!', 'success');
            onUpdate();
        } catch (error) {
            console.error('Error updating RTO details:', error);
            showToast(error.response?.data?.error || 'Error updating RTO details', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const totalReceived = booking.agreedPrice - booking.balanceAmount;

    return (
        <div className="space-y-6">
            {/* Data Verification Panel */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b bg-blue-50">
                    <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        Data Verification - Please Review Before Proceeding
                    </h3>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Car Details */}
                    <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <CarIcon size={20} className="text-blue-600" />
                            <h4 className="font-semibold">Vehicle Details</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Registration:</span>
                                <span className="font-medium">{booking.car?.registrationNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Make/Model:</span>
                                <span className="font-medium">
                                    {booking.car?.make} {booking.car?.model}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Variant:</span>
                                <span className="font-medium">{booking.car?.variant || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* RTO Details */}
                    <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <User size={20} className="text-blue-600" />
                            <h4 className="font-semibold">Registration Details</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <span className="font-medium">
                                    {booking.registration?.registrationType === 'SELF' ? 'Self (Customer)' : 'Other (Nominee)'}
                                </span>
                            </div>
                            {booking.registration?.registrationType === 'OTHER' && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nominee Name:</span>
                                        <span className="font-medium">{booking.registration?.nomineeName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nominee Phone:</span>
                                        <span className="font-medium">{booking.registration?.nomineePhone}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText size={20} />
                        Complete Payment History
                    </h3>
                </div>

                <div className="p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Agreed Price</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(booking.agreedPrice)}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total Received</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(totalReceived)}
                            </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Pending Balance</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(booking.balanceAmount)}
                            </p>
                        </div>
                    </div>

                    {/* Transaction Breakdown */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Mode
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {booking.transactions?.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${transaction.type === 'advance' ? 'bg-blue-100 text-blue-800' :
                                                transaction.type === 'part_payment' ? 'bg-green-100 text-green-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                {transaction.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {transaction.mode}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                                            {formatCurrency(transaction.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Final Settlement */}
            {booking.balanceAmount > 0 && booking.status !== 'completed' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b bg-orange-50">
                        <h3 className="text-lg font-semibold text-orange-900">
                            Final Settlement Required
                        </h3>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Final Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    value={finalPayment.amount}
                                    onChange={(e) => setFinalPayment({ ...finalPayment, amount: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Mode *
                                </label>
                                <select
                                    value={finalPayment.mode}
                                    onChange={(e) => setFinalPayment({ ...finalPayment, mode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="loan">Loan</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Transaction/Ref ID
                                </label>
                                <input
                                    type="text"
                                    value={finalPayment.referenceId}
                                    onChange={(e) => setFinalPayment({ ...finalPayment, referenceId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RTO Details Block (Backup) */}
            {booking.status !== 'completed' && (
                <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-orange-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="text-orange-600" size={24} />
                            RTO / Registration Details
                        </h3>
                        <button
                            onClick={handleRTOUpdate}
                            disabled={submitting}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium transition-colors"
                        >
                            {submitting ? 'Updating...' : 'Update RTO Details'}
                        </button>
                    </div>

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
                                        checked={rtoData.registrationType === 'SELF'}
                                        onChange={(e) => setRtoData({ ...rtoData, registrationType: e.target.value })}
                                        className="mr-2"
                                    />
                                    Self (Customer)
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="OTHER"
                                        checked={rtoData.registrationType === 'OTHER'}
                                        onChange={(e) => setRtoData({ ...rtoData, registrationType: e.target.value })}
                                        className="mr-2"
                                    />
                                    Other (Nominee)
                                </label>
                            </div>
                        </div>

                        {rtoData.registrationType === 'OTHER' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nominee Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={rtoData.nomineeName}
                                        onChange={(e) => setRtoData({ ...rtoData, nomineeName: e.target.value })}
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
                                        value={rtoData.nomineeAddress}
                                        onChange={(e) => setRtoData({ ...rtoData, nomineeAddress: e.target.value })}
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
                                        value={rtoData.nomineePhone}
                                        onChange={(e) => setRtoData({ ...rtoData, nomineePhone: e.target.value })}
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
                                {Object.entries(rtoData.documentsSubmitted).map(([key, value]) => (
                                    <label key={key} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={(e) => setRtoData({
                                                ...rtoData,
                                                documentsSubmitted: { ...rtoData.documentsSubmitted, [key]: e.target.checked }
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
            )}

            {/* Final Invoice & Customer Acceptance */}
            {booking.status !== 'completed' && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b bg-green-50">
                        <h3 className="text-lg font-semibold text-green-900">
                            Final Invoice & Customer Acceptance
                        </h3>
                    </div>

                    <div className="p-6">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Important Disclaimer
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p className="italic">
                                            "I accept the vehicle in as-is condition. I have verified all commitments
                                            and am satisfied with the car's state. All payments have been accounted for
                                            as shown in the transaction history above."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={acceptanceChecked}
                                    onChange={(e) => setAcceptanceChecked(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-900">
                                    Customer has read and accepted the above disclaimer
                                </span>
                            </label>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleCompleteDelivery}
                                disabled={submitting || !acceptanceChecked}
                                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-lg"
                            >
                                <CheckCircle size={20} />
                                {submitting ? 'Processing...' : 'Complete Delivery & Generate Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinalDeliveryTab;
