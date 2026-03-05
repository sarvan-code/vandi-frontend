import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, FileText, Car as CarIcon, User } from 'lucide-react';
import clsx from 'clsx';
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

    const handleDownloadInvoice = async () => {
        try {
            const response = await api.get(`/bookings/${booking.id}/invoice`, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${booking.id.slice(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            showToast('Error downloading invoice', 'error');
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
        <div className="space-y-12 animate-fade-in">
            {/* Critical Verification */}
            <div className="card overflow-hidden border border-rose-200 dark:border-rose-900/30 shadow-sm">
                <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-900/20 bg-rose-50/50 dark:bg-rose-900/10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-600">
                        <AlertTriangle size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-rose-900 dark:text-rose-400">Final Verification</h3>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vehicle Metadata */}
                    <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 border border-[var(--border)] relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2">Car Details</p>
                            <h4 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
                                {booking.car?.make} {booking.car?.model}
                            </h4>
                            <p className="text-[var(--text-muted)] font-bold mb-6 text-xs">{booking.car?.variant || 'Standard Specification'}</p>

                            <div className="pt-4 border-t border-[var(--border)]">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Reg Index</span>
                                    <span className="font-mono font-bold text-[10px] bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3 py-1 rounded border border-[var(--border)] uppercase">
                                        {booking.car?.registrationNumber || 'PENDING'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Compliance Profile Retrieval */}
                    <div className="card border-[var(--border)] p-6 bg-[var(--bg-secondary)] relative overflow-hidden">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Registration Info</p>
                        <h4 className="text-xl font-bold mb-1 text-[var(--text-primary)] tracking-tight">
                            {booking.registration?.registrationType === 'SELF' ? 'Self Ownership' : 'Nominee Transfer'}
                        </h4>
                        <p className="text-[var(--text-muted)] font-bold mb-6 text-xs uppercase tracking-tight">
                            {booking.registration?.registrationType === 'SELF' ? 'Direct Allocation' : `Legal Nominee: ${booking.registration?.nomineeName}`}
                        </p>

                        <div className="pt-4 border-t border-[var(--border)]">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest">Status</span>
                                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    VERIFIED
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactional Audit */}
            <div className="card overflow-hidden border border-[var(--border)] shadow-sm">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                        <FileText size={16} />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">Payment Records</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-4 rounded-xl">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Contract Value</p>
                            <p className="text-xl font-extrabold text-[var(--text-primary)]">
                                {formatCurrency(booking.agreedPrice)}
                            </p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-4 rounded-xl">
                            <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Received</p>
                            <p className="text-xl font-extrabold text-emerald-600">
                                {formatCurrency(totalReceived)}
                            </p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-4 rounded-xl">
                            <p className="text-[9px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-1">Remaining Balance</p>
                            <p className="text-xl font-extrabold text-rose-600">
                                {formatCurrency(booking.balanceAmount)}
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto no-scrollbar border border-[var(--border)] rounded-xl">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[var(--bg-tertiary)]">
                                    <th className="px-6 py-4 text-left text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Timestamp</th>
                                    <th className="px-6 py-4 text-left text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Type</th>
                                    <th className="px-6 py-4 text-left text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Mode</th>
                                    <th className="px-6 py-4 text-right text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {booking.transactions?.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                                        <td className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "badge py-0.5 px-2 rounded-md font-bold uppercase tracking-wider text-[9px] border",
                                                transaction.type === 'advance_payment' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                    transaction.type === 'part_payment' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                                            )}>
                                                {transaction.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                            {transaction.mode}
                                        </td>
                                        <td className="px-6 py-4 text-right font-extrabold text-[var(--text-primary)]">
                                            {formatCurrency(transaction.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Settlement Interface */}
            {booking.balanceAmount > 0 && booking.status !== 'completed' && (
                <div className="card overflow-hidden border border-amber-200 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-900/10 shadow-sm">
                    <div className="px-6 py-4 border-b border-amber-200 dark:border-amber-900/20 bg-amber-100/30 dark:bg-amber-900/20">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-3">
                            <CheckCircle size={16} className="text-amber-600" />
                            Record Final Payment
                        </h3>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="form-label ml-1 text-amber-900/70">Final Payment (₹)</label>
                                <input
                                    type="number"
                                    value={finalPayment.amount}
                                    onChange={(e) => setFinalPayment({ ...finalPayment, amount: parseFloat(e.target.value) })}
                                    className="input-field p-3 font-bold border-amber-200 focus:border-amber-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="form-label ml-1 text-amber-900/70">Receipt Mode</label>
                                <select
                                    value={finalPayment.mode}
                                    onChange={(e) => setFinalPayment({ ...finalPayment, mode: e.target.value })}
                                    className="input-field p-3 font-bold border-amber-200 focus:border-amber-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="loan">Loan Disbursal</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="form-label ml-1 text-amber-900/70">Reference Trace</label>
                                <input
                                    type="text"
                                    value={finalPayment.referenceId}
                                    onChange={(e) => setFinalPayment({ ...finalPayment, referenceId: e.target.value })}
                                    className="input-field p-3 font-bold uppercase text-[10px] tracking-wider border-amber-200 focus:border-amber-500"
                                    placeholder="TRANS ID..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delivery */}
            {booking.status !== 'completed' && (
                <div className="card overflow-hidden border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/10 dark:bg-emerald-900/10 shadow-sm">
                    <div className="px-6 py-4 border-b border-emerald-100 dark:border-emerald-900/20 bg-emerald-50/50 dark:bg-emerald-900/20">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-400">Delivery Confirmation</h3>
                    </div>

                    <div className="p-6">
                        <div className="bg-[var(--bg-tertiary)] rounded-xl p-8 mb-8 border border-[var(--border)] relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4">Customer Acceptance</p>
                                <p className="text-[var(--text-primary)] font-bold italic text-base leading-relaxed mb-8 max-w-2xl opacity-70">
                                    "I hereby acknowledge the transition of the asset. I have verified the physical integrity and financial closure of this transaction."
                                </p>

                                <label className="flex items-center gap-4 cursor-pointer group w-fit p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                                    <input
                                        type="checkbox"
                                        checked={acceptanceChecked}
                                        onChange={(e) => setAcceptanceChecked(e.target.checked)}
                                        className="w-5 h-5 rounded border-[var(--border)] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className={clsx(
                                        "text-xs font-bold uppercase tracking-tight transition-colors",
                                        acceptanceChecked ? "text-emerald-600" : "text-[var(--text-muted)]"
                                    )}>
                                        Confirm Car Handover
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-center flex-col items-center gap-4">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] max-w-[400px] text-center uppercase tracking-tight leading-relaxed">
                                This action finalizes the lifecycle of this booking. Once authorized, it will be moved to archival records.
                            </p>
                            <button
                                onClick={handleCompleteDelivery}
                                disabled={submitting || !acceptanceChecked}
                                className="btn-primary !px-16 !py-4 text-base flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <CheckCircle size={20} />
                                {submitting ? 'COMMITTING...' : 'Complete Delivery'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Final Success State & Invoice Download */}
            {booking.status === 'completed' && (
                <div className="card p-8 border border-emerald-200 bg-emerald-50/20 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle size={32} />
                    </div>
                    <div className="text-center">
                        <h4 className="text-xl font-bold text-emerald-900 mb-1">Delivery Completed</h4>
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Post-delivery documentation ready</p>
                    </div>
                    <button
                        onClick={handleDownloadInvoice}
                        className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !px-12 !py-4 flex items-center gap-3 shadow-lg"
                    >
                        <FileText size={20} />
                        Download Final Invoice
                    </button>
                </div>
            )}
        </div>
    );
};

export default FinalDeliveryTab;
