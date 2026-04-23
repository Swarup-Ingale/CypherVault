import { Request, Response } from 'express';
import { db } from '../config/database';

export class MachineController {

    // ⚠️ VULNERABLE ENDPOINT: DO NOT USE IN PROD
    public static async getMachineVulnerable(req: Request, res: Response): Promise<void> {
        try {
            const machineId = req.query.id; 
            if (!machineId) {
                res.status(400).json({ error: 'Machine ID is required' });
                return;
            }

            // VULNERABILITY: Raw string concatenation allows SQL Injection
            const query = `SELECT * FROM machines WHERE id = '${machineId}'`;
            const result = await db.query(query);

            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Machine not found.' });
                return;
            }
            res.status(200).json(result.rows);
        } catch (error: any) {
            // VULNERABILITY: Verbose error leaks DB schema
            res.status(500).json({ error: 'Database execution failed', details: error.message });
        }
    }

    // 🛡️ SECURE ENDPOINT: ENTERPRISE STANDARD
    public static async getMachineSecure(req: Request, res: Response): Promise<void> {
        try {
            const machineId = req.query.id;
            if (!machineId || typeof machineId !== 'string') {
                res.status(400).json({ error: 'Valid Machine ID is required' });
                return;
            }

            // MITIGATION: Parameterized Queries prevent executable code injection
            const query = `SELECT id, name, difficulty, os, points FROM machines WHERE id = $1`;
            const result = await db.query(query, [machineId]);

            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Machine not found.' });
                return;
            }
            res.status(200).json({ status: 'success', data: result.rows[0] });
        } catch (error) {
            console.error('[Security Log] Database query error in secure route.');
            res.status(500).json({ error: 'Internal server error occurred.' });
        }
    }
}