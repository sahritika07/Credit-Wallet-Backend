import { Router } from 'express';
import { list, create, fund } from '../controllers/campaignController';
import { authenticate } from '../middleware/authMiddleware';
import { requireFields } from '../middleware/validators';

const router = Router();

router.get('/', authenticate, list);
router.post('/', authenticate, requireFields(['title', 'targetAmount', 'currencyId']), create);
router.post('/:id/fund', authenticate, requireFields(['currencyId', 'amount']), fund);

export default router;
