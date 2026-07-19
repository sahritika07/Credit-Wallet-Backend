import { Op } from 'sequelize';
import sequelize from '../config/database';
import Currency from '../models/Currency';
import Wallet from '../models/Wallet';
import WalletLedger from '../models/WalletLedger';

class WalletService {
  public async getWallets(userId: number) {
    const wallets = await Wallet.findAll({
      where: { user_id: userId },
      include: [{ model: Currency, as: 'currency', attributes: ['id', 'name', 'code', 'module', 'price_per_credit_paise'] }],
      order: [['currency_id', 'ASC']],
    });

    return { success: true, data: wallets };
  }

  public async getLedger(userId: number, currencyId?: number) {
    const wallets = await Wallet.findAll({
      where: { user_id: userId, ...(currencyId ? { currency_id: currencyId } : {}) },
      attributes: ['id'],
    });

    const walletIds = wallets.map((wallet) => wallet.id);
    const entries = await WalletLedger.findAll({
      where: { wallet_id: { [Op.in]: walletIds } },
      include: [{ model: Currency, as: 'currency', attributes: ['id', 'name', 'code'] }],
      order: [['createdAt', 'DESC']],
    });

    return { success: true, data: entries };
  }

  public async createWalletsForUser(userId: number) {
    const currencies = await Currency.findAll({ where: { is_active: true } });

    await Promise.all(
      currencies.map(async (currency) => {
        await Wallet.findOrCreate({
          where: { user_id: userId, currency_id: currency.id },
          defaults: { user_id: userId, currency_id: currency.id, current_balance: 0 },
        });
      }),
    );
  }

  public async purchaseCredits(userId: number, currencyId: number, quantity: number, description = 'Credit purchase') {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    const currency = await Currency.findByPk(currencyId);
    if (!currency) {
      throw new Error('Invalid currency');
    }

    const transaction = await sequelize.transaction();

    try {
      let wallet = await Wallet.findOne({ where: { user_id: userId, currency_id: currencyId }, transaction });
      if (!wallet) {
        wallet = await Wallet.create({ user_id: userId, currency_id: currencyId, current_balance: 0 }, { transaction });
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
      return { success: true, data: { wallet, currency } };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async spendCredits(userId: number, currencyId: number, quantity: number, referenceType: string, referenceId: number, description: string) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    const transaction = await sequelize.transaction();

    try {
      const wallet = await Wallet.findOne({ where: { user_id: userId, currency_id: currencyId }, transaction });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.current_balance < quantity) {
        throw new Error('Insufficient balance');
      }

      const newBalance = wallet.current_balance - quantity;
      await wallet.update({ current_balance: newBalance }, { transaction });
      await WalletLedger.create(
        {
          wallet_id: wallet.id,
          currency_id: currencyId,
          type: 'spend',
          amount: -quantity,
          balance_after: newBalance,
          reference_type: referenceType,
          reference_id: referenceId,
          description,
        },
        { transaction },
      );

      await transaction.commit();
      return { success: true, data: { wallet } };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new WalletService();
