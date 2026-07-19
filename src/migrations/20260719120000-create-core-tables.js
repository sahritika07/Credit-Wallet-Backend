module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      full_name: { type: Sequelize.STRING(150), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'user' },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('currencies', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      module: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      price_per_credit_paise: { type: Sequelize.INTEGER, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('wallets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      currency_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'currencies', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      current_balance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('wallets', ['user_id', 'currency_id'], { unique: true, name: 'wallets_user_currency_unique' });

    await queryInterface.createTable('wallet_ledger', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      wallet_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'wallets', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      currency_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'currencies', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      type: { type: Sequelize.ENUM('purchase', 'spend', 'refund', 'adjustment'), allowNull: false },
      amount: { type: Sequelize.INTEGER, allowNull: false },
      balance_after: { type: Sequelize.INTEGER, allowNull: false },
      reference_type: { type: Sequelize.STRING(50), allowNull: true },
      reference_id: { type: Sequelize.INTEGER, allowNull: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('campaigns', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      currency_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'currencies', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      target_amount: { type: Sequelize.INTEGER, allowNull: false },
      current_amount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.ENUM('draft', 'active', 'funded', 'closed'), allowNull: false, defaultValue: 'draft' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('payments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      currency_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'currencies', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      amount_paise: { type: Sequelize.INTEGER, allowNull: false },
      credits_purchased: { type: Sequelize.INTEGER, allowNull: false },
      provider: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'stripe' },
      status: { type: Sequelize.ENUM('pending', 'succeeded', 'failed', 'refunded'), allowNull: false, defaultValue: 'pending' },
      stripe_session_id: { type: Sequelize.STRING(255), allowNull: true },
      stripe_payment_intent_id: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('stripe_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      event_id: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      event_type: { type: Sequelize.STRING(150), allowNull: false },
      provider: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'stripe' },
      payload: { type: Sequelize.TEXT, allowNull: false },
      processed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stripe_events');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('campaigns');
    await queryInterface.dropTable('wallet_ledger');
    await queryInterface.dropTable('wallets');
    await queryInterface.dropTable('currencies');
    await queryInterface.dropTable('users');
  },
};
