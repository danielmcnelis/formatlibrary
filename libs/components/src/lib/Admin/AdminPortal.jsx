
import { useState, useEffect } from 'react'
import { BanListCreator, BracketCreator, CardCreator, DeckCreator, DeckTypeCreator, EventCreator, ImageCreator, PlayerCreator, YDKCreator } from './Creators'
import { NotFound } from '../General/NotFound'
import { getCookie } from '@fl/utils'
import axios from 'axios'
import './AdminPortal.css'

const playerId = getCookie('playerId')

export const AdminPortal = () => {
  const [isContentManager, setIsContentManager] = useState(true)
  const [view, setView] = useState(false)

    // USE EFFECT
    useEffect(() => {
        const checkRoles = async () => {
            try {
                const accessToken = getCookie('access')
                const { data: player } = await axios.get(`/api/players/roles`, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })

                if (player.contentManager) setIsContentManager(true)
            } catch (err) {
                console.log(err)
            }
        }

        if (playerId) checkRoles()
    }, [])

  // SWITCH VIEW
  const switchView = (view) => {
    switch (view) {
        case 'events':
            return <EventCreator/>
        case 'cards':
            return <CardCreator/>
        case 'decks':
            return <DeckCreator/>
        case 'deck-types':
            return <DeckTypeCreator/>
        case 'players':
            return <PlayerCreator/>
        case 'images':
            return <ImageCreator/>
        case 'ban-lists':
            return <BanListCreator/>
        case 'bracket':
            return <BracketCreator/>
        case 'ydk':
            return <YDKCreator/>
        default:
            return ''
    }
  }

  if (isContentManager) {
    return (
        <div className="body">
            <h1>Admin Portal</h1>
            <div className="admin-menu">
                <div onClick={() => setView('events')} className={view === 'events' ? 'clicked-admin-button' : 'admin-button'}>New Event</div>
                <div onClick={() => setView('decks')} className={view === 'decks' ? 'clicked-admin-button' : 'admin-button'}>Upload Deck</div>
                <div onClick={() => setView('deck-types')} className={view === 'deck-types' ? 'clicked-admin-button' : 'admin-button'}>New Deck Type</div>
                <div onClick={() => setView('players')} className={view === 'players' ? 'clicked-admin-button' : 'admin-button'}>New Player</div>
                <div onClick={() => setView('cards')} className={view === 'cards' ? 'clicked-admin-button' : 'admin-button'}>New Card</div>
                <div onClick={() => setView('images')} className={view === 'images' ? 'clicked-admin-button' : 'admin-button'}>Upload Image</div>
                <div onClick={() => setView('ban-lists')} className={view === 'ban-lists' ? 'clicked-admin-button' : 'admin-button'}>New Ban List</div>
                <div onClick={() => setView('bracket')} className={view === 'bracket' ? 'clicked-admin-button' : 'admin-button'}>Mock Bracket</div>
                <div onClick={() => setView('ydk')} className={view === 'ydk' ? 'clicked-admin-button' : 'admin-button'}>Convert to YDK</div>
            </div>
            <div>{switchView(view)}</div>
        </div>
    )
  } else {
    return <NotFound/>
  }
}
