import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import {
    Users, FileText, Calendar, UserPlus, UserX, CheckCircle,
    XCircle, Database, Clock, ArrowRight, Activity, Zap, Search,
    TrendingUp, ChevronDown, Building2, User, Car, ShoppingCart, Package
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import clsx from 'clsx';
import { useToast } from '../context/ToastContext';

// ─── Follow-up Summary Block ──────────────────────────────────────────────────

const FollowupSummaryBlock = ({ user }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const role = user?.role;
    const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(role);
    const isBranchMgr = role === 'BRANCH_MGR';
    const isSalesMgr  = role === 'SALES_MGR';
    const isSalesRole = ['SALES_REP', 'SALES_MGR', 'BRANCH_MGR', 'EXECUTIVE', 'APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(role);

    // Show User Dropdown for Super Users, Branch Managers, and Sales Managers
    const showUserDropdown = isSuperUser || isBranchMgr || isSalesMgr;
    const showBranchDropdown = isSuperUser;

    const [branchId, setBranchId] = useState('');
    const [userId, setUserId]     = useState('');
    const [status, setStatus]     = useState('new');
    const [count, setCount]       = useState(null);
    const [loading, setLoading]   = useState(false);
    const [branches, setBranches] = useState([]);
    const [salesUsers, setSalesUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Fetch branches once (super users)
    useEffect(() => {
        if (!showBranchDropdown) return;
        api.get('/branches').then(r => setBranches(r.data)).catch(() => {});
    }, [showBranchDropdown]);

    // Fetch assignable users on branch change
    useEffect(() => {
        if (!showUserDropdown) return;
        setUsersLoading(true);
        setUserId('');
        const params = {};
        if (branchId) params.branchId = branchId;
        api.get('/users/assignable', { params })
            .then(r => setSalesUsers(r.data))
            .catch(() => setSalesUsers([]))
            .finally(() => setUsersLoading(false));
    }, [branchId, showUserDropdown]);

    const fetchFollowupCount = useCallback(async () => {
        setLoading(true);
        try {
            const params = { status };
            if (isSuperUser && branchId) params.branchId = branchId;
            if (showUserDropdown && userId) params.userId = userId;
            // If user dropdown is hidden but user is not super, backend handles filtering by branchId/userId from token
            const res = await api.get('/dashboard/follow-up-count', { params });
            setCount(res.data.count);
        } catch (error) {
            console.error("Error fetching follow-up count", error);
            setCount(0);
        } finally {
            setLoading(false);
        }
    }, [branchId, userId, status, isSuperUser, showUserDropdown]);

    useEffect(() => {
        if (isSalesRole) fetchFollowupCount();
    }, [fetchFollowupCount, isSalesRole]);

    const handleNavigateToEnquiries = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        let url = `/enquiries?status=${status}&nextVisitDate=${todayStr}`;
        if (userId) url += `&assignedToUserId=${userId}`;
        if (branchId && isSuperUser) url += `&branchId=${branchId}`;
        navigate(url);
    };

    if (!isSalesRole) return null;

    return (
        <div className="card overflow-hidden border border-[var(--border)] shadow-md animate-fade-in mb-8">
            <div className="px-6 py-6 bg-[var(--bg-tertiary)] border-b border-[var(--border)]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Follow-up Summary</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">
                                Pending follow-ups as of today
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Filter */}
                        <div className="flex rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
                            {[
                                { id: 'new', label: 'New' },
                                { id: 'in-followup', label: 'In Followup' }
                            ].map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setStatus(s.id)}
                                    className={clsx(
                                        'px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-md',
                                        status === s.id
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                                    )}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Branch Dropdown */}
                        {showBranchDropdown && (
                            <div className="relative group">
                                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none" />
                                <select 
                                    value={branchId} 
                                    onChange={e => setBranchId(e.target.value)}
                                    className="input-field text-xs font-bold py-2 pl-9 pr-8 cursor-pointer appearance-none bg-[var(--bg-secondary)] border-[var(--border)] focus:ring-2 focus:ring-amber-500/20" 
                                    style={{ minWidth: 160 }}
                                >
                                    <option value="">All Branches</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.displayName}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        )}

                        {/* User Dropdown */}
                        {showUserDropdown && (
                            <div className="relative group">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none" />
                                <select 
                                    value={userId} 
                                    onChange={e => setUserId(e.target.value)}
                                    disabled={usersLoading}
                                    className="input-field text-xs font-bold py-2 pl-9 pr-8 cursor-pointer appearance-none disabled:opacity-60 bg-[var(--bg-secondary)] border-[var(--border)] focus:ring-2 focus:ring-amber-500/20" 
                                    style={{ minWidth: 180 }}
                                >
                                    <option value="">All Users</option>
                                    {salesUsers.map(u => (
                                        <option key={u.userId} value={u.userId}>
                                            {u.fullName} ({u.role.replace('_', ' ')})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-baseline justify-center md:justify-start gap-4 mb-2">
                        <div className={clsx('transition-all duration-300', loading ? 'opacity-30 blur-sm scale-95' : 'opacity-100')}>
                            <span className="text-7xl font-black text-amber-600 tracking-tighter leading-none">
                                {count ?? '—'}
                            </span>
                        </div>
                        <div className="text-left">
                            <span className="text-xl font-extrabold text-[var(--text-primary)] block">Pending Follow-ups</span>
                            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Scheduled for Today</span>
                        </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] font-medium max-w-lg">
                        Total enquiries awaiting attention by the end of today based on their next visit schedule.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={handleNavigateToEnquiries}
                        className="btn-primary !h-14 !py-0 px-10 flex items-center gap-3 text-lg font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all w-full md:w-auto"
                        style={{ backgroundColor: 'rgb(245 158 11)' }}
                    >
                        View Enquiries <ArrowRight size={20} />
                    </button>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Redirects to filtered enquiry list
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0];

const formatCount = (n) => (n === undefined || n === null ? '—' : String(n));

// ─── Date Range Mode Helpers ──────────────────────────────────────────────────

const MODES = [
    { id: 'day',   label: 'Day' },
    { id: 'range', label: 'Range' },
    { id: 'month', label: 'Month' },
    { id: 'year',  label: 'Year' },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => currentYear - i);

/** Given a mode + its inputs, return { startDate, endDate } as ISO date strings */
const resolveDateRange = (mode, { day, rangeFrom, rangeTo, month, year }) => {
    const clampToday = (d) => (d > today() ? today() : d);
    switch (mode) {
        case 'day':
            return { startDate: day, endDate: day };
        case 'range':
            return { startDate: rangeFrom, endDate: clampToday(rangeTo) };
        case 'month': {
            // month value from <input type="month"> is "YYYY-MM"
            if (!month) return { startDate: today(), endDate: today() };
            const [y, m] = month.split('-').map(Number);
            const start  = `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-01`;
            // Last day of month
            const lastDay = new Date(y, m, 0).getDate();
            const end     = `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
            return { startDate: start, endDate: clampToday(end) };
        }
        case 'year': {
            const y = year || currentYear;
            return {
                startDate: `${y}-01-01`,
                endDate: clampToday(`${y}-12-31`),
            };
        }
        default:
            return { startDate: today(), endDate: today() };
    }
};

// ─── Period label shown inside stat card ──────────────────────────────────────

const periodLabel = (mode, { day, rangeFrom, rangeTo, month, year }) => {
    switch (mode) {
        case 'day':   return day === today() ? 'Today' : day;
        case 'range': return `${rangeFrom} → ${rangeTo}`;
        case 'month': return month || '—';
        case 'year':  return String(year || currentYear);
        default:      return '';
    }
};

// ─── Activity Block ───────────────────────────────────────────────────────────

const DailyActivityBlock = ({ user }) => {
    const role = user?.role;
    const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(role);
    const isSalesMgr  = role === 'SALES_MGR' || role === 'BRANCH_MGR';
    const showUserDropdown = isSuperUser || isSalesMgr;

    // ── Date mode state ──
    const [mode, setMode]           = useState('day');
    const [day, setDay]             = useState(today());
    const [rangeFrom, setRangeFrom] = useState(today());
    const [rangeTo, setRangeTo]     = useState(today());
    const [month, setMonth]         = useState(() => today().slice(0, 7)); // "YYYY-MM"
    const [year, setYear]           = useState(currentYear);

    // ── Filter state ──
    const [branchId, setBranchId]   = useState('');
    const [userId, setUserId]       = useState('');

    // ── Data state ──
    const [stats, setStats]         = useState({ enquiryCount: null, followUpCount: null });
    const [loading, setLoading]     = useState(false);
    const [branches, setBranches]   = useState([]);
    const [salesUsers, setSalesUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Fetch branches once (super users)
    useEffect(() => {
        if (!isSuperUser) return;
        api.get('/branches').then(r => setBranches(r.data)).catch(() => {});
    }, [isSuperUser]);

    // Fetch assignable users on branch change
    useEffect(() => {
        if (!showUserDropdown) return;
        setUsersLoading(true);
        setUserId('');
        const params = {};
        if (branchId) params.branchId = branchId;
        api.get('/users/assignable', { params })
            .then(r => setSalesUsers(r.data))
            .catch(() => setSalesUsers([]))
            .finally(() => setUsersLoading(false));
    }, [branchId, showUserDropdown]);

    // Fetch stats on any filter / date change
    const dateInputs = { day, rangeFrom, rangeTo, month, year };
    const fetchStats = useCallback(async () => {
        const { startDate, endDate } = resolveDateRange(mode, dateInputs);
        if (!startDate || !endDate) return;
        setLoading(true);
        try {
            const params = { startDate, endDate };
            if (isSuperUser && branchId) params.branchId = branchId;
            if ((isSuperUser || isSalesMgr) && userId) params.userId = userId;
            const res = await api.get('/dashboard/daily-stats', { params });
            setStats(res.data);
        } catch {
            setStats({ enquiryCount: 0, followUpCount: 0 });
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, day, rangeFrom, rangeTo, month, year, branchId, userId, isSuperUser, isSalesMgr]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const label = periodLabel(mode, dateInputs);
    const maxMonth = today().slice(0, 7);

    return (
        <div className="card overflow-hidden border border-[var(--border)] shadow-sm">
            {/* ── Header ── */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Title */}
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)]">
                            <Activity size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">Activity Stats</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                {isSuperUser ? 'All Branches' : 'Your Branch'} · {role === 'SALES_REP' ? 'Personal Stats' : 'Filterable Stats'}
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Mode Tabs */}
                        <div className="flex rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)]">
                            {MODES.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={clsx(
                                        'px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                                        mode === m.id
                                            ? 'bg-[var(--accent)] text-white shadow-sm'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Date Inputs — vary by mode */}
                        {mode === 'day' && (
                            <input type="date" value={day} max={today()}
                                onChange={e => setDay(e.target.value)}
                                className="input-field text-xs font-bold py-1.5 px-3 cursor-pointer" />
                        )}
                        {mode === 'range' && (
                            <div className="flex items-center gap-1">
                                <input type="date" value={rangeFrom} max={today()}
                                    onChange={e => setRangeFrom(e.target.value)}
                                    className="input-field text-xs font-bold py-1.5 px-3 cursor-pointer" style={{ minWidth: 120 }} />
                                <span className="text-[var(--text-muted)] text-xs font-bold">→</span>
                                <input type="date" value={rangeTo} min={rangeFrom} max={today()}
                                    onChange={e => setRangeTo(e.target.value)}
                                    className="input-field text-xs font-bold py-1.5 px-3 cursor-pointer" style={{ minWidth: 120 }} />
                            </div>
                        )}
                        {mode === 'month' && (
                            <input type="month" value={month} max={maxMonth}
                                onChange={e => setMonth(e.target.value)}
                                className="input-field text-xs font-bold py-1.5 px-3 cursor-pointer" />
                        )}
                        {mode === 'year' && (
                            <div className="relative">
                                <select value={year} onChange={e => setYear(Number(e.target.value))}
                                    className="input-field text-xs font-bold py-1.5 px-3 pr-7 cursor-pointer appearance-none">
                                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        )}

                        {/* Branch Dropdown — Super Users only */}
                        {isSuperUser && (
                            <div className="relative">
                                <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                <select value={branchId} onChange={e => setBranchId(e.target.value)}
                                    className="input-field text-xs font-bold py-1.5 pl-7 pr-7 cursor-pointer appearance-none" style={{ minWidth: 140 }}>
                                    <option value="">All Branches</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.displayName}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        )}

                        {/* User Dropdown — SALES_MGR + Super Users */}
                        {showUserDropdown && (
                            <div className="relative">
                                <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                <select value={userId} onChange={e => setUserId(e.target.value)}
                                    disabled={usersLoading}
                                    className="input-field text-xs font-bold py-1.5 pl-7 pr-7 cursor-pointer appearance-none disabled:opacity-60" style={{ minWidth: 160 }}>
                                    <option value="">All Users</option>
                                    {salesUsers.map(u => (
                                        <option key={u.userId} value={u.userId}>
                                            {u.fullName} ({u.role.replace('_', ' ')})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Enquiries */}
                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileText size={80} className="text-amber-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Enquiries Assigned</p>
                                <p className="text-[10px] text-amber-500 font-semibold">{label}</p>
                            </div>
                        </div>
                        <div className={clsx('transition-all', loading && 'opacity-40 blur-[1px]')}>
                            <h2 className="text-5xl font-black text-amber-700 tracking-tighter">
                                {formatCount(stats.enquiryCount)}
                            </h2>
                            <p className="text-xs text-amber-600/70 font-semibold mt-2 uppercase tracking-wide">
                                {role === 'SALES_REP' ? 'Assigned to you' : userId ? 'For selected user' : 'All users in scope'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Follow-ups */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Calendar size={80} className="text-indigo-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Follow-ups Added</p>
                                <p className="text-[10px] text-indigo-500 font-semibold">{label}</p>
                            </div>
                        </div>
                        <div className={clsx('transition-all', loading && 'opacity-40 blur-[1px]')}>
                            <h2 className="text-5xl font-black text-indigo-700 tracking-tighter">
                                {formatCount(stats.followUpCount)}
                            </h2>
                            <p className="text-xs text-indigo-600/70 font-semibold mt-2 uppercase tracking-wide">
                                {role === 'SALES_REP' ? 'Added by you' : userId ? 'For selected user' : 'All users in scope'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Vehicle Stats Block ──────────────────────────────────────────────────────

const VehicleStatsBlock = ({ user }) => {
    const role = user?.role;
    const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(role);

    // ── Date mode state ──
    const [mode, setMode]           = useState('day');
    const [day, setDay]             = useState(today());
    const [rangeFrom, setRangeFrom] = useState(today());
    const [rangeTo, setRangeTo]     = useState(today());
    const [month, setMonth]         = useState(() => today().slice(0, 7));
    const [year, setYear]           = useState(currentYear);

    // ── Filter state ──
    const [branchId, setBranchId]   = useState('');

    // ── Data state ──
    const [stats, setStats]         = useState({ stockCount: null, addedCount: null, bookedCount: null, deliveredCount: null });
    const [loading, setLoading]     = useState(false);
    const [branches, setBranches]   = useState([]);

    // Fetch branches once (super users)
    useEffect(() => {
        if (!isSuperUser) return;
        api.get('/branches').then(r => setBranches(r.data)).catch(() => {});
    }, [isSuperUser]);

    const dateInputs = { day, rangeFrom, rangeTo, month, year };
    const fetchStats = useCallback(async () => {
        const { startDate, endDate } = resolveDateRange(mode, dateInputs);
        if (!startDate || !endDate) return;
        setLoading(true);
        try {
            const params = { startDate, endDate };
            if (isSuperUser && branchId) params.branchId = branchId;
            const res = await api.get('/dashboard/vehicle-stats', { params });
            setStats(res.data);
        } catch {
            setStats({ stockCount: 0, addedCount: 0, bookedCount: 0, deliveredCount: 0 });
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, day, rangeFrom, rangeTo, month, year, branchId, isSuperUser]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const label = periodLabel(mode, dateInputs);
    const maxMonth = today().slice(0, 7);

    return (
        <div className="card overflow-hidden border border-[var(--border)] shadow-sm">
            {/* ── Header ── */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600">
                            <Car size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">Vehicle Stats</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                {isSuperUser ? 'All Branches' : 'Your Branch'} · Performance & Inventory
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)]">
                            {MODES.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={clsx(
                                        'px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                                        mode === m.id
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {mode === 'day' && (
                            <input type="date" value={day} max={today()}
                                onChange={e => setDay(e.target.value)}
                                className="input-field text-xs font-bold py-1.5 px-3 cursor-pointer" />
                        )}
                        {mode === 'range' && (
                            <div className="flex items-center gap-1">
                                <input type="date" value={rangeFrom} max={today()}
                                    onChange={e => setRangeFrom(e.target.value)}
                                    className="input-field text-xs font-bold py-1.5 px-3 cursor-pointer" style={{ minWidth: 120 }} />
                                <span className="text-[var(--text-muted)] text-xs font-bold">→</span>
                                <input type="date" value={rangeTo} min={rangeFrom} max={today()}
                                    onChange={e => setRangeTo(e.target.value)}
                                    className="input-field text-xs font-bold py-1.5 px-3 cursor-pointer" style={{ minWidth: 120 }} />
                            </div>
                        )}
                        {mode === 'month' && (
                            <input type="month" value={month} max={maxMonth}
                                onChange={e => setMonth(e.target.value)}
                                className="input-field text-xs font-bold py-1.5 px-3 cursor-pointer" />
                        )}
                        {mode === 'year' && (
                            <div className="relative">
                                <select value={year} onChange={e => setYear(Number(e.target.value))}
                                    className="input-field text-xs font-bold py-1.5 px-3 pr-7 cursor-pointer appearance-none">
                                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        )}

                        {isSuperUser && (
                            <div className="relative">
                                <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                <select value={branchId} onChange={e => setBranchId(e.target.value)}
                                    className="input-field text-xs font-bold py-1.5 pl-7 pr-7 cursor-pointer appearance-none" style={{ minWidth: 140 }}>
                                    <option value="">All Branches</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.displayName}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stock - Total Ready for Sale */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Package size={80} className="text-slate-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Stock Count</p>
                                <p className="text-[10px] text-slate-500 font-semibold italic">Ready for Sale</p>
                            </div>
                        </div>
                        <div className={clsx('transition-all', loading && 'opacity-40 blur-[1px]')}>
                            <h2 className="text-5xl font-black text-slate-700 tracking-tighter">
                                {formatCount(stats.stockCount)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">Current Snapshot</p>
                        </div>
                    </div>
                </div>

                {/* Cars Added */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Car size={80} className="text-emerald-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                <Car size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Cars Added</p>
                                <p className="text-[10px] text-emerald-500 font-semibold">{label}</p>
                            </div>
                        </div>
                        <div className={clsx('transition-all', loading && 'opacity-40 blur-[1px]')}>
                            <h2 className="text-5xl font-black text-emerald-700 tracking-tighter">
                                {formatCount(stats.addedCount)}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Cars Booked */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingCart size={80} className="text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <ShoppingCart size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Cars Booked</p>
                                <p className="text-[10px] text-blue-500 font-semibold">{label}</p>
                            </div>
                        </div>
                        <div className={clsx('transition-all', loading && 'opacity-40 blur-[1px]')}>
                            <h2 className="text-5xl font-black text-blue-700 tracking-tighter">
                                {formatCount(stats.bookedCount)}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Cars Delivered */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle size={80} className="text-indigo-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Cars Delivered</p>
                                <p className="text-[10px] text-indigo-500 font-semibold">{label}</p>
                            </div>
                        </div>
                        <div className={clsx('transition-all', loading && 'opacity-40 blur-[1px]')}>
                            <h2 className="text-5xl font-black text-indigo-700 tracking-tighter">
                                {formatCount(stats.deliveredCount)}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    const role = user?.role;
    const isSalesRole = ['SALES_REP', 'SALES_MGR', 'APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE', 'BRANCH_MGR'].includes(role);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const getCards = () => {
        const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(role);

        if (role === 'ACCOUNTANT') {
            return [
                { label: 'Pending Handovers', value: stats.pendingHandovers, icon: <Clock size={22} className="text-amber-600" />, bg: 'bg-amber-100/50', text: 'text-amber-700' },
                { label: 'Active Bookings', value: stats.activeBookings, icon: <FileText size={22} className="text-[var(--accent)]" />, bg: 'bg-indigo-100/50', text: 'text-indigo-700' },
                { label: 'Delivered Vehicles', value: stats.deliveredVehicles, icon: <CheckCircle size={22} className="text-emerald-600" />, bg: 'bg-emerald-100/50', text: 'text-emerald-700' },
            ];
        }

        if (role === 'HR_MGR') {
            return [
                { label: 'Total Users', value: stats.totalUsers, icon: <Users size={22} className="text-[var(--accent)]" />, bg: 'bg-indigo-100/50', text: 'text-indigo-700' },
                { label: 'New Users', value: stats.newUsersCount, icon: <UserPlus size={22} className="text-emerald-600" />, bg: 'bg-emerald-100/50', text: 'text-emerald-700' },
                { label: 'Inactive Users', value: stats.inActiveUsersCount, icon: <UserX size={22} className="text-rose-600" />, bg: 'bg-rose-100/50', text: 'text-rose-700' },
            ];
        }

        if (role === 'SALES_REP' || role === 'SALES_MGR' || role === 'BRANCH_MGR' || isSuperUser) {
            const labelPrefix = isSuperUser ? 'Global' : (['SALES_MGR', 'BRANCH_MGR'].includes(role) ? 'Branch' : 'Personal');
            return [
                { label: `${labelPrefix} Enquiries`, value: stats.pending || stats.pendingEnquiries, icon: <FileText size={22} className="text-amber-600" />, bg: 'bg-amber-100/50', text: 'text-amber-700' },
                { label: `${labelPrefix} Conversions`, value: stats.closed || stats.closedEnquiries, icon: <CheckCircle size={22} className="text-emerald-600" />, bg: 'bg-emerald-100/50', text: 'text-emerald-700' },
                { label: `${labelPrefix} Lost Enquiries`, value: stats.missed || stats.missedEnquiries, icon: <XCircle size={22} className="text-rose-600" />, bg: 'bg-rose-100/50', text: 'text-rose-700' },
            ];
        }

        return [
            { label: 'Data Overview', value: '—', icon: <Database size={22} />, bg: 'bg-slate-100/50', text: 'text-slate-700' }
        ];
    };

    const cards = getCards();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-2" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-10">
            <header>
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-[var(--accent)] shadow-sm border border-[var(--accent)]/20">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] mt-2">Real-time performance metrics.</p>
                    </div>
                </div>
            </header>
            
            {/* Daily Activity Block — visible to all sales roles (Moved to First Block) */}
            {isSalesRole && (
                <div className="space-y-10">
                    <FollowupSummaryBlock user={user} />
                    <DailyActivityBlock user={user} />
                    <VehicleStatsBlock user={user} />
                </div>
            )}

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="card p-8 hover:shadow-lg transition-all relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <div className={`p-4 rounded-xl ${card.bg} group-hover:scale-110 transition-transform shadow-sm border border-[var(--border)]`}>
                                {card.icon}
                            </div>
                            <div className="h-1 w-12 bg-[var(--border)] rounded-full group-hover:bg-[var(--accent)] transition-all opacity-30 group-hover:opacity-100"></div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-[var(--text-muted)]">
                            {card.label}
                        </p>
                        <h3 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                            {card.value ?? '0'}
                        </h3>
                    </div>
                ))}
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 card p-8">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter flex items-center gap-4">
                            <Clock className="text-[var(--accent)]" size={24} />
                            Recent Activity
                        </h3>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-secondary)] px-4 py-2 rounded-full border">
                            Activity Logs
                        </p>
                    </div>
                    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/30">
                        <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-6 shadow-sm border">
                            <Database size={28} className="text-[var(--text-muted)] opacity-50" />
                        </div>
                        <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">No Recent Activity</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">User activity will be recorded here.</p>
                    </div>
                </div>

                {/* Quick Access */}
                <div className="card p-8 bg-[var(--bg-secondary)]/30">
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)] ml-1">Quick Links</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={() => navigate('/enquiries')} className="group flex flex-col p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-xl transition-all shadow-sm active:scale-95 text-left">
                                <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center text-[var(--accent)] shadow-sm group-hover:bg-[var(--accent)] group-hover:text-white transition-all mb-4">
                                    <Search size={22} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Enquiries</span>
                                <span className="text-sm font-bold text-[var(--text-primary)] group-hover:translate-x-1 transition-transform flex items-center gap-2">Access Enquiries <ArrowRight size={14} /></span>
                            </button>

                            {(role === 'ACCOUNTANT' || ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(role)) ? (
                                <button onClick={() => navigate('/bookings')} className="group flex flex-col p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500 hover:shadow-xl transition-all shadow-sm active:scale-95 text-left">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all mb-4">
                                        <TrendingUp size={22} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40 mb-1">Bookings</span>
                                    <span className="text-sm font-bold text-emerald-900 group-hover:translate-x-1 transition-transform flex items-center gap-2">Manage Bookings <ArrowRight size={14} /></span>
                                </button>
                            ) : (
                                <button onClick={() => navigate('/followups')} className="group flex flex-col p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-amber-500 hover:shadow-xl transition-all shadow-sm active:scale-95 text-left">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all mb-4">
                                        <Calendar size={22} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/40 mb-1">Follow-ups</span>
                                    <span className="text-sm font-bold text-amber-900 group-hover:translate-x-1 transition-transform flex items-center gap-2">Manage Follow-ups <ArrowRight size={14} /></span>
                                </button>
                            )}

                            <div className="card p-8 bg-[var(--accent)] text-white relative overflow-hidden group border border-[var(--border)] shadow-sm">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                                    <Zap size={80} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Zap className="text-white" size={20} fill="currentColor" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Tip</span>
                                    </div>
                                    <h4 className="text-xl font-bold mb-3 tracking-tight">Navigation Tip</h4>
                                    <p className="text-white/80 leading-relaxed text-xs">Use the sidebar to quickly access different modules.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
