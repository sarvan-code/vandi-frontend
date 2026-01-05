import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser); // Set initial state from storage for speed

                    // Fetch fresh data to get updated role/isActive status
                    const res = await api.get(`/users/${parsedUser.userId}`);
                    const freshUser = res.data;

                    // Merge with token (though token doesn't have user data, ensure we keep what's needed)
                    // Actually, just replace user state with fresh data. 
                    // Note: `login` response includes `token`. `GET /users/:id` does NOT return token.
                    // We just update the user object.

                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                } catch (error) {
                    console.error("Failed to refresh user session", error);
                    // Only logout if token is explicitly invalid (401/403)
                    // Don't logout on network errors or if user endpoint fails for other reasons
                    if (error.response?.status === 401 || error.response?.status === 403) {
                        console.log("Token invalid, logging out...");
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    } else {
                        // Keep using cached user data if refresh fails for other reasons
                        console.log("Using cached user data, refresh failed:", error.message);
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            console.error('Login failed', error);
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            await api.post('/auth/register', userData);
            return { success: true };
        } catch (error) {
            console.error('Registration failed', error);
            return { success: false, error: error.response?.data?.error || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
