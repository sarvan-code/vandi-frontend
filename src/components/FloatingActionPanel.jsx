import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

/**
 * Reusable Floating Action Panel Component
 * 
 * @param {Object} props
 * @param {Object|null} props.selectedItem - The currently selected item
 * @param {Function} props.onClose - Callback when panel is closed
 * @param {Array} props.actions - Array of action objects
 * @param {string} props.title - Optional title to display
 * @param {string} props.subtitle - Optional subtitle to display
 */
const FloatingActionPanel = ({ selectedItem, onClose, actions = [], title, subtitle }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!selectedItem) return null;

    // Color variants for action buttons
    const colorClasses = {
        gray: {
            icon: 'text-gray-600',
            hover: 'hover:bg-gray-100',
            hoverExpanded: 'hover:bg-gray-50',
            text: 'text-gray-700'
        },
        indigo: {
            icon: 'text-indigo-600',
            hover: 'hover:bg-indigo-50',
            hoverExpanded: 'hover:bg-indigo-50',
            text: 'text-indigo-700'
        },
        blue: {
            icon: 'text-blue-600',
            hover: 'hover:bg-blue-50',
            hoverExpanded: 'hover:bg-blue-50',
            text: 'text-blue-700'
        },
        red: {
            icon: 'text-red-600',
            hover: 'hover:bg-red-50',
            hoverExpanded: 'hover:bg-red-50',
            text: 'text-red-700'
        }
    };

    const handleActionClick = (action) => {
        action.onClick(selectedItem);
        onClose();
        setIsExpanded(false);
    };

    const handleClose = () => {
        onClose();
        setIsExpanded(false);
    };

    return (
        <div className={`fixed right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-14'
            }`}>
            {/* Collapsed View - Icons Only */}
            {!isExpanded ? (
                <div className="p-2 space-y-2">
                    {/* Expand Button */}
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-full flex items-center justify-center p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Expand menu"
                    >
                        <ChevronDown size={20} className="transform -rotate-90" />
                    </button>

                    <div className="border-t border-gray-200 pt-2 space-y-2">
                        {/* Action Icons */}
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            const colors = colorClasses[action.color] || colorClasses.gray;

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleActionClick(action)}
                                    className={`w-full flex items-center justify-center p-2.5 ${colors.icon} ${colors.hover} rounded-lg transition-colors`}
                                    title={action.title || action.label}
                                >
                                    <Icon size={20} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Close Button */}
                    <div className="border-t border-gray-200 pt-2">
                        <button
                            onClick={handleClose}
                            className="w-full flex items-center justify-center p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            ) : (
                /* Expanded View - Full Labels */
                <>
                    {/* Header */}
                    {(title || subtitle) && (
                        <div className="flex items-center justify-between p-3 border-b border-gray-200">
                            <div className="flex-1 min-w-0">
                                {title && (
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                        {title}
                                    </h3>
                                )}
                                {subtitle && (
                                    <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Collapse menu"
                            >
                                <ChevronDown size={20} className="transform rotate-90" />
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-2 space-y-1.5">
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            const colors = colorClasses[action.color] || colorClasses.gray;

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleActionClick(action)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${colors.text} ${colors.hoverExpanded} rounded-lg transition-colors`}
                                >
                                    <Icon size={18} className={colors.icon} />
                                    <span className="font-medium text-sm">{action.label}</span>
                                </button>
                            );
                        })}

                        <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                            <button
                                onClick={handleClose}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <X size={18} className="text-gray-400" />
                                <span className="font-medium text-sm">Close</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FloatingActionPanel;
