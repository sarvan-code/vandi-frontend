import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Briefcase, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

const CustomerProfile = ({ customer }) => {
    if (!customer) return null;

    const [isProfileExpanded, setIsProfileExpanded] = useState(true);

    return (
        <div className="card overflow-hidden mb-4">
            <div
                className="px-6 py-4 border-b flex justify-between items-center cursor-pointer transition-colors"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            >
                <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--text-primary)' }}>
                    <User size={18} /> Customer Profile
                </div>
                {isProfileExpanded ? <ChevronUp className="h-5 w-5" style={{ color: 'var(--accent)' }} /> : <ChevronDown className="h-5 w-5" style={{ color: 'var(--accent)' }} />}
            </div>
            {isProfileExpanded && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Full Name</p>
                        <p className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            {customer.fullName || 'N/A'}
                        </p>
                        <span className={clsx("inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                            (customer.customerType || 'Lead') === 'Customer' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-yellow-500/10 text-yellow-600'
                        )}>
                            {customer.customerType || 'Lead'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                <Mail size={12} /> Email
                            </p>
                            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{customer.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                <MapPin size={12} /> Address
                            </p>
                            <p className="font-medium leading-snug" style={{ color: 'var(--text-secondary)' }}>{customer.address || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                <Phone size={12} /> Phone
                            </p>
                            <p className="font-medium font-mono" style={{ color: 'var(--text-secondary)' }}>{customer.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                <Briefcase size={12} /> Profession
                            </p>
                            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{customer.profession || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerProfile;
