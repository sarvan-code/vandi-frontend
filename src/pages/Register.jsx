import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const Register = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await register({ fullName, email, password });
        if (result.success) {
            navigate('/login');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-primary)]">
            <div className="max-w-[450px] w-full animate-fade-in-up">
                <div className="bg-[var(--surface)] p-12 rounded-[2.5rem] shadow-2xl border border-[var(--border)] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent)]"></div>

                    <div className="flex flex-col items-center mb-12">
                        <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[var(--border)]">
                            <Logo size={48} />
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                            Create Account
                        </h1>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-3">
                            VANDI CRM Automotive • Registry Portal
                        </p>
                    </div>

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {error && (
                            <div className="text-xs font-bold uppercase tracking-wider p-4 rounded-2xl bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)]/20 animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                required
                                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm font-semibold text-[var(--text-primary)] w-full outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-muted)]"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">
                                Email Address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm font-semibold text-[var(--text-primary)] w-full outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-muted)]"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">
                                Authorization Passkey
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm font-semibold text-[var(--text-primary)] w-full outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-muted)]"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Initialize Onboarding
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 pt-8 border-t border-[var(--border)] text-center">
                        <p className="text-xs text-[var(--text-muted)] font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[var(--accent)] font-bold hover:underline">
                                Return to Identity Gateway
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">
                        &copy; 2026 VANDI CRM AUTOMOTIVE
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                        <span className="hover:text-[var(--text-secondary)] cursor-pointer">Privacy Protocol</span>
                        <span className="w-1 h-1 bg-[var(--border)] rounded-full"></span>
                        <span className="hover:text-[var(--text-secondary)] cursor-pointer">Terms of Engagement</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
