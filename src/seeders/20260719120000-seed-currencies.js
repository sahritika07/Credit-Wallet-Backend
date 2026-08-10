module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('currencies', [
      {
        name: 'Campaign Credits',
        code: 'CAMPAIGN',
        module: 'campaign',
        price_per_credit_paise: 300,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Report Credits',
        code: 'REPORT',
        module: 'report',
        price_per_credit_paise: 1000,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Discovery Credits',
        code: 'DISCOVERY',
        module: 'discovery',
        price_per_credit_paise: 500,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('currencies', null, {});
  },
};
