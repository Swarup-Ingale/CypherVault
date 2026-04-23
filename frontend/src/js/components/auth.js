// frontend/src/js/components/auth.js
import { ApiClient } from '../api/client.js';

export const AuthEngine = {
    init: () => {
        window.executeLogin = AuthEngine.executeLogin;
    },

    executeLogin: async (mode) => {
        const username = document.getElementById('username-input').value;
        const password = document.getElementById('password-input').value;
        const debugOutput = document.getElementById('auth-debugger');

        debugOutput.innerText = `[*] Initiating ${mode.toUpperCase()} authentication handshake...\n`;

        if (!username || !password) {
            debugOutput.innerText += `[ERROR] Credentials required.\n`;
            return;
        }

        // Target either the hardened or vulnerable backend route
        const endpoint = `/${mode}/auth/login`;
        
        const response = await ApiClient.request(endpoint, 'POST', { username, password });

        debugOutput.innerText += `[*] Server Response [HTTP ${response.status}]:\n${JSON.stringify(response.data, null, 2)}`;

        if (response.ok) {
            debugOutput.style.color = 'var(--accent-green)';
            debugOutput.innerText += `\n\n[ACCESS GRANTED] Identity verified.`;
        } else {
            // Flash red if the vulnerable endpoint leaks a verbose database error
            if (mode === 'vulnerable' && response.data.error && response.data.error.includes('does not exist')) {
                debugOutput.style.color = '#ff4444';
                debugOutput.innerText += `\n\n[VULNERABILITY] Verbose error allows User Enumeration.`;
            } else {
                debugOutput.style.color = '#ff4444';
                debugOutput.innerText += `\n\n[ACCESS DENIED] Invalid credentials.`;
            }
        }
    }
};

// Boot the component
document.addEventListener('DOMContentLoaded', AuthEngine.init);