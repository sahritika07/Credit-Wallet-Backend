import { Request, Response, NextFunction } from 'express';
import stripeService from '../services/stripeService';

class StripeController {
  public createCheckoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currencyId, quantity } = req.body;
      const result = await stripeService.createCheckoutSession(req.user!.id, Number(currencyId), Number(quantity));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public webhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body;
      const signature = req.headers['stripe-signature'];
      const result = await stripeService.handleWebhook(JSON.stringify(payload), Array.isArray(signature) ? signature[0] : signature || '');
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default new StripeController();
