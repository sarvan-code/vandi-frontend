import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon: Icon,
    children,
    footer,
    maxWidth = 'max-w-xl'
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen p-4 text-center">
                <div
                    className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm animate-fade-in"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* This element is to trick the browser into centering the modal contents. */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className={`relative z-10 inline-block align-middle bg-[var(--surface)] w-full ${maxWidth} rounded-[2rem] shadow-2xl border border-[var(--border)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-left`}>
                    {/* Header */}
                    <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-secondary)]/30 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-4" id="modal-title">
                                {Icon && (
                                    <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center text-[var(--accent)]">
                                        <Icon size={20} />
                                    </div>
                                )}
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-[10px] font-bold mt-2 uppercase tracking-[0.3em] text-[var(--accent)] opacity-60">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-[var(--bg-secondary)] rounded-2xl transition-all"
                        >
                            <X size={24} className="text-[var(--text-muted)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div
                            className="px-8 bg-[var(--bg-secondary)]/30 border-t border-[var(--border)] flex justify-end gap-6"
                            style={{
                                paddingTop: '2rem',
                                paddingBottom: 'calc(2rem + var(--safe-area-bottom))'
                            }}
                        >
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
