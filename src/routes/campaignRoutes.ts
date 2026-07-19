import { Router } from 'express';
import campaignController from '../controllers/campaignController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticate, campaignController.create);
router.post('/:id/fund', authenticate, campaignController.fund);

export default router;
