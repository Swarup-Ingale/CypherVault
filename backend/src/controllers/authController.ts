import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { securityConfig } from '../config/security';

export class AuthController {

    // ⚠️ VULNERABLE ENDPOINT: Broken Authentication
    public static async loginVulnerable(req: Request, res: Response): Promise<void> {
        try {
            const { username, password } = req.body;

            // VULNERABILITY 1: SQL Injection in the login bypass
            const query = `SELECT * FROM users WHERE username = '${username}' AND password_hash = '${password}'`;
            const result = await db.query(query);

            if (result.rows.length === 0) {
                // VULNERABILITY 2: Verbose error messages allow User Enumeration
                res.status(401).json({ error: `User ${username} does not exist or password is wrong.` });
                return;
            }

            // VULNERABILITY 3: Storing session token in localStorage (frontend) makes it vulnerable to XSS theft
            const token = jwt.sign({ id: result.rows[0].id }, securityConfig.jwtSecret);
            res.status(200).json({ message: 'Login successful', token: token });

        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // 🛡️ SECURE ENDPOINT: Enterprise Standard
    public static async loginSecure(req: Request, res: Response): Promise<void> {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                res.status(400).json({ error: 'Invalid request payload.' });
                return;
            }

            // MITIGATION 1: Parameterized query prevents SQLi bypass
            const query = `SELECT id, username, password_hash FROM users WHERE username = $1`;
            const result = await db.query(query, [username]);

            const user = result.rows[0];

            // MITIGATION 2: Generic error message prevents User Enumeration
            if (!user) {
                res.status(401).json({ error: 'Invalid credentials.' });
                return;
            }

            // MITIGATION 3: Cryptographic password comparison using Bcrypt
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                res.status(401).json({ error: 'Invalid credentials.' });
                return;
            }

            // MITIGATION 4: Issuing token inside an HttpOnly cookie (Immune to XSS)
            const token = jwt.sign(
                { id: String(user.id) }, 
                securityConfig.jwtSecret as string, 
                { expiresIn: securityConfig.jwtExpiresIn as any }
            );
            
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: securityConfig.cookieMaxAge
            });

            res.status(200).json({ status: 'success', message: 'Authentication verified.' });

        } catch (error) {
            console.error('[Security Log] Authentication fault.');
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}