import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = process.env.REACT_APP_API_URL || (isLocal ? 'http://localhost:3001/api' : '/api');
export const BASE_URL = isLocal ? 'http://localhost:3001' : ''; // URL base sem /api para uploads

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 segundos — evita requests travados indefinidamente
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado ou inválido — só redireciona se não estiver já na tela de login
            const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
            if (!isLoginPage) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

