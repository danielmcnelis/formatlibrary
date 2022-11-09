'use strict';

const Player = require("../server/db/models/Player");

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TABLE "public"."players"
    ADD COLUMN "uuid" character varying(255),
    ADD UNIQUE ("uuid");`)

    const players = await Player.findAll()
    for (let i = 0; i < players.length; i++) {
        const player = players[i]
        const uuid = await Player.generateId()
        await player.update({ uuid })
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TABLE "public"."players" DROP COLUMN "uuid";`)
  }
};
