import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StripeEventAttributes {
  id: number;
  event_id: string;
  event_type: string;
  provider: string;
  payload: string;
  processed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StripeEventCreationAttributes extends Optional<StripeEventAttributes, 'id' | 'processed' | 'createdAt' | 'updatedAt'> {}

class StripeEvent extends Model<StripeEventAttributes, StripeEventCreationAttributes> implements StripeEventAttributes {
  public id!: number;
  public event_id!: string;
  public event_type!: string;
  public provider!: string;
  public payload!: string;
  public processed!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StripeEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    event_type: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'stripe',
    },
    payload: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    processed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'stripe_events',
    modelName: 'StripeEvent',
    timestamps: true,
    underscored: true,
  },
);

export default StripeEvent;
