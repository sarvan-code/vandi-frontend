import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';
import Logo from './Logo';

const VehicleAutocomplete = ({ value = '', onChange, placeholder = 'Search vehicles...', className = '' }) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const timeoutRef = useRef(null);

    // Sync internal query with external value prop
    useEffect(() => {
        setQuery(value);
    }, [value]);

    const fetchSuggestions = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setLoading(true);
        try {
            // Updated to use 'q' as per server implementation
            const res = await api.get(`/cars/search?q=${encodeURIComponent(searchQuery)}`, { hideLoader: true });
            setSuggestions(res.data || []);
            setShowSuggestions(true);
        } catch (err) {
            console.error('Vehicle search error:', err);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        // Important: notify parent on typing too if they want to manage state
        if (onChange) {
            // We pass a partial object or just the string if that's what's expected
            // Based on LeadForm usage: value={followUp.car?.registrationNumber || ''}
            // and onChange={(car) => setFollowUp({ ...followUp, car: car || null })}
            // LeadForm expects an OBJECT on select, but on typing it might just want the string.
            // However, usually we only notify on actual SELECT for the object.
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => fetchSuggestions(val), 300);
    };

    const handleSelect = (car) => {
        // Build display string using 'make' or fallback to 'brand'
        const brand = car.make || car.brand || '';
        const display = car.registrationNumber || `${brand} ${car.model || ''} ${car.variant || ''}`.trim();

        setQuery(display);
        setShowSuggestions(false);
        if (onChange) onChange(car);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className={clsx("input-field w-full !pl-10 !pr-10 py-2.5", className)}
                    placeholder={placeholder}
                    value={query}
                    onChange={handleChange}
                    onFocus={() => {
                        if (query?.length >= 2 && suggestions.length > 0) setShowSuggestions(true);
                    }}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]">
                    <Search size={16} />
                </div>
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center pointer-events-none pr-1 mb-2">
                        <Logo size={24} isAnimating={true} color="blue" />
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 card overflow-hidden animate-fade-in shadow-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {suggestions.map((car, idx) => (
                            <div
                                key={car.carId || car.id || idx}
                                onClick={() => handleSelect(car)}
                                className="px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)] border-b last:border-b-0"
                                style={{ borderColor: 'var(--border)' }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {car.registrationNumber || `${car.make || car.brand || ''} ${car.model || ''}`.trim()}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
                                            {[
                                                car.make || car.brand,
                                                car.model,
                                                car.variant
                                            ].filter(Boolean).join(' • ')}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] uppercase tracking-tighter">
                                        {car.maximumRetailPrice - (car.discountAmount ? car.discountAmount : 0) || 'Available'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleAutocomplete;
