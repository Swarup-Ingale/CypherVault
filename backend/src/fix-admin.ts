import { db } from './config/database';
import bcrypt from 'bcryptjs';

async function fixAdminPassword() {
    try {
        console.log('Generating mathematically valid bcrypt hash for "password123"...');
        // Generate a real hash
        const realHash = await bcrypt.hash('password123', 12);
        
        // Update the database
        await db.query(`UPDATE users SET password_hash = $1 WHERE username = 'admin'`, [realHash]);
        
        console.log('\n[SUCCESS] Admin password successfully updated in database!');
        console.log('Hash injected:', realHash);
    } catch (error) {
        console.error('[ERROR] Failed to update user:', error);
    } finally {
        // Close the database connection so the script finishes
        await db.end();
        process.exit();
    }
}

fixAdminPassword();