import React from 'react';
import { User, Phone, Calendar, MapPin, Edit } from 'lucide-react';

const CustomerContactInfo = ({ customer, onEdit }) => {
    if (!customer) return null;

    return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5 relative group overflow-hidden transition-all hover:border-[var(--accent)]/30">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                        <User size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">{customer.fullName}</h4>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Identified Client</p>
                    </div>
                </div>
                <button
                    onClick={onEdit}
                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] transition-all active:scale-95"
                    title="Edit Customer"
                >
                    <Edit size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-full border border-[var(--border)]">
                        <Phone size={14} />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Phone Number</p>
                        <p className="text-[11px] font-bold text-[var(--text-primary)]">{customer.phone || 'Not Provided'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-full border border-[var(--border)]">
                        <Calendar size={14} />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Date of Birth</p>
                        <p className="text-[11px] font-bold text-[var(--text-primary)]">{customer.dateOfBirth || 'Not Provided'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:col-span-2 mt-1">
                    <div className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-full border border-[var(--border)] shrink-0">
                        <MapPin size={14} />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Address</p>
                        <p className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">
                            {customer.address || 'Address not listed'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerContactInfo;
