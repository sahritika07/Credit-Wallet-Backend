import { Request, Response, NextFunction } from 'express';
import campaignService from '../services/campaignService';

class CampaignController {
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await campaignService.createCampaign(req.user!.id, {
        title: req.body.title,
        description: req.body.description,
        targetAmount: req.body.targetAmount,
        currencyId: req.body.currencyId,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public fund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await campaignService.fundCampaign(req.user!.id, Number(req.params.id), req.body.currencyId, Number(req.body.amount));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default new CampaignController();
