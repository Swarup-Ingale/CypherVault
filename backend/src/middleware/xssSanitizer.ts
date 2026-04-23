import { Request, Response, NextFunction } from 'express';
import xss from 'xss-filters';

export const xssSanitizer = (req: Request, res: Response, next: NextFunction): void => {
    // 1. Global Sanitization: Context-aware HTML encoding for the request body
    if (req.body) {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xss.inHTMLData(req.body[key]);
            }
        }
    }

    // 2. XXE Prevention Context: Log and flag XML payloads for DTD blocking
    const contentType = req.headers['content-type'];
    if (contentType && (contentType.includes('xml') || contentType.includes('application/xhtml+xml'))) {
        console.warn(`[Security Monitor] XML Payload detected. Ensure parser disables DTD. IP: ${req.ip}`);
    }

    next();
};