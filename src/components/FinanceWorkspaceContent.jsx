import React, { useState, useEffect } from 'react';
import { IndianRupee, Calendar, User, Car as CarIcon } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import { useToast } from '../context/ToastContext';
import InitialBookingTab from './InitialBookingTab';
import ActiveManagementTab from './ActiveManagementTab';
import FinalDeliveryTab from './FinalDeliveryTab';
import CustomerEditModal from './CustomerEditModal';

const FinanceWorkspaceContent = ({ enquiryId, tabId, onComplete }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [enquiry, setEnquiry] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    useEffect(() => {
        fetchWorkspaceData();
    }, [enquiryId]);

    const fetchWorkspaceData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Enquiry Details (Source of Truth for Customer)
            const enquiryRes = await api.get(`/enquiries/${enquiryId}`);
            setEnquiry(enquiryRes.data);

            // 2. Fetch Booking History for this Enquiry
            const bookingsRes = await api.get('/bookings');
            const existingBooking = bookingsRes.data.find(b => b.enquiryId === enquiryId);

            if (existingBooking) {
                const detailResponse = await api.get(`/bookings/${existingBooking.id}`);
                setBooking(detailResponse.data);
            } else {
                setBooking(null);
            }
        } catch (error) {
            console.error('Error fetching workspace data:', error);
            showToast('Error loading workspace data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const netBenefit = booking?.car ? (booking.car.maximumRetailPrice || 0) - (booking.car.discountAmount || 0) : 0;
    const totalNegotiatedDiscount = booking?.agreedPrice ? netBenefit - booking.agreedPrice : 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
                <div className="w-10 h-10 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mb-4"></div>
                <p className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-widest">Gathering Financial Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Financial Summary Card */}
            {booking && (
                <div className="card p-4 sm:p-6 border border-[var(--border)] shadow-sm relative overflow-hidden">
                    {/* Subtle Indigo Accent for Financial Context */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)] opacity-20"></div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <IndianRupee size={14} className="text-[var(--text-muted)]" />
                                <p className="text-[var(--text-muted)] text-[9px] uppercase tracking-wider font-bold">Contract Value</p>
                            </div>
                            <p className="text-lg font-extrabold text-[var(--text-primary)]">{formatCurrency(booking.agreedPrice)}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <IndianRupee size={14} className="text-emerald-500" />
                                <p className="text-emerald-600 dark:text-emerald-400 text-[9px] uppercase tracking-wider font-bold">Receipts</p>
                            </div>
                            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(booking.agreedPrice - booking.balanceAmount)}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <IndianRupee size={14} className="text-rose-500" />
                                <p className="text-rose-600 dark:text-rose-400 text-[9px] uppercase tracking-wider font-bold">Balance</p>
                            </div>
                            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(booking.balanceAmount)}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <IndianRupee size={14} className="text-[var(--accent)]" />
                                <p className="text-[var(--accent)] text-[9px] uppercase tracking-wider font-bold">Total Discount</p>
                            </div>
                            <p className="text-lg font-extrabold text-[var(--accent)]">{formatCurrency(totalNegotiatedDiscount)}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-[var(--text-muted)]" />
                                <p className="text-[var(--text-muted)] text-[9px] uppercase tracking-wider font-bold">Lifecycle</p>
                            </div>
                            <span className={clsx(
                                "badge py-0.5 px-2 rounded-md font-bold uppercase tracking-wider text-[9px] border",
                                booking.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    booking.status === 'ready_for_delivery' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20'
                            )}>
                                {booking.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center border border-[var(--border)] text-[var(--accent)] shrink-0">
                                <CarIcon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[var(--text-muted)] text-[9px] uppercase tracking-widest font-bold mb-1">Asset Trace</p>
                                <p className="text-sm font-extrabold text-[var(--text-primary)] truncate">
                                    {booking.car?.make} {booking.car?.model} {booking.car?.variant}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] font-bold">{booking.car?.registrationNumber || 'PENDING ASSIGNMENT'}</p>

                                <div className="grid grid-cols-3 gap-3 pt-3 mt-3 border-t border-[var(--border)]">
                                    <div>
                                        <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">MRP List</p>
                                        <p className="text-[10px] font-bold text-[var(--text-primary)]">{formatCurrency(booking.car?.maximumRetailPrice || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Negotiated</p>
                                        <p className="text-[10px] font-bold text-rose-500">-{formatCurrency(booking.car?.discountAmount || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-[var(--text-muted)] uppercase font-bold">Net Offer</p>
                                        <p className="text-[10px] font-extrabold text-emerald-600">{formatCurrency(netBenefit)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center border border-[var(--border)] text-[var(--accent)] shrink-0">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-[var(--text-muted)] text-[9px] uppercase tracking-widest font-bold mb-1">Identified Client</p>
                                <p className="text-sm font-extrabold text-[var(--text-primary)]">{booking.enquiry?.customer?.fullName}</p>
                                <p className="text-[10px] text-[var(--text-muted)] font-bold">{booking.enquiry?.customer?.phone}</p>
                                <p className="text-[9px] text-[var(--accent)] mt-2 font-mono uppercase">ID Trace: {booking.enquiryId.slice(0, 12)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-[var(--border)] relative z-10">
                        <p className="text-[var(--text-muted)] text-[9px] uppercase tracking-widest font-bold mb-3">Contractual Commitments</p>
                        <div className="bg-[var(--bg-tertiary)]/50 p-4 rounded-xl border border-[var(--border)]">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                {booking.commitments && Object.entries(booking.commitments).map(([key, val]) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <span className="text-[var(--text-muted)] text-[8px] uppercase font-bold">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className={clsx(
                                            "text-[10px] font-extrabold uppercase tracking-tight",
                                            val === 'COMPANY' ? 'text-emerald-600' : 'text-[var(--text-primary)]'
                                        )}>
                                            {val === 'COMPANY' ? 'Showroom ✓' : 'Direct Cust'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {booking.payPartAmountBeforeDelivery && (
                                <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                                    <span className="text-[var(--accent)]">Protocol:</span>
                                    <span className="text-emerald-600">Part payment before delivery authorized ✓</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Area */}
            <div className="card shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)]/50 flex items-center justify-between">
                    <h3 className="font-extrabold text-[var(--text-primary)] text-xs uppercase tracking-widest flex items-center gap-3">
                        <span className="w-2 h-2 bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent)]"></span>
                        {(!booking || booking.status === 'ADVANCE_PENDING' || booking.status === 'initial') && 'Provisioning Protocol'}
                        {booking?.status === 'active' && 'Operational Cycle'}
                        {booking?.status === 'ready_for_delivery' && 'Final Settlement'}
                        {booking?.status === 'completed' && 'Archived Record'}
                    </h3>
                </div>

                <div className="p-4">
                    {(!booking || booking.status === 'ADVANCE_PENDING' || booking.status === 'initial') ? (
                        <InitialBookingTab
                            enquiryId={enquiryId}
                            enquiry={enquiry}
                            onBookingCreated={fetchWorkspaceData}
                            onEditCustomer={() => setIsCustomerModalOpen(true)}
                        />
                    ) : booking.status === 'active' ? (
                        <ActiveManagementTab
                            booking={booking}
                            onUpdate={fetchWorkspaceData}
                            onEditCustomer={() => setIsCustomerModalOpen(true)}
                        />
                    ) : booking.status === 'ready_for_delivery' ? (
                        <FinalDeliveryTab
                            booking={booking}
                            onUpdate={fetchWorkspaceData}
                            onEditCustomer={() => setIsCustomerModalOpen(true)}
                            onComplete={() => onComplete && onComplete(tabId)}
                        />
                    ) : booking.status === 'completed' ? (
                        <div className="py-12 text-center space-y-4 animate-fade-in bg-[var(--bg-tertiary)]/30 rounded-2xl border border-[var(--border)] border-dashed">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                                <IndianRupee size={32} />
                            </div>
                            <h2 className="text-xl font-extrabold text-[var(--text-primary)] uppercase tracking-tight">Handover Complete</h2>
                            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                                All financial obligations are satisfied. Asset transferred and lifecycle finalized.
                            </p>
                            <div className="pt-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                                <FinalDeliveryTab
                                    booking={booking}
                                    onUpdate={() => { }}
                                    readOnly={true}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <CustomerEditModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                customer={booking?.enquiry?.customer || enquiry?.customer}
                onUpdate={fetchWorkspaceData}
            />
        </div>
    );
};

export default FinanceWorkspaceContent;
