import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, User, Car as CarIcon } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import InitialBookingTab from './InitialBookingTab';
import ActiveManagementTab from './ActiveManagementTab';
import FinalDeliveryTab from './FinalDeliveryTab';

const FinanceWorkspaceContent = ({ enquiryId, tabId, onComplete }) => {
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
            showToast('Error loading booking data', 'error');
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
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 text-sm">Loading Finance Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Financial Summary Card */}
            {booking && (
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign size={16} className="text-indigo-200" />
                                <p className="text-indigo-100 text-[10px] uppercase tracking-wider font-semibold">Agreed Price</p>
                            </div>
                            <p className="text-xl font-bold">{formatCurrency(booking.agreedPrice)}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign size={16} className="text-indigo-200" />
                                <p className="text-indigo-100 text-[10px] uppercase tracking-wider font-semibold">Received</p>
                            </div>
                            <p className="text-xl font-bold">
                                {formatCurrency(booking.agreedPrice - booking.balanceAmount)}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign size={16} className="text-indigo-200" />
                                <p className="text-indigo-100 text-[10px] uppercase tracking-wider font-semibold">Pending</p>
                            </div>
                            <p className="text-xl font-bold">{formatCurrency(booking.balanceAmount)}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign size={16} className="text-orange-300" />
                                <p className="text-orange-200 text-[10px] uppercase tracking-wider font-semibold">Total Discount</p>
                            </div>
                            <p className="text-xl font-bold text-orange-400">{formatCurrency(totalNegotiatedDiscount)}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={16} className="text-indigo-200" />
                                <p className="text-indigo-100 text-[10px] uppercase tracking-wider font-semibold">Status</p>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${booking.status === 'completed' ? 'bg-green-500' :
                                booking.status === 'ready_for_delivery' ? 'bg-yellow-500' :
                                    'bg-indigo-500'
                                }`}>
                                {booking.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                <CarIcon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-indigo-100 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Vehicle</p>
                                <p className="text-sm font-bold truncate">
                                    {booking.car?.make} {booking.car?.model} {booking.car?.variant}
                                </p>
                                <p className="text-[10px] text-white/70 font-medium mb-2">{booking.car?.registrationNumber}</p>

                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                                    <div>
                                        <p className="text-[9px] text-indigo-200 uppercase">MRP</p>
                                        <p className="text-[10px] font-semibold">{formatCurrency(booking.car?.maximumRetailPrice || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-indigo-200 uppercase">Rev. Price</p>
                                        <p className="text-[10px] font-semibold text-red-300">{formatCurrency(booking.car?.discountAmount || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-indigo-200 uppercase">Net Benefit</p>
                                        <p className="text-[10px] font-bold text-green-400">{formatCurrency(netBenefit)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-indigo-100 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Customer</p>
                                <p className="text-sm font-bold">{booking.enquiry?.customer?.fullName}</p>
                                <p className="text-[10px] text-white/70 font-medium">{booking.enquiry?.customer?.phone}</p>
                                <p className="text-[9px] text-indigo-200/60 mt-1 italic">EID: {booking.enquiryId}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-indigo-100 text-[10px] uppercase tracking-wider font-semibold mb-2">Commitments</p>
                        <div className="bg-white/5 p-3 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {booking.commitments && Object.entries(booking.commitments).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between text-[10px]">
                                        <span className="text-indigo-100 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className={`font-bold ${val === 'COMPANY' ? 'text-yellow-400' : 'text-white'}`}>
                                            {val === 'COMPANY' ? '✓ Co' : 'Cust'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {booking.payPartAmountBeforeDelivery && (
                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-[9px] uppercase tracking-wide">
                                    <span className="text-indigo-100 font-semibold italic">Deal Highlight:</span>
                                    <span className="text-green-400 font-black">Customer willing to pay part amount before delivery ✓</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                        {(!booking || booking.status === 'ADVANCE_PENDING' || booking.status === 'initial') && 'Stage 1: Initial Booking'}
                        {booking?.status === 'active' && 'Stage 2: Active Management'}
                        {booking?.status === 'ready_for_delivery' && 'Stage 3: Final Settlement'}
                        {booking?.status === 'completed' && 'Booking Completed'}
                    </h3>
                </div>

                <div className="p-4">
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
                            onComplete={() => onComplete && onComplete(tabId)}
                        />
                    ) : booking.status === 'completed' ? (
                        <div className="py-8 text-center space-y-3">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <DollarSign size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Delivery Completed</h2>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                This booking has been successfully settled and the vehicle delivered.
                            </p>
                            <div className="pt-4 opacity-75">
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
        </div>
    );
};

export default FinanceWorkspaceContent;
