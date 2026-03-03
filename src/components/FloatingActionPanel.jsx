import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, ChevronRight, MoreVertical } from 'lucide-react';

/**
 * Reusable Floating Action Panel Component
 * Optimized for Mobile (Bottom Bar/Sheet) and Desktop (Sidebar)
 */
const FloatingActionPanel = ({ selectedItem, onClose, actions = [], title, subtitle }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!selectedItem) {
            return;
        }

        const updatePadding = () => {
            const mainElem = document.querySelector('main');
            if (mainElem) {
                // Determine layout transitions based on breakpoints
                if (window.innerWidth >= 768) {
                    mainElem.style.paddingRight = isExpanded ? '340px' : '90px';
                    mainElem.style.paddingBottom = '';
                } else {
                    mainElem.style.paddingRight = '';
                    mainElem.style.paddingBottom = isExpanded ? '85vh' : '90px';
                }
            }
        };

        updatePadding();
        window.addEventListener('resize', updatePadding);

        return () => {
            window.removeEventListener('resize', updatePadding);
            const mainElem = document.querySelector('main');
            if (mainElem) {
                mainElem.style.paddingRight = '';
                mainElem.style.paddingBottom = '';
            }
        };
    }, [isExpanded, selectedItem]);

    if (!selectedItem) return null;

    const colorClasses = {
        gray: { icon: 'text-gray-600', bg: 'bg-gray-100', hover: 'hover:bg-gray-200', text: 'text-gray-700' },
        blue: { icon: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:bg-blue-100', text: 'text-blue-700' },
        indigo: { icon: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:bg-blue-100', text: 'text-blue-700' },
        red: { icon: 'text-red-600', bg: 'bg-red-50', hover: 'hover:bg-red-100', text: 'text-red-700' },
        green: { icon: 'text-green-600', bg: 'bg-green-50', hover: 'hover:bg-green-100', text: 'text-green-700' }
    };

    const handleActionClick = (action) => {
        action.onClick(selectedItem);
        onClose();
        setIsExpanded(false);
    };

    const handleClose = (e) => {
        e.stopPropagation();
        onClose();
        setIsExpanded(false);
    };

    const toggleExpand = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const callAction = actions.find(a => a.label.toLowerCase().includes('call'));
    const workspaceAction = actions.find(a => a.label.toLowerCase().includes('workspace'));
    const editAction = actions.find(a => a.label.toLowerCase().includes('edit'));
    const primaryAction = actions.find(a => !a.label.toLowerCase().includes('call') && !a.label.toLowerCase().includes('workspace') && a.color !== 'red');

    const barIcons = [];
    if (callAction) barIcons.push(callAction);
    if (workspaceAction) barIcons.push(workspaceAction);
    if (editAction) barIcons.push(editAction);
    if (barIcons.length < 3 && primaryAction) barIcons.push(primaryAction);

    return createPortal(
        <>
            {/* Backdrop for mobile expanded */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-[60] md:hidden animate-fade-in"
                    style={{ background: 'var(--overlay)' }}
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <div
                style={{
                    paddingBottom: 'var(--safe-area-bottom)',
                    height: isExpanded ? 'auto' : (window.innerWidth < 768 ? 'calc(64px + var(--safe-area-bottom))' : 'auto'),
                    background: 'var(--surface)',
                    borderColor: 'var(--border)'
                }}
                className={`
                    fixed transition-all duration-300 z-[70]
                    bottom-0 left-0 right-0 border-t rounded-t-xl
                    md:bottom-auto md:top-1/2 md:right-4 md:left-auto md:transform md:-translate-y-1/2 md:rounded-lg md:border md:w-auto
                    shadow-lg
                    ${isExpanded ? 'max-h-[85vh] w-full md:w-80' : 'md:w-[56px] md:h-auto'}
                `}
            >
                <div className="flex flex-col h-full w-full overflow-hidden">
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer md:cursor-default"
                        style={isExpanded ? { borderBottom: '1px solid var(--border)' } : {}}
                        onClick={() => !isExpanded && window.innerWidth < 768 && setIsExpanded(true)}
                    >
                        <div className={`flex-1 min-w-0 pr-4 ${!isExpanded ? 'hidden' : ''}`}>
                            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                            {subtitle && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
                        </div>

                        {/* Mobile Quick Actions */}
                        {!isExpanded && (
                            <div className="flex items-center gap-2 md:hidden">
                                {barIcons.map((action, i) => {
                                    const Icon = action.icon;
                                    const colors = colorClasses[action.color] || colorClasses.gray;
                                    return (
                                        <button
                                            key={i}
                                            onClick={(e) => { e.stopPropagation(); handleActionClick(action); }}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg ${colors.bg} ${colors.icon} active:scale-95 transition-all`}
                                        >
                                            <Icon size={18} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Controls */}
                        <div className={`flex items-center gap-2 ${!isExpanded ? 'md:hidden' : ''}`}>
                            <button
                                onClick={toggleExpand}
                                className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {isExpanded ? <ChevronDown size={18} className="md:rotate-90" /> : <MoreVertical size={18} />}
                            </button>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-md hover:bg-[var(--danger-bg)] transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Full Actions List */}
                    <div className={`
                        overflow-y-auto custom-scrollbar transition-all duration-300
                        ${isExpanded
                            ? 'opacity-100 p-3 space-y-1 pb-8 h-auto max-h-[75vh]'
                            : 'h-0 opacity-0 md:h-auto md:opacity-100 md:p-2 md:flex md:flex-col md:items-center md:space-y-1'
                        }
                    `}>
                        {/* Desktop Collapsed Expand */}
                        {!isExpanded && (
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="hidden md:flex items-center justify-center w-10 h-10 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                                style={{ color: 'var(--accent)' }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        )}

                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            const colors = colorClasses[action.color] || colorClasses.gray;

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleActionClick(action)}
                                    className={`
                                        flex items-center transition-colors rounded-md group
                                        ${isExpanded
                                            ? `w-full px-3 py-2.5 gap-3 hover:bg-[var(--bg-tertiary)]`
                                            : `justify-center ${colors.icon} md:w-10 md:h-10 hover:bg-[var(--bg-tertiary)] rounded-md`
                                        }
                                        ${!isExpanded && 'hidden md:flex'}
                                    `}
                                >
                                    <div className={`flex items-center justify-center ${isExpanded ? 'w-9 h-9 rounded-md ' + colors.bg : ''}`}>
                                        <Icon size={isExpanded ? 16 : 18} className={colors.icon} />
                                    </div>
                                    {isExpanded && (
                                        <div className="flex flex-col text-left">
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                                            {action.title && action.title !== action.label && (
                                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{action.title}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}

                        {/* Desktop Close */}
                        {!isExpanded && (
                            <>
                                <div className="w-8 hidden md:block" style={{ height: '1px', background: 'var(--border)', margin: '4px auto' }} />
                                <button
                                    onClick={handleClose}
                                    className="hidden md:flex w-10 h-10 items-center justify-center rounded-md hover:bg-[var(--danger-bg)] transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <X size={18} />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="md:hidden flex flex-col items-center py-2 shrink-0">
                        <div className="w-12 h-1 rounded-full" style={{ background: 'var(--border)' }} />
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default FloatingActionPanel;
