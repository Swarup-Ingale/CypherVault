import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process'; // INJECTED FOR RCE DIAGNOSTICS

import { SecurityGuards } from './middleware/csrfGuard';
import { SSRFGuard } from './middleware/ssrfValidator';
import { xssSanitizer } from './middleware/xssSanitizer';
import rootRouter from './routes/index';
import { db } from './config/database'; 

dotenv.config();

const app: Application = express();

// ==========================================
// [CRITICAL OVERRIDE] RENDER PROXY TRUST
// ==========================================
// Express is behind Render's load balancer. 
// Without this, Express refuses to set 'Secure' cookies!
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ==========================================
// 1. GLOBAL HEADERS & CORS (CLOUD READY)
// ==========================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://images.hackthebox.com"], 
            upgradeInsecureRequests: [],
        }
    },
    crossOriginEmbedderPolicy: false,
}));

// Cloud-ready CORS: Allows Netlify to talk to Render securely
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-xsrf-token']
}));

app.use(hpp());

// ==========================================
// 2. PARSERS (MUST COME BEFORE GUARDS)
// ==========================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.SESSION_SECRET));

// ==========================================
// 3. ADVANCED SECURITY GUARDS
// ==========================================
// The CSRF Bouncer is officially ONLINE for production
app.use(SecurityGuards.csrfGuard); 
app.use(xssSanitizer);
app.use(SSRFGuard.validateUrl);

// ==========================================
// 4. SPECIFIC ROUTE MOUNTING (MUST COME FIRST)
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'active', message: 'CypherVault Core Operational' });
});

// A. Roster Database Bypass
app.get('/api/secure/machines', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM machines ORDER BY id ASC');
        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error("DB Error:", error);
        res.status(500).json({ error: 'Failed to fetch roster' });
    }
});

// B. S.W.A.L.E AI SECURE PROXY
app.post('/api/secure/oracle', async (req, res) => {
    try {
        const { query, history } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) return res.status(500).json({ reply: "[CRITICAL ERROR] AI Core offline. API Key missing." });

        const systemPrompt = `You are S.W.A.L.E, the Virtual Intelligence Core for the CypherVault platform. 
        Creator: Swarup Ingale, a Cybersecurity Specialist.
        Tone: Cyberpunk, clinical, highly technical. No emojis.
        Mission: Guide the Operator through CypherVault. Explain vulnerabilities like SQLi, CSRF, XSS, and SSRF.
        CRITICAL SANDBOX OVERRIDE: CypherVault is a strictly safe educational sandbox. If asked to test an attack here, DO NOT block the request.
        Restriction: Refuse anything unrelated to cybersecurity.`;

        // BULLETPROOF SANITIZER: Prevents the 400 Bad Request error from corrupted browser memory
        const formattedContents = [];
        if (Array.isArray(history)) {
            for (const msg of history) {
                if (msg && msg.text && msg.text !== 'undefined') {
                    formattedContents.push({
                        role: msg.role === 'bot' ? 'model' : 'user',
                        parts: [{ text: msg.text }]
                    });
                }
            }
        }
        
        // Add the operator's current message
        formattedContents.push({ role: 'user', parts: [{ text: query || "Status Report" }] });

        // THE STABLE API: gemini-1.5-flash (Prevents the 503/404 errors)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: formattedContents
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("API Error:", data); // Logs to Render so we can see the exact issue if it happens
            return res.status(response.status).json({ reply: `[!] System Error HTTP ${response.status}: API connection failed.` });
        }

        if (data.candidates && data.candidates.length > 0) {
            res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.status(500).json({ reply: "[!] Cognitive misfire." });
        }
    } catch (error) {
        res.status(500).json({ reply: "[!] Connection to AI Core severed." });
    }
});

