import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CurrencyAttributes {
  id: number;
  name: string;
  code: string;
  module: string;
  price_per_credit_paise: number;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CurrencyCreationAttributes extends Optional<CurrencyAttributes, 'id' | 'is_active' | 'createdAt' | 'updatedAt'> {}

class Currency extends Model<CurrencyAttributes, CurrencyCreationAttributes> implements CurrencyAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public module!: string;
  public price_per_credit_paise!: number;
  public is_active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Currency.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    price_per_credit_paise: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'currencies',
    modelName: 'Currency',
    timestamps: true,
    underscored: true,
  },
);

export default Currency;
