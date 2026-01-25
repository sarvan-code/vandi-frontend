import React, { useState, useContext, useEffect } from 'react';
import { DollarSign, Plus, FileText, Phone, X } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const ActiveManagementTab = ({ booking, onUpdate }) => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showFollowUpForm, setShowFollowUpForm] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        mode: 'cash',
        referenceId: '',
        type: 'part_payment'
    });
    const [followUpData, setFollowUpData] = useState({
        type: '',
        remarks: '',
        nextActionDate: ''
    });
    const [submitting, setSubmitting] = useState(false);
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

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        if (parseFloat(paymentData.amount) > booking.balanceAmount) {
            showToast('Payment amount cannot exceed pending balance', 'error');
            return;
        }

        setSubmitting(true);

        try {
            await api.post(`/bookings/${booking.id}/payment`, {
                amount: parseFloat(paymentData.amount),
                mode: paymentData.mode,
                referenceId: paymentData.referenceId,
                type: paymentData.type
            });

            showToast('Payment recorded successfully!', 'success');
            setPaymentData({ amount: '', mode: 'cash', referenceId: '', type: 'part_payment' });
            setShowPaymentForm(false);
            onUpdate();
        } catch (error) {
            console.error('Error recording payment:', error);
            showToast(error.response?.data?.error || 'Error recording payment', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMoveToDelivery = async () => {
        if (!window.confirm('Are you sure you want to move this booking to "Ready for Delivery"? This will unlock the Final Delivery tab.')) {
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/bookings/${booking.id}/ready-for-delivery`);
            showToast('Booking status updated to Ready for Delivery!', 'success');
            onUpdate();
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('Error updating booking status', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFollowUpSubmit = async (e) => {
        e.preventDefault();

        if (!followUpData.type) {
            showToast('Please select a follow-up type', 'error');
            return;
        }

        setSubmitting(true);

        try {
            await api.post(`/bookings/${booking.id}/followup`, {
                agentId: user.userId,
                type: followUpData.type,
                remarks: followUpData.remarks,
                nextActionDate: followUpData.nextActionDate || null
            });

            showToast('Follow-up added successfully!', 'success');
            setFollowUpData({ type: '', remarks: '', nextActionDate: '' });
            setShowFollowUpForm(false);
            onUpdate();
        } catch (error) {
            console.error('Error adding follow-up:', error);
            showToast(error.response?.data?.error || 'Error adding follow-up', 'error');
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const followUpTypes = [
        'Called Customer: Request Part Payment',
        'Called Customer: Sent Bank Details',
        'Called Customer: Confirm Delivery Date/Time',
        'Called Customer: Request Pending Proofs',
        'Called Loan Agent: Check Disbursement Status',
        'Called Loan Agent: Loan Approved',
        'Called Customer: General Status Update'
    ];

    return (
        <div className="space-y-6">
            {/* Status Override */}
            {booking.status !== 'ready_for_delivery' && booking.status !== 'COMPLETED' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-orange-800">Ready for Delivery?</h4>
                        <p className="text-sm text-orange-700">
                            Move to delivery phase even if payment is pending (e.g., balance to be paid at RTO).
                        </p>
                    </div>
                    <button
                        onClick={handleMoveToDelivery}
                        disabled={submitting}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium whitespace-nowrap"
                    >
                        Move to Delivery
                    </button>
                </div>
            )}

            {/* Section A: Payment Collection Block */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DollarSign size={24} />
                        <h3 className="text-lg font-semibold">Collect Payment</h3>
                    </div>
                    <button
                        onClick={() => setShowPaymentForm(!showPaymentForm)}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {showPaymentForm ? 'Cancel' : 'Add Payment'}
                    </button>
                </div>

                {showPaymentForm && (
                    <form onSubmit={handlePaymentSubmit} className="p-6 bg-blue-50 border-t-2 border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Mode *
                                </label>
                                <select
                                    value={paymentData.mode}
                                    onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="loan">Loan Disbursement</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Transaction/Ref ID
                                </label>
                                <input
                                    type="text"
                                    value={paymentData.referenceId}
                                    onChange={(e) => setPaymentData({ ...paymentData, referenceId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {submitting ? 'Recording...' : 'Record Payment & Generate Receipt'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Section B: Transaction History Ledger */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b flex items-center gap-2">
                    <FileText size={20} className="text-gray-600" />
                    <h3 className="text-lg font-semibold">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mode
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reference
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Receipt
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {booking.transactions && booking.transactions.length > 0 ? (
                                booking.transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${transaction.type === 'advance' ? 'bg-blue-100 text-blue-800' :
                                                transaction.type === 'part_payment' ? 'bg-green-100 text-green-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                {transaction.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {transaction.mode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                            {formatCurrency(transaction.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {transaction.referenceId || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {transaction.receiptUrl ? (
                                                <a
                                                    href={transaction.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    View PDF
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">Pending</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No transactions yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section C: Follow-up Activity Stream */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Phone size={20} className="text-gray-600" />
                        <h3 className="text-lg font-semibold">Follow-up Activity</h3>
                    </div>
                    <button
                        onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {showFollowUpForm ? 'Cancel' : 'Log Call / Update'}
                    </button>
                </div>

                {showFollowUpForm && (
                    <form onSubmit={handleFollowUpSubmit} className="p-6 bg-gray-50 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Follow-up Type *
                                </label>
                                <select
                                    value={followUpData.type}
                                    onChange={(e) => setFollowUpData({ ...followUpData, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select type</option>
                                    {followUpTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Remarks
                                </label>
                                <input
                                    type="text"
                                    value={followUpData.remarks}
                                    onChange={(e) => setFollowUpData({ ...followUpData, remarks: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional notes"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Next Action Date
                                </label>
                                <div className="relative group">
                                    <input
                                        type="date"
                                        value={followUpData.nextActionDate}
                                        onChange={(e) => setFollowUpData({ ...followUpData, nextActionDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                                    />
                                    {followUpData.nextActionDate && (
                                        <button
                                            type="button"
                                            onClick={() => setFollowUpData({ ...followUpData, nextActionDate: '' })}
                                            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {submitting ? 'Adding...' : 'Add Follow-up'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="p-6">
                    {booking.followUps && booking.followUps.length > 0 ? (
                        <div className="space-y-4">
                            {booking.followUps.map((followUp) => (
                                <div key={followUp.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{followUp.type}</p>
                                            {followUp.remarks && (
                                                <p className="text-sm text-gray-600 mt-1">{followUp.remarks}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>By: {followUp.agent.fullName}</span>
                                                <span>•</span>
                                                <span>{formatDate(followUp.createdAt)}</span>
                                                {followUp.nextActionDate && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-orange-600 font-medium">
                                                            Next: {new Date(followUp.nextActionDate).toLocaleDateString('en-IN')}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No follow-ups yet</p>
                    )}
                </div>
            </div>

            {/* RTO Details Block (Backup) */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-orange-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="text-orange-600" size={24} />
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
        </div>
    );
};

export default ActiveManagementTab;
