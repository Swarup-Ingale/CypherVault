export const logger = {
    info: (msg: string) => console.log(`[INFO] [${new Date().toISOString()}] ${msg}`),
    warn: (msg: string) => console.warn(`[SECURITY-WARN] [${new Date().toISOString()}] ${msg}`),
    error: (msg: string) => console.error(`[CRITICAL-ERROR] [${new Date().toISOString()}] ${msg}`)
};