import { Router } from 'express';
import { MachineController } from '../../controllers/machineController';

const router = Router();
router.get('/profile', MachineController.getMachineVulnerable);

export default router;