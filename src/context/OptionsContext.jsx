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
    const getDependentOptions = async (category, parentCategory, parentValue) => {
        if (!parentValue) return [];
        try {
            const res = await api.get('/options', {
                params: { category, parentCategory, parentValue }
            });
            return res.data || [];
        } catch (error) {
            console.error(`Failed to fetch dependent options for ${category}`, error);
            return [];
        }
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
            refreshVehicles: fetchVehicles
        }}>
            {children}
        </OptionsContext.Provider>
    );
};
