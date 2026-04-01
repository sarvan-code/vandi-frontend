import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import Logo from './Logo';

const CustomerSearch = ({ customers, onSearch, onSelect, onSearchTermChange, selectedCustomer, disabled, label = "Customer" }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (selectedCustomer) {
            setSearchTerm(selectedCustomer.phone);
        } else {
            setSearchTerm('');
        }
    }, [selectedCustomer]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [wrapperRef]);

    const handleInputChange = async (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (onSearchTermChange) onSearchTermChange(value);
        setIsOpen(true);
        if (value.length > 2) {
            setIsLoading(true);
            try {
                await onSearch(value);
            } finally {
                setIsLoading(false);
            }
        } 
        if (!value) {
            onSelect(null);
        }
    };

    const handleSelect = (customer) => {
        setSearchTerm(customer.phone);
        if (onSearchTermChange) onSearchTermChange(customer.phone);
        onSelect(customer);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="form-label">{label}</label>
            <div className="search-box relative">
                <Search className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                    type="text"
                    className="input-field !pl-10 !pr-10"
                    placeholder="Search by name or phone (min 3 chars)..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && searchTerm.length > 2 && setIsOpen(true)}
                    disabled={disabled}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center pointer-events-none pr-1 mb-2">
                        <Logo size={24} isAnimating={true} color="blue" />
                    </div>
                )}
            </div>

            {isOpen && !disabled && customers.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full card py-1 max-h-60 overflow-auto focus:outline-none sm:text-sm">
                    {customers.map((customer) => (
                        <li
                            key={customer.customerId}
                            className="cursor-pointer select-none relative py-2 px-3 hover:bg-[var(--accent-bg)] text-[var(--text-primary)] border-b border-[var(--border)] last:border-b-0"
                            onClick={() => handleSelect(customer)}
                        >
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{customer.fullName}</span>
                                <span className="text-[var(--text-muted)] text-xs">{customer.phone}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && !disabled && customers.length === 0 && searchTerm.length > 2 && (
                <div className="absolute z-20 mt-1 w-full card py-3 px-4 text-sm text-[var(--text-muted)]">
                    No customers found.
                </div>
            )}
        </div>
    );
};

export default CustomerSearch;
