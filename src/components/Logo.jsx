import React from 'react';
import './Logo.css';

/**
 * Reusable Animated Car Logo Component
 * @param {number} size - The width of the logo (aspect ratio 120:50)
 * @param {string} color - Optional color class ('red' or default blue)
 * @param {string} className - Additional CSS classes
 * @param {boolean} animateOnHover - Whether to speed up animation on hover
 * @param {boolean} isAnimating - Whether to speed up animation permanently
 */
const Logo = ({ size = 120, color = '', className = '', animateOnHover = false, isAnimating = false }) => {
    // Base width is 120px
    const scale = size / 120;

    return (
        <div
            className={`car-loader-wrapper ${color} ${animateOnHover ? 'logo-animate-hover' : ''} ${isAnimating ? 'logo-animating' : ''} ${className}`}
            style={{ '--logo-scale': scale }}
        >
            <div className="car-body">
                <div className="car-top">
                    <div className="car-window"></div>
                    <div className="car-window rear"></div>
                </div>
            </div>
            <div className="car-wheel rear"></div>
            <div className="car-wheel front"></div>
        </div>
    );
};

export default Logo;
