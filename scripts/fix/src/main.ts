import { Deck, DeckType, DeckThumb, Event, Format, Player } from '@fl/models'
// import { Op } from 'sequelize'

;(async () => {
    const decks = await Deck.findAll({ include: [DeckType, Event, Format, Player] })
    let a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, k = 0, l = 0

    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]

        // change Deck origin from 'event' to 'user' if no associated Event is found
        if (!deck.eventId && deck.origin === 'event') {
            await deck.update({ origin: 'user' })
            a++
        }

        // synchronize Deck types with DeckType names
        if (deck.deckType?.name && deck.deckType.name !== deck.type) {
            await deck.update({ type: deck.deckType.name })
            b++
        }

        // synchronize Deck categories with DeckType categories
        if (deck.deckType?.category && deck.deckType.category !== deck.category) {
            await deck.update({ category: deck.deckType.category })
            c++
        }

        // synchronize Deck event-names with Event abbreviations
        if (deck.event?.abbreviation && deck.event.abbreviation !== deck.eventName) {
            await deck.update({ eventName: deck.event.abbreviation })
            d++
        }

        // synchronize Deck event-names with Event abbreviations
        if (deck.event?.community && deck.event.community !== deck.community) {
            await deck.update({ community: deck.event.community })
            k++
        }

        // synchronize Deck publish-dates with Event end-dates
        if (deck.event?.endDate && deck.event.endDate !== deck.publishDate) {
            await deck.update({ publishDate: deck.event.endDate })
            e++
        }

        // synchronize Deck format-names with Format names
        if (deck.format?.name && deck.format.name !== deck.formatName) {
            await deck.update({ formatName: deck.format.name })
            f++
        }

        // synchronize Deck builders with Player names
        if (deck.player?.name && deck.player.name !== deck.builder) {
            await deck.update({ builder: deck.player.name })
            g++
        }
    }

    console.log(`changed ${a} deck origins from 'event' to 'user'`)
    console.log(`synchronized ${b} Deck types with DeckType names`)
    console.log(`synchronized ${c} Deck categories with DeckType categories`)
    console.log(`synchronized ${d} Deck eventNames with Event abbreviations`)
    console.log(`synchronized ${k} Deck communities with Event communities`)
    console.log(`synchronized ${e} Deck publishDates with Event endDates`)
    console.log(`synchronized ${f} Deck formatNames with Format names`)
    console.log(`synchronized ${g} Deck builders with Player names`)

    const deckThumbs = await DeckThumb.findAll({ include: DeckType })

    for (let i = 0; i < deckThumbs.length; i++) {
        const deckThumb = deckThumbs[i]

        // synchronize DeckThumb names with DeckType names
        if (deckThumb.deckType?.name && deckThumb.name !== deckThumb.deckType.name) {
            await deckThumb.update({ name: deckThumb.deckType.name })
            h++
        }
    }

    console.log(`synchronized ${h} DeckThumb names with DeckType names`)

    const deckTypes = await DeckType.findAll()

    for (let i = 0; i < deckTypes.length; i++) {
        const deckType = deckTypes[i]

        const count = await Deck.count({
            where: {
                deckTypeId: deckType.id
            }
        })

        if (!count) {
            console.log(`deleting DeckType: ${deckType.name}`)
            await deckType.destroy()
            l++
        }
    }

    console.log(`deleted ${l} DeckTypes without a corresponding Deck`)
})()
