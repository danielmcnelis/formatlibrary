
import { useState } from 'react'
import { BanListCreator, BracketCreator, CardCreator, DeckCreator, DeckTypeCreator, EventCreator, ImageCreator, PlayerCreator, TeamCreator, YDKCreator } from './Creators'
import { NotFound } from '../General/NotFound'
import './AdminPortal.css'

export const AdminPortal = (props) => {
    const isContentManager = props.roles?.contentManager
    const [view, setView] = useState(false)

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
        case 'teams':
            return <TeamCreator/>
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
            {/* Default Gaming Playlist */}
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            <h1>Admin Portal</h1>
            <div className="admin-menu">
                <div onClick={() => setView('events')} className={view === 'events' ? 'clicked-admin-button' : 'admin-button'}>New Event</div>
                <div onClick={() => setView('decks')} className={view === 'decks' ? 'clicked-admin-button' : 'admin-button'}>Upload Deck</div>
                <div onClick={() => setView('deck-types')} className={view === 'deck-types' ? 'clicked-admin-button' : 'admin-button'}>New Deck Type</div>
                <div onClick={() => setView('players')} className={view === 'players' ? 'clicked-admin-button' : 'admin-button'}>New Player</div>
                <div onClick={() => setView('teams')} className={view === 'teams' ? 'clicked-admin-button' : 'admin-button'}>New Team</div>
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
