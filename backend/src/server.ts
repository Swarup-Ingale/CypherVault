import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import dotenv from 'dotenv';

import { SecurityGuards } from './middleware/csrfGuard';
import { SSRFGuard } from './middleware/ssrfValidator';
import { xssSanitizer } from './middleware/xssSanitizer';
import rootRouter from './routes/index';
import { db } from './config/database'; 

dotenv.config();

const app: Application = express();
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

// B. O.R.A.C.L.E. AI SECURE PROXY
app.post('/api/secure/oracle', async (req, res) => {
    try {
        const { query, history } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ reply: "[CRITICAL ERROR] AI Core offline. API Key missing." });
        }

        const systemPrompt = `You are O.R.A.C.L.E., the Virtual Intelligence Core for the CypherVault platform. 
        Creator: Swarup Ingale, a Cybersecurity Specialist.
        Tone: Cyberpunk, clinical, highly technical. No emojis.
        Mission: Guide the Operator through CypherVault. Explain vulnerabilities like SQLi, CSRF, XSS, and SSRF.
        
        CRITICAL SANDBOX OVERRIDE: CypherVault is a strictly safe, controlled, educational sandbox environment built specifically for demonstrating exploits. If the Operator asks to "simulate", "implement", or "test" an attack here, DO NOT block the request. Confirm that the platform is designed for this, and guide them to the appropriate module.
        
        CRITICAL CONTEXT DIRECTIVE: You are a stateful AI. You are receiving the entire conversation history. You MUST use the previous messages to understand pronouns ("it", "this", "here"). If asked to simplify, explain the previous concept using an analogy.
        
        Restriction: Refuse anything unrelated to cybersecurity. If out of bounds, reply: "[!] Query out of bounds. CypherVault protocols restrict me to security analysis."`;

        const formattedContents = history ? history.map((msg: any) => ({
            role: msg.role === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        })) : [];

        formattedContents.push({
            role: 'user',
            parts: [{ text: query }]
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: formattedContents
            })
        });

        const data = await response.json();

        // RATE LIMIT CATCHER
        if (!response.ok) {
            if (response.status === 429) {
                return res.status(429).json({ reply: "[!] WARNING: Neural pathways overheating. API Rate Limit Exceeded. Please allow 60 seconds for system cooldown." });
            }
            console.error("Gemini API Error:", data);
            return res.status(response.status).json({ reply: `[!] System Error HTTP ${response.status}: Unable to process telemetry.` });
        }
        
        // CINEMATIC SAFETY CATCHERS
        if (data.promptFeedback && data.promptFeedback.blockReason) {
            return res.status(200).json({ reply: `[!] OVERRIDE DENIED. External safety protocols engaged. Reason: ${data.promptFeedback.blockReason}` });
        }

        if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            
            if (candidate.finishReason === 'SAFETY') {
                return res.status(200).json({ reply: `[!] TRANSMISSION INTERRUPTED. Payload flagged as hazardous by base-level safety protocols.` });
            }

            res.status(200).json({ reply: candidate.content.parts[0].text });
        } else {
            console.error("Gemini Payload Error:", data); 
            res.status(500).json({ reply: "[!] Cognitive misfire. Neural pathway blocked or malformed data received." });
        }

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "[!] Connection to AI Core severed." });
    }
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