import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { requireFields } from '../middleware/validators';

const router = Router();

router.post('/signup', requireFields(['full_name', 'email', 'password']), authController.signup);
router.post('/login', requireFields(['email', 'password']), authController.login);
router.get('/profile', authenticate, authController.profile);

export default router;
