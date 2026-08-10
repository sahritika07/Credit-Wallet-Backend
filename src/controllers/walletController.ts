import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import Currency from '../models/Currency';
import Wallet from '../models/Wallet';
import WalletLedger from '../models/WalletLedger';
import { createHttpError } from '../utils/httpError';

export const getWallets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wallets = await Wallet.findAll({
      where: { user_id: req.user!.id },
      include: [{ model: Currency, as: 'currency', attributes: ['id', 'name', 'code', 'module', 'price_per_credit_paise'] }],
      order: [['currency_id', 'ASC']],
    });

    res.status(200).json({ success: true, data: wallets });
  } catch (error) {
    next(error);
  }
};

export const getLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currencyId = req.query.currencyId ? Number(req.query.currencyId) : undefined;
    const wallets = await Wallet.findAll({
      where: { user_id: req.user!.id, ...(currencyId ? { currency_id: currencyId } : {}) },
      attributes: ['id'],
    });

    const walletIds = wallets.map((wallet) => wallet.id);
    const entries = walletIds.length
      ? await WalletLedger.findAll({
          where: { wallet_id: { [Op.in]: walletIds } },
          include: [{ model: Currency, as: 'currency', attributes: ['id', 'name', 'code'] }],
          order: [['createdAt', 'DESC']],
        })
      : [];

    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

export const purchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currencyId = Number(req.body.currencyId);
    const quantity = Number(req.body.quantity);
    const description = req.body.description || 'Credit purchase';

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createHttpError(400, 'Quantity must be greater than zero');
    }

    const currency = await Currency.findByPk(currencyId);
    if (!currency) {
      throw createHttpError(404, 'Invalid currency');
    }

    const transaction = await sequelize.transaction();

    try {
      let wallet = await Wallet.findOne({ where: { user_id: req.user!.id, currency_id: currencyId }, transaction });
      if (!wallet) {
        wallet = await Wallet.create({ user_id: req.user!.id, currency_id: currencyId, current_balance: 0 }, { transaction });
      }

      const newBalance = wallet.current_balance + quantity;
      await wallet.update({ current_balance: newBalance }, { transaction });
      await WalletLedger.create(
        {
          wallet_id: wallet.id,
          currency_id: currencyId,
          type: 'purchase',
          amount: quantity,
          balance_after: newBalance,
          reference_type: 'purchase',
          description,
        },
        { transaction },
      );

      await transaction.commit();
      res.status(200).json({ success: true, data: { wallet, currency } });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export default { getWallets, getLedger, purchase };
