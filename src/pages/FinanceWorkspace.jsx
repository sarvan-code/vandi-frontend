import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, User, Car as CarIcon } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import InitialBookingTab from '../components/InitialBookingTab';
import ActiveManagementTab from '../components/ActiveManagementTab';
import FinalDeliveryTab from '../components/FinalDeliveryTab';

const FinanceWorkspace = () => {
    const { enquiryId } = useParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [activeTab, setActiveTab] = useState('initial'); // initial, active, delivery

    useEffect(() => {
        fetchBooking();
    }, [enquiryId]);

    const fetchBooking = async () => {
        try {
            // First check if booking exists for this enquiry
            const response = await api.get('/bookings');
            const existingBooking = response.data.find(b => b.enquiryId === enquiryId);

            if (existingBooking) {
                // Fetch full booking details
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
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Finance Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Finance Workspace</h1>
                                <p className="text-sm text-gray-500">
                                    {booking?.enquiry?.customer?.fullName || 'Customer'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Summary Card - Always Visible */}
            {booking && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white transition-all duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={20} />
                                    <p className="text-blue-100 text-sm">Agreed Price</p>
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(booking.agreedPrice)}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={20} />
                                    <p className="text-blue-100 text-sm">Total Received</p>
                                </div>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(booking.agreedPrice - booking.balanceAmount)}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={20} />
                                    <p className="text-blue-100 text-sm">Pending Balance</p>
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(booking.balanceAmount)}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={20} />
                                    <p className="text-orange-300 text-sm font-semibold">Total Discount</p>
                                </div>
                                <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalNegotiatedDiscount)}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={20} />
                                    <p className="text-blue-100 text-sm">Status</p>
                                </div>
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'completed' ? 'bg-green-500' :
                                    booking.status === 'ready_for_delivery' ? 'bg-yellow-500' :
                                        'bg-blue-500'
                                    }`}>
                                    {booking.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Car & Customer Info Section */}
                        <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-lg shrink-0">
                                    <CarIcon size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-blue-100 text-xs uppercase tracking-wider font-semibold mb-1">Vehicle Details</p>
                                    <p className="text-lg font-bold">
                                        {booking.car?.make} {booking.car?.model} {booking.car?.variant}
                                    </p>
                                    <p className="text-white/80 font-medium mb-3">{booking.car?.registrationNumber}</p>

                                    {/* Pricing Breakdown */}
                                    <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-3">
                                        <div>
                                            <p className="text-[10px] text-blue-100 uppercase">MRP</p>
                                            <p className="text-xs font-semibold">{formatCurrency(booking.car?.maximumRetailPrice || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-blue-100 uppercase">Rev. Price</p>
                                            <p className="text-xs font-semibold text-red-300">{formatCurrency(booking.car?.discountAmount || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-blue-100 uppercase">Net Benefit</p>
                                            <p className="text-xs font-bold text-green-400">{formatCurrency(netBenefit)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-lg shrink-0">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs uppercase tracking-wider font-semibold mb-1">Customer Details</p>
                                    <p className="text-lg font-bold">{booking.enquiry?.customer?.fullName}</p>
                                    <p className="text-white/80 font-medium">{booking.enquiry?.customer?.phone}</p>
                                    <p className="text-sm text-blue-100/60 mt-2 italic">
                                        Enquiry ID: {booking.enquiryId}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Commitments Summary */}
                        <div className="md:col-span-3 space-y-2">
                            <p className="text-blue-100 text-xs uppercase tracking-wider font-semibold">Deal Commitments & Responsibilities</p>
                            <div className="bg-white/10 p-4 rounded-lg">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                                    {booking.commitments && Object.entries(booking.commitments).map(([key, val]) => (
                                        <div key={key} className="flex items-center justify-between text-xs">
                                            <span className="text-blue-100 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <span className={`font-bold ${val === 'COMPANY' ? 'text-yellow-400 font-bold' : 'text-white'}`}>
                                                {val === 'COMPANY' ? '✓ Company' : 'Customer'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {booking.payPartAmountBeforeDelivery && (
                                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2 text-[10px] uppercase tracking-wider">
                                        <span className="text-blue-100 font-semibold italic">Deal Highlight:</span>
                                        <span className="text-green-400 font-black">Customer willing to pay part amount before delivery ✓</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            {(!booking || booking.status === 'ADVANCE_PENDING' || booking.status === 'initial') && 'Stage 1: Initial Booking & Confirmation'}
                            {booking?.status === 'active' && 'Stage 2: Active Management & Payments'}
                            {booking?.status === 'ready_for_delivery' && 'Stage 3: Final Settlement & Delivery'}
                            {booking?.status === 'completed' && 'Booking Completed'}
                        </h3>
                    </div>

                    <div className="p-6">
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
                            <div className="py-12 text-center space-y-4">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    < DollarSign size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Delivery Completed</h2>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    This booking has been successfully settled and the vehicle delivered.
                                    All financial details are now archived in the summary above.
                                </p>
                                <div className="pt-4">
                                    <FinalDeliveryTab
                                        booking={booking}
                                        onUpdate={() => { }}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default FinanceWorkspace;
