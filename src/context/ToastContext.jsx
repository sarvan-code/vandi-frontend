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

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto
                            flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border min-w-[300px]
                            animate-fade-in-right transform transition-all duration-300
                            ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
                            ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : ''}
                            ${toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : ''}
                            ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
                        `}
                    >
                        <div className="flex-shrink-0">
                            {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-500" />}
                            {toast.type === 'error' && <AlertCircle size={20} className="text-rose-500" />}
                            {toast.type === 'warning' && <AlertTriangle size={20} className="text-amber-500" />}
                            {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
                        </div>
                        <div className="flex-grow text-sm font-medium">
                            {toast.message}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
