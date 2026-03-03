import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 4000) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'success': return 'var(--success)';
            case 'error': return 'var(--danger)';
            case 'warning': return 'var(--warning)';
            case 'info': return 'var(--accent)';
            default: return 'var(--accent)';
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'success': return 'var(--success)';
            case 'error': return 'var(--danger)';
            case 'warning': return 'var(--warning)';
            case 'info': return 'var(--accent)';
            default: return 'var(--accent)';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                className="fixed right-4 z-[9998] flex flex-col gap-2 pointer-events-none"
                style={{ bottom: 'calc(1rem + var(--safe-area-bottom))' }}
            >
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[320px] max-w-[420px] animate-fade-in"
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderLeft: `3px solid ${getBorderColor(toast.type)}`
                        }}
                    >
                        <div className="flex-shrink-0" style={{ color: getIconColor(toast.type) }}>
                            {toast.type === 'success' && <CheckCircle size={18} />}
                            {toast.type === 'error' && <AlertCircle size={18} />}
                            {toast.type === 'warning' && <AlertTriangle size={18} />}
                            {toast.type === 'info' && <Info size={18} />}
                        </div>
                        <p className="flex-grow text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {toast.message}
                        </p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
