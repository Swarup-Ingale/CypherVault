import { Request, Response, NextFunction } from 'express';

export class XXEGuard {
    public static blockXmlPayloads(req: Request, res: Response, next: NextFunction): void {
        const contentType = req.headers['content-type'];
        
        // MITIGATION: If the architecture does not explicitly require XML, block it at the router level.
        if (contentType && (contentType.includes('xml') || contentType.includes('application/xhtml+xml'))) {
            console.warn(`[Security Alert] Blocked malicious XML payload attempt from IP: ${req.ip}`);
            res.status(415).json({ 
                error: 'Unsupported Media Type',
                message: 'XML payloads are strictly prohibited to prevent XXE vulnerabilities. Use JSON.'
            });
            return;
        }
        
        next();
    }
}