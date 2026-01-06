import React, { useState, useEffect } from 'react';
import { Edit, Trash } from 'lucide-react';
import api from '../api';
import Table from '../components/Table';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Users = () => {
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roles, setRoles] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, user: null });

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [page, pageSize]);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get(`/users?page=${page}&pageSize=${pageSize}`);
            if (response.data.data && response.data.meta) {
                setUsers(response.data.data);
                setTotalPages(response.data.meta.totalPages);
                setTotalUsers(response.data.meta.total);
            } else {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // alert('Failed to fetch users');
        }
    };

    const handleEdit = (user) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (user) => {
        setDeleteConfirm({ isOpen: true, user });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.user) return;
        try {
            await api.delete(`/users/${deleteConfirm.user.userId}`);
            showToast("User deleted successfully", "success");
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user", error);
            showToast("Failed to delete user", "error");
        } finally {
            setDeleteConfirm({ isOpen: false, user: null });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentUser.userId) {
                await api.put(`/users/${currentUser.userId}`, currentUser);
            } else {
                await api.post('/users', currentUser);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            showToast('Failed to save user', 'error');
        }
    };

    const columns = [
        { key: 'fullName', label: 'Name' },
        { key: 'email', label: 'Email' },
        {
            key: 'role', label: 'Role', render: (row) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${['APP_OWNER', 'SYS_ADMIN', 'DEV'].includes(row.role) ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {row.role}
                </span>
            )
        },
        {
            key: 'userStatus', label: 'Status', render: (row) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.userStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    row.userStatus === 'NEW' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {row.userStatus}
                </span>
            )
        },
        {
            key: 'actions', label: 'Actions', render: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded-md text-sm border border-blue-200"
                        title="Edit User"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row);
                        }}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded-md text-sm border border-red-200"
                        title="Delete User"
                    >
                        <Trash size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Users</h1>
                <button
                    onClick={() => { setCurrentUser({}); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Add User
                </button>
            </div>

            <Table columns={columns} data={users} />

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalUsers)}</span> of{' '}
                            <span className="font-medium">{totalUsers}</span> results
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <label htmlFor="pageSize" className="mr-2 text-sm text-gray-700">Rows per page:</label>
                            <select
                                id="pageSize"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1); // Reset to first page on size change
                                }}
                                className="block w-full rounded-md border-gray-300 py-1.5 text-base leading-5 text-gray-900 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100"
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100"
                            >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentUser?.userId ? 'Edit User' : 'Add User'}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={currentUser?.fullName || ''}
                            onChange={(e) => setCurrentUser({ ...currentUser, fullName: e.target.value })}
                            required
                            minLength={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={currentUser?.email || ''}
                            onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-700"
                            value={currentUser?.role || 'AUTH_USER'}
                            onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                        >
                            {roles.map(role => (
                                <option key={role.code} value={role.code}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={currentUser?.userStatus || 'NEW'}
                            onChange={(e) => setCurrentUser({ ...currentUser, userStatus: e.target.value })}
                        >
                            <option value="NEW">NEW</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                        </select>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, user: null })}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you sure you want to delete "${deleteConfirm.user?.fullName}"? All their assigned follow-ups will also be deleted. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

export default Users;
