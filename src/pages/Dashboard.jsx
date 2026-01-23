import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { Users, FileText, Calendar, Car, UserPlus, UserX, CheckCircle, XCircle, Database, Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
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
        const isSuperUser = ['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(role);

        if (role === 'ACCOUNTANT') {
            return [
                { label: 'Pending Handovers', value: stats.pendingHandovers, icon: <Clock size={24} className="text-orange-500" />, color: 'orange' },
                { label: 'Active Bookings', value: stats.activeBookings, icon: <FileText size={24} className="text-blue-500" />, color: 'blue' },
                { label: 'Delivered Vehicles', value: stats.deliveredVehicles, icon: <CheckCircle size={24} className="text-green-500" />, color: 'green' },
            ];
        }

        if (role === 'HR_MGR') {
            return [
                { label: 'Total Staff', value: stats.totalUsers, icon: <Users size={24} className="text-blue-500" />, color: 'blue' },
                { label: 'New This Month', value: stats.newUsersCount, icon: <UserPlus size={24} className="text-green-500" />, color: 'green' },
                { label: 'Inactive Users', value: stats.inActiveUsersCount, icon: <UserX size={24} className="text-red-500" />, color: 'red' },
            ];
        }

        if (role === 'SALES_REP' || role === 'SALES_MGR' || isSuperUser) {
            const labelPrefix = isSuperUser ? 'Global' : (role === 'SALES_MGR' ? 'Branch' : 'My');
            return [
                { label: `${labelPrefix} Pending`, value: stats.pending || stats.pendingEnquiries, icon: <FileText size={24} className="text-yellow-500" />, color: 'yellow' },
                { label: `${labelPrefix} Closed`, value: stats.closed || stats.closedEnquiries, icon: <CheckCircle size={24} className="text-green-500" />, color: 'green' },
                { label: `${labelPrefix} Missed`, value: stats.missed || stats.missedEnquiries, icon: <XCircle size={24} className="text-red-500" />, color: 'red' },
            ];
        }

        return [
            { label: 'Overview', value: '...', icon: <Database size={24} />, color: 'gray' }
        ];
    };

    const cards = getCards();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow">
                        <div>
                            <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{card.label}</h2>
                            <p className="text-3xl font-extrabold mt-2 text-gray-900">{card.value}</p>
                        </div>
                        <div className={`p-4 bg-${card.color}-50 rounded-lg`}>
                            {card.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Placeholder for future sections */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Recent Activity</h2>
                    <p className="text-gray-500 italic">No recent activity found.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Shortcut Links</h2>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <a href="/enquiries" className="p-3 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors">Enquiries</a>
                        {user?.role === 'ACCOUNTANT' || ['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(user?.role) ? (
                            <a href="/bookings" className="p-3 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors">Finance Bookings</a>
                        ) : (
                            <a href="/follow-ups" className="p-3 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors">Follow-ups</a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
