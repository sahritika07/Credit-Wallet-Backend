import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface WalletAttributes {
  id: number;
  user_id: number;
  currency_id: number;
  current_balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WalletCreationAttributes extends Optional<WalletAttributes, 'id' | 'current_balance' | 'createdAt' | 'updatedAt'> {}

class Wallet extends Model<WalletAttributes, WalletCreationAttributes> implements WalletAttributes {
  public id!: number;
  public user_id!: number;
  public currency_id!: number;
  public current_balance!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Wallet.init(
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
    current_balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'wallets',
    modelName: 'Wallet',
    timestamps: true,
    underscored: true,
  },
);

export default Wallet;
