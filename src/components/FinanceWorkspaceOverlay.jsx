import React from 'react';
import { IndianRupee, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
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
            className={clsx(
                "fixed z-[9997] shadow-2xl rounded-t-xl border transition-all duration-300 flex flex-col overflow-hidden",
                "bg-[var(--surface)] border-[var(--border)]",
                isFinanceMinimized 
                    ? "h-12 w-72 sm:w-80 right-4 bottom-[var(--safe-area-bottom)]" 
                    : "h-[85vh] w-[98vw] sm:w-[95vw] lg:w-[80vw] xl:w-[70vw] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 bottom-[var(--safe-area-bottom)]"
            )}
            style={{ paddingBottom: 'var(--safe-area-bottom)' }}
        >
            {/* Header / Tab Bar */}
            <div
                className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] flex items-center px-1 pt-1 shrink-0 cursor-default border-b"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => isFinanceMinimized && toggleFinanceMinimize()}
            >
                {/* Fixed Title Section */}
                <div
                    className="flex items-center gap-2 font-bold px-3 py-2 cursor-pointer text-[var(--accent)] shrink-0"
                    onClick={(e) => { e.stopPropagation(); toggleFinanceMinimize(); }}
                >
                    <IndianRupee className="h-5 w-5" />
                    <span className="hidden md:inline uppercase tracking-widest text-[10px]">Finance Workspace</span>
                </div>

                {/* Scrollable Tabs Section */}
                <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {financeTabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => openFinanceTab(tab.enquiryId, tab.title)}
                            className={clsx(
                                "group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg cursor-pointer border-t border-l border-r min-w-[100px] sm:min-w-[120px] justify-between transition-colors shrink-0",
                                activeTabId === tab.id
                                    ? 'bg-[var(--bg-primary)] text-[var(--accent)] font-bold border-[var(--border)]'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                            )}
                            style={{ borderBottom: activeTabId === tab.id ? '1px solid var(--bg-primary)' : '1px solid var(--border)', marginBottom: '-1px' }}
                        >
                            <span className="truncate max-w-[80px] sm:max-w-[100px] text-[10px] sm:text-xs">{tab.title}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeFinanceTab(tab.id);
                                }}
                                className={clsx(
                                    "p-0.5 rounded-full hover:bg-rose-500 hover:text-white transition-opacity",
                                    activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                )}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Fixed Actions Section */}
                <div className="flex items-center gap-1 pr-2 shrink-0 bg-[var(--bg-tertiary)]">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleFinanceMinimize(); }}
                        className="p-1.5 sm:p-2 hover:bg-[var(--accent)]/10 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)]"
                        title={isFinanceMinimized ? "Restore" : "Minimize"}
                    >
                        {isFinanceMinimized ? <ChevronRight className="h-5 w-5 rotate-[-90deg]" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); closeFinanceWorkspace(); }}
                        className="p-1.5 sm:p-2 hover:bg-rose-500 rounded-lg text-[var(--text-muted)] hover:text-white"
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
                        key={tab.id}
                        className={clsx(
                            "absolute inset-0 p-4 transition-opacity duration-200 bg-[var(--bg-primary)]",
                            activeTabId === tab.id ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                        )}
                        style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                    >
                        <div className="h-full overflow-auto pr-2 custom-scrollbar">
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
