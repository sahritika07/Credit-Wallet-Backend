import { Router } from 'express';
import { signup, login, profile } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { requireFields } from '../middleware/validators';

const router = Router();

router.post('/signup', requireFields(['full_name', 'email', 'password']), signup);
router.post('/login', requireFields(['email', 'password']), login);
router.get('/profile', authenticate, profile);

export default router;
