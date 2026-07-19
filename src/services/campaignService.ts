import sequelize from '../config/database';
import Campaign from '../models/Campaign';
import Currency from '../models/Currency';
import Wallet from '../models/Wallet';
import WalletLedger from '../models/WalletLedger';

class CampaignService {
  public async createCampaign(userId: number, input: { title: string; description?: string; targetAmount: number; currencyId: number }) {
    const currency = await Currency.findByPk(input.currencyId);
    if (!currency) {
      throw new Error('Invalid currency');
    }

    const campaign = await Campaign.create({
      user_id: userId,
      currency_id: input.currencyId,
      title: input.title,
      description: input.description || null,
      target_amount: input.targetAmount,
      current_amount: 0,
      status: 'active',
    });

    return { success: true, data: campaign };
  }

  public async fundCampaign(userId: number, campaignId: number, currencyId: number, amount: number) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const currency = await Currency.findByPk(currencyId);
    if (!currency || currency.module !== 'campaign') {
      throw new Error('Only campaign credits can fund campaigns');
    }

    const transaction = await sequelize.transaction();

    try {
      const campaign = await Campaign.findByPk(campaignId, { transaction });
      if (!campaign) {
        throw new Error('Campaign not found');
      }
      if (campaign.status === 'funded' || campaign.status === 'closed') {
        throw new Error('Campaign already funded');
      }

      const wallet = await Wallet.findOne({ where: { user_id: userId, currency_id: currencyId }, transaction });
      if (!wallet || wallet.current_balance < amount) {
        throw new Error('Insufficient balance');
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

      const updatedCampaign = await campaign.update({ current_amount: campaign.current_amount + amount, status: 'funded' }, { transaction });
      await transaction.commit();

      return { success: true, data: updatedCampaign };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new CampaignService();
