import React from 'react';
import { Info, User, Car, ClipboardList } from 'lucide-react';
import clsx from 'clsx';

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
            <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center gap-2 font-semibold" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <Info size={18} /> {showCustomer ? 'Summary of Enquiry' : 'Enquiry Details'}
                </div>
                <div className={`p-4 grid grid-cols-1 ${showCustomer ? 'md:grid-cols-2 gap-8' : 'md:grid-cols-1'}`}>
                    {/* Left: Customer */}
                    {showCustomer && (
                        <div>
                            <div className="flex items-center gap-2 font-medium mb-3 border-b pb-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                                <User size={16} /> Customer Details
                            </div>
                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Full Name</p>
                                    <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{customer?.fullName || 'N/A'}</p>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Type</p>
                                    <span className="bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded text-xs font-semibold">{customer?.customerType || 'Lead'}</span>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Contact</p>
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{customer?.phone || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Address</p>
                                    <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{customer?.address || 'N/A'}</p>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Profession</p>
                                    <p style={{ color: 'var(--text-primary)' }}>{customer?.profession || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right: Enquiry */}
                    <div>
                        <div className="flex items-center gap-2 font-medium mb-3 border-b pb-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                            <Car size={16} /> Enquiry Info
                        </div>
                        <div className={`grid ${showCustomer ? 'grid-cols-2' : 'grid-cols-3'} gap-y-3 gap-x-4 text-sm`}>
                            <div className="col-span-3 md:col-span-2 lg:col-span-1">
                                <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Car Interest</p>
                                <p className="font-semibold text-[var(--accent)]">{getCarInterest()}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Budget</p>
                                <p style={{ color: 'var(--text-primary)' }}>{getLabel('BUDGET_RANGES', enquiry?.budgetRange)}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</p>
                                <span className={clsx("px-2 py-0.5 rounded text-xs font-semibold uppercase",
                                    enquiry?.status === 'new' ? 'bg-emerald-500/10 text-emerald-600' :
                                        enquiry?.status === 'close' ? 'bg-rose-500/10 text-rose-600' :
                                            'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                                )}>
                                    {enquiry?.status || 'New'}
                                </span>
                            </div>
                            <div className="col-span-1">
                                <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Enquiry Type</p>
                                <p style={{ color: 'var(--text-primary)' }}>{enquiry?.enquiryType || 'Buy'}</p>
                            </div>
                            <div className="col-span-1">
                                <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Payment Mode</p>
                                <p style={{ color: 'var(--text-primary)' }}>{getLabel('PAYMENT_MODES', enquiry?.payment)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Followups */}
            <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b font-semibold flex items-center gap-2" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <ClipboardList size={18} style={{ color: 'var(--text-muted)' }} /> Recent Talks
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }} className="font-semibold border-b">
                            <tr>
                                <th className="p-3">Date / Agent</th>
                                <th className="p-3">Mode / Type</th>
                                <th className="p-3">Action / Car</th>
                                <th className="p-3">Result / Remarks</th>
                                <th className="p-3">Next Visit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                            {enquiry?.followUps && enquiry.followUps.length > 0 ? (
                                enquiry.followUps.map((f, i) => (
                                    <tr key={f.followUpId || i} className="transition-colors hover:bg-[var(--bg-tertiary)]">
                                        <td className="p-3 align-top">
                                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{new Date(f.createdAt).toLocaleDateString()}</div>
                                            <div className="text-[10px] truncate max-w-[100px]" style={{ color: 'var(--text-muted)' }} title={f.agent?.fullName}>{f.agent?.fullName || 'Unknown'}</div>
                                        </td>
                                        <td className="p-3 align-top">
                                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{getLabel('FOLLOWUP_MODES', f.followupMode)}</div>
                                            <div style={{ color: 'var(--text-muted)' }}>{getLabel('FOLLOWUP_TYPES', f.followupType)}</div>
                                        </td>
                                        <td className="p-3 align-top">
                                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{getLabel('FOLLOWUP_ACTIONS', f.followupActionDone)}</div>
                                            {f.followupCar && <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Car: {f.followupCar}</div>}
                                        </td>
                                        <td className="p-3 align-top">
                                            <span className={clsx("inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1",
                                                f.followupResults === 'sale-closed' ? 'bg-emerald-500/10 text-emerald-600' :
                                                    f.followupResults === 'not-interested' ? 'bg-rose-500/10 text-rose-600' :
                                                        'bg-[var(--accent)]/10 text-[var(--accent)]'
                                            )}>
                                                {getLabel('FOLLOWUP_RESULTS', f.followupResults)}
                                            </span>
                                            <div className="italic leading-tight" style={{ color: 'var(--text-muted)' }}>{f.followupRemarks}</div>
                                        </td>
                                        <td className="p-3 align-top font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {f.nextVisitDate ? new Date(f.nextVisitDate).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
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
