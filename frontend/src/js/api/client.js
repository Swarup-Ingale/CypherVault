// frontend/src/js/api/client.js

const API_BASE = 'http://localhost:5000/api';

export const ApiClient = {
    // Helper to extract the Double-Submit Cookie
    getCsrfToken: () => {
        const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
        return match ? match[2] : null;
    },

    // Centralized fetch wrapper
    request: async (endpoint, method = 'GET', body = null) => {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        // Inject CSRF token for state-changing requests
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
            const token = ApiClient.getCsrfToken();
            if (token) {
                headers['x-csrf-token'] = token;
            } else {
                console.warn('[Security] No CSRF token found in cookies. Request may be rejected.');
            }
        }

        const config = {
            method,
            headers,
            credentials: 'include' // Crucial for sending/receiving cookies cross-origin
        };

        if (body) config.body = JSON.stringify(body);

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            const data = await response.json();
            return { status: response.status, ok: response.ok, data };
        } catch (error) {
            console.error('[Network Fault]', error);
            return { status: 500, ok: false, data: { error: 'Network communication failed.' } };
        }
    }
};