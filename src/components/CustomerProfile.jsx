import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Briefcase, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

const CustomerProfile = ({ customer }) => {
    if (!customer) return null;

    const [isProfileExpanded, setIsProfileExpanded] = useState(true);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden mb-4">
            <div
                className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            >
                <div className="flex items-center gap-2 text-blue-800 font-bold">
                    <User size={18} /> Customer Profile
                </div>
                {isProfileExpanded ? <ChevronUp className="h-5 w-5 text-blue-500" /> : <ChevronDown className="h-5 w-5 text-blue-500" />}
            </div>
            {isProfileExpanded && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Full Name</p>
                        <p className="font-bold text-gray-900 text-base flex items-center gap-2">
                            {customer.fullName || 'N/A'}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${(customer.customerType || 'Lead') === 'Customer' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {customer.customerType || 'Lead'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                <Mail size={12} /> Email
                            </p>
                            <p className="font-medium text-gray-700">{customer.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                <MapPin size={12} /> Address
                            </p>
                            <p className="font-medium text-gray-700 leading-snug">{customer.address || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                <Phone size={12} /> Phone
                            </p>
                            <p className="font-medium text-gray-700 font-mono">{customer.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                <Briefcase size={12} /> Profession
                            </p>
                            <p className="font-medium text-gray-700">{customer.profession || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerProfile;
