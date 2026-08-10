import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import sequelize from '../config/database';
import Currency from '../models/Currency';
import Payment from '../models/Payment';
import Wallet from '../models/Wallet';
import WalletLedger from '../models/WalletLedger';
import StripeEvent from '../models/StripeEvent';
import { createHttpError } from '../utils/httpError';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
});

const getStripeMinimumAmount = () => {
  const configuredValue = Number(process.env.STRIPE_MINIMUM_AMOUNT_PAISE || 0);
  return Number.isFinite(configuredValue) && configuredValue > 0 ? configuredValue : 50;
};

export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const currencyId = Number(req.body.currencyId);
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createHttpError(400, 'Quantity must be greater than zero');
    }

    const currency = await Currency.findByPk(currencyId);
    if (!currency) {
      throw createHttpError(404, 'Invalid currency');
    }

    const amountPaise = currency.price_per_credit_paise * quantity;
    const minimumAmount = getStripeMinimumAmount();

    if (amountPaise < minimumAmount) {
      throw createHttpError(
        400,
        `Minimum checkout amount is ${(minimumAmount / 100).toFixed(2)} INR for this Stripe setup`,
        {
          amountPaise,
          minimumAmountPaise: minimumAmount,
          minimumQuantity: Math.ceil(minimumAmount / currency.price_per_credit_paise),
        },
      );
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `${currency.name} credit`,
              },
              unit_amount: currency.price_per_credit_paise,
            },
            quantity,
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

      res.status(200).json({
        success: true,
        data: { checkoutUrl: session.url, paymentId: payment.id },
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        throw createHttpError(400, error.message);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const webhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const raw = req.body as Buffer;
    const payloadString = raw && raw.length ? raw.toString('utf8') : '';
    const signature = Array.isArray(req.headers['stripe-signature']) ? req.headers['stripe-signature'][0] : (req.headers['stripe-signature'] as string | undefined) || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
    const event = stripe.webhooks.constructEvent(payloadString, signature, webhookSecret);

    const existing = await StripeEvent.findOne({ where: { event_id: event.id } });
    if (existing) {
      res.status(200).json({ success: true, message: 'Duplicate event ignored', data: existing });
      return;
    }

    const savedEvent = await StripeEvent.create({
      event_id: event.id,
      event_type: event.type,
      provider: 'stripe',
      payload: payloadString,
      processed: false,
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = Number(session.metadata?.userId);
      const currencyId = Number(session.metadata?.currencyId);
      const quantity = Number(session.metadata?.quantity);

      if (!userId || !currencyId || !quantity) {
        throw createHttpError(400, 'Invalid webhook metadata');
      }

      const transaction = await sequelize.transaction();

      try {
        const payment = await Payment.findOne({ where: { stripe_session_id: session.id }, transaction });
        if (!payment) {
          throw createHttpError(404, 'Payment record not found');
        }

        if (payment.status === 'succeeded') {
          await transaction.commit();
          res.status(200).json({ success: true, message: 'Payment already processed' });
          return;
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

        await payment.update(
          { status: 'succeeded', stripe_payment_intent_id: session.payment_intent as string | null },
          { transaction },
        );
        await savedEvent.update({ processed: true }, { transaction });
        await transaction.commit();

        res.status(200).json({ success: true, message: 'Credits granted' });
        return;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    await savedEvent.update({ processed: true });
    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    next(error);
  }
};

export default { createCheckoutSession, webhook };
