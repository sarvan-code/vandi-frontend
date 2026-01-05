import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const CustomerSearch = ({ customers, onSearch, onSelect, selectedCustomer, disabled }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (selectedCustomer) {
            setSearchTerm(selectedCustomer.fullName);
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

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setIsOpen(true);
        if (value.length > 2) {
            onSearch(value);
        } else {
            // Optional: Clear results if input is too short
            // onSearch(''); 
        }
        if (!value) {
            onSelect(null);
        }
    };

    const handleSelect = (customer) => {
        setSearchTerm(customer.fullName);
        onSelect(customer);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Search by name or phone (min 3 chars)..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && searchTerm.length > 2 && setIsOpen(true)}
                    disabled={disabled}
                />
            </div>

            {isOpen && !disabled && customers.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {customers.map((customer) => (
                        <li
                            key={customer.customerId}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 text-gray-900"
                            onClick={() => handleSelect(customer)}
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{customer.fullName}</span>
                                <span className="text-gray-500 text-xs">{customer.phone}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && !disabled && customers.length === 0 && searchTerm.length > 2 && (
                <div className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-gray-500">
                    No customers found.
                </div>
            )}
        </div>
    );
};

export default CustomerSearch;
