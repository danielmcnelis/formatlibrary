'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TABLE "public"."players" DROP CONSTRAINT "players_pkey", ADD PRIMARY KEY ("uuid");`)
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TABLE "public"."players" DROP CONSTRAINT "players_pkey", ADD PRIMARY KEY ("id");`)
  }
};
