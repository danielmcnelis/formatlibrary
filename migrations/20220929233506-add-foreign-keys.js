'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // DECKS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."decks" ADD CONSTRAINT "decks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."players"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;`)
    
    // ENTRIES
    await queryInterface.sequelize.query(`ALTER TABLE "public"."entries" ADD CONSTRAINT "entries_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."players"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;`)
    
    // EVENTS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."events" ADD CONSTRAINT "events_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."players"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;`)
    
    // IRONS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."irons" ADD CONSTRAINT "irons_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."players"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;`)
    
    // MEMBERSHIPS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."players"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;`)
    
    // POOLS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."pools" ADD CONSTRAINT "pools_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."players"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;`)
    
    // SERVERS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."servers" ADD CONSTRAINT "servers_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."players"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;`)
    
    // STATS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."stats" ADD CONSTRAINT "stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."players"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;`)
  },

  async down (queryInterface, Sequelize) {
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
  }
};
