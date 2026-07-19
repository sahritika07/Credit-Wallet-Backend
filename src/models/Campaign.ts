import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CampaignAttributes {
  id: number;
  user_id: number;
  currency_id: number;
  title: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  status: 'draft' | 'active' | 'funded' | 'closed';
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'description' | 'current_amount' | 'status' | 'createdAt' | 'updatedAt'> {}

class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  public id!: number;
  public user_id!: number;
  public currency_id!: number;
  public title!: string;
  public description!: string | null;
  public target_amount!: number;
  public current_amount!: number;
  public status!: 'draft' | 'active' | 'funded' | 'closed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Campaign.init(
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
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    target_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    current_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'funded', 'closed'),
      allowNull: false,
      defaultValue: 'draft',
    },
  },
  {
    sequelize,
    tableName: 'campaigns',
    modelName: 'Campaign',
    timestamps: true,
    underscored: true,
  },
);

export default Campaign;
