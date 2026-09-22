import { Router } from 'express';
import { getServers, getServer, createServer, updateServer, deleteServer } from '../controllers/server.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getServers);
router.get('/:id', getServer);
router.post('/', createServer);
router.put('/:id', updateServer);
router.delete('/:id', deleteServer);

export default router;
