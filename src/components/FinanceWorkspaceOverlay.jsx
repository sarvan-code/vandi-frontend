import React from 'react';
import { DollarSign, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useFinanceWorkspace } from '../context/FinanceWorkspaceContext';
import FinanceWorkspaceContent from './FinanceWorkspaceContent';

const FinanceWorkspaceOverlay = () => {
    const {
        isFinanceOpen,
        isFinanceMinimized,
        financeTabs,
        activeTabId,
        openFinanceTab,
        closeFinanceTab,
        toggleFinanceMinimize,
        closeFinanceWorkspace
    } = useFinanceWorkspace();

    if (!isFinanceOpen || financeTabs.length === 0) return null;

    const activeTab = financeTabs.find(tab => tab.id === activeTabId) || financeTabs[0];

    return (
        <div
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            className={clsx(
                "fixed bottom-0 right-4 z-[9997] bg-white shadow-2xl rounded-t-xl border border-gray-300 transition-all duration-300 flex flex-col overflow-hidden",
                isFinanceMinimized ? "h-12 w-80" : "h-[85vh] w-[95vw] lg:w-[80vw] xl:w-[70vw]"
            )}
        >
            {/* Header / Tab Bar */}
            <div
                className="bg-indigo-700 text-white flex items-center px-2 pt-1 gap-1 overflow-x-auto shrink-0 cursor-default"
                onClick={() => isFinanceMinimized && toggleFinanceMinimize()}
            >
                <div
                    className="flex items-center gap-2 font-bold px-3 py-2 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); toggleFinanceMinimize(); }}
                >
                    <DollarSign className="h-5 w-5" />
                    <span className="hidden sm:inline">Finance Workspace</span>
                </div>

                {financeTabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => openFinanceTab(tab.enquiryId, tab.title)}
                        className={clsx(
                            "group flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer border-t border-l border-r min-w-[120px] justify-between transition-colors",
                            activeTabId === tab.id ? 'bg-white text-indigo-700 font-bold' : 'bg-indigo-800/50 text-indigo-100 hover:bg-indigo-600'
                        )}
                    >
                        <span className="truncate max-w-[100px] text-xs">{tab.title}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeFinanceTab(tab.id);
                            }}
                            className={clsx(
                                "p-0.5 rounded-full hover:bg-red-500 hover:text-white transition-opacity",
                                activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            )}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}

                <div className="ml-auto flex items-center gap-1 pr-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleFinanceMinimize(); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-white"
                        title={isFinanceMinimized ? "Restore" : "Minimize"}
                    >
                        {isFinanceMinimized ? <ChevronRight className="h-5 w-5 rotate-[-90deg]" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); closeFinanceWorkspace(); }}
                        className="p-2 hover:bg-red-500 rounded-lg text-white"
                        title="Close Overlay"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative p-4">
                {financeTabs.map(tab => (
                    <div
                        key={tab.key}
                        className={clsx(
                            "absolute inset-0 p-4 transition-opacity duration-200 bg-white",
                            activeTabId === tab.id ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                        )}
                        style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                    >
                        <div className="h-full overflow-auto pr-2 no-scrollbar">
                            <FinanceWorkspaceContent
                                enquiryId={tab.enquiryId}
                                tabId={tab.id}
                                onComplete={closeFinanceTab}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FinanceWorkspaceOverlay;
