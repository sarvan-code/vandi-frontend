import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Shield, Save, Camera, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const UserProfile = () => {
    const { user: authUser, setUser } = useContext(AuthContext);
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        password: '',
        confirmPassword: ''
    });

    const [pinLoading, setPinLoading] = useState(false);
    const [pin, setPin] = useState('');
    const [isPinPanelOpen, setIsPinPanelOpen] = useState(false);

    useEffect(() => {
        if (authUser) {
            setFormData(prev => ({
                ...prev,
                fullName: authUser.fullName || '',
                email: authUser.email || '',
                role: authUser.role || ''
            }));
        }
    }, [authUser]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.put(`/users/${authUser.userId}`, {
                fullName: formData.fullName,
            });

            const updatedUser = res.data;
            setUser(prev => ({ ...prev, ...updatedUser }));
            showToast('Identity updated successfully.', 'success');
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to update identity.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePinToggle = async () => {
        if (authUser.isPinEnabled) {
            if (!window.confirm('Are you sure you want to disable 4-digit PIN login?')) return;
            setPinLoading(true);
            try {
                await api.put('/auth/disable-pin');
                setUser(prev => ({ ...prev, isPinEnabled: false }));
                localStorage.removeItem('isPinEnabled');
                showToast('PIN login disabled.', 'success');
            } catch (error) {
                showToast('Failed to disable PIN login.', 'error');
            } finally {
                setPinLoading(false);
            }
        } else {
            setIsPinPanelOpen(true);
        }
    };

    const handleSetPin = async (e) => {
        e.preventDefault();
        if (pin.length !== 4) return showToast('PIN must be 4 digits.', 'warning');
        setPinLoading(true);

        try {
            await api.put('/auth/set-pin', { pin });
            setUser(prev => ({ ...prev, isPinEnabled: true }));
            localStorage.setItem('isPinEnabled', 'true');
            showToast('4-digit PIN login enabled successfully!', 'success');
            setIsPinPanelOpen(false);
            setPin('');
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to set PIN.', 'error');
        } finally {
            setPinLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-6 animate-fade-in">
            {/* Header section */}
            <header className="flex items-center gap-6 mb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="btn-secondary p-3 shadow-sm border border-[var(--border)]"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-4xl font-semibold mb-1 text-[var(--text-primary)]">User Profile</h1>
                    <div className="flex items-center gap-3">
                        <span className="badge bg-indigo-50 text-[var(--accent)] font-bold text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                            My Account
                        </span>
                        <span className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest italic opacity-60">
                            User ID: {authUser?.userId}
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Visual Avatar Card */}
                <div className="lg:col-span-1 space-y-10">
                    <div className="card overflow-hidden border border-[var(--border)] shadow-2xl rounded-[2.5rem]">
                        <div className="bg-[var(--bg-secondary)] p-12 relative overflow-hidden flex flex-col items-center">
                            <div className="relative z-10">
                                <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center border-8 border-[var(--border)] mb-8 shadow-inner group transition-all hover:scale-105">
                                    <span className="text-6xl font-black text-[var(--accent)] drop-shadow-sm">
                                        {formData.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="text-center relative z-10 w-full">
                                <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2 truncate px-4 tracking-tight">{formData.fullName}</h2>
                                <p className="text-[var(--accent)] font-bold text-[10px] uppercase tracking-[0.3em] mb-8">{formData.role}</p>

                                <div className="h-px w-full bg-[var(--border)] mb-8 opacity-50"></div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-[var(--text-muted)]">Status</span>
                                        <span className="text-emerald-600 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Form Card */}
                <div className="lg:col-span-2">
                    <div className="card p-10 border border-[var(--border)] h-full">
                        <div className="flex items-center gap-5 mb-12 pb-8 border-b border-[var(--border)]">
                            <div className="w-14 h-14 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)] shadow-inner group-hover:scale-110 transition-transform">
                                <User size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Profile Settings</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mt-1">Update your personal information</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName || ''}
                                    onChange={handleChange}
                                    className="input-field p-5 font-bold text-xl focus:ring-8 focus:ring-[var(--accent)]/5 transition-all text-[var(--text-primary)] bg-[var(--bg-secondary)]/30"
                                    placeholder="Enter full name..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 flex items-center gap-2">
                                        <Mail size={14} className="text-[var(--accent)]" /> Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        readOnly
                                        className="input-field bg-[var(--bg-secondary)] cursor-not-allowed border-dashed text-[var(--text-muted)] font-bold italic"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1 flex items-center gap-2">
                                        <Shield size={14} className="text-[var(--accent)]" /> Role
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.role || ''}
                                        readOnly
                                        className="input-field bg-[var(--bg-secondary)] cursor-not-allowed border-[var(--border)] text-[var(--accent)] font-black uppercase tracking-widest shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="pt-10 mt-10 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-8">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic opacity-70">
                                    * Contact System Administrator to change role.
                                </p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary py-4 px-12 text-[10px] font-bold uppercase tracking-[0.2em] w-full sm:w-auto flex items-center justify-center gap-3 shadow-2xl shadow-[var(--accent)]/30 active:scale-95 transition-all text-white"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <><Save size={20} /> Save Changes</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security & PIN Login Card */}
                    <div className="card p-10 border border-[var(--border)] mt-8 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border)]">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner group-hover:scale-110 transition-transform">
                                    <Shield size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Security & Access</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mt-1">Manage your 4-digit PIN login</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={clsx(
                                    "text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border",
                                    authUser?.isPinEnabled
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : "bg-gray-50 text-gray-400 border-gray-100"
                                )}>
                                    {authUser?.isPinEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <button
                                    onClick={handlePinToggle}
                                    disabled={pinLoading}
                                    className={clsx(
                                        "btn-primary py-3 px-8 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50",
                                        authUser?.isPinEnabled ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                                    )}
                                >
                                    {pinLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (authUser?.isPinEnabled ? 'Disable PIN' : 'Enable PIN')}
                                </button>
                            </div>
                        </div>

                        {isPinPanelOpen && !authUser?.isPinEnabled && (
                            <form onSubmit={handleSetPin} className="animate-slide-down space-y-6 bg-[var(--bg-secondary)]/30 p-8 rounded-3xl border border-[var(--border)] border-dashed">
                                <div className="space-y-4 max-w-sm mx-auto text-center">
                                    <label className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Set Your 4-Digit PIN</label>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium">This PIN will be used for rapid login on this browser and mobile app.</p>
                                    <div className="flex justify-center gap-4 py-4">
                                        <input
                                            type="password"
                                            maxLength={4}
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                            className="w-48 text-center text-4xl font-black tracking-[1em] p-4 bg-white border-2 border-[var(--accent)] rounded-2xl focus:ring-8 focus:ring-[var(--accent)]/10 transition-all outline-none"
                                            placeholder="••••"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsPinPanelOpen(false)}
                                            className="flex-1 btn-secondary py-4 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={pinLoading || pin.length !== 4}
                                            className="flex-3 btn-primary py-4 text-[10px] font-black uppercase tracking-widest bg-indigo-600 shadow-xl shadow-indigo-600/20"
                                        >
                                            Confirm & Enable
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        <div className="p-6 bg-indigo-50/50 rounded-2xl mt-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-700 mb-2 flex items-center gap-2">
                                <Shield size={14} /> Security Note
                            </h4>
                            <p className="text-[11px] text-indigo-900/70 leading-relaxed font-medium">
                                PIN login is browser/device specific for security. If you don't login for 3 consecutive days, we'll automatically disable it and ask for your password to keep your account secure.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
