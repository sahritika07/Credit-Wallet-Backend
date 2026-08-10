import { Router } from 'express';
import { getWallets, getLedger, purchase } from '../controllers/walletController';
import { authenticate } from '../middleware/authMiddleware';
import { requireFields } from '../middleware/validators';

const router = Router();

router.get('/', authenticate, getWallets);
router.get('/ledger', authenticate, getLedger);
router.post('/purchase', authenticate, requireFields(['currencyId', 'quantity']), purchase);

export default router;
