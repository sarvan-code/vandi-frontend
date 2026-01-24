import React, { useEffect, useState } from 'react';
import { subscribe } from '../utils/loadingManager';
import './Loading.css';

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
            <div className="car-loader">
                <div className="car-body">
                    <div className="car-top">
                        <div className="car-window"></div>
                        <div className="car-window rear"></div>
                    </div>
                </div>
                <div className="car-wheel rear"></div>
                <div className="car-wheel front"></div>
            </div>
            <div className="road">
                <div className="road-line"></div>
            </div>
            <div className="loading-text">LOADING...</div>
        </div>
    );
};

export default Loading;
