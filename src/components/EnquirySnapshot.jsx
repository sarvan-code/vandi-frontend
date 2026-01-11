import React from 'react';
import { Info, User, Car, ClipboardList } from 'lucide-react';

const EnquirySnapshot = ({ enquiry, customer, getOptionList, showCustomer = true }) => {
    const getLabel = (type, value) => {
        if (!value) return 'N/A';
        const list = getOptionList(type) || [];
        const option = list.find(o => o.value === value);
        return option ? option.label : value;
    };

    const getCarInterest = () => {
        if (!enquiry?.carDetails || enquiry.carDetails.length === 0) return 'Any';
        return enquiry.carDetails.map(c => {
            const parts = [];
            if (c.carBrand) parts.push(c.carBrand);
            if (c.carModel) parts.push(c.carModel);
            if (c.carVariant) parts.push(c.carVariant);
            return parts.join(' - ');
        }).join(', ');
    };

    return (
        <div className="space-y-6">
            {/* Snapshot Card */}
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-2 text-blue-800 font-semibold">
                    <Info size={18} /> {showCustomer ? 'Enquiry & Customer Snapshot' : 'Enquiry Details'}
                </div>
                <div className={`p-4 grid grid-cols-1 ${showCustomer ? 'md:grid-cols-2 gap-8' : 'md:grid-cols-1'}`}>
                    {/* Left: Customer */}
                    {showCustomer && (
                        <div>
                            <div className="flex items-center gap-2 text-gray-800 font-medium mb-3 border-b pb-2">
                                <User size={16} /> Customer Details
                            </div>
                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Full Name</p>
                                    <p className="font-semibold text-gray-900 text-base">{customer?.fullName || 'N/A'}</p>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Type</p>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-semibold">{customer?.customerType || 'Lead'}</span>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Contact</p>
                                    <p className="font-medium text-gray-900">{customer?.phone || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Address</p>
                                    <p className="text-gray-900 leading-relaxed">{customer?.address || 'N/A'}</p>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Profession</p>
                                    <p className="text-gray-900">{customer?.profession || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right: Enquiry */}
                    <div>
                        <div className="flex items-center gap-2 text-gray-800 font-medium mb-3 border-b pb-2">
                            <Car size={16} /> Enquiry Info
                        </div>
                        <div className={`grid ${showCustomer ? 'grid-cols-2' : 'grid-cols-3'} gap-y-3 gap-x-4 text-sm`}>
                            <div className="col-span-3 md:col-span-2 lg:col-span-1">
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Car Interest</p>
                                <p className="font-semibold text-blue-700">{getCarInterest()}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Budget</p>
                                <p className="text-gray-900">{getLabel('BUDGET_RANGES', enquiry?.budgetRange)}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Status</p>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${enquiry?.status === 'new' ? 'bg-green-100 text-green-800' :
                                    enquiry?.status === 'close' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {enquiry?.status || 'New'}
                                </span>
                            </div>
                            <div className="col-span-1">
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Enquiry Type</p>
                                <p className="text-gray-900">{enquiry?.enquiryType || 'Buy'}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Payment Mode</p>
                                <p className="text-gray-900">{getLabel('PAYMENT_MODES', enquiry?.payment)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Followups */}
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 flex items-center gap-2">
                    <ClipboardList size={18} className="text-gray-500" /> Follow-up History
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                            <tr>
                                <th className="p-3">Date / Agent</th>
                                <th className="p-3">Mode / Type</th>
                                <th className="p-3">Action / Car</th>
                                <th className="p-3">Result / Remarks</th>
                                <th className="p-3">Next Visit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {enquiry?.followUps && enquiry.followUps.length > 0 ? (
                                enquiry.followUps.map((f, i) => (
                                    <tr key={f.followUpId || i} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 align-top">
                                            <div className="font-medium text-gray-900">{new Date(f.createdAt).toLocaleDateString()}</div>
                                            <div className="text-gray-500 text-[10px] truncate max-w-[100px]" title={f.agent?.fullName}>{f.agent?.fullName || 'Unknown'}</div>
                                        </td>
                                        <td className="p-3 align-top">
                                            <div className="font-medium text-gray-900">{getLabel('FOLLOWUP_MODES', f.followupMode)}</div>
                                            <div className="text-gray-500">{getLabel('FOLLOWUP_TYPES', f.followupType)}</div>
                                        </td>
                                        <td className="p-3 align-top">
                                            <div className="font-medium text-gray-900">{getLabel('FOLLOWUP_ACTIONS', f.followupActionDone)}</div>
                                            {f.followupCar && <div className="text-gray-500 text-[10px]">Car: {f.followupCar}</div>}
                                        </td>
                                        <td className="p-3 align-top">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${f.followupResults === 'sale-closed' ? 'bg-green-100 text-green-800' :
                                                f.followupResults === 'not-interested' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                {getLabel('FOLLOWUP_RESULTS', f.followupResults)}
                                            </span>
                                            <div className="text-gray-500 italic leading-tight">{f.followupRemarks}</div>
                                        </td>
                                        <td className="p-3 align-top font-medium text-gray-700">
                                            {f.nextVisitDate ? new Date(f.nextVisitDate).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        No follow-ups recorded for this enquiry.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EnquirySnapshot;
