import React, { useState, useEffect } from 'react';
import { Plus, X, Briefcase, ChevronDown, ChevronRight } from 'lucide-react';
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
        return saved ? JSON.parse(saved) : [{ id: 1, title: 'New Lead', key: Date.now() }];
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
            const { enquiryId, customerId, phone, branchId } = preloadedEnquiry;

            // Check if this enquiry is already open in a tab
            const existingTab = tabs.find(tab => tab.enquiryId === enquiryId);

            if (existingTab) {
                // Switch to existing tab
                setActiveTabId(existingTab.id);
            } else {
                // Create new tab with pre-loaded data
                const newId = Date.now();
                const newTab = {
                    id: newId,
                    title: `Enquiry #${enquiryId.slice(0, 8)}`,
                    key: newId,
                    enquiryId,
                    customerId,
                    phone,
                    branchId
                };
                setTabs([...tabs, newTab]);
                setActiveTabId(newId);
            }

            // Clear the preloaded enquiry from context
            clearPreloadedEnquiry();
        }
    }, [preloadedEnquiry]);

    // ---- Handlers ----
    const addTab = () => {
        const newId = Date.now();
        const newTab = { id: newId, title: 'New Lead', key: newId };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
    };

    const closeTab = (e, id) => {
        e.stopPropagation(); // Prevent activating the tab when closing
        if (tabs.length === 1) {
            // Don't close the last tab, maybe just reset it?
            // For now, let's allow closing and recreate a blank one if empty?
            // Better: Reset last tab
            const newId = Date.now();
            setTabs([{ id: newId, title: 'New Lead', key: newId }]);
            setActiveTabId(newId);
            return;
        }

        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);

        // If we closed the active tab, switch to the last one
        if (id === activeTabId) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const handleLeadSaved = (tabId) => {
        // setLeadModal({ show: false, lead: null }); // Assuming this would be defined elsewhere if needed
        // fetchLeads(); // Assuming this would be defined elsewhere if needed
        showToast("Lead Processed Successfully!", "success");
        // Close the tab on success
        if (tabs.length === 1) {
            // Reset if it's the only one
            const newId = Date.now();
            setTabs([{ id: newId, title: 'New Lead', key: newId }]);
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
        <div className={clsx(
            "fixed bottom-0 right-4 z-[9997] bg-white shadow-2xl rounded-t-xl border border-gray-300 transition-all duration-300 flex flex-col overflow-hidden",
            isMinimized ? "h-12 w-80" : "h-[85vh] w-[95vw] lg:w-[80vw] xl:w-[70vw]"
        )}>
            {/* Header / Tab Bar */}
            <div className="bg-indigo-700 text-white flex items-center px-2 pt-1 gap-1 overflow-x-auto shrink-0 cursor-default" onClick={(e) => isMinimized && onMinimize()}>
                <div className="flex items-center gap-2 font-bold px-3 py-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); onMinimize(); }}>
                    <Briefcase className="h-5 w-5" />
                    <span className="hidden sm:inline">Lead Workspace</span>
                </div>

                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`
                            group flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer border-t border-l border-r min-w-[120px] justify-between transition-colors
                            ${activeTabId === tab.id ? 'bg-white text-indigo-700 font-bold' : 'bg-indigo-800/50 text-indigo-100 hover:bg-indigo-600'}
                        `}
                    >
                        <span className="truncate max-w-[100px]">{tab.title}</span>
                        <button
                            onClick={(e) => closeTab(e, tab.id)}
                            className={`p-0.5 rounded-full hover:bg-red-500 hover:text-white ${activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}

                <button
                    onClick={addTab}
                    className="ml-1 p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                    title="New Tab"
                >
                    <Plus className="h-5 w-5" />
                </button>

                <div className="ml-auto flex items-center gap-1 pr-2">
                    <button onClick={onMinimize} className="p-2 hover:bg-white/10 rounded-lg text-white" title={isMinimized ? "Restore" : "Minimize"}>
                        {isMinimized ? <ChevronRight className="h-5 w-5 rotate-[-90deg]" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-red-500 rounded-lg text-white" title="Close Workspace">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative p-4">
                {tabs.map(tab => (
                    <div
                        key={tab.key}
                        className={`absolute inset-0 p-4 transition-opacity duration-200 ${activeTabId === tab.id ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
                        // Use CSS display: none for true isolation if z-index isn't enough to prevent focus/clicks
                        style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                    >
                        {/* 
                            We pass a unique key to force remount ONLY if explicit reset needed, 
                            but here we want persistence so we map based on state. 
                            If we wanted form caching even after refresh, LeadForm needs to read/write to localstorage itself 
                            or we pass initialData from a lifted state.
                            
                            For this iteration (Basic Persistence), the React State inside LeadForm survives 
                            as long as this component is mounted. And since we map `tabs`, they correspond to 
                            mounted instances hidden via CSS. 
                            
                            (Crash Recovery Note): To assist crash recovery, LeadForm should ideally sync changes up 
                            or save to a specific localStorage key based on Tab ID.
                        */}
                        <div className="bg-white rounded-xl shadow-lg h-full overflow-hidden flex flex-col border border-gray-200">
                            <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-400">Lead ID: {tab.id}</span>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <LeadForm
                                    tabId={tab.id}
                                    preloadedEnquiryId={tab.enquiryId}
                                    preloadedCustomerId={tab.customerId}
                                    preloadedPhone={tab.phone}
                                    preloadedBranchId={tab.branchId}
                                    onSave={() => handleLeadSaved(tab.id)}
                                    onCancel={(e) => closeTab(e, tab.id)}
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
