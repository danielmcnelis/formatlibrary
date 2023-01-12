'use strict';

const { query } = require("express");

module.exports = {
  async up (queryInterface, Sequelize) {
    // DROP KEY FROM DECKS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."decks" DROP CONSTRAINT "decks_playerId_fkey";`)
    // DROP KEY FROM ENTRIES
    await queryInterface.sequelize.query(`ALTER TABLE "public"."entries" DROP CONSTRAINT "entries_playerId_fkey";`)
    // DROP KEY FROM EVENTS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."events" DROP CONSTRAINT "events_playerId_fkey";`)
    // DROP KEY FROM IRONS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."irons" DROP CONSTRAINT "irons_playerId_fkey";`)
    // DROP KEY FROM MEMBERSHIPS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."memberships" DROP CONSTRAINT "memberships_playerId_fkey";`)
    // DROP KEY FROM POOLS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."pools" DROP CONSTRAINT "pools_playerId_fkey";`)
    // DROP KEY FROM SERVERS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."servers" DROP CONSTRAINT "servers_ownerId_fkey";`)
    // DROP KEY FROM STATS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."stats" DROP CONSTRAINT "stats_playerId_fkey";`)
  },

  async down (queryInterface, Sequelize) {
    // ADD KEY TO DECKS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."decks" ADD FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;`)
    // ADD KEY TO ENTRIES
    await queryInterface.sequelize.query(`ALTER TABLE "public"."entries" ADD FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;`)
    // ADD KEY TO EVENTS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."events" ADD FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;`)
    // ADD KEY TO IRONS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."irons" ADD FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;`)
    // ADD KEY TO MEMBERSHIPS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."memberships" ADD FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;`)
    // ADD KEY TO POOLS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."pools" ADD FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;`)
    // ADD KEY TO SERVERS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."servers" ADD FOREIGN KEY ("ownerId") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;`)
    // ADD KEY TO STATS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."stats" ADD FOREIGN KEY ("playerId") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;`)
  }
};
