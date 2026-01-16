import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Modal from './Modal';

// Timeouts in milliseconds
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 Minutes
const WARNING_DURATION = 60 * 1000;  // 1 Minute warning before logout

const IdleMonitor = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const [isIdle, setIsIdle] = useState(false);
    const [remainingTime, setRemainingTime] = useState(WARNING_DURATION / 1000);
    const idleTimerRef = useRef(null);
    const warningIntervalRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // Reset timer on user activity
    const resetTimer = () => {
        if (!user) return;

        lastActivityRef.current = Date.now();

        if (isIdle) {
            setIsIdle(false);
            setRemainingTime(WARNING_DURATION / 1000);
            clearInterval(warningIntervalRef.current);
        }

        clearTimeout(idleTimerRef.current);

        // Set timer for the "Warning" phase (Total Timeout - Warning Duration)
        idleTimerRef.current = setTimeout(() => {
            setIsIdle(true);
            startWarningCountdown();
        }, IDLE_TIMEOUT - WARNING_DURATION);
    };

    const startWarningCountdown = () => {
        setRemainingTime(WARNING_DURATION / 1000);

        // Clear any existing interval to be safe
        if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);

        warningIntervalRef.current = setInterval(() => {
            setRemainingTime((prev) => Math.max(0, prev - 1));
        }, 1000);
    };

    // Watch for timeout completion
    useEffect(() => {
        if (remainingTime === 0 && isIdle) {
            handleLogout();
        }
    }, [remainingTime, isIdle]);

    const handleLogout = () => {
        clearInterval(warningIntervalRef.current);
        clearTimeout(idleTimerRef.current);
        setIsIdle(false);
        logout();
        // Optional: Force redirect or show a "Session Expired" message on login page
    };

    const handleStayLoggedIn = () => {
        resetTimer();
    };

    useEffect(() => {
        if (!user) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        // Attach listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            clearTimeout(idleTimerRef.current);
            clearInterval(warningIntervalRef.current);
        };
    }, [user, location.pathname]); // Re-attach if user logs in or route changes

    if (!user) return children;

    return (
        <>
            {children}

            <Modal
                isOpen={isIdle}
                onClose={() => { }} // Disable closing by clicking outside/esc logic handled by buttons
                title="Session Expiring"
                width="max-w-md"
            >
                <div className="p-4">
                    <p className="text-gray-600 mb-6">
                        You have been idle for a while. For security, your session will end in <span className="font-bold text-red-600">{remainingTime}</span> seconds.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                        >
                            Logout Now
                        </button>
                        <button
                            onClick={handleStayLoggedIn}
                            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                        >
                            Stay Logged In
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default IdleMonitor;
