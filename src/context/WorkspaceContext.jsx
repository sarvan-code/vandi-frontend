import React, { createContext, useContext, useState } from 'react';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within WorkspaceProvider');
    }
    return context;
};

export const WorkspaceProvider = ({ children }) => {
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
    const [isWorkspaceMinimized, setIsWorkspaceMinimized] = useState(false);
    const [preloadedEnquiry, setPreloadedEnquiry] = useState(null);

    const openWorkspace = () => {
        setIsWorkspaceOpen(true);
        setIsWorkspaceMinimized(false);
    };

    const openWorkspaceWithEnquiry = (enquiryId, customerId, phone) => {
        setPreloadedEnquiry({ enquiryId, customerId, phone });
        setIsWorkspaceOpen(true);
        setIsWorkspaceMinimized(false);
    };

    const closeWorkspace = () => {
        setIsWorkspaceOpen(false);
        setPreloadedEnquiry(null);
    };

    const toggleMinimize = () => {
        setIsWorkspaceMinimized(!isWorkspaceMinimized);
    };

    const clearPreloadedEnquiry = () => {
        setPreloadedEnquiry(null);
    };

    return (
        <WorkspaceContext.Provider value={{
            isWorkspaceOpen,
            isWorkspaceMinimized,
            preloadedEnquiry,
            openWorkspace,
            openWorkspaceWithEnquiry,
            closeWorkspace,
            toggleMinimize,
            clearPreloadedEnquiry
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
};
