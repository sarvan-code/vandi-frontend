import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { User, Save } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import CustomerForm from './CustomerForm';

const CustomerEditModal = ({ isOpen, onClose, customer, onUpdate }) => {
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (customer) {
            setFormData({ ...customer });
        }
    }, [customer, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Remove system fields and relations before sending
            const { enquiries, createdAt, updatedAt, customerId, ...dataToUpdate } = formData;
            await api.put(`/customers/${customer.customerId}`, dataToUpdate);
            showToast('Customer information updated successfully!', 'success');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error updating customer:', error);
            showToast(error.response?.data?.error || 'Error updating customer information', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const footer = (
        <div className="flex gap-4 w-full">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-all active:scale-95 border border-[var(--border)]"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="customer-edit-form"
                disabled={submitting}
                className="flex-[2] btn-primary !py-4 flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/20"
            >
                {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <><Save size={18} /> Update Information</>
                )}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Customer"
            subtitle="Update identified client information"
            icon={User}
            footer={footer}
            maxWidth="max-w-6xl"
        >
            <form id="customer-edit-form" onSubmit={handleSubmit}>
                <CustomerForm 
                    customer={formData} 
                    setCustomer={setFormData}
                />
            </form>
        </Modal>
    );
};

export default CustomerEditModal;
