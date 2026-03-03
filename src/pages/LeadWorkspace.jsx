import React, { useState, useEffect } from 'react';
import { Plus, X, Briefcase, ChevronDown, ChevronRight, Layout } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../context/ToastContext';
import LeadForm from '../components/LeadForm';
import { useWorkspace } from '../context/WorkspaceContext';

const LeadWorkspace = ({ isMinimized, onMinimize, onClose }) => {
    const { showToast } = useToast();
    // ---- State ----
    // Tabs Array: { id: number, title: string, key: number }
    const [tabs, setTabs] = useState(() => {
        const saved = localStorage.getItem('vandi_lead_tabs');
        return saved ? JSON.parse(saved) : [{ id: 1, title: 'New Enquiry', key: Date.now() }];
    });

    const { preloadedEnquiry, clearPreloadedEnquiry } = useWorkspace();
    const [activeTabId, setActiveTabId] = useState(() => {
        const saved = localStorage.getItem('vandi_active_tab');
        return saved ? Number(saved) : 1;
    });

    // ---- Effects ----
    useEffect(() => {
        localStorage.setItem('vandi_lead_tabs', JSON.stringify(tabs));
    }, [tabs]);

    useEffect(() => {
        localStorage.setItem('vandi_active_tab', activeTabId);
    }, [activeTabId]);

    // Handle pre-loaded enquiry from context
    useEffect(() => {
        if (preloadedEnquiry) {
            const { enquiryId, customerId, phone, branchId, fullEnquiryData } = preloadedEnquiry;

            // Check if this enquiry is already open in a tab
            const existingTab = tabs.find(tab => tab.enquiryId === enquiryId);

            if (existingTab) {
                // Switch to existing tab
                setActiveTabId(existingTab.id);
            } else {
                // Determine if we can reuse the currently active tab
                const currentActiveTab = tabs.find(t => t.id === activeTabId);
                let canReuseActiveTab = false;

                if (currentActiveTab && (!currentActiveTab.enquiryId && !currentActiveTab.customerId && !currentActiveTab.phone)) {
                    // It's a "New Enquiry" tab. Check if user started typing (has localStorage data)
                    const savedDataStr = localStorage.getItem(`vandi_lead_form_${activeTabId}`);
                    if (!savedDataStr) {
                        canReuseActiveTab = true;
                    } else {
                        try {
                            const savedData = JSON.parse(savedDataStr);
                            const hasCustomerData = savedData?.customer?.fullName || savedData?.customer?.phone;
                            const hasEnquiryCars = savedData?.enquiry?.carDetails?.length > 0;
                            if (!hasCustomerData && !hasEnquiryCars) {
                                canReuseActiveTab = true;
                            }
                        } catch (e) {
                            // If parse fails, assume it's corrupted and re-usable
                            canReuseActiveTab = true;
                        }
                    }
                }

                const customerName = fullEnquiryData?.customer?.fullName;
                const tabTitle = customerName || `Enquiry #${enquiryId.slice(0, 8)}`;

                if (canReuseActiveTab) {
                    // Update existing active tab with pre-loaded data
                    setTabs(prev => prev.map(t => t.id === activeTabId ? {
                        ...t,
                        title: tabTitle,
                        enquiryId,
                        customerId,
                        phone,
                        branchId,
                        fullEnquiryData: fullEnquiryData || null
                    } : t));
                } else {
                    // Create new tab with pre-loaded data
                    const newId = Date.now();
                    const newTab = {
                        id: newId,
                        title: tabTitle,
                        key: newId,
                        enquiryId,
                        customerId,
                        phone,
                        branchId,
                        fullEnquiryData: fullEnquiryData || null
                    };
                    setTabs([...tabs, newTab]);
                    setActiveTabId(newId);
                }
            }

            // Clear the preloaded enquiry from context
            clearPreloadedEnquiry();
        }
    }, [preloadedEnquiry]);

    // ---- Handlers ----
    const addTab = () => {
        const newId = Date.now();
        const newTab = { id: newId, title: 'New Enquiry', key: newId };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
    };

    const closeTab = (e, id) => {
        e.stopPropagation();
        // Cleanup localStorage for this tab
        localStorage.removeItem(`vandi_lead_form_${id}`);

        if (tabs.length === 1) {
            const newId = Date.now();
            setTabs([{ id: newId, title: 'New Enquiry', key: newId }]);
            setActiveTabId(newId);
            return;
        }

        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);

        if (id === activeTabId) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const handleUpdateTabTitle = (tabId, title) => {
        if (!title) return;
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title } : t));
    };

    const handleTabEmpty = (tabId) => {
        // Search API returned no results for this tab's enquiry — close it and clean up
        localStorage.removeItem(`vandi_lead_form_${tabId}`);
        showToast("Lead data not found. The tab has been closed.", "warning");
        if (tabs.length === 1) {
            const newId = Date.now();
            setTabs([{ id: newId, title: 'New Enquiry', key: newId }]);
            setActiveTabId(newId);
        } else {
            const newTabs = tabs.filter(t => t.id !== tabId);
            setTabs(newTabs);
            if (tabId === activeTabId) {
                setActiveTabId(newTabs[newTabs.length - 1].id);
            }
        }
    };

    const handleLeadSaved = (tabId) => {
        showToast("Lead Processed Successfully!", "success");
        // Cleanup localStorage
        localStorage.removeItem(`vandi_lead_form_${tabId}`);

        if (tabs.length === 1) {
            const newId = Date.now();
            setTabs([{ id: newId, title: 'New Enquiry', key: newId }]);
            setActiveTabId(newId);
        } else {
            const newTabs = tabs.filter(t => t.id !== tabId);
            setTabs(newTabs);
            if (tabId === activeTabId) {
                setActiveTabId(newTabs[newTabs.length - 1].id);
            }
        }
    };

    return (
        <div
            style={{ paddingBottom: 'var(--safe-area-bottom)', bottom: 'var(--safe-area-bottom)' }}
            className={clsx(
                "fixed right-8 z-[9997] transition-all duration-500 flex flex-col overflow-hidden shadow-2xl border",
                "bg-[var(--bg-primary)] border-[var(--border)]",
                isMinimized ? "h-14 w-80 rounded-t-xl" : "h-[88vh] w-[95vw] lg:w-[85vw] xl:w-[75vw] rounded-t-2xl"
            )}
        >
            {/* Header / Tab Bar */}
            <div
                className="bg-[var(--bg-tertiary)] flex items-center px-4 pt-3 gap-1 overflow-x-auto shrink-0 cursor-default border-b border-[var(--border)]"
                onClick={(e) => isMinimized && onMinimize()}
            >
                <div
                    className="flex items-center gap-3 font-bold text-[10px] uppercase tracking-[0.2em] px-4 py-2 cursor-pointer select-none"
                    onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                >
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105">
                        <Briefcase className="h-4 w-4" />
                    </div>
                </div>

                <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar ml-4">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={clsx(
                                "group flex items-center gap-3 px-5 py-2.5 rounded-t-lg cursor-pointer min-w-[140px] max-w-[200px] justify-between transition-all relative border-t border-x",
                                activeTabId === tab.id
                                    ? 'bg-[var(--bg-primary)] font-bold border-[var(--border)] z-10'
                                    : 'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-secondary)]'
                            )}
                        >
                            <span className={clsx("truncate text-[10px] uppercase tracking-wider font-bold transition-colors", activeTabId === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]')}>{tab.title}</span>
                            <button
                                onClick={(e) => closeTab(e, tab.id)}
                                className={clsx(
                                    "p-1 rounded-md transition-all",
                                    activeTabId === tab.id
                                        ? 'hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 opacity-100'
                                        : 'opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-tertiary)]'
                                )}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addTab}
                    className="mx-3 p-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--accent)] hover:bg-[var(--bg-tertiary)] transition-all active:scale-90 shadow-sm"
                    title="New Enquiry"
                >
                    <Plus className="h-5 w-5" />
                </button>

                <div className="ml-auto flex items-center gap-1 pr-2 border-l border-[var(--border)] pl-2">
                    <button
                        onClick={onMinimize}
                        className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] transition-colors"
                        title={isMinimized ? "Restore" : "Minimize"}
                    >
                        {isMinimized ? <Layout className="h-4 w-4" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-colors"
                        title="Close Workspace"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Area — always mounted to preserve state when minimized */}
            <div className="flex-1 overflow-hidden relative bg-[var(--bg-primary)]">
                {tabs.map(tab => (
                    <div
                        key={tab.key}
                        className={clsx(
                            "absolute inset-0 transition-opacity duration-300",
                            activeTabId === tab.id ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                        )}
                        style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                    >
                        <div className="h-full overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                                <LeadForm
                                    tabId={tab.id}
                                    preloadedEnquiryId={tab.enquiryId}
                                    preloadedCustomerId={tab.customerId}
                                    preloadedPhone={tab.phone}
                                    preloadedBranchId={tab.branchId}
                                    preloadedFullData={tab.fullEnquiryData}
                                    onSave={() => handleLeadSaved(tab.id)}
                                    onCancel={(e) => closeTab(e, tab.id)}
                                    onTitleUpdate={(title) => handleUpdateTabTitle(tab.id, title)}
                                    onTabEmpty={() => handleTabEmpty(tab.id)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default LeadWorkspace;