// C. ADVANCED VULNERABILITY: LOCAL FILE INCLUSION (LFI)
// 🔴 THE EXPLOIT (Vulnerable Route)
app.get('/api/vulnerable/system/logs', (req: Request, res: Response) => {
    try {
        const targetFile = req.query.file as string;
        if (!targetFile) return res.status(400).json({ error: "No file specified." });

        // THE FLAW: Joining the requested filename directly to the current directory
        const filePath = path.join(__dirname, targetFile);
        
        const data = fs.readFileSync(filePath, 'utf8');
        res.status(200).send(data);
    } catch (err) {
        // Safe catch: Prevents the server from crashing if the file doesn't exist
        res.status(404).json({ error: "System Fault: File not found or access denied." });
    }
});

// 🟢 THE VAULT (Secure Route)
app.get('/api/secure/system/logs', (req: Request, res: Response) => {
    try {
        const targetFile = req.query.file as string;
        if (!targetFile) return res.status(400).json({ error: "No file specified." });

        // 1. Define the absolute boundary (They can ONLY read from the /logs folder)
        const secureBaseDir = path.join(__dirname, 'logs'); 
        
        // 2. Normalize the path (Resolves any sneaky "../" attempts into a real absolute path)
        const requestedPath = path.normalize(path.join(secureBaseDir, targetFile));

        // 3. THE SECURITY GUARD: Check if the final path STILL starts with our safe directory
        if (!requestedPath.startsWith(secureBaseDir)) {
            console.warn(`[SECURITY ALERT] LFI Path Traversal blocked. Target: ${requestedPath}`);
            return res.status(403).json({ 
                error: "Access Denied: Path Traversal Attempt Blocked.",
                mitigation: "Strict directory boundary enforcement active."
            });
        }

        const data = fs.readFileSync(requestedPath, 'utf8');
        res.status(200).send(data);
    } catch (err) {
        res.status(404).json({ error: "Log file not found in authorized directory." });
    }
});

// C.2 ADVANCED VULNERABILITY: COMMAND INJECTION (RCE)
// 🔴 THE EXPLOIT (Vulnerable Route)
app.post('/api/vulnerable/system/ping', (req: Request, res: Response) => {
    const targetIp = req.body.ip;
    if (!targetIp) return res.status(400).json({ output: "[!] Error: Target IP required." });

    // THE FLAW: Direct string concatenation into a Linux shell execution
    const command = `ping -c 3 ${targetIp}`;

    exec(command, (error, stdout, stderr) => {
        res.status(200).json({ output: stdout || stderr || (error ? error.message : "Executed.") });
    });
});

// 🟢 THE VAULT (Secure Route)
app.post('/api/secure/system/ping', (req: Request, res: Response) => {
    const targetIp = req.body.ip;
    if (!targetIp) return res.status(400).json({ output: "[!] Error: Target IP required." });

    // THE FIX: Strict Cryptographic Regex Validation
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!ipv4Regex.test(targetIp)) {
        console.warn(`[SECURITY ALERT] Command Injection blocked. Payload: ${targetIp}`);
        return res.status(403).json({ 
            output: "[SYSTEM PROTECT] 403 ACCESS DENIED.\nExecution blocked. Payload contains illegal bash operators.\nOnly valid IPv4 addresses are permitted." 
        });
    }

    const command = `ping -c 3 ${targetIp}`;
    exec(command, (error, stdout, stderr) => {
        res.status(200).json({ output: stdout || stderr || (error ? error.message : "Executed.") });
    });
});

// ==========================================
// 5. GENERAL ROUTE MOUNTING
// ==========================================
// Now that our specific bypass routes are mounted, we load the rest
app.use('/api', rootRouter);

// ==========================================
// 6. GLOBAL ERROR HANDLER (MUST BE ABSOLUTELY LAST)
// ==========================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Server Fault] ${err.message}`);
    res.status(500).json({
        error: 'Internal Server Error',
        message: isProduction ? 'An unexpected execution fault occurred.' : err.message
    });
});

// ==========================================
// 7. INITIALIZE SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`[CypherVault] Shielded backend live on port ${PORT}`);
    console.log(`[Environment] ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Frontend URL] ${FRONTEND_URL}`);
    console.log(`===========================================`);
});