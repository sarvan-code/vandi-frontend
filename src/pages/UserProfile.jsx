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

    useEffect(() => {
        if (authUser) {
            setFormData(prev => ({
                ...prev,
                fullName: authUser.fullName,
                email: authUser.email,
                role: authUser.role
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
                                    value={formData.fullName}
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
                                        value={formData.email}
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
                                        value={formData.role}
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
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
