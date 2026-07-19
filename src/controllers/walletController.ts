import { Request, Response, NextFunction } from 'express';
import walletService from '../services/walletService';

class WalletController {
  public getWallets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await walletService.getWallets(req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currencyId = req.query.currencyId ? Number(req.query.currencyId) : undefined;
      const result = await walletService.getLedger(req.user!.id, currencyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public purchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currencyId, quantity, description } = req.body;
      const result = await walletService.purchaseCredits(req.user!.id, currencyId, quantity, description);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default new WalletController();
