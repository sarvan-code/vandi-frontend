import React, { useState, useContext, useEffect } from 'react';
import clsx from 'clsx';
import { IndianRupee, Plus, FileText, Phone, X } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import CustomerContactInfo from './CustomerContactInfo';

const ActiveManagementTab = ({ booking, onUpdate, onEditCustomer }) => {
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

    const handleDownloadReceipt = async (transaction) => {
        try {
            const endpoint = transaction.type === 'advance_payment'
                ? `/bookings/${booking.id}/advance-receipt`
                : `/bookings/${booking.id}/receipt/${transaction.id}`;

            const response = await api.get(endpoint, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${transaction.type}_${transaction.id.slice(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading receipt:', error);
            showToast('Error downloading receipt', 'error');
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
        <div className="space-y-12 animate-fade-in">
            {/* Status Transition Action */}
            {booking.status !== 'ready_for_delivery' && booking.status !== 'COMPLETED' && (
                <div className="card p-6 border border-[var(--border)] bg-[var(--bg-tertiary)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-600/10 rounded-lg flex items-center justify-center text-amber-600">
                            <Plus size={24} className="rotate-45" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Booking Progress</h4>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                                Move to ready for delivery
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleMoveToDelivery}
                        disabled={submitting}
                        className="btn-primary !bg-slate-900 !text-white hover:!bg-black px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95"
                    >
                        Mark Ready for Delivery
                    </button>
                </div>
            )}

            {/* Payment Registry */}
            <div className="card overflow-hidden border border-[var(--border)] shadow-sm">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                            <IndianRupee size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">Payment History</h3>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPaymentForm(!showPaymentForm)}
                        className={clsx(
                            "btn-secondary !px-4 !py-2 !text-[10px] uppercase tracking-widest flex items-center gap-2",
                            showPaymentForm ? "bg-rose-50 text-rose-600 border-rose-100" : ""
                        )}
                    >
                        {showPaymentForm ? (
                            <><X size={12} /> Cancel</>
                        ) : (
                            <><Plus size={12} /> Record Receipt</>
                        )}
                    </button>
                </div>

                {showPaymentForm && (
                    <form onSubmit={handlePaymentSubmit} className="p-8 bg-[var(--bg-secondary)] border-b border-[var(--border)] animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="form-label ml-1">Payment Amount (₹)</label>
                                <input
                                    type="number"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    className="input-field p-3 font-bold"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="form-label ml-1">Payment Mode</label>
                                <select
                                    value={paymentData.mode}
                                    onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
                                    className="input-field p-3 font-bold"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="loan">Loan Disbursement</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="form-label ml-1">Reference Number / Note</label>
                                <input
                                    type="text"
                                    value={paymentData.referenceId}
                                    onChange={(e) => setPaymentData({ ...paymentData, referenceId: e.target.value })}
                                    className="input-field p-3 font-bold uppercase text-[10px] tracking-wider"
                                    placeholder="TRACE ID..."
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full btn-primary !py-3 flex items-center justify-center gap-2 disabled:opacity-50 transition-all font-bold text-xs uppercase tracking-widest"
                                >
                                    {submitting ? 'SAVING...' : 'SAVE PAYMENT'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-[var(--bg-tertiary)]">
                                <th className="px-6 py-4 text-left text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Timestamp</th>
                                <th className="px-6 py-4 text-left text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Type</th>
                                <th className="px-6 py-4 text-left text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Mode</th>
                                <th className="px-6 py-4 text-left text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Amount</th>
                                <th className="px-6 py-4 text-left text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Reference</th>
                                <th className="px-6 py-4 text-right text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-[var(--border)]">
                            {booking.transactions && booking.transactions.length > 0 ? (
                                booking.transactions.map((transaction) => (
                                    <tr key={transaction.id} className="group hover:bg-[var(--bg-tertiary)] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-[var(--text-muted)] uppercase text-[9px]">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "badge py-0.5 px-2 rounded-md font-bold uppercase tracking-wider text-[9px] border",
                                                transaction.type === 'advance_payment' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                    transaction.type === 'part_payment' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border)]'
                                            )}>
                                                {transaction.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-[var(--text-muted)] uppercase">
                                            {transaction.mode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-extrabold text-[var(--text-primary)]">
                                            {formatCurrency(transaction.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase">
                                            {transaction.referenceId || '--'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-[var(--accent)]">
                                            <button
                                                onClick={() => handleDownloadReceipt(transaction)}
                                                className="inline-flex items-center gap-1 font-bold uppercase tracking-widest hover:underline text-[var(--accent)] bg-transparent border-none p-0"
                                            >
                                                Receipt <FileText size={10} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">No transactions found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Activities & Logistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Interaction Registry */}
                <div className="card flex flex-col border border-[var(--border)] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                                <Phone size={16} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">Recent Talks</h3>
                        </div>
                        <button
                            onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                            className={clsx(
                                "btn-secondary !px-4 !py-2 !text-[10px] uppercase tracking-widest",
                                showFollowUpForm ? "bg-rose-50 text-rose-600" : ""
                            )}
                        >
                            {showFollowUpForm ? 'Cancel' : 'Add Follow-up'}
                        </button>
                    </div>
                    {showFollowUpForm && (
                        <form onSubmit={handleFollowUpSubmit} className="p-6 bg-[var(--bg-secondary)] border-b border-[var(--border)] space-y-4 animate-in slide-in-from-top-4">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="form-label ml-1">Follow-up Type</label>
                                    <select
                                        value={followUpData.type}
                                        onChange={(e) => setFollowUpData({ ...followUpData, type: e.target.value })}
                                        className="input-field p-3 font-bold text-[10px] uppercase"
                                        required
                                    >
                                        <option value="">Select Category...</option>
                                        {followUpTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="form-label ml-1">Notes</label>
                                    <textarea
                                        value={followUpData.remarks}
                                        onChange={(e) => setFollowUpData({ ...followUpData, remarks: e.target.value })}
                                        className="input-field p-3 font-bold text-[10px] h-20 resize-none"
                                        placeholder="Enter detailed observation..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="form-label ml-1">Next Follow-up Date</label>
                                    <input
                                        type="date"
                                        value={followUpData.nextActionDate}
                                        onChange={(e) => setFollowUpData({ ...followUpData, nextActionDate: e.target.value })}
                                        className="input-field p-3 font-bold text-[10px]"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary !px-8 !py-2.5 !text-[10px] uppercase tracking-widest"
                                >
                                    SAVE FOLLOW-UP
                                </button>
                            </div>
                        </form>
                    )}
                    <div className="p-6 flex-1 overflow-auto max-h-[500px] no-scrollbar">
                        {booking.followUps && booking.followUps.length > 0 ? (
                            <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--border)]">
                                {booking.followUps.map((followUp) => (
                                    <div key={followUp.id} className="relative pl-10">
                                        <div className="absolute left-0 top-1 w-8 h-8 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full flex items-center justify-center z-10">
                                            <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-extrabold tracking-tight uppercase text-[var(--text-primary)]">{followUp.type}</p>
                                            {followUp.remarks && (
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] italic bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border)]">
                                                    {followUp.remarks}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                                                <span>BY: {followUp.agent.fullName}</span>
                                                <span className="w-1 h-1 bg-[var(--border)] rounded-full"></span>
                                                <span>{formatDate(followUp.createdAt)}</span>
                                                {followUp.nextActionDate && (
                                                    <span className="badge py-0.5 px-2 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
                                                        FOLLOW UP: {new Date(followUp.nextActionDate).toLocaleDateString('en-IN')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">No active interactions</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* Compliance Ledger */}
                <div className="card flex flex-col border border-[var(--border)] overflow-hidden shadow-sm bg-[var(--bg-tertiary)]/30">
                    <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-600/10 rounded-lg flex items-center justify-center text-orange-600">
                                <FileText size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">RTO Details</h3>
                            </div>
                        </div>
                        <button
                            onClick={handleRTOUpdate}
                            disabled={submitting}
                            className="btn-primary !bg-orange-600 !text-white hover:!bg-orange-700 !px-4 !py-2 !text-[10px] uppercase tracking-widest shadow-none"
                        >
                            Update RTO
                        </button>
                    </div>
                    <div className="p-6 flex-1 space-y-8">
                        {booking?.enquiry?.customer && (
                            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                <CustomerContactInfo 
                                    customer={booking.enquiry.customer} 
                                    onEdit={onEditCustomer} 
                                />
                            </div>
                        )}
                        <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl w-fit border border-[var(--border)]">
                            <button
                                type="button"
                                onClick={() => setRtoData({ ...rtoData, registrationType: 'SELF' })}
                                className={clsx(
                                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg",
                                    rtoData.registrationType === 'SELF' ? "bg-[var(--bg-tertiary)] text-orange-700 shadow-sm" : "text-[var(--text-muted)]"
                                )}
                            >
                                Self
                            </button>
                            <button
                                type="button"
                                onClick={() => setRtoData({ ...rtoData, registrationType: 'OTHER' })}
                                className={clsx(
                                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg",
                                    rtoData.registrationType === 'OTHER' ? "bg-[var(--bg-tertiary)] text-orange-700 shadow-sm" : "text-[var(--text-muted)]"
                                )}
                            >
                                Nominee
                            </button>
                        </div>

                        {rtoData.registrationType === 'OTHER' && (
                            <div className="space-y-4 animate-in zoom-in-95">
                                <input
                                    type="text"
                                    value={rtoData.nomineeName}
                                    onChange={(e) => setRtoData({ ...rtoData, nomineeName: e.target.value })}
                                    className="input-field p-3 font-bold text-[10px] uppercase"
                                    placeholder="Nominee Full Name..."
                                    required
                                />
                                <input
                                    type="tel"
                                    value={rtoData.nomineePhone}
                                    onChange={(e) => setRtoData({ ...rtoData, nomineePhone: e.target.value })}
                                    className="input-field p-3 font-bold text-[10px]"
                                    placeholder="Nominee Contact..."
                                    required
                                />
                                <textarea
                                    value={rtoData.nomineeAddress}
                                    onChange={(e) => setRtoData({ ...rtoData, nomineeAddress: e.target.value })}
                                    className="input-field p-3 font-bold text-[10px] h-20 resize-none"
                                    placeholder="Permanent Address..."
                                    required
                                />
                            </div>
                        )}
                        <div className="pt-6 border-t border-[var(--border)]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Documents list</p>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(rtoData.documentsSubmitted).map(([key, value]) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={(e) => setRtoData({
                                                ...rtoData,
                                                documentsSubmitted: { ...rtoData.documentsSubmitted, [key]: e.target.checked }
                                            })}
                                            className="w-4 h-4 rounded border-[var(--border)] text-orange-600 focus:ring-orange-500 cursor-pointer"
                                        />
                                        <span className={clsx(
                                            "text-[10px] font-bold uppercase tracking-tight",
                                            value ? "text-orange-700" : "text-[var(--text-muted)]"
                                        )}>
                                            {key === 'photos' ? 'Photos (2 Nos)' : key}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveManagementTab;
