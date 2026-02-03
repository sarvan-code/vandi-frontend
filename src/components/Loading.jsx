import React, { useEffect, useState } from 'react';
import { subscribe } from '../utils/loadingManager';
import './Loading.css';
import Logo from './Logo';

const Loading = () => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribe((isActive) => {
            setIsLoading(isActive);
        });
        return () => unsubscribe();
    }, []);

    if (!isLoading) return null;

    return (
        <div className="loading-overlay">
            <Logo size={120} />
            <div className="road">
                <div className="road-line"></div>
            </div>
            <div className="loading-text">LOADING...</div>
        </div>
    );
};

export default Loading;
