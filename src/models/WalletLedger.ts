import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface WalletLedgerAttributes {
  id: number;
  wallet_id: number;
  currency_id: number;
  type: 'purchase' | 'spend' | 'refund' | 'adjustment';
  amount: number;
  balance_after: number;
  reference_type?: string | null;
  reference_id?: number | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WalletLedgerCreationAttributes extends Optional<WalletLedgerAttributes, 'id' | 'reference_type' | 'reference_id' | 'description' | 'createdAt' | 'updatedAt'> {}

class WalletLedger extends Model<WalletLedgerAttributes, WalletLedgerCreationAttributes> implements WalletLedgerAttributes {
  public id!: number;
  public wallet_id!: number;
  public currency_id!: number;
  public type!: 'purchase' | 'spend' | 'refund' | 'adjustment';
  public amount!: number;
  public balance_after!: number;
  public reference_type!: string | null;
  public reference_id!: number | null;
  public description!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WalletLedger.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    wallet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currency_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('purchase', 'spend', 'refund', 'adjustment'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balance_after: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'wallet_ledger',
    modelName: 'WalletLedger',
    timestamps: true,
    underscored: true,
  },
);

export default WalletLedger;
