import dotenv from 'dotenv';
dotenv.config();

export const securityConfig = {
    jwtSecret: process.env.JWT_SECRET || 'fallback_do_not_use_in_prod',
    jwtExpiresIn: '2h',
    bcryptSaltRounds: 12, // High work factor to mitigate brute-force/rainbow table attacks
    cookieMaxAge: 2 * 60 * 60 * 1000 // 2 hours in milliseconds
};