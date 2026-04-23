import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// The connection pool needs to know if it's on Render (production) or your laptop (development)
const isProduction = process.env.NODE_ENV === 'production';

export const db = new Pool({
    // This tells it to strictly use the Render Environment Variable we set up
    connectionString: process.env.DATABASE_URL,
    
    // Cloud databases require SSL. Local databases do not. This switches automatically.
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

db.on('connect', () => {
    console.log('[Database] PostgreSQL Vault connected successfully');
});

db.on('error', (err) => {
    console.error('[Database] Critical Connection Error:', err.message);
});