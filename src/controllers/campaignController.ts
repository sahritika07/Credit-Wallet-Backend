import { Request, Response, NextFunction } from 'express';
import sequelize from '../config/database';
import Campaign from '../models/Campaign';
import Currency from '../models/Currency';
import Wallet from '../models/Wallet';
import WalletLedger from '../models/WalletLedger';
import { createHttpError } from '../utils/httpError';

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaigns = await Campaign.findAll({
      where: { user_id: req.user!.id },
      include: [{ model: Currency, as: 'currency', attributes: ['id', 'name', 'code', 'module', 'price_per_credit_paise'] }],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currencyId = Number(req.body.currencyId);
    const targetAmount = Number(req.body.targetAmount);

    const currency = await Currency.findByPk(currencyId);
    if (!currency) {
      throw createHttpError(404, 'Invalid currency');
    }

    if (!Number.isInteger(targetAmount) || targetAmount <= 0) {
      throw createHttpError(400, 'Target amount must be greater than zero');
    }

    const campaign = await Campaign.create({
      user_id: req.user!.id,
      currency_id: currencyId,
      title: String(req.body.title).trim(),
      description: req.body.description || null,
      target_amount: targetAmount,
      current_amount: 0,
      status: 'active',
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const fund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = Number(req.params.id);
    const currencyId = Number(req.body.currencyId);
    const amount = Number(req.body.amount);

    if (!Number.isInteger(amount) || amount <= 0) {
      throw createHttpError(400, 'Amount must be greater than zero');
    }

    const currency = await Currency.findByPk(currencyId);
    if (!currency || currency.module !== 'campaign') {
      throw createHttpError(400, 'Only campaign credits can fund campaigns');
    }

    const transaction = await sequelize.transaction();

    try {
      const campaign = await Campaign.findByPk(campaignId, { transaction });
      if (!campaign) {
        throw createHttpError(404, 'Campaign not found');
      }
      if (campaign.status === 'funded' || campaign.status === 'closed') {
        throw createHttpError(400, 'Campaign already funded');
      }

      const wallet = await Wallet.findOne({ where: { user_id: req.user!.id, currency_id: currencyId }, transaction });
      if (!wallet || wallet.current_balance < amount) {
        throw createHttpError(400, 'Insufficient balance');
      }

      const newBalance = wallet.current_balance - amount;
      await wallet.update({ current_balance: newBalance }, { transaction });
      await WalletLedger.create(
        {
          wallet_id: wallet.id,
          currency_id: currencyId,
          type: 'spend',
          amount: -amount,
          balance_after: newBalance,
          reference_type: 'campaign',
          reference_id: campaign.id,
          description: 'Campaign funding',
        },
        { transaction },
      );

      const updatedCampaign = await campaign.update(
        { current_amount: campaign.current_amount + amount, status: 'funded' },
        { transaction },
      );

      await transaction.commit();
      res.status(200).json({ success: true, data: updatedCampaign });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export default { list, create, fund };
