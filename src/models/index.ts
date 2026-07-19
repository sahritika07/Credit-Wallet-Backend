import User from './User';
import Currency from './Currency';
import Wallet from './Wallet';
import WalletLedger from './WalletLedger';
import Campaign from './Campaign';
import Payment from './Payment';
import StripeEvent from './StripeEvent';

User.hasMany(Wallet, { foreignKey: 'user_id', as: 'wallets' });
Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Currency.hasMany(Wallet, { foreignKey: 'currency_id', as: 'wallets' });
Wallet.belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' });

Wallet.hasMany(WalletLedger, { foreignKey: 'wallet_id', as: 'ledger_entries' });
WalletLedger.belongsTo(Wallet, { foreignKey: 'wallet_id', as: 'wallet' });

Currency.hasMany(WalletLedger, { foreignKey: 'currency_id', as: 'ledger_entries' });
WalletLedger.belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' });

User.hasMany(Campaign, { foreignKey: 'user_id', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Currency.hasMany(Campaign, { foreignKey: 'currency_id', as: 'campaigns' });
Campaign.belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' });

User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Currency.hasMany(Payment, { foreignKey: 'currency_id', as: 'payments' });
Payment.belongsTo(Currency, { foreignKey: 'currency_id', as: 'currency' });

export { User, Currency, Wallet, WalletLedger, Campaign, Payment, StripeEvent };
export default {
  User,
  Currency,
  Wallet,
  WalletLedger,
  Campaign,
  Payment,
  StripeEvent,
};
