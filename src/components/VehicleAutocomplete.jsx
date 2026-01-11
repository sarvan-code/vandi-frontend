import React, { useState, useEffect, useRef, useContext } from 'react';
import { Search, Loader, X } from 'lucide-react';
import api from '../api';
import clsx from 'clsx';
import { AuthContext } from '../context/AuthContext';

const VehicleAutocomplete = ({ value, onChange, placeholder = "Search Vehicle...", className }) => {
    const { user } = useContext(AuthContext);
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const isSelection = useRef(false);

    // Sync local state if external value changes (e.g. initial load or reset)
    useEffect(() => {
        if (value !== query) {
            setQuery(value || '');
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/cars/search', {
                params: {
                    q: searchQuery,
                    branchId: user?.branchId // Explicitly pass branch ID if needed, mainly relying on backend auto-filter
                }
            });
            setSuggestions(response.data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error fetching vehicle suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (isSelection.current) {
                isSelection.current = false;
                return;
            }

            if (query && query.length >= 2 && document.activeElement === inputRef.current) {
                fetchSuggestions(query);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (car) => {
        isSelection.current = true;
        setQuery(car.registrationNumber);
        setShowSuggestions(false);
        onChange(car);
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val); // Propagate change immediately (acts like normal input)
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className={clsx("w-full border p-2 rounded text-sm pr-8", className)}
                    placeholder={placeholder}
                    value={query}
                    onChange={handleChange}
                    onFocus={() => {
                        if (query?.length >= 2 && suggestions.length > 0) setShowSuggestions(true);
                    }}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((car) => (
                        <div
                            key={car.carId}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => handleSelect(car)}
                        >
                            <div className="font-medium text-sm text-gray-900">{car.registrationNumber || 'N/A'}</div>
                            <div className="text-xs text-gray-500">
                                {car.make} {car.model} {car.variant}
                                <span className={clsx(
                                    "ml-2 px-1.5 py-0.5 rounded-full text-[10px]",
                                    car.inventoryStatus?.toLowerCase().includes('ready') ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {car.inventoryStatus?.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VehicleAutocomplete;
