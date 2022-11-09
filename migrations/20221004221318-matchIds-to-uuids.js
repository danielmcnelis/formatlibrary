'use strict';

const {Match} = require("../libs/models/src/lib/Match.js"
const {Player} = require("../libs/models/src/lib/Player.js")


module.exports = {
  async up (queryInterface, Sequelize) {
    // // DECKS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."matches" ALTER COLUMN "winnerId" TYPE character varying(255);`)
    await queryInterface.sequelize.query(`ALTER TABLE "public"."matches" ALTER COLUMN "loserId" TYPE character varying(255);`)
    const matches = await Match.findAll()
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        const winner = await Player.findOne({ where: { oldId: match.winnerId }})
        if (!winner || !winner.id) continue
        const loser = await Player.findOne({ where: { oldId: match.loserId }})
        if (!loser || !loser.id) continue
        await match.update({ 
            winnerId: winner.id,
            loserId: loser.id
        })
    }
  },

  async down (queryInterface, Sequelize) {
  }
};
