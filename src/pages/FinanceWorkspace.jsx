import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, IndianRupee, Calendar, User, Car as CarIcon } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import { useToast } from '../context/ToastContext';
import InitialBookingTab from '../components/InitialBookingTab';
import ActiveManagementTab from '../components/ActiveManagementTab';
import FinalDeliveryTab from '../components/FinalDeliveryTab';

const FinanceWorkspace = () => {
    const { enquiryId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);

    useEffect(() => {
        fetchBooking();
    }, [enquiryId]);

    const fetchBooking = async () => {
        try {
            const response = await api.get('/bookings');
            const existingBooking = response.data.find(b => b.enquiryId === enquiryId);

            if (existingBooking) {
                const detailResponse = await api.get(`/bookings/${existingBooking.id}`);
                setBooking(detailResponse.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching booking:', error);
            showToast('Failed to load booking', 'error');
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
            <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in">
                <div className="w-10 h-10 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mb-4"></div>
                <p className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-widest">Loading Details...</p>
            </div>
        );
    }

    return (
        <div className="pb-20 animate-fade-in-up">
            {/* Premium Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-secondary !p-3"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            Booking Details
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="badge py-1 px-3 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-lg text-[10px] font-bold tracking-wider">
                                {booking?.enquiry?.customer?.fullName || 'Customer Name'}
                            </span>
                            <span className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest">
                                ENQ #{enquiryId.slice(0, 8)}
                            </span>
                        </div>
                    </div>
                </div>

                {booking && (
                    <div className={clsx(
                        "badge py-2 px-6 rounded-lg text-[10px] font-bold tracking-[0.1em] shadow-sm border uppercase",
                        booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            booking.status === 'ready_for_delivery' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20 shadow-[0_0_10px_var(--accent)]/10'
                    )}>
                        {booking.status.replace(/_/g, ' ')}
                    </div>
                )}
            </header>

            {/* Financial Summary Card */}
            {booking && (
                <div className="card p-8 md:p-10 mb-8 overflow-hidden relative border border-[var(--border)] shadow-sm">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Selling Price</p>
                            <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">{formatCurrency(booking.agreedPrice)}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Collected</p>
                            <p className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(booking.agreedPrice - booking.balanceAmount)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">Outstanding</p>
                            <p className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">{formatCurrency(booking.balanceAmount)}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Discounts</p>
                            <p className="text-3xl font-extrabold tracking-tight text-[var(--accent)]">{formatCurrency(totalNegotiatedDiscount)}</p>
                        </div>
                    </div>

                    {/* Extended Details Grid */}
                    <div className="relative z-10 mt-8 pt-8 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Vehicle Snapshot */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center border border-[var(--border)] text-[var(--accent)]">
                                <CarIcon size={20} />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest block mb-1 text-[var(--text-muted)]">Car Details</span>
                                <h4 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                                    {booking.car?.make} {booking.car?.model} {booking.car?.variant}
                                </h4>
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">MRP</p>
                                        <p className="text-xs font-bold text-[var(--text-primary)]">{formatCurrency(booking.car?.maximumRetailPrice || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Plate</p>
                                        <p className="text-xs font-bold text-[var(--text-primary)]">{booking.car?.registrationNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Equity</p>
                                        <p className="text-xs font-bold text-[var(--accent)]">{booking.bookingPercentage || 0}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Entity Snapshot */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center border border-[var(--border)] text-[var(--accent)]">
                                <User size={20} />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest block mb-1 text-[var(--text-muted)]">Customer Info</span>
                                <h4 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">{booking.enquiry?.customer?.fullName}</h4>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {booking.commitments && Object.entries(booking.commitments).map(([key, val]) => (
                                        <span key={key} className={clsx(
                                            "badge py-0.5 px-2 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                                            val === 'COMPANY' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border)]'
                                        )}>
                                            {key}: {val === 'COMPANY' ? 'Showroom' : 'Self'}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Operational Surface */}
            <div className="card border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="px-8 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent)]"></div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                            {(!booking || booking.status === 'ADVANCE_PENDING' || booking.status === 'initial') && 'Setup Booking'}
                            {booking?.status === 'active' && 'Manage Booking'}
                            {booking?.status === 'ready_for_delivery' && 'Ready for Delivery'}
                            {booking?.status === 'completed' && 'Completed'}
                        </h3>
                    </div>
                </div>

                <div className="p-8">
                    {(!booking || booking.status === 'ADVANCE_PENDING' || booking.status === 'initial') ? (
                        <InitialBookingTab
                            enquiryId={enquiryId}
                            onBookingCreated={fetchBooking}
                        />
                    ) : booking.status === 'active' ? (
                        <ActiveManagementTab
                            booking={booking}
                            onUpdate={fetchBooking}
                        />
                    ) : booking.status === 'ready_for_delivery' ? (
                        <FinalDeliveryTab
                            booking={booking}
                            onUpdate={fetchBooking}
                        />
                    ) : booking.status === 'completed' ? (
                        <div className="py-20 text-center space-y-8 animate-fade-in bg-[var(--bg-tertiary)]/30 rounded-2xl border border-[var(--border)] border-dashed">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                                <CheckCircle size={40} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Delivered</h2>
                                <p className="text-[var(--text-muted)] max-w-md mx-auto mt-2 font-bold text-xs uppercase tracking-tight leading-relaxed">
                                    This asset lifecycle is officially finalized. All financial obligations have been satisfied and committed to historical records.
                                </p>
                            </div>
                            <div className="pt-10 opacity-60 scale-95 transition-all hover:opacity-100 hover:scale-100 grayscale hover:grayscale-0">
                                <FinalDeliveryTab
                                    booking={booking}
                                    onUpdate={() => { }}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div >
    );
};

export default FinanceWorkspace;
