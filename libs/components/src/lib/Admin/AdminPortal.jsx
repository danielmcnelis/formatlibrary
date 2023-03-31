
import { useState, useEffect } from 'react'
import { BanListCreator } from './BanListCreator'
import { CardCreator } from './CardCreator'
import { DeckCreator } from './DeckCreator'
import { DeckTypeCreator } from './DeckTypeCreator'
import { EventCreator } from './EventCreator'
import { ImageCreator } from './ImageCreator'
import { PlayerCreator } from './PlayerCreator'
import { NotFound } from '../General/NotFound'
import { getCookie } from '@fl/utils'
import axios from 'axios'

const playerId = getCookie('playerId')

export const AdminPortal = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [view, setView] = useState(false)

  // USE EFFECT
  useEffect(() => {
    const checkIfAdmin = async () => {
      try {
        const { status } = await axios.get(`/api/players/admin/${playerId}`)
        if (status === 200) {
          setIsAdmin(true)
        }
      } catch (err) {
        console.log(err)
      }
    }

    checkIfAdmin()
  }, [])

  if (isAdmin) {
    return (
      <div className="body">
        <h1>Admin Portal</h1>
            <div className="admin-menu">
                <div onClick={() => setView('events')} className={view === 'events' ? 'clicked-admin-button' : 'admin-button'}>New Event</div>
                <div onClick={() => setView('decks')} className={view === 'decks' ? 'clicked-admin-button' : 'admin-button'}>Upload Deck</div>
                <div onClick={() => setView('deckTypes')} className={view === 'deckTypes' ? 'clicked-admin-button' : 'admin-button'}>New Deck Type</div>
                <div onClick={() => setView('players')} className={view === 'players' ? 'clicked-admin-button' : 'admin-button'}>New Player</div>
                <div onClick={() => setView('cards')} className={view === 'cards' ? 'clicked-admin-button' : 'admin-button'}>New Card</div>
                <div onClick={() => setView('images')} className={view === 'images' ? 'clicked-admin-button' : 'admin-button'}>Upload Image</div>
                <div onClick={() => setView('banLists')} className={view === 'banLists' ? 'clicked-admin-button' : 'admin-button'}>New Ban List</div>
            </div>
            <div>
                {
                view === 'events' ? (
                    <EventCreator/>
                ) : view === 'cards' ? (
                    <CardCreator/>
                ): view === 'decks' ? (
                    <DeckCreator/>
                ) : view === 'deckTypes' ? (
                    <DeckTypeCreator/>
                ) : view === 'players' ? (
                    <PlayerCreator/>
                ) : view === 'images' ? (
                    <ImageCreator/>
                ) : view === 'banLists' ? (
                    <BanListCreator/>
                ) : ''
                }
            </div>
        </div>
    )
  } else {
    return <NotFound />
  }
}
