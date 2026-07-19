import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PaymentAttributes {
  id: number;
  user_id: number;
  currency_id: number;
  amount_paise: number;
  credits_purchased: number;
  provider: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status' | 'stripe_session_id' | 'stripe_payment_intent_id' | 'createdAt' | 'updatedAt'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public user_id!: number;
  public currency_id!: number;
  public amount_paise!: number;
  public credits_purchased!: number;
  public provider!: string;
  public status!: 'pending' | 'succeeded' | 'failed' | 'refunded';
  public stripe_session_id!: string | null;
  public stripe_payment_intent_id!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currency_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount_paise: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    credits_purchased: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'stripe',
    },
    status: {
      type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    stripe_session_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    stripe_payment_intent_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    modelName: 'Payment',
    timestamps: true,
    underscored: true,
  },
);

export default Payment;
