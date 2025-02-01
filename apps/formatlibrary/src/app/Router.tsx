import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
 AdminPortal,
 Builder,
 CardTable,
 CubeBrowser,
 DraftLauncher,
 CubeMaker,
 DeckGallery,
 DeckTable,
 DeckType,
 DraftLobby,
 EventGallery,
 EventTable,
 FormatMaker,
 FormatMenu,
 FormatIntro,
 Home,
 LeaderBoard,
 NotFound,
 PackSimulator,
 Page,
 PlayerProfile,
 Subscriptions,
 RatedLobby,
 ReplayTable,
 SealedLauncher,
 SealedLobby,
 Settings,
 SingleBanList,
 SingleCard,
 SingleDeck,
 SingleEvent,
 UserPortal
} from '@fl/components'

// import { SocketProvider } from '@fl/context'
// import {config} from '@fl/config'
// import io from 'socket.io-client'
// const socket = io(config.siteUrl, { transports: ["websocket"] })

const AdsTxtRedirect = () => {
 window.location.href = 'https://ads.adthrive.com/sites/66e1eae5fdcedc15a412ead6/ads.txt';
 return null;
}

export const Router = (props) => {
 const {disableAds, roles} = props
 return (
			<BrowserRouter>
				<Routes>
					<Route path="/" element=<Page roles={roles} disableAds={disableAds} element=<Home /> /> />
                    <Route path='/ads.txt' element=<AdsTxtRedirect /> />
					<Route path="/home" element=<Page roles={roles} disableAds={disableAds} element=<Home /> /> />
                    <Route path="/auth/"/>
					<Route path="/apps" element=<Page roles={roles} disableAds={disableAds} element=<UserPortal roles={roles}/> /> />
					<Route path="/deck-builder" element=<Page roles={roles} disableAds={true} element=<Builder /> /> />
					<Route path="/deck-builder/:id" element=<Page roles={roles} disableAds={true} element=<Builder /> /> />
					<Route path="/pack-simulator" element=<Page roles={roles} element=<PackSimulator /> /> />
					<Route path="/settings" element=<Page roles={roles} disableAds={true} element=<Settings /> /> />
					<Route path="/cube-maker" element=<Page roles={roles} disableAds={true} element=<CubeMaker /> /> />
					<Route path="/rated-lobby" element=<Page roles={roles} disableAds={true} element=<RatedLobby /> /> />
					<Route path="/cubes/:id" element=<Page roles={roles} disableAds={true} element=<CubeBrowser /> /> />
					<Route path="/drafts/:id" element=<Page roles={roles} disableAds={true} element= <DraftLobby/> /> />
					{/* <Route path="/drafts/:id" element=<Page roles={roles} disableAds={disableAds} element= <SocketProvider value={socket}><DraftLobby/></SocketProvider> /> /> */}
					<Route path="/sealed/:id" element=<Page roles={roles} disableAds={disableAds} element= <SealedLobby/> /> />
					<Route path="/format-maker" element=<Page roles={roles} disableAds={disableAds} element=<FormatMaker /> /> />
					<Route path="/great-library.html" element=<Page roles={roles} disableAds={disableAds} element= <CardTable /> /> />
					<Route path="/great-library" element=<Page roles={roles} disableAds={disableAds} element= <CardTable /> /> />
					<Route path="/cards-by-format.html" element=<Page roles={roles} disableAds={disableAds} element= <CardTable /> /> />
					<Route path="/cards-by-format" element=<Page roles={roles} disableAds={disableAds} element= <CardTable /> /> />
					<Route path="/cards-by-year.html" element=<Page roles={roles} disableAds={disableAds} element= <CardTable /> /> />
					<Route path="/cards-by-year" element=<Page roles={roles} disableAds={disableAds} element= <CardTable /> /> />
					<Route path="/goat-pool.html" element={<Navigate to="/cards?format=goat" />} />
					<Route path="/goat-pool" element={<Navigate to="/cards?format=goat" />} />
					<Route path="/goat-card-pool.html" element={<Navigate to="/cards?format=goat" />} />
					<Route path="/goat-card-pool" element={<Navigate to="/cards?format=goat" />} />
					<Route path="/cards/" element=<Page roles={roles} disableAds={disableAds} element=<CardTable /> /> />
					<Route path="/cards?format=:id" element=<Page roles={roles} disableAds={disableAds} element=<CardTable /> /> />
					<Route path="/cards/:id" element=<Page roles={roles} disableAds={disableAds} element=<SingleCard roles={roles}/> /> />
					<Route path="/goat-deck-gallery" element={<Navigate to="/deck-gallery/Goat" />} />
					<Route path="/decks/" element=<Page roles={roles} disableAds={disableAds} element= <DeckTable roles={roles}/> /> />
					<Route path="/decks/:id" element=<Page roles={roles} disableAds={disableAds} element= <SingleDeck roles={roles}/> /> />
					<Route path="/deckTypes/:id" element=<Page roles={roles} disableAds={disableAds} element= <DeckType roles={roles}/> /> />
					<Route path="/deck-gallery/:id" element=<Page roles={roles} disableAds={disableAds} element= <DeckGallery /> /> />
					<Route path="/events/" element=<Page roles={roles} disableAds={disableAds} element= <EventTable /> /> />
					<Route path="/events/:id" element=<Page roles={roles} disableAds={disableAds} element= <SingleEvent roles={roles}/> /> />
					<Route path="/event-gallery/:id" element=<Page roles={roles} disableAds={disableAds} element= <EventGallery /> /> />
					<Route path="/ban-lists" element=<Page roles={roles} disableAds={disableAds} element= <FormatMenu /> /> />
					<Route path="/goat-intro.html" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-intro" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-history.html" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-history" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-rulings.html" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-rulings" element={<Navigate to="/formats/goat" />} />
					<Route path="/formats/" element=<Page roles={roles} disableAds={disableAds} element= <FormatMenu roles={roles}/> /> />
					<Route path="/formats/:id" element=<Page roles={roles} disableAds={disableAds} element= <FormatIntro roles={roles}/> /> />
					<Route path="/leaderboards/:id" element=<Page roles={roles} disableAds={disableAds} element= <LeaderBoard /> /> />
					<Route path="/leaderboards/:id/:statsType" element=<Page roles={roles} disableAds={disableAds} element= <LeaderBoard /> /> />
					{/* <Route path="/manage-subscription/" element=<Page roles={roles} disableAds={true} element=<Subscriptions /> /> /> */}
					<Route path="/subscribe/" element=<Page roles={roles} disableAds={true} element=<Subscriptions /> /> />
					<Route path="/replays/" element=<Page roles={roles} disableAds={disableAds} element= <ReplayTable roles={roles}/> /> />
                    <Route path="/start-draft/" element=<Page roles={roles} disableAds={disableAds} element= <DraftLauncher/> /> />
                    {/* <Route path="/start-draft/" element=<Page roles={roles} disableAds={disableAds} element= <SocketProvider value={socket}><DraftLauncher/></SocketProvider> /> /> */}
					<Route path="/start-sealed/" element=<Page roles={roles} disableAds={disableAds} element= <SealedLauncher /> /> />
					<Route path="/banlists/:id" element=<Page roles={roles} disableAds={disableAds} element= <SingleBanList /> /> />
					<Route path="/players/:id" element=<Page roles={roles} disableAds={disableAds} element= <PlayerProfile /> /> />
					<Route path="/admin-portal" element=<Page roles={roles} element= <AdminPortal roles={roles}/> /> />
					<Route path="/may-2002---yugi-kaiba" element={<Navigate to="/formats/yugi-kaiba" />} />
					<Route path="/jul-2002---critter" element={<Navigate to="/formats/critter" />} />
					<Route path="/apr-2003---android" element={<Navigate to="/formats/android" />} />
					<Route path="/aug-2003---yata" element={<Navigate to="/formats/yata" />} />
					<Route path="/aug-2004---chaos" element={<Navigate to="/formats/chaos" />} />
					<Route path="/oct-2004---warrior" element={<Navigate to="/formats/warrior" />} />
					<Route path="/apr-2005---goat" element={<Navigate to="/formats/goat" />} />
					<Route path="/oct-2005---reaper" element={<Navigate to="/formats/reaper" />} />
					<Route path="/apr-2006---chaos-return" element={<Navigate to="/formats/chaos-return" />} />
					<Route path="/oct-2006---stein-monarch" element={<Navigate to="/formats/stein" />} />
					<Route path="/mar-2007---troop-dup" element={<Navigate to="/formats/trooper" />} />
					<Route path="/jan-2008---perfect-circle" element={<Navigate to="/formats/perfect-circle" />} />
					<Route path="/sep-2008---teledad" element={<Navigate to="/formats/teledad" />} />
					<Route path="/mar-2009---synchro-cat" element={<Navigate to="/formats/cat" />} />
					<Route path="/mar-2010---edison" element={<Navigate to="/formats/edison" />} />
					<Route path="/july-2010---glad-beast" element={<Navigate to="/formats/frog" />} />
					<Route path="/oct-2011---tengu-plant" element={<Navigate to="/formats/tengu" />} />
					<Route path="/dec-2012---wind-up" element={<Navigate to="/formats/wind-up" />} />
					<Route path="/mar-2013---baby-ruler" element={<Navigate to="/formats/baby-ruler" />} />
					<Route path="/sep-2013---ravine-ruler" element={<Navigate to="/formats/ravine-ruler" />} />
					<Route path="/july-2014---hat" element={<Navigate to="/formats/hat" />} />
					<Route path="/july-2015---djinn-lock" element={<Navigate to="/formats/nekroz" />} />
					<Route path="/aug-2015---newgioh" element={<Navigate to="/formats/" />} />
					<Route path="/flc1" element={<Navigate to="/events/FLC1" />} />
					<Route path="/flc2" element={<Navigate to="/events/FLC2" />} />
					<Route path="/flc3" element={<Navigate to="/events/FLC3" />} />
					<Route path="/flc4" element={<Navigate to="/events/FLC4" />} />
					<Route path="/flc5" element={<Navigate to="/events/FLC5" />} />
					<Route path="/not-found" element= < NotFound /> />
					<Route element= < NotFound /> />
				</Routes>
			</BrowserRouter>
 )
}
