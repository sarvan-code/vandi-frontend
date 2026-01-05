import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { AuthContext } from './AuthContext';
import * as FALLBACK_OPTIONS from '../constants/options';

const OptionsContext = createContext();

export const useOptions = () => useContext(OptionsContext);

export const OptionsProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [options, setOptions] = useState(FALLBACK_OPTIONS); // Init with fallbacks
    const [loading, setLoading] = useState(true);

    const fetchOptions = async () => {
        if (!user) return; // Don't fetch if not logged in

        try {
            const res = await api.get('/options');
            // Transform flat list to category map
            // Server returns array of { category, value, label }
            // We want { CATEGORY_NAME: [{ value, label }, ...] }

            const raw = res.data || [];
            if (raw.length === 0) {
                // Keep fallbacks if DB empty
                setLoading(false);
                return;
            }

            const grouped = raw.reduce((acc, item) => {
                // Ensure category key exists
                if (!acc[item.category]) {
                    acc[item.category] = [];
                }
                acc[item.category].push({ value: item.value, label: item.label });
                return acc;
            }, {});

            // Merge with fallbacks to ensure usage safety if DB incomplete
            setOptions(prev => ({ ...prev, ...grouped }));
        } catch (error) {
            console.error("Failed to load dynamic options", error);
            // Fallback options already set
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOptions();
        } else {
            // User logged out? Reset or keep fallbacks? 
            // Maybe keep to avoid errors if partially rendering
        }
    }, [user]);

    // Helper to get formatted options for select inputs
    const getOptionList = (categoryKey) => {
        if (options[categoryKey]) {
            return options[categoryKey];
        }
        // If passed key not found but exists in fallback as simple array strings (legacy)
        // Convert string array to object array
        if (FALLBACK_OPTIONS[categoryKey]) {
            return FALLBACK_OPTIONS[categoryKey].map(v => typeof v === 'string' ? { value: v, label: v } : v);
        }
        return [];
    };

    return (
        <OptionsContext.Provider value={{ options, loading, getOptionList, refreshOptions: fetchOptions }}>
            {children}
        </OptionsContext.Provider>
    );
};
