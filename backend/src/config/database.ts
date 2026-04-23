import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the PostgreSQL Connection Pool
export const db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'cyphervault_db',
});

// Test the connection
db.connect()
    .then(() => console.log('[Database] PostgreSQL Vault connected successfully.'))
    .catch((err) => console.error('[Database] Connection critical failure:', err.message));