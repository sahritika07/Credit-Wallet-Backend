import { Router, json, raw } from 'express';
import stripeController from '../controllers/stripeController';
import { authenticate } from '../middleware/authMiddleware';
import { requireFields } from '../middleware/validators';

const router = Router();

router.post('/checkout', authenticate, requireFields(['currencyId', 'quantity']), stripeController.createCheckoutSession);
// Use raw body parser specifically for Stripe webhook so the signature can be verified
router.post('/webhook', raw({ type: 'application/json' }), stripeController.webhook);

export default router;
