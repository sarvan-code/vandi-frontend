import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { AuthContext } from './AuthContext';
import * as FALLBACK_OPTIONS from '../constants/options';

const OptionsContext = createContext();

export const useOptions = () => useContext(OptionsContext);

export const OptionsProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [options, setOptions] = useState(FALLBACK_OPTIONS);
    const [loading, setLoading] = useState(true);
    const [vehicleBrands, setVehicleBrands] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [vehicleModels, setVehicleModels] = useState([]);
    const [vehicleVariants, setVehicleVariants] = useState([]);
    const [roles, setRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [optionRelations, setOptionRelations] = useState([]);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data || []);
        } catch (error) {
            console.error("Failed to load roles", error);
        }
    };

    const fetchBranches = async () => {
        // Only fetch if super/global user or as needed by logic
        // For now, let's fetch to have them available
        try {
            const res = await api.get('/branches');
            setBranches(res.data.data || res.data || []);
        } catch (error) {
            console.error("Failed to load branches", error);
        }
    };

    const fetchOptionRelations = async () => {
        try {
            const res = await api.get('/option-relations');
            setOptionRelations(res.data || []);
        } catch (error) {
            console.error("Failed to load option relations", error);
        }
    };

    const fetchVehicles = async () => {
        try {
            const [brandsRes, typesRes, modelsRes, variantsRes] = await Promise.all([
                api.get('/vehicles/brands'),
                api.get('/vehicles/types'),
                api.get('/vehicles/models'),
                api.get('/vehicles/variants'),
            ]);
            setVehicleBrands(brandsRes.data || []);
            setVehicleTypes(typesRes.data || []);
            setVehicleModels(modelsRes.data || []);
            setVehicleVariants(variantsRes.data || []);
        } catch (error) {
            console.error("Failed to load vehicle data", error);
        }
    };

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
            fetchVehicles();
            fetchRoles();
            fetchBranches();
            fetchOptionRelations();
        } else {
            // User logged out? Reset or keep fallbacks? 
            // Maybe keep to avoid errors if partially rendering
        }
    }, [user]);

    // Helper to get formatted options for select inputs
    const getOptionList = (categoryKey) => {
        let list = [];
        if (options[categoryKey]) {
            list = options[categoryKey];
        } else if (FALLBACK_OPTIONS[categoryKey]) {
            list = FALLBACK_OPTIONS[categoryKey];
        }

        return list.map(v => typeof v === 'string' ? { value: v, label: v } : v);
    };

    // Helper to get dependent options (e.g., Follow-up Types for a specific Mode)
    // Refactored to use pre-loaded relations first
    const getDependentOptions = (category, parentCategory, parentValue) => {
        if (!parentValue) return [];

        // 1. Filter relations for the given parent
        const relatedValues = optionRelations
            .filter(r =>
                r.parentCategory === parentCategory &&
                r.parentValue === parentValue &&
                r.childCategory === category
            )
            .map(r => r.childValue);

        if (relatedValues.length > 0) {
            // 2. Map to actual option objects { value, label } from the pre-loaded options map
            const categoryOptions = getOptionList(category);
            return categoryOptions.filter(opt => relatedValues.includes(opt.value));
        }

        return [];
    };

    return (
        <OptionsContext.Provider value={{
            options,
            loading,
            getOptionList,
            getDependentOptions,
            refreshOptions: fetchOptions,
            vehicleBrands,
            vehicleTypes,
            vehicleModels,
            vehicleVariants,
            refreshVehicles: fetchVehicles,
            roles,
            refreshRoles: fetchRoles,
            branches,
            refreshBranches: fetchBranches,
            optionRelations,
            refreshOptionRelations: fetchOptionRelations
        }}>
            {children}
        </OptionsContext.Provider>
    );
};
