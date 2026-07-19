import { Router } from 'express';
import stripeController from '../controllers/stripeController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/checkout', authenticate, stripeController.createCheckoutSession);
router.post('/webhook', stripeController.webhook);

export default router;
