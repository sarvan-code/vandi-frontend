import axios from 'axios';
import { showLoading, hideLoading } from '../utils/loadingManager';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
    showLoading();
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    hideLoading();
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        hideLoading();
        return response;
    },
    (error) => {
        hideLoading();
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
