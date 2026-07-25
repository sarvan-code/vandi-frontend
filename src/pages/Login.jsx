import React, { useState, useContext } from 'react';
import clsx from 'clsx';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const Login = () => {
    const [email, setEmail] = useState(localStorage.getItem('lastEmail') || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pin, setPin] = useState('');
    const [showPinView, setShowPinView] = useState(!!localStorage.getItem('isPinEnabled') && !!localStorage.getItem('lastEmail'));
    const { login, loginWithPin } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    const handlePinLogin = async (e) => {
        if (e) e.preventDefault();
        if (pin.length !== 4) return;
        setIsLoading(true);
        setError('');

        const result = await loginWithPin(email, pin);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
            setPin('');
            // If PIN expired, switch to regular login
            if (result.code === 'PIN_EXPIRED') {
                setShowPinView(false);
                localStorage.removeItem('isPinEnabled');
            }
        }
        setIsLoading(false);
    };

    const handlePinKeyPress = (num) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                // Auto-submit after small delay
                setTimeout(() => {
                    const result = loginWithPin(email, newPin);
                    result.then(res => {
                        if (res.success) navigate('/');
                        else {
                            setError(res.error);
                            setPin('');
                            if (res.code === 'PIN_EXPIRED') {
                                setShowPinView(false);
                                localStorage.removeItem('isPinEnabled');
                            }
                        }
                    });
                }, 300);
            }
        }
    };

    const handleSwitchAccount = () => {
        localStorage.removeItem('lastEmail');
        localStorage.removeItem('isPinEnabled');
        setEmail('');
        setPassword('');
        setPin('');
        setShowPinView(false);
        setError('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-primary)]">
            <div className="max-w-[450px] w-full animate-fade-in-up">
                <div className="bg-[var(--surface)] p-12 rounded-[2.5rem] shadow-2xl border border-[var(--border)] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent)]"></div>

                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[var(--border)] group-hover:scale-105 transition-transform">
                            <Logo size={48} />
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                            {showPinView ? 'PIN Verification' : 'Login'}
                        </h1>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-3">
                            {showPinView ? (
                                <span>
                                    Welcome back, {email} •{' '}
                                    <button
                                        onClick={handleSwitchAccount}
                                        className="text-[var(--accent)] hover:underline cursor-pointer bg-transparent border-none p-0 normal-case font-bold"
                                    >
                                        Not you?
                                    </button>
                                </span>
                            ) : (
                                'VANDI CRM Automotive • Login'
                            )}
                        </p>
                    </div>

                    {showPinView ? (
                        <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                            {error && (
                                <div className="text-xs font-bold uppercase tracking-wider p-4 rounded-2xl bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)]/20 text-center">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-center gap-4 py-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className={clsx(
                                            "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all",
                                            pin.length > i ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)] bg-[var(--bg-secondary)]"
                                        )}
                                    >
                                        {pin.length > i && <div className="w-3 h-3 bg-white rounded-full"></div>}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handlePinKeyPress(num.toString())}
                                        className="h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-2xl font-bold text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white transition-all active:scale-90"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowPinView(false)}
                                    className="h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent)] text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
                                >
                                    Login with Password
                                </button>
                                <button
                                    key={0}
                                    onClick={() => handlePinKeyPress('0')}
                                    className="h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-2xl font-bold text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white transition-all active:scale-90"
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => setPin(pin.slice(0, -1))}
                                    className="h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] text-xl font-bold hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                                >
                                    ⌫
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-8" onSubmit={handleSubmit}>
                            {error && (
                                <div className="text-xs font-bold uppercase tracking-wider p-4 rounded-2xl bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)]/20 animate-in shake duration-300">
                                    {error}
                                </div>
                            )}

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
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-5 py-4 pr-14 text-sm font-semibold text-[var(--text-primary)] w-full outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-muted)]"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors focus:outline-none"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            // Eye-off icon
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        ) : (
                                            // Eye icon
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-10 pt-8 border-t border-[var(--border)] text-center">
                        <p className="text-xs text-[var(--text-muted)] font-medium">
                            Initial Onboarding?{' '}
                            <Link to="/register" className="text-[var(--accent)] font-bold hover:underline">
                                Register Now
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">
                        &copy; 2026 VANDI CRM AUTOMOTIVE
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                        <span className="hover:text-[var(--text-secondary)] cursor-pointer">Privacy Policy</span>
                        <span className="w-1 h-1 bg-[var(--border)] rounded-full"></span>
                        <span className="hover:text-[var(--text-secondary)] cursor-pointer">Terms of Service</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
