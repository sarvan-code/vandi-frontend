import React from 'react';
import { useOptions } from '../context/OptionsContext';
import clsx from 'clsx';

const CustomerForm = ({ customer, setCustomer, readOnly = false }) => {
    const { getOptionList } = useOptions();

    // Helper to get options from context
    const getOpt = (key) => getOptionList(key);

    const updateField = (field, value) => {
        setCustomer(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-10">
            <fieldset disabled={readOnly} className="contents">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                        <input
                            className="input-field"
                            placeholder="e.g. John Carter"
                            value={customer?.fullName || ''}
                            onChange={(e) => updateField('fullName', e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="form-label">Phone Number <span className="text-red-500">*</span></label>
                        <input
                            className="input-field"
                            placeholder="e.g. +91 98765 43210"
                            value={customer?.phone || ''}
                            onChange={(e) => updateField('phone', e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="form-label">Email Address</label>
                        <input
                            className="input-field"
                            placeholder="e.g. john@example.com"
                            value={customer?.email || ''}
                            onChange={(e) => updateField('email', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="form-label">Social Media ID</label>
                        <input
                            className="input-field"
                            placeholder="e.g. Instagram/Facebook handle"
                            value={customer?.instaid || ''}
                            onChange={(e) => updateField('instaid', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="form-label">Date of Birth</label>
                        <input
                            type="date"
                            className="input-field"
                            value={customer?.dateOfBirth || ''}
                            onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="form-label">Marriage Anniversary</label>
                        <input
                            type="date"
                            className="input-field"
                            value={customer?.marriageDate || ''}
                            onChange={(e) => updateField('marriageDate', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="form-label">Profession / Industry</label>
                        <select
                            className="input-field"
                            value={customer?.profession || ''}
                            onChange={(e) => updateField('profession', e.target.value)}
                        >
                            <option value="">Select Category</option>
                            {getOpt('PROFESSIONS').map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="form-label">Classification</label>
                        <div className="flex gap-4">
                            {['Lead', 'Customer'].map(type => (
                                <label key={type} className="flex-1">
                                    <input
                                        type="radio"
                                        name="customerType"
                                        value={type}
                                        checked={(customer?.customerType || 'Lead') === type}
                                        onChange={(e) => updateField('customerType', e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className={clsx(
                                        "flex items-center justify-center p-2 rounded-lg border-2 transition-all cursor-pointer font-bold text-xs h-full",
                                        (customer?.customerType || 'Lead') === type
                                            ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-bg)]"
                                            : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                                    )}>
                                        {type}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)] border-b pb-2 mb-6 flex items-center gap-2" style={{ borderColor: 'var(--accent-bg)' }}>
                        External Referrals
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="form-label">Lead Source</label>
                            <select
                                className="input-field"
                                value={customer?.referredBy || ''}
                                onChange={(e) => updateField('referredBy', e.target.value)}
                            >
                                <option value="">Select Channel</option>
                                {getOpt('REFERRAL_SOURCES').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="form-label">Referrer Details</label>
                            <input
                                className="input-field"
                                placeholder="e.g. Shared Contact or Agency"
                                value={customer?.referredByName || ''}
                                onChange={(e) => updateField('referredByName', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)] border-b pb-2 mb-6 flex items-center gap-2" style={{ borderColor: 'var(--accent-bg)' }}>
                        Geographic Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="md:col-span-2 lg:col-span-4 space-y-2">
                            <label className="form-label">Communication Address</label>
                            <input
                                className="input-field"
                                placeholder="Street, locality, and unit details..."
                                value={customer?.address || ''}
                                onChange={(e) => updateField('address', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="form-label">Locality / Landmark</label>
                            <input
                                className="input-field"
                                placeholder="e.g. Near Market Square"
                                value={customer?.landMark || ''}
                                onChange={(e) => updateField('landMark', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="form-label">City / District</label>
                            <input
                                className="input-field"
                                placeholder="e.g. Mumbai"
                                value={customer?.district || ''}
                                onChange={(e) => updateField('district', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="form-label">State / Province</label>
                            <input
                                className="input-field"
                                placeholder="e.g. Maharashtra"
                                value={customer?.state || ''}
                                onChange={(e) => updateField('state', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="form-label">Country</label>
                            <input
                                className="input-field font-bold"
                                placeholder="Country"
                                value={customer?.country || 'India'}
                                onChange={(e) => updateField('country', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 mb-3 block">Notes / Remarks</label>
                    <textarea
                        className="input-field min-h-[120px] p-4 text-sm font-medium"
                        placeholder="Enter any relevant observations, interaction history or specific preferences..."
                        value={customer?.remarks || ''}
                        onChange={(e) => updateField('remarks', e.target.value)}
                    />
                </div>
            </fieldset>
        </div>
    );
};

export default CustomerForm;
