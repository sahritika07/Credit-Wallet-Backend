import Stripe from 'stripe';
import sequelize from '../config/database';
import Currency from '../models/Currency';
import Payment from '../models/Payment';
import Wallet from '../models/Wallet';
import WalletLedger from '../models/WalletLedger';
import StripeEvent from '../models/StripeEvent';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
});

class StripeService {
  public async createCheckoutSession(userId: number, currencyId: number, quantity: number) {
    const currency = await Currency.findByPk(currencyId);
    if (!currency) {
      throw new Error('Invalid currency');
    }

    const amountPaise = currency.price_per_credit_paise * quantity;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `${currency.name} - ${quantity} credits`,
            },
            unit_amount: amountPaise,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/payment/cancel`,
      metadata: {
        userId: String(userId),
        currencyId: String(currencyId),
        quantity: String(quantity),
      },
    });

    const payment = await Payment.create({
      user_id: userId,
      currency_id: currencyId,
      amount_paise: amountPaise,
      credits_purchased: quantity,
      provider: 'stripe',
      status: 'pending',
      stripe_session_id: session.id,
    });

    return { success: true, data: { checkoutUrl: session.url, paymentId: payment.id } };
  }

  public async handleWebhook(payload: string, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    const existing = await StripeEvent.findOne({ where: { event_id: event.id } });
    if (existing) {
      return { success: true, message: 'Duplicate event ignored', data: existing };
    }

    const savedEvent = await StripeEvent.create({
      event_id: event.id,
      event_type: event.type,
      provider: 'stripe',
      payload,
      processed: false,
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = Number(session.metadata?.userId);
      const currencyId = Number(session.metadata?.currencyId);
      const quantity = Number(session.metadata?.quantity);

      if (!userId || !currencyId || !quantity) {
        throw new Error('Invalid webhook metadata');
      }

      const transaction = await sequelize.transaction();
      try {
        const payment = await Payment.findOne({ where: { stripe_session_id: session.id }, transaction });
        if (!payment) {
          throw new Error('Payment record not found');
        }
        if (payment.status === 'succeeded') {
          await transaction.commit();
          return { success: true, message: 'Payment already processed' };
        }

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
            reference_type: 'stripe',
            reference_id: payment.id,
            description: 'Stripe purchase credit grant',
          },
          { transaction },
        );

        await payment.update({ status: 'succeeded', stripe_payment_intent_id: session.payment_intent as string | null }, { transaction });
        await savedEvent.update({ processed: true }, { transaction });
        await transaction.commit();

        return { success: true, message: 'Credits granted' };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    await savedEvent.update({ processed: true });
    return { success: true, message: 'Webhook processed' };
  }
}

export default new StripeService();
