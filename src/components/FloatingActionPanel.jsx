import React, { useState } from 'react';
import { ChevronDown, X, ChevronUp, ChevronRight, Phone, MoreVertical } from 'lucide-react';

/**
 * Reusable Floating Action Panel Component
 * Optimized for Mobile (Bottom Bar/Sheet) and Desktop (Sidebar)
 */
const FloatingActionPanel = ({ selectedItem, onClose, actions = [], title, subtitle }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!selectedItem) return null;

    const colorClasses = {
        gray: { icon: 'text-gray-600', bg: 'bg-gray-100', hover: 'hover:bg-gray-200', text: 'text-gray-700' },
        indigo: { icon: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:bg-indigo-100', text: 'text-indigo-700' },
        blue: { icon: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:bg-blue-100', text: 'text-blue-700' },
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

    // Important actions to show on the mobile bar
    const callAction = actions.find(a => a.label.toLowerCase().includes('call'));
    const primaryAction = actions.find(a => !a.label.toLowerCase().includes('call') && a.color !== 'red');

    return (
        <>
            {/* Backdrop for mobile expanded state */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden animate-fade-in"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <div className={`
                fixed transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.25)] z-[70]
                /* Mobile: Bottom position with safe area padding */
                bottom-0 left-0 right-0 border-t border-gray-200 rounded-t-[2.5rem] pb-[safe-area-inset-bottom]
                /* Desktop: Right side position */
                md:bottom-auto md:top-1/2 md:right-8 md:left-auto md:transform md:-translate-y-1/2 md:rounded-[2rem] md:border md:w-auto
                ${isExpanded
                    ? 'h-auto max-h-[85vh] w-full md:w-80'
                    : 'h-[96px] md:h-auto md:w-[84px]'
                }
            `}>

                <div className="flex flex-col h-full w-full overflow-hidden">
                    {/* Header Bar / Mobile Bottom Bar */}
                    <div
                        className={`
                            flex items-center justify-between px-6 py-5 cursor-pointer md:cursor-default
                            ${isExpanded ? 'border-b border-gray-100' : ''}
                        `}
                        onClick={() => !isExpanded && window.innerWidth < 768 && setIsExpanded(true)}
                    >
                        {/* Title Section */}
                        <div className="flex-1 min-w-0 pr-4">
                            <h3 className="text-[15px] font-black text-gray-900 truncate uppercase tracking-tighter leading-none">{title}</h3>
                            {subtitle && <p className="text-[10px] text-gray-400 truncate font-bold uppercase tracking-widest mt-1.5">{subtitle}</p>}
                        </div>

                        {/* Mobile Quick Actions (Visualized when collapsed) */}
                        {!isExpanded && (
                            <div className="flex items-center gap-3 md:hidden">
                                {callAction && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleActionClick(callAction); }}
                                        className="w-11 h-11 flex items-center justify-center rounded-2xl bg-green-50 text-green-600 shadow-sm active:scale-90 transition-transform"
                                    >
                                        <callAction.icon size={22} />
                                    </button>
                                )}
                                {primaryAction && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleActionClick(primaryAction); }}
                                        className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm active:scale-90 transition-transform"
                                    >
                                        <primaryAction.icon size={22} />
                                    </button>
                                )}
                                <div className="w-px h-8 bg-gray-100 mx-1" />
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleExpand}
                                className="p-2.5 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-2xl transition-all"
                            >
                                {isExpanded ? <ChevronDown size={24} /> : <MoreVertical size={24} />}
                            </button>

                            <button
                                onClick={handleClose}
                                className="p-2.5 text-gray-400 hover:text-red-600 bg-red-50/0 hover:bg-red-50 rounded-2xl transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Full Actions List (Visible when expanded or on desktop) */}
                    <div className={`
                        overflow-y-auto custom-scrollbar transition-all duration-300
                        ${isExpanded
                            ? 'opacity-100 p-6 space-y-3 pb-10 animate-slide-up'
                            : 'h-0 opacity-0 md:h-auto md:opacity-100 md:p-5 md:flex md:flex-col md:items-center md:space-y-6'
                        }
                    `}>
                        {/* Desktop Collapsed Toggle */}
                        {!isExpanded && (
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="hidden md:flex items-center justify-center w-14 h-14 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all hover:scale-110"
                            >
                                <ChevronRight size={32} />
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
                                        flex items-center transition-all duration-300 rounded-2xl group
                                        ${isExpanded
                                            ? `w-full p-4 gap-5 ${colors.text} hover:bg-gray-50 bg-white border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.97]`
                                            : `justify-center ${colors.icon} md:w-14 md:h-14 hover:bg-gray-100 rounded-2xl hover:scale-110`
                                        }
                                        /* Hide on mobile if collapsed */
                                        ${!isExpanded && 'hidden md:flex'}
                                    `}
                                >
                                    <div className={`
                                        flex items-center justify-center rounded-2xl transition-all
                                        ${isExpanded ? 'w-12 h-12 ' + colors.bg + ' group-hover:rotate-6' : ''}
                                    `}>
                                        <Icon size={isExpanded ? 20 : 28} className={colors.icon} />
                                    </div>
                                    {isExpanded && (
                                        <div className="flex flex-col text-left">
                                            <span className="font-extrabold text-[15px] tracking-tight">{action.label}</span>
                                            {action.title && action.title !== action.label && (
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{action.title}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}

                        {/* Desktop Collapsed Close */}
                        {!isExpanded && (
                            <button
                                onClick={handleClose}
                                className="hidden md:flex w-14 h-14 items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                            >
                                <X size={28} />
                            </button>
                        )}
                    </div>

                    {/* Mobile Drag Indicator */}
                    <div className="md:hidden flex flex-col items-center py-3 shrink-0">
                        <div className="w-14 h-1.5 bg-gray-200 rounded-full" />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slide-up {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f3f4f6; border-radius: 20px; }
            ` }} />
        </>
    );
};

export default FloatingActionPanel;
