import { Router } from 'express';
import { createCheckoutSession, webhook } from '../controllers/stripeController';
import { authenticate } from '../middleware/authMiddleware';
import { requireFields } from '../middleware/validators';

const router = Router();

router.post('/checkout', authenticate, requireFields(['currencyId', 'quantity']), createCheckoutSession);
router.post('/webhook', webhook);

export default router;
