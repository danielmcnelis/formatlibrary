'use strict';

const Deck = require("../server/db/models/Deck")
const Entry = require("../server/db/models/Entry")
const Event = require("../server/db/models/Event")
const Iron = require("../server/db/models/Iron")
const Membership = require("../server/db/models/Membership")
const Player = require("../server/db/models/Player")
const Pool = require("../server/db/models/Pool")
const Server = require("../server/db/models/Server")
const Stats = require("../server/db/models/Stats")

module.exports = {
  async up (queryInterface, Sequelize) {
    // // DECKS
    // await queryInterface.sequelize.query(`ALTER TABLE "public"."decks" ALTER COLUMN "playerId" TYPE character varying(255);`)
    // const decks = await Deck.findAll()
    // for (let i = 0; i < decks.length; i++) {
    //     const deck = decks[i]
    //     const player = await Player.findOne({ where: { id: deck.builderId }})
    //     if (!player || !player.uuid) continue
    //     await deck.update({ playerId: player.uuid })
    // }

    // // ENTRIES
    // await queryInterface.sequelize.query(`ALTER TABLE "public"."entries" ALTER COLUMN "playerId" TYPE character varying(255);`)
    // const entries = await Entry.findAll()
    // for (let i = 0; i < entries.length; i++) {
    //     const entry = entries[i]
    //     const player = await Player.findOne({ where: { id: entry.playerId }})
    //     if (!player || !player.uuid) continue
    //     await entry.update({ playerId: player.uuid })
    // }

    // // EVENTS
    // await queryInterface.sequelize.query(`ALTER TABLE "public"."events" ALTER COLUMN "playerId" TYPE character varying(255);`)
    // const events = await Event.findAll()
    // for (let i = 0; i < events.length; i++) {
    //     const event = events[i]
    //     const player = await Player.findOne({ where: { id: event.winnerId }})
    //     if (!player || !player.uuid) continue
    //     await event.update({ playerId: player.uuid })
    // }

    // IRONS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."irons" ALTER COLUMN "playerId" TYPE character varying(255);`)
    const irons = await Iron.findAll()
    for (let i = 0; i < irons.length; i++) {
        const iron = irons[i]
        const player = await Player.findOne({ where: { id: iron.playerId }})
        if (!player || !player.uuid) continue
        await iron.update({ playerId: player.uuid })
    }

    // MEMBERSHIPS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."memberships" ALTER COLUMN "playerId" TYPE character varying(255);`)
    const memberships = await Membership.findAll()
    for (let i = 0; i < memberships.length; i++) {
            const membership = memberships[i]
            const player = await Player.findOne({ where: { id: membership.playerId }})
            if (!player || !player.uuid) continue
            await membership.update({ playerId: player.uuid })
        
    }

    // RATED POOLS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."pools" ALTER COLUMN "playerId" TYPE character varying(255);`)
    const pools = await Pool.findAll()
    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i]
        const player = await Player.findOne({ where: { id: pool.playerId }})
        if (!player || !player.uuid) continue
        await pool.update({ playerId: player.uuid })
    }

    // SERVERS
    await queryInterface.sequelize.query(`ALTER TABLE "public"."servers" ALTER COLUMN "ownerId" TYPE character varying(255);`)
    const servers = await Server.findAll()
    for (let i = 0; i < servers.length; i++) {
        const server = servers[i]
        const player = await Player.findOne({ where: { id: server.ownerId }})
        if (!player || !player.uuid) continue
        await server.update({ ownerId: player.uuid })
    }

    // STATS
    // await queryInterface.sequelize.query(`ALTER TABLE "public"."stats" ALTER COLUMN "playerId" TYPE character varying(255);`)
    // const allStats = await Stats.findAll()
    // for (let i = 0; i < allStats.length; i++) {
    //     const stats = allStats[i]
    //     const player = await Player.findOne({ where: { id: stats.playerId }})
    //     if (!player || !player.uuid) continue
    //     await stats.update({ playerId: player.uuid })
    // }

  },

  async down (queryInterface, Sequelize) {
  }
};
