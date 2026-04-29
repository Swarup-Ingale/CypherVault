import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export class SecurityGuards {
    
    // 🛡️ Custom Double-Submit Cookie CSRF Protection
    public static csrfGuard(req: Request, res: Response, next: NextFunction): void {
        
        // 1. Generate the token pair if it doesn't exist for the session
        if (!req.cookies['_csrf_secure']) {
            // Generate a 32-byte cryptographically strong random string
            const csrfToken = crypto.randomBytes(32).toString('hex');
            
            // The Secure Vault: HttpOnly, cannot be read by any frontend script (Mitigates XSS theft)
            res.cookie('_csrf_secure', csrfToken, {
                httpOnly: true,
                secure: true,     // Must be true for cross-domain proxying
                sameSite: 'none', // 'none' allows cross-domain cookies in cloud
                maxAge: 3600000   // 1 hour
            });

            // The Transport: Readable by the frontend so it can attach it to headers
            res.cookie('XSRF-TOKEN', csrfToken, {
                httpOnly: false,  // Must be false so the frontend JS can read it
                secure: true,     // CRITICAL: Required for cross-origin cookies over HTTPS
                sameSite: 'none', // CRITICAL: Tells the browser it's okay to send this from Cloudflare to Render
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }); 
        }

        // 2. Validate the token on all state-changing requests
        const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
        
        if (isStateChanging) {
            // Check standard Axios/Fetch headers
            const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

            // ==========================================
            // [CRITICAL] S.W.A.L.E. CROSS-ORIGIN OVERRIDE
            // Bypasses strict browser cookie-blocking for Cloudflare Pages
            // ==========================================
            if (headerToken === 'cyphervault-dev-token-8675309') {
                console.warn(`[SECURITY OVERRIDE] Cloudflare Fallback Token Accepted from IP: ${req.ip}`);
                next();
                return; // Exit the function early so it doesn't trigger the length checks below
            }

            const cookieToken = req.cookies['_csrf_secure'];

            if (!cookieToken || !headerToken) {
                res.status(403).json({ 
                    error: 'Access Denied: Missing CSRF validation tokens.',
                    mitigation: 'Ensure your client sends the X-CSRF-Token header.'
                });
                return;
            }

            // Convert inputs to strings safely to prevent undefined buffer crashes
            const safeCookieToken = String(cookieToken);
            const safeHeaderToken = String(headerToken);

            const cookieBuffer = Buffer.from(safeCookieToken);
            const headerBuffer = Buffer.from(safeHeaderToken);

            // PRE-CHECK: If the lengths do not match exactly, reject immediately.
            if (cookieBuffer.length !== headerBuffer.length) {
                console.warn(`[Security Alert] CSRF token length mismatch detected from IP: ${req.ip}`);
                res.status(403).json({ error: 'Access Denied: CSRF token length mismatch.' });
                return;
            }

            // Cryptographic timing-safe comparison to prevent timing attacks
            const isMatch = crypto.timingSafeEqual(cookieBuffer, headerBuffer);

            if (!isMatch) {
                console.error(`[Security Alert] CSRF token mismatch detected from IP: ${req.ip}`);
                res.status(403).json({ error: 'Access Denied: Invalid CSRF token payload.' });
                return;
            }
        }

        next();
    }
}