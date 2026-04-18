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
                // A6: Mostrar aviso antes de redirecionar (evita tela branca silenciosa)
                const msg = error.response?.data?.message || 'Sua sessão expirou. Por favor, faça login novamente.';
                // Usar alert nativo pois o SnackbarProvider pode não estar disponível neste contexto
                const existing = document.getElementById('session-expired-toast');
                if (!existing) {
                    const toast = document.createElement('div');
                    toast.id = 'session-expired-toast';
                    toast.style.cssText = `
                        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                        background: #1a1a2e; color: #fff; padding: 16px 24px;
                        border-radius: 12px; z-index: 99999; font-family: sans-serif;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.4); font-size: 14px;
                        border: 1px solid #e74c3c; max-width: 400px; text-align: center;
                    `;
                    toast.innerHTML = `⚠️ ${msg}`;
                    document.body.appendChild(toast);
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                }
            }
        }
        return Promise.reject(error);
    }
);


export default api;

