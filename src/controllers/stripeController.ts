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
      // req.body will be the raw request body (Buffer) when express.raw is used on the route
      const raw = req.body as Buffer;
      const payloadString = raw && raw.length ? raw.toString('utf8') : '';
      const signature = Array.isArray(req.headers['stripe-signature']) ? req.headers['stripe-signature'][0] : (req.headers['stripe-signature'] as string | undefined) || '';
      const result = await stripeService.handleWebhook(payloadString, signature);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default new StripeController();
