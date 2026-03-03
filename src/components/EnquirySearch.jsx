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
            <label className="form-label">Enquiry</label>
            <div className="search-box">
                <Search className="search-icon" />
                <input
                    type="text"
                    className="input-field pl-10"
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
                <ul className="absolute z-20 mt-1 w-full card py-1 max-h-60 overflow-auto focus:outline-none sm:text-sm">
                    {filteredEnquiries.map((enquiry) => (
                        <li
                            key={enquiry.enquiryId}
                            className="cursor-pointer select-none relative py-2 px-3 hover:bg-[var(--accent-bg)] text-[var(--text-primary)] border-b border-[var(--border)] last:border-b-0"
                            onClick={() => handleSelect(enquiry)}
                        >
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{enquiry.carDetailsDescription || 'General Enquiry'}</span>
                                <span className="text-[var(--text-muted)] text-xs">
                                    Status: {enquiry.status} | Date: {new Date(enquiry.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && !disabled && filteredEnquiries.length === 0 && (
                <div className="absolute z-20 mt-1 w-full card py-3 px-4 text-sm text-[var(--text-muted)]">
                    No matching enquiries found.
                </div>
            )}
        </div>
    );
};

export default EnquirySearch;
