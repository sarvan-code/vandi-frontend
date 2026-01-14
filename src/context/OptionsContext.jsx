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

    const fetchBootstrapData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get('/auth/bootstrap');
            const data = res.data;

            // 1. Process Options
            const rawOptions = data.options || [];
            const grouped = rawOptions.reduce((acc, item) => {
                if (!acc[item.category]) acc[item.category] = [];
                acc[item.category].push({ value: item.value, label: item.label });
                return acc;
            }, {});
            setOptions(prev => ({ ...prev, ...grouped }));

            // 2. Process Other Metadata
            setBranches(data.branches || []);
            setRoles(data.roles || []);
            setOptionRelations(data.relations || []);

            // 3. Process Vehicles
            if (data.vehicles) {
                setVehicleBrands(data.vehicles.brands || []);
                setVehicleTypes(data.vehicles.types || []);
                setVehicleModels(data.vehicles.models || []);
                setVehicleVariants(data.vehicles.variants || []);
            }
        } catch (error) {
            console.error("Failed to load bootstrap data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBootstrapData();
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
            refreshOptions: fetchBootstrapData,
            vehicleBrands,
            vehicleTypes,
            vehicleModels,
            vehicleVariants,
            refreshVehicles: fetchBootstrapData,
            roles,
            refreshRoles: fetchBootstrapData,
            branches,
            refreshBranches: fetchBootstrapData,
            optionRelations,
            refreshOptionRelations: fetchBootstrapData
        }}>
            {children}
        </OptionsContext.Provider>
    );
};
