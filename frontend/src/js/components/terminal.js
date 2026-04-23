document.addEventListener("DOMContentLoaded", () => {
    const terminalOutput = document.getElementById("terminal-output");
    const inputLine = document.getElementById("input-line");
    const termInput = document.getElementById("term-input");
    const overlay = document.getElementById("redirect-overlay");
    const overlayText = document.getElementById("redirect-text");
    
    // ==========================================
    // BFI-CACHE FIX: Unstuck the loading screen on "Back"
    // ==========================================
    window.addEventListener("pageshow", (event) => {
        if (overlay) {
            overlay.classList.remove("active");
        }
    });

    // ==========================================
    // STATE MANAGEMENT (History & Uptime)
    // ==========================================
    const cmdHistory = [];
    let historyIndex = -1;
    
    // Base uptime (14 days) + current session tracking
    const sessionStartTime = Date.now();
    const baseUptimeMs = (14 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000); 

    // ==========================================
    // BOOT SEQUENCE
    // ==========================================
    const bootSequence = [
        { text: "root@cyphervault:~# ./init_core.sh", delay: 600 },
        { text: "[*] Booting CypherVault Subsystems...", delay: 400 },
        { text: "[+] SECURE_KERNEL_INIT .................... OK", delay: 200, class: "term-success" },
        { text: "[+] LOADING ENCRYPTION PROTOCOLS .......... OK", delay: 200, class: "term-success" },
        { text: "[*] Mounting Virtual DOM...", delay: 300 },
        { text: "Type 'help' to view available commands.", delay: 300, class: "term-warning" }
    ];

    let currentIndex = 0;

    function printNextLine() {
        if (currentIndex < bootSequence.length) {
            appendOutput(bootSequence[currentIndex].text, bootSequence[currentIndex].class);
            currentIndex++;
            setTimeout(printNextLine, bootSequence[currentIndex - 1].delay);
        } else {
            inputLine.style.display = "flex";
            termInput.focus();
        }
    }
    setTimeout(printNextLine, 1000);

    // ==========================================
    // COMMAND PROCESSING & KEYBOARD EVENTS
    // ==========================================
    termInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            const cmdRaw = this.value.trim();
            const cmdLower = cmdRaw.toLowerCase();
            
            // Log command to UI
            appendOutput(`root@cypher:~# ${cmdRaw}`);
            
            if (cmdRaw !== "") {
                // Save to history array
                cmdHistory.push(cmdRaw);
                historyIndex = cmdHistory.length;
                executeCommand(cmdLower, cmdRaw);
            }
            this.value = "";
            
        } else if (e.key === "ArrowUp") {
            e.preventDefault(); // Stop cursor from jumping
            if (historyIndex > 0) {
                historyIndex--;
                this.value = cmdHistory[historyIndex];
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex < cmdHistory.length - 1) {
                historyIndex++;
                this.value = cmdHistory[historyIndex];
            } else {
                historyIndex = cmdHistory.length;
                this.value = "";
            }
        }
    });

    function appendOutput(text, className = "", isHTML = false) {
        const p = document.createElement("p");
        p.className = `term-line ${className}`;
        if (isHTML) { p.innerHTML = text; } else { p.innerText = text; }
        
        terminalOutput.insertBefore(p, inputLine);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function executeCommand(cmdLower, cmdRaw) {
        const args = cmdLower.split(" ");
        const baseCmd = args[0];

        switch(baseCmd) {
            case 'help':
                appendOutput("Available commands:", "term-success");
                appendOutput("  ls       - List directory contents (Interactive)");
                appendOutput("  whoami   - Print current user context");
                appendOutput("  pwd      - Print working directory");
                appendOutput("  clear    - Clear terminal output");
                appendOutput("  scan     - Initiate vulnerability sweep against target IP");
                appendOutput("  decrypt  - Attempt local hash cracking (e.g., decrypt <hash>)");
                appendOutput("  uptime   - View real-time system uptime");
                appendOutput("  history  - View command history");
                appendOutput("  reboot   - Restart terminal instance");
                break;
            case 'whoami':
                appendOutput("root_operator"); break;
            case 'pwd':
                appendOutput("/var/cyphervault/core_system/"); break;
            case 'clear':
                Array.from(terminalOutput.children).forEach(child => {
                    if (child.id !== 'input-line') { child.remove(); }
                });
                break;
            case 'uptime':
                // Calculate actual real-time uptime
                const totalUptimeMs = baseUptimeMs + (Date.now() - sessionStartTime);
                const d = Math.floor(totalUptimeMs / (1000 * 60 * 60 * 24));
                const h = Math.floor((totalUptimeMs / (1000 * 60 * 60)) % 24);
                const m = Math.floor((totalUptimeMs / 1000 / 60) % 60);
                const s = Math.floor((totalUptimeMs / 1000) % 60);
                appendOutput(`up ${d} days, ${h} hours, ${m} minutes, ${s} seconds. load average: 0.02, 0.05, 0.01`); 
                break;
            case 'scan':
                const target = args[1] || "127.0.0.1";
                appendOutput(`[*] Initiating SYN Stealth Scan against [${target}]...`);
                setTimeout(() => appendOutput("[+] Port 22 (SSH) - OPEN", "term-warning"), 600);
                setTimeout(() => appendOutput("[+] Port 80 (HTTP) - CLOSED"), 1200);
                setTimeout(() => appendOutput("[!] VULNERABILITY DETECTED: Port 5432 (PostgreSQL) exposed.", "term-error"), 1800);
                break;
            case 'decrypt':
                if (args.length < 2) {
                    appendOutput("[!] ERROR: Target hash parameter missing. Syntax: decrypt <hash>", "term-error");
                } else {
                    const hashToCrack = args[1];
                    appendOutput(`[*] Initializing hashcat engine for target: ${hashToCrack.substring(0, 15)}...`);
                    setTimeout(() => appendOutput("[*] Loading wordlist: rockyou.txt..."), 800);
                    setTimeout(() => appendOutput("[*] Commencing dictionary attack..."), 1500);
                    setTimeout(() => appendOutput(`[+] CRACKED: ${hashToCrack} -> "admin123"`, "term-success"), 3500);
                }
                break;
            case 'history':
                cmdHistory.forEach((c, i) => appendOutput(`  ${i + 1}  ${c}`));
                break;
            case 'reboot':
                appendOutput("Restarting system...", "term-warning");
                setTimeout(() => location.reload(), 1000); break;
            case 'ls':
                appendOutput("total 24");
                appendOutput(`drwxr-xr-x 2 root root 4096 <span class="term-link" data-target="src/pages/machines/list.html" data-name="TARGET ROSTER">target_nodes/</span>`, "", true);
                appendOutput(`-rwxr-xr-x 1 root root 8192 <span class="term-link exe" data-target="src/pages/dashboard/dashboard.html" data-name="MAIN DASHBOARD">core_dashboard.exe</span>`, "", true);
                appendOutput(`-rwxr-xr-x 1 root root 2048 <span class="term-link exe" data-target="src/pages/profile/login.html" data-name="AUTH MATRIX">auth_matrix.sh</span>`, "", true);
                appendOutput(`-rw-r--r-- 1 root root 1024 <span class="term-link log" data-target="src/pages/about/about.html" data-name="SYSTEM LOGS">sys_info.log</span>`, "", true);
                break;
            default:
                appendOutput(`bash: ${cmdRaw}: command not found`, "term-error");
        }
    }

    // ==========================================
    // CINEMATIC REDIRECT
    // ==========================================
    terminalOutput.addEventListener("click", function(e) {
        if (e.target && e.target.classList.contains("term-link")) {
            const targetUrl = e.target.getAttribute("data-target");
            const displayName = e.target.getAttribute("data-name");

            overlay.classList.add("active");
            overlayText.innerText = "[ UPLINK ESTABLISHED ]";
            
            setTimeout(() => { overlayText.innerText = `ROUTING TO [ ${displayName} ]...`; }, 800);
            setTimeout(() => { window.location.href = targetUrl; }, 1800);
        }
    });
});