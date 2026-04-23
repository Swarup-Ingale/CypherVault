import { Router } from 'express';

// Import Routes & Controllers
import secureMachineRoutes from './secure/machineRoutes';
import vulnerableMachineRoutes from './vulnerable/machineRoutes';
import { AuthController } from '../controllers/authController';
import { UserController } from '../controllers/userController';

// Import Security Middleware
import { XXEGuard } from '../middleware/xxeBlocker';

const rootRouter = Router();

// ==========================================
// GLOBAL API GUARDS
// ==========================================
// Apply the explicit XXE Blocker to all incoming routes
rootRouter.use(XXEGuard.blockXmlPayloads);

// ==========================================
// 🛡️ SECURE ROUTES (The Hardened Architecture)
// ==========================================
// Machine Profiling
rootRouter.use('/secure/machines', secureMachineRoutes);

// Authentication & Identity
rootRouter.post('/secure/auth/login', AuthController.loginSecure);
rootRouter.get('/secure/user/profile', UserController.getProfile);

// ==========================================
// ⚠️ VULNERABLE ROUTES (The Exploit Targets)
// ==========================================
// Machine Profiling
rootRouter.use('/vulnerable/machines', vulnerableMachineRoutes);

// Authentication (Broken Auth / SQLi Bypass Demo)
rootRouter.post('/vulnerable/auth/login', AuthController.loginVulnerable);

export default rootRouter;