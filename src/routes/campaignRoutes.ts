import { Router } from 'express';
import campaignController from '../controllers/campaignController';
import { authenticate } from '../middleware/authMiddleware';
import { requireFields } from '../middleware/validators';

const router = Router();

router.post('/', authenticate, requireFields(['title', 'targetAmount', 'currencyId']), campaignController.create);
router.post('/:id/fund', authenticate, requireFields(['currencyId', 'amount']), campaignController.fund);

export default router;
