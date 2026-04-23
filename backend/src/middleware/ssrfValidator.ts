import { Request, Response, NextFunction } from 'express';
import ipaddr from 'ipaddr.js';

export class SSRFGuard {
    // Block internal network ranges (RFC 1918) and Cloud Metadata IPs
    private static readonly BANNED_RANGES = [
        '127.0.0.0/8',    // IPv4 loopback
        '10.0.0.0/8',     // RFC 1918
        '172.16.0.0/12',  // RFC 1918
        '192.168.0.0/16', // RFC 1918
        '169.254.169.254/32', // AWS/GCP/Azure Metadata
        '::1/128'         // IPv6 loopback
    ];

    public static validateUrl(req: Request, res: Response, next: NextFunction): void {
        // Safe navigation (?.) prevents "Cannot read properties of undefined" crashes
        const targetUrl = req.body?.url || req.query?.url;

        if (!targetUrl) {
            next();
            return;
        }

        try {
            const parsedUrl = new URL(targetUrl as string);
            const hostname = parsedUrl.hostname;

            if (ipaddr.isValid(hostname)) {
                if (SSRFGuard.isBanned(hostname)) {
                    res.status(403).json({ error: 'SSRF Detected: Destination prohibited.' });
                    return;
                }
            }
            
            next();
        } catch (err) {
            next(); // Ignore malformed URLs here; let the route validators handle it
        }
    }

    private static isBanned(ip: string): boolean {
        const addr = ipaddr.parse(ip);
        return SSRFGuard.BANNED_RANGES.some(range => {
            const [network, mask] = range.split('/');
            return addr.match(ipaddr.parse(network), parseInt(mask));
        });
    }
}