import { db, Alius, Archetype, Article, Artwork, BlogPost, Card, CardDeckType, ChronRecord, Community, Cube, Deck, DeckThumb, DeckType, DeckTypeArchetype, Draft, DraftEntry, Entry, Errata, Event, Format, Inventory, LikedArticle, LikedCube, LikedDeck, LikedFormat, LikedVideo, Match, Matchup, Membership, PackContent, Pairing, Player, Pool, Price, Print, Replay, Role, Ruling, Series, Server, Set, Stats, Status, Subscription, Team, Tournament, TriviaEntry, TriviaKnowledge, TriviaQuestion, Video } from "@fl/models";

console.log('!!!')
;(async () => {
    console.log('???')
	try {
        console.log('?!?!?!')
        const seed = async () => {
            console.log('seeding')
            console.log('db.sync', db.sync)
            await db.sync({force: true})
            const player = await Player.create({id: 'UeyvnNBD6CD53gsqRQsxCY', name: 'Jazz'})
            console.log('db.close', db.close)
            db.close()
            console.log(`Seeding successful! FL is now ready to rock!`)
        }
        
        seed().catch(err => {
          db.close()
          console.log(`
            Error seeding:
            ${err.message}
            ${err.stack}
          `)
        })        
    } catch (err) {
		console.log(err)
	}

    process.exit(0)
})();

