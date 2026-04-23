import { Request, Response } from 'express';

export class UserController {
    public static async getProfile(req: Request, res: Response): Promise<void> {
        // In a real flow, this would pull the user ID from the validated JWT payload
        res.status(200).json({
            status: 'success',
            data: {
                username: 'CypherAdmin',
                role: 'Penetration Tester',
                clearance: 'Level 5'
            }
        });
    }
}