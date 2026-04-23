import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const seedDatabase = async () => {
    // Connect directly using your environment variables
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for cloud databases
    });

    try {
        await client.connect();
        console.log("=======================================");
        console.log("🔌 Uplink established. Bypassing Neon UI...");
        
        // 1. Force table creation (IF NOT EXISTS prevents errors if they are already there)
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL
            );
            CREATE TABLE IF NOT EXISTS machines (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                os VARCHAR(50) NOT NULL,
                difficulty VARCHAR(50) NOT NULL,
                points INTEGER NOT NULL
            );
        `);
        console.log("🏗️  Tables verified and architected.");

        // 2. Clear out any duplicates just in case
        await client.query('TRUNCATE TABLE machines RESTART IDENTITY CASCADE;');

        // 3. Inject the targets
        await client.query(`
            INSERT INTO machines (id, name, os, difficulty, points) VALUES
            (1, 'Lame', 'Linux', 'Easy', 20), (2, 'Optimum', 'Windows', 'Easy', 20),
            (3, 'Legacy', 'Windows', 'Easy', 20), (4, 'Nexus', 'Linux', 'Medium', 30),
            (5, 'Titan', 'Windows', 'Hard', 50), (6, 'Vortex', 'Linux', 'Insane', 100),
            (7, 'Enigma', 'FreeBSD', 'Easy', 20), (8, 'Wraith', 'Windows', 'Medium', 40),
            (9, 'Phantom', 'Linux', 'Hard', 60), (10, 'Standard', 'Linux', 'Extreme', 100),
            (11, 'Gameshell', 'Linux', 'Medium', 40), (12, 'Gameshell2', 'Linux', 'Hard', 60),
            (13, 'Space Scope', 'Windows', 'Medium', 20), (14, 'Alpha', 'Linux', 'Easy', 20),
            (15, 'Beta', 'Windows', 'Medium', 30), (16, 'Cipher', 'Linux', 'Hard', 60),
            (17, 'Matrix', 'FreeBSD', 'Insane', 100), (18, 'Delta', 'Windows', 'Medium', 40),
            (19, 'Epsilon', 'Linux', 'Easy', 20), (20, 'Zeta', 'Solaris', 'Hard', 60),
            (21, 'Grid', 'Windows', 'Insane', 100), (22, 'Node', 'Linux', 'Medium', 40),
            (23, 'Uplink', 'FreeBSD', 'Easy', 20), (24, 'Proxy', 'Linux', 'Hard', 60),
            (25, 'Firewall', 'Windows', 'Extreme', 100), (26, 'Gateway', 'Linux', 'Medium', 40),
            (27, 'Daemon', 'OpenBSD', 'Hard', 60), (28, 'Kernel', 'Linux', 'Insane', 100),
            (29, 'Shell', 'Windows', 'Easy', 20), (30, 'Root', 'Linux', 'Medium', 40),
            (31, 'Socket', 'FreeBSD', 'Hard', 60), (32, 'Thread', 'Windows', 'Insane', 100),
            (33, 'Packet', 'Linux', 'Medium', 40), (34, 'Router', 'Solaris', 'Easy', 20),
            (35, 'Switch', 'Windows', 'Hard', 60), (36, 'Bridge', 'Linux', 'Extreme', 100),
            (37, 'Subnet', 'FreeBSD', 'Medium', 40), (38, 'Backbone', 'Windows', 'Insane', 100),
            (39, 'Eta', 'Linux', 'Easy', 20), (40, 'Theta', 'Windows', 'Hard', 60),
            (41, 'Iota', 'Linux', 'Medium', 40), (42, 'Kappa', 'FreeBSD', 'Insane', 100),
            (43, 'Lambda', 'Windows', 'Easy', 20), (44, 'Mu', 'Linux', 'Hard', 60),
            (45, 'Nu', 'Solaris', 'Extreme', 100), (46, 'Xi', 'Windows', 'Medium', 40),
            (47, 'Omicron', 'Linux', 'Insane', 100), (48, 'Pi', 'FreeBSD', 'Easy', 20),
            (49, 'Rho', 'Windows', 'Hard', 60), (50, 'Sigma', 'Linux', 'Medium', 40),
            (51, 'Tau', 'OpenBSD', 'Insane', 100), (52, 'Upsilon', 'Windows', 'Extreme', 100),
            (53, 'Phi', 'Linux', 'Easy', 20), (54, 'Chi', 'FreeBSD', 'Hard', 60),
            (55, 'Psi', 'Windows', 'Medium', 40), (56, 'Omega', 'Linux', 'Insane', 100),
            (57, 'Ghost', 'Windows', 'Extreme', 100), (58, 'Specter', 'Linux', 'Hard', 60),
            (59, 'Banshee', 'FreeBSD', 'Medium', 40), (60, 'Wraith_v2', 'Windows', 'Easy', 20),
            (61, 'Shadow', 'Linux', 'Insane', 100), (62, 'Eclipse', 'Solaris', 'Medium', 40),
            (63, 'Nova', 'Windows', 'Hard', 60);
        `);
        console.log("💾 63 Target Nodes successfully injected!");
        console.log("=======================================");

    } catch (err) {
        console.error("[CRITICAL ERROR] Injection failed:", err);
    } finally {
        await client.end();
    }
};

seedDatabase();