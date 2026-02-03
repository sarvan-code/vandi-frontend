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
    const workspaceAction = actions.find(a => a.label.toLowerCase().includes('workspace'));
    const editAction = actions.find(a => a.label.toLowerCase().includes('edit'));
    const primaryAction = actions.find(a => !a.label.toLowerCase().includes('call') && !a.label.toLowerCase().includes('workspace') && a.color !== 'red');

    // Final icons to display in the collapsed bottom bar
    const barIcons = [];
    if (callAction) barIcons.push(callAction);
    if (workspaceAction) barIcons.push(workspaceAction);
    if (editAction) barIcons.push(editAction);
    if (barIcons.length < 3 && primaryAction) barIcons.push(primaryAction);

    return (
        <>
            {/* Backdrop for mobile expanded state */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden animate-fade-in"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <div
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    height: isExpanded ? 'auto' : (window.innerWidth < 768 ? 'calc(72px + env(safe-area-inset-bottom, 0px))' : 'auto')
                }}
                className={`
                    fixed transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.25)] z-[70]
                    /* Mobile: Bottom position */
                    bottom-0 left-0 right-0 border-t border-gray-200 rounded-t-[2.5rem]
                    /* Desktop: Right side position */
                    md:bottom-auto md:top-1/2 md:right-6 md:left-auto md:transform md:-translate-y-1/2 md:rounded-[2rem] md:border md:w-auto
                    ${isExpanded ? 'max-h-[80vh] w-full md:w-80' : 'md:w-[64px] md:h-auto'}
                `}
            >

                <div className="flex flex-col h-full w-full overflow-hidden">
                    {/* Header Bar / Mobile Bottom Bar */}
                    <div
                        className={`
                            flex items-center justify-between px-5 py-3 cursor-pointer md:cursor-default
                            ${isExpanded ? 'border-b border-gray-100' : 'md:border-none'}
                        `}
                        onClick={() => !isExpanded && window.innerWidth < 768 && setIsExpanded(true)}
                    >
                        {/* Title Section - Only visible when expanded */}
                        <div className={`flex-1 min-w-0 pr-4 transition-all duration-300 ${!isExpanded ? 'hidden' : 'opacity-100'}`}>
                            <h3 className="text-[14px] font-black text-gray-900 truncate uppercase tracking-tighter leading-none">{title}</h3>
                            {subtitle && <p className="text-[10px] text-gray-400 truncate font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
                        </div>

                        {/* Mobile Quick Actions (Visualized when collapsed) */}
                        {!isExpanded && (
                            <div className="flex items-center gap-2 md:hidden">
                                {barIcons.map((action, i) => {
                                    const Icon = action.icon;
                                    const colors = colorClasses[action.color] || colorClasses.gray;
                                    return (
                                        <button
                                            key={i}
                                            onClick={(e) => { e.stopPropagation(); handleActionClick(action); }}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl ${colors.bg} ${colors.icon} shadow-sm active:scale-90 transition-transform`}
                                        >
                                            <Icon size={20} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Controls */}
                        <div className={`flex items-center gap-2 ${!isExpanded && 'md:flex-col md:w-full md:py-1'}`}>
                            <button
                                onClick={toggleExpand}
                                className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-all"
                            >
                                {isExpanded ? <ChevronDown size={22} className="md:rotate-90" /> : <MoreVertical size={22} />}
                            </button>

                            <button
                                onClick={handleClose}
                                className="p-2 text-gray-400 hover:text-red-600 bg-red-50/0 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <X size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Full Actions List / Desktop Vertical Icons */}
                    <div className={`
                        overflow-y-auto custom-scrollbar transition-all duration-300
                        ${isExpanded
                            ? 'opacity-100 p-5 space-y-2 pb-12 animate-slide-up h-auto max-h-[70vh]'
                            : 'h-0 opacity-0 md:h-auto md:opacity-100 md:p-2 md:flex md:flex-col md:items-center md:space-y-2'
                        }
                    `}>

                        {/* Desktop Collapsed Toggle */}
                        {!isExpanded && (
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="hidden md:flex items-center justify-center w-11 h-11 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all hover:scale-110"
                            >
                                <ChevronRight size={24} />
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
                                        flex items-center transition-all duration-300 rounded-xl group
                                        ${isExpanded
                                            ? `w-full p-3 gap-4 ${colors.text} hover:bg-gray-50 bg-white border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.97]`
                                            : `justify-center ${colors.icon} md:w-11 md:h-11 hover:bg-gray-100 rounded-xl hover:scale-110`
                                        }
                                        /* Hide on mobile if collapsed */
                                        ${!isExpanded && 'hidden md:flex'}
                                    `}
                                >
                                    <div className={`
                                        flex items-center justify-center rounded-xl transition-all
                                        ${isExpanded ? 'w-10 h-10 ' + colors.bg + ' group-hover:rotate-6' : ''}
                                    `}>
                                        <Icon size={isExpanded ? 18 : 24} className={colors.icon} />
                                    </div>
                                    {isExpanded && (
                                        <div className="flex flex-col text-left">
                                            <span className="font-extrabold text-[14px] tracking-tight leading-tight">{action.label}</span>
                                            {action.title && action.title !== action.label && (
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{action.title}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}

                        {/* Desktop Collapsed Close (Thinner) */}
                        {!isExpanded && (
                            <div className="w-8 h-px bg-gray-100 my-1 hidden md:block" />
                        )}
                        {!isExpanded && (
                            <button
                                onClick={handleClose}
                                className="hidden md:flex w-11 h-11 items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                            >
                                <X size={22} />
                            </button>
                        )}
                    </div>

                    {/* Mobile Drag Indicator */}
                    <div className="md:hidden flex flex-col items-center py-2 shrink-0">
                        <div className="w-12 h-1 bg-gray-200 rounded-full" />
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
