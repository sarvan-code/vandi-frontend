import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const EnquirySearch = ({ enquiries, onSelect, selectedEnquiry, disabled }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (selectedEnquiry) {
            setSearchTerm(`${selectedEnquiry.carDetailsDescription || 'Enquiry'} - ${selectedEnquiry.status}`);
        } else {
            setSearchTerm('');
        }
    }, [selectedEnquiry]);

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

    const handleSelect = (enquiry) => {
        setSearchTerm(`${enquiry.carDetailsDescription || 'Enquiry'} - ${enquiry.status}`);
        onSelect(enquiry);
        setIsOpen(false);
    };

    // Filter locally since we are passing a specific list of enquiries for a customer
    const filteredEnquiries = enquiries.filter(enquiry =>
        (enquiry.carDetailsDescription && enquiry.carDetailsDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
        enquiry.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Select an enquiry..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        if (!e.target.value) onSelect(null);
                    }}
                    onFocus={() => !disabled && setIsOpen(true)}
                    disabled={disabled}
                />
            </div>

            {isOpen && !disabled && filteredEnquiries.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {filteredEnquiries.map((enquiry) => (
                        <li
                            key={enquiry.enquiryId}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 text-gray-900 border-b last:border-b-0"
                            onClick={() => handleSelect(enquiry)}
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{enquiry.carDetailsDescription || 'General Enquiry'}</span>
                                <span className="text-gray-500 text-xs">
                                    Status: {enquiry.status} | Date: {new Date(enquiry.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && !disabled && filteredEnquiries.length === 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-gray-500">
                    No matching enquiries found.
                </div>
            )}
        </div>
    );
};

export default EnquirySearch;
