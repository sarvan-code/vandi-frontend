import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Calendar, Car, UserPlus, UserX, CheckCircle, XCircle, Database, Clock, ArrowRight, Activity, Zap, Search, TrendingUp } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

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
        const role = user?.role;
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

        if (role === 'SALES_REP' || role === 'SALES_MGR' || isSuperUser) {
            const labelPrefix = isSuperUser ? 'Global' : (role === 'SALES_MGR' ? 'Branch' : 'Personal');
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
        <div className="animate-fade-in">
            <header className="mb-10">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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
                                <span className="text-sm font-bold text-[var(--text-primary)] group-hover:translate-x-1 transition-transform flex items-center gap-2"> Access Enquiries <ArrowRight size={14} /> </span>
                            </button>

                            {(user?.role === 'ACCOUNTANT' || ['APP_OWNER', 'SYS_ADMIN', 'DEV', 'EXECUTIVE'].includes(user?.role)) ? (
                                <button onClick={() => navigate('/bookings')} className="group flex flex-col p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500 hover:shadow-xl transition-all shadow-sm active:scale-95 text-left">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all mb-4">
                                        <TrendingUp size={22} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40 mb-1">Bookings</span>
                                    <span className="text-sm font-bold text-emerald-900 group-hover:translate-x-1 transition-transform flex items-center gap-2"> Manage Bookings <ArrowRight size={14} /> </span>
                                </button>
                            ) : (
                                <button onClick={() => navigate('/followups')} className="group flex flex-col p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-amber-500 hover:shadow-xl transition-all shadow-sm active:scale-95 text-left">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all mb-4">
                                        <Calendar size={22} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/40 mb-1">Follow-ups</span>
                                    <span className="text-sm font-bold text-amber-900 group-hover:translate-x-1 transition-transform flex items-center gap-2"> Manage Follow-ups <ArrowRight size={14} /> </span>
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
                                    <p className="text-white/80 leading-relaxed text-xs">
                                        Use the sidebar to quickly access different modules.
                                    </p>
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

