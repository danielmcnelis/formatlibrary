'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.sequelize.query(`ALTER TABLE "public"."players" RENAME COLUMN "id" TO "oldId"; ALTER TABLE "public"."players" RENAME COLUMN "uuid" TO "id";`)
  },

  async down (queryInterface, Sequelize) {
    queryInterface.sequelize.query(`ALTER TABLE "public"."players" RENAME COLUMN "id" TO "uuid"; ALTER TABLE "public"."players" RENAME COLUMN "oldId" TO "id";`)
  }
};
