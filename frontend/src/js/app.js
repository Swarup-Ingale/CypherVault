// ==========================================
// CLOUD API ROUTING
// ==========================================
// When you deploy, comment out localhost and uncomment the Render URL
const API_BASE = 'https://cyphervault-api.onrender.com/api'; // Replace with your actual Render URL later

// Helper Function: Write to the cinematic terminals
function logToTerminal(terminalId, text, type = 'normal') {
    const term = document.getElementById(terminalId);
    if (!term) return;
    const p = document.createElement('p');
    p.className = 'term-line';
    if (type === 'error') p.style.color = '#ff4444';
    else if (type === 'success') p.style.color = 'var(--accent-green)';
    else if (type === 'warning') p.style.color = '#ffbd2e';
    p.innerText = text;
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
}

// Helper Function: Retrieve CSRF Token (UPDATED TO MATCH BACKEND NAME)
function getCSRFToken() {
    // We now look explicitly for the "XSRF-TOKEN" set by csrfGuard.ts
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    return match ? match[2] : 'cyphervault-dev-token-8675309'; 
}

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // SECURITY PUZZLE & LOGOUT LOGIC
    // ==========================================
    const currentPage = window.location.pathname.toLowerCase();
    const isProtectedPage = currentPage.includes('dashboard') || currentPage.includes('list.html');

    // Lockdown Check
    if (isProtectedPage && !sessionStorage.getItem('cypher_clearance')) {
        document.body.innerHTML = `
            <div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #05080c; font-family: 'JetBrains Mono', monospace; text-align: center;">
                <h1 style="font-size: 3.5rem; color: #ff4444; text-shadow: 0 0 20px rgba(255, 68, 68, 0.6); margin-bottom: 10px;">[!] ACCESS DENIED</h1>
                <p style="font-size: 1.2rem; color: #a9b7c6; margin-bottom: 5px;">Unauthorized zone entry detected.</p>
                <p style="font-size: 1.2rem; color: #a9b7c6;">Clearance token not found in active session.</p>
                <div style="margin-top: 30px; width: 40px; height: 40px; border: 3px solid rgba(255,68,68,0.2); border-top-color: #ff4444; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 20px; color: #ffbd2e;">Rerouting to Auth Matrix...</p>
                <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
            </div>
        `;
        setTimeout(() => { window.location.href = '../profile/login.html'; }, 3500);
        return; 
    }

    // Terminate Session Button Logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('cypher_clearance');
            document.body.innerHTML = `
                <div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #05080c; font-family: 'JetBrains Mono', monospace; text-align: center;">
                    <h1 style="font-size: 2.5rem; color: var(--accent-green); margin-bottom: 10px;">[ SESSION TERMINATED ]</h1>
                    <p style="color: #a9b7c6;">Local cache cleared. Disconnecting from mainframe...</p>
                </div>
            `;
            setTimeout(() => { window.location.href = '../../../index.html'; }, 1500);
        });
    }

    // ==========================================
    // PAGE 1: LOGIN (AUTH MATRIX)
    // ==========================================
    const secureLoginBtn = document.getElementById('secure-login');
    const exploitLoginBtn = document.getElementById('exploit-login');

    if (secureLoginBtn && exploitLoginBtn) {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        const handleAuth = async (isSecure) => {
            const username = usernameInput.value;
            const password = passwordInput.value;
            const endpoint = isSecure ? '/secure/auth/login' : '/vulnerable/auth/login';
            const modeName = isSecure ? 'SECURE' : 'VULNERABLE';

            logToTerminal('auth-debugger', `\n[*] Initiating ${modeName} authentication handshake...`, 'warning');

            try {
                const response = await fetch(`${API_BASE}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCSRFToken() },
                    credentials: 'include',
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                
                setTimeout(() => {
                    logToTerminal('auth-debugger', `[*] Server Response [HTTP ${response.status}]:`);
                    logToTerminal('auth-debugger', JSON.stringify(data, null, 2));

                    if (response.ok) {
                        sessionStorage.setItem('cypher_clearance', 'GRANTED_LEVEL_9');
                        logToTerminal('auth-debugger', `[ACCESS GRANTED] Clearance token generated. Redirecting...`, 'success');
                        setTimeout(() => window.location.href = '../dashboard/dashboard.html', 1500);
                    } else {
                        logToTerminal('auth-debugger', `[ACCESS DENIED] Auth failed.`, 'error');
                    }
                }, 600);
            } catch (err) {
                logToTerminal('auth-debugger', `[CRITICAL] Network failure: ${err.message}`, 'error');
            }
        };
        secureLoginBtn.addEventListener('click', () => handleAuth(true));
        exploitLoginBtn.addEventListener('click', () => handleAuth(false));
    }

    // ==========================================
    // PAGE 2: DASHBOARD
    // ==========================================
    const executeSecureBtn = document.getElementById('execute-secure');
    const executeVulnBtn = document.getElementById('execute-vulnerable');

    if (executeSecureBtn && executeVulnBtn) {
        const targetIdInput = document.getElementById('target-id');
        const updateIntel = (data) => {
            document.getElementById('intel-hostname').innerText = data.name || data.hostname || '---';
            document.getElementById('intel-os').innerText = data.os || data.os_type || '---';
            document.getElementById('intel-difficulty').innerText = data.difficulty || '---';
            document.getElementById('intel-points').innerText = data.points || '---';
        };

        const handleExtraction = async (isSecure) => {
            const targetId = targetIdInput.value;
            const endpoint = isSecure ? '/secure/machines/profile' : '/vulnerable/machines/profile';
            const modeName = isSecure ? 'SECURE' : 'VULNERABLE';

            updateIntel({});
            logToTerminal('debugger-output', `\n[*] Executing ${modeName} extraction for Target ID: ${targetId}...`, 'warning');

            try {
                const response = await fetch(`${API_BASE}${endpoint}?id=${targetId}`, {
                    headers: { 'x-csrf-token': getCSRFToken() },
                    credentials: 'include'
                });
                const data = await response.json();

                setTimeout(() => {
                    logToTerminal('debugger-output', `[*] Server Response [HTTP ${response.status}]:`);
                    logToTerminal('debugger-output', JSON.stringify(data, null, 2));

                    const machineData = data.data || data.machine;

                    if (response.ok && machineData && !Array.isArray(machineData)) {
                        logToTerminal('debugger-output', `[+] Intel successfully parsed.`, 'success');
                        updateIntel(machineData);
                    } else if (response.ok && (Array.isArray(data) || Array.isArray(machineData))) {
                        logToTerminal('debugger-output', `[!] DATA BLEED DETECTED: Multiple records returned!`, 'error');
                        const arr = Array.isArray(data) ? data : machineData;
                        if(arr.length > 0) updateIntel(arr[0]); 
                    } else {
                        logToTerminal('debugger-output', `[-] Extraction failed. Target may not exist.`, 'error');
                    }
                }, 500);
            } catch (err) {
                logToTerminal('debugger-output', `[CRITICAL] Network failure: ${err.message}`, 'error');
            }
        };
        executeSecureBtn.addEventListener('click', () => handleExtraction(true));
        executeVulnBtn.addEventListener('click', () => handleExtraction(false));
    }

    // ==========================================
    // PAGE 3: TARGET ROSTER (LIST) - NETWORK SWEEP BYPASS
    // ==========================================
    const rosterList = document.getElementById('roster-grid');
    if (rosterList) {
        logToTerminal('roster-debugger', '[*] Establishing secure uplink to central database...', 'warning');
        logToTerminal('roster-debugger', '[*] Initiating deep sector scan for active targets...');

        // Helper to ping the known-working profile route
        const fetchTarget = async (id) => {
            try {
                const res = await fetch(`${API_BASE}/secure/machines/profile?id=${id}`, {
                    headers: { 'x-csrf-token': getCSRFToken() },
                    credentials: 'include'
                });
                const data = await res.json();
                return data.data || data.machine; // Handle both possible JSON structures
            } catch (e) {
                return null;
            }
        };

        // The Scanner Loop
        // The Dynamic Scanner Loop
        const scanNetwork = async () => {
            let foundCount = 0;
            let consecutiveMisses = 0;
            let currentId = 1;
            
            // SECURITY PARAMETER: Stop scanning after 3 empty sectors in a row
            const MAX_MISSES = 3; 

            // Scan infinitely until we hit the dead zone limit
            while (consecutiveMisses < MAX_MISSES) {
                
                // Cinematic 400ms delay between pings
                await new Promise(resolve => setTimeout(resolve, 400));

                const machine = await fetchTarget(currentId);

                // If we found a valid machine...
                if (machine && !Array.isArray(machine) && (machine.name || machine.hostname)) {
                    
                    consecutiveMisses = 0; // SUCCESS! Reset the miss counter.
                    foundCount++;
                    
                    const mName = machine.name || machine.hostname || 'UNKNOWN';
                    const mOS = machine.os || machine.os_type || 'UNKNOWN';

                    logToTerminal('roster-debugger', `[+] Port open. Extracted Node: ${mName} [${mOS}]`, 'success');

                    // Build and inject the Machine Card
                    const card = document.createElement('div');
                    card.className = 'machine-card fade-in-up';
                    card.innerHTML = `
                        <h3 class="glitch-glow" style="margin-top:0;">${mName}</h3>
                        <div class="data-label">OS: <span class="data-value">${mOS}</span></div>
                        <div class="data-label">Difficulty: <span class="data-value">${machine.difficulty || '---'}</span></div>
                        <div class="data-label" style="margin-top: 10px;">TARGET ID: <span class="data-value" style="color: var(--accent-green);">#${currentId}</span></div>
                    `;
                    rosterList.appendChild(card);
                    
                } else {
                    // DEAD ZONE DETECTED: Increment the miss counter
                    consecutiveMisses++;
                    logToTerminal('roster-debugger', `> Ping timeout on sector ${currentId}. No node detected. (Miss ${consecutiveMisses}/${MAX_MISSES})`, 'error');
                }
                
                currentId++; // Move to the next ID and repeat
            }

            logToTerminal('roster-debugger', `\n[*] Sector scan complete. Reached network edge. Total targets acquired: ${foundCount}`, 'warning');
        };

        // Execute the sweep
        scanNetwork();
    }
}); // End of DOMContentLoaded

// ==========================================
// VIRTUAL INTELLIGENCE CORE (AI CHATBOT)
// ==========================================
(function initializeAICore() {
    // 1. Inject the HTML into the page dynamically
    const chatHTML = `
        <div class="cyber-chatbot-widget">
            <div class="chatbot-window" id="chatbot-window">
                <div class="chat-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="status-indicator active" style="width: 8px; height: 8px;"></span>
                        <span style="color: var(--accent-green); font-weight: bold; font-size: 0.9rem;">S.W.A.L.E. AI</span>
                    </div>
                    <span class="close-chat" id="close-chat">&times;</span>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="chat-msg msg-bot">System assistant online. State your query, Operator. Type 'help' for commands.</div>
                </div>
                <div class="chat-input">
                    <span style="color: var(--accent-green); margin-right: 10px;">></span>
                    <input type="text" id="ai-input" autocomplete="off" placeholder="Enter command...">
                </div>
            </div>
            <div class="chatbot-toggle" id="chatbot-toggle">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L22 7.77V16.22L12 22L2 16.22V7.77L12 2ZM12 4.3L4 8.9V15.1L12 19.7L20 15.1V8.9L12 4.3ZM11 10H13V14H11V10ZM11 15H13V17H11V15Z"/>
                </svg>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('close-chat');
    const chatWindow = document.getElementById('chatbot-window');
    const chatInput = document.getElementById('ai-input');
    const chatMessages = document.getElementById('chat-messages');

    // ==========================================
    // PERSISTENT MEMORY MODULE
    // ==========================================
    // Load existing history from session storage, or start empty
    let conversationHistory = JSON.parse(sessionStorage.getItem('oracle_memory')) || [];

    // Render historical messages so they stay on screen after page loads
    conversationHistory.forEach(msg => {
        addMessageToDOM(msg.text, msg.role);
    });

    // 3. UI Toggles
    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.add('active');
        toggleBtn.style.display = 'none';
        chatInput.focus();
        chatMessages.scrollTop = chatMessages.scrollHeight; 
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
        setTimeout(() => { toggleBtn.style.display = 'flex'; }, 300);
    });

    // 4. Message DOM Handling
    function addMessageToDOM(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender === 'user' ? 'msg-user' : 'msg-bot'}`;
        msgDiv.innerText = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; 
    }

    // 5. Secure Backend Communication
    async function processAIResponse(query) {
        try {
            const csrfToken = typeof getCSRFToken === 'function' ? getCSRFToken() : '';

            const response = await fetch(`${API_BASE}/secure/oracle`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken 
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    query: query,
                    history: conversationHistory // Send the full memory array to backend
                })
            });

            const data = await response.json();
            
            // Save the exchange to memory
            conversationHistory.push({ role: 'user', text: query });
            conversationHistory.push({ role: 'bot', text: data.reply });

            // Keep memory under 20 messages to prevent payload bloat
            if (conversationHistory.length > 20) {
                conversationHistory = conversationHistory.slice(conversationHistory.length - 20);
            }

            // Save to browser session storage so it survives page reloads
            sessionStorage.setItem('oracle_memory', JSON.stringify(conversationHistory));
            
            setTimeout(() => addMessageToDOM(data.reply, 'bot'), 400);

        } catch (error) {
            setTimeout(() => addMessageToDOM("[!] Network failure. Cannot reach AI Core.", 'bot'), 400);
        }
    }

    // 6. User Input Listener
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            const userText = chatInput.value.trim();
            addMessageToDOM(userText, 'user');
            chatInput.value = '';
            
            const typingId = "typing-" + Date.now();
            const typingMsg = document.createElement('div');
            typingMsg.className = 'chat-msg msg-bot';
            typingMsg.id = typingId;
            typingMsg.innerText = "Processing telemetry...";
            chatMessages.appendChild(typingMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            processAIResponse(userText).finally(() => {
                const indicator = document.getElementById(typingId);
                if (indicator) indicator.remove();
            });
        }
    });
})();