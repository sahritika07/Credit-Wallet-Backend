import { Router } from 'express';
import walletController from '../controllers/walletController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, walletController.getWallets);
router.get('/ledger', authenticate, walletController.getLedger);
router.post('/purchase', authenticate, walletController.purchase);

export default router;
