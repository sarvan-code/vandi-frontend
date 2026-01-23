import React, { createContext, useContext, useState, useEffect } from 'react';

const FinanceWorkspaceContext = createContext();

export const useFinanceWorkspace = () => {
    const context = useContext(FinanceWorkspaceContext);
    if (!context) {
        throw new Error('useFinanceWorkspace must be used within FinanceWorkspaceProvider');
    }
    return context;
};

export const FinanceWorkspaceProvider = ({ children }) => {
    const [isFinanceOpen, setIsFinanceOpen] = useState(false);
    const [isFinanceMinimized, setIsFinanceMinimized] = useState(false);
    const [financeTabs, setFinanceTabs] = useState(() => {
        const saved = localStorage.getItem('vandi_finance_tabs');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeTabId, setActiveTabId] = useState(() => {
        const saved = localStorage.getItem('vandi_active_finance_tab');
        return saved ? Number(saved) : null;
    });

    useEffect(() => {
        localStorage.setItem('vandi_finance_tabs', JSON.stringify(financeTabs));
    }, [financeTabs]);

    useEffect(() => {
        if (activeTabId) {
            localStorage.setItem('vandi_active_finance_tab', activeTabId);
        }
    }, [activeTabId]);

    const openFinanceTab = (enquiryId, title) => {
        const existingTab = financeTabs.find(tab => tab.enquiryId === enquiryId);
        if (existingTab) {
            setActiveTabId(existingTab.id);
        } else {
            const newId = Date.now();
            const newTab = { id: newId, enquiryId, title, key: newId };
            setFinanceTabs([...financeTabs, newTab]);
            setActiveTabId(newId);
        }
        setIsFinanceOpen(true);
        setIsFinanceMinimized(false);
    };

    const closeFinanceTab = (tabId) => {
        const newTabs = financeTabs.filter(t => t.id !== tabId);
        setFinanceTabs(newTabs);

        if (newTabs.length === 0) {
            setIsFinanceOpen(false);
            setActiveTabId(null);
            localStorage.removeItem('vandi_active_finance_tab');
        } else if (tabId === activeTabId) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const toggleFinanceMinimize = () => {
        setIsFinanceMinimized(!isFinanceMinimized);
    };

    const closeFinanceWorkspace = () => {
        setIsFinanceOpen(false);
        // We keep the tabs for persistence unless user explicitly closes them
    };

    return (
        <FinanceWorkspaceContext.Provider value={{
            isFinanceOpen,
            isFinanceMinimized,
            financeTabs,
            activeTabId,
            openFinanceTab,
            closeFinanceTab,
            toggleFinanceMinimize,
            closeFinanceWorkspace
        }}>
            {children}
        </FinanceWorkspaceContext.Provider>
    );
};
