import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', variant = 'danger' }) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'text-red-600',
            iconBg: 'bg-red-100',
            button: 'bg-red-600 hover:bg-red-700'
        },
        warning: {
            icon: 'text-yellow-600',
            iconBg: 'bg-yellow-100',
            button: 'bg-yellow-600 hover:bg-yellow-700'
        }
    };

    const styles = variantStyles[variant] || variantStyles.danger;

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 transition-opacity"
                    style={{ background: 'var(--overlay)' }}
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom card p-0 text-left overflow-hidden shadow-lg transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-fade-in">
                    <div className="px-6 pt-6 pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg ${styles.iconBg} sm:mx-0`}>
                                <AlertTriangle className={`h-6 w-6 ${styles.icon}`} aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }} id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {message}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    <div
                        className="px-6 sm:flex sm:flex-row-reverse gap-3"
                        style={{
                            background: 'var(--bg-tertiary)',
                            borderTop: '1px solid var(--border)',
                            paddingTop: '1rem',
                            paddingBottom: 'calc(1rem + var(--safe-area-bottom))'
                        }}
                    >
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${styles.button} sm:w-auto`}
                        >
                            {confirmText}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center items-center btn-secondary sm:mt-0 sm:w-auto"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmDialog;
