import { Router } from 'express';
import { createSession } from '../controllers/session.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', createSession);

export default router;
