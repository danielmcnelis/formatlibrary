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
  ReplayTable,
  Settings,
  SingleBanList,
  SingleCard,
  SingleDeck,
  SingleEvent,
  UserPortal,
  YDKCreator
} from '@fl/components'

export const Router = () => {
  return (
			<BrowserRouter>
				<Routes>
					<Route path="/" element=<Page element=<Home /> /> />
					<Route path="/home" element=<Page element=<Home /> /> />
                    <Route path="/auth/"/>
					<Route path="/apps" element=<Page element=<UserPortal /> /> />
					<Route path="/builder" element=<Page element=<Builder /> /> />
					<Route path="/deck-builder" element=<Page element=<Builder /> /> />
					<Route path="/pack-simulator" element=<Page element=<PackSimulator /> /> />
					<Route path="/text-to-ydk" element=<Page element=<YDKCreator /> /> />
					<Route path="/settings" element=<Page element=<Settings /> /> />
					<Route path="/cube-maker" element=<Page element=<CubeMaker /> /> />
					<Route path="/cubes/:id" element=<Page element=<CubeBrowser /> /> />
					<Route path="/drafts/:id" element=<Page element=<DraftLobby /> /> />
					<Route path="/format-maker" element=<Page element=<FormatMaker /> /> />
					<Route path="/great-library.html" element=<Page element= <CardTable /> /> />
					<Route path="/great-library" element=<Page element= <CardTable /> /> />
					<Route path="/cards-by-format.html" element=<Page element= <CardTable /> /> />
					<Route path="/cards-by-format" element=<Page element= <CardTable /> /> />
					<Route path="/cards-by-year.html" element=<Page element= <CardTable /> /> />
					<Route path="/cards-by-year" element=<Page element= <CardTable /> /> />
					<Route path="/goat-pool.html" element={<Navigate to="/cards?format=goat" />} />
					<Route path="/goat-pool" element={<Navigate to="/cards?format=goat" />} />
					<Route path="/goat-card-pool.html" element={<Navigate to="/cards?format=goat" />} />
					<Route path="/goat-card-pool"  element={<Navigate to="/cards?format=goat" />} />
					<Route path="/cards/" element=<Page element=<CardTable /> /> />
					<Route path="/cards?format=:id" element=<Page element=<CardTable /> /> />
					<Route path="/cards/:id" element=<Page element=<SingleCard /> /> />
					<Route path="/goat-deck-gallery" element={<Navigate to="/deck-gallery/Goat" />} />
					<Route path="/decks/" element=<Page element= <DeckTable /> /> />
					<Route path="/decks/:id" element=<Page element= <SingleDeck /> /> />
					<Route path="/decktypes/:id" element=<Page element= <DeckType /> /> />
					<Route path="/deck-gallery/:id" element=<Page element= <DeckGallery /> /> />
					<Route path="/events/" element=<Page element= <EventTable /> /> />
					<Route path="/events/:id" element=<Page element= <SingleEvent /> /> />
					<Route path="/event-gallery/:id" element=<Page element= <EventGallery /> /> />
					<Route path="/ban-lists" element=<Page element= <FormatMenu /> /> />
					<Route path="/goat-intro.html" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-intro" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-history.html" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-history" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-rulings.html" element={<Navigate to="/formats/goat" />} />
					<Route path="/goat-rulings" element={<Navigate to="/formats/goat" />} />
					<Route path="/formats/" element=<Page element= <FormatMenu /> /> />
					<Route path="/formats/:id" element=<Page element= <FormatIntro /> /> />
					<Route path="/leaderboards/:id" element=<Page element= <LeaderBoard /> /> />
					<Route path="/replays/" element=<Page element= <ReplayTable /> /> />
					<Route path="/start-cube/" element=<Page element= <DraftLauncher /> /> />
					<Route path="/banlists/:id" element=<Page element= <SingleBanList /> /> />
					<Route path="/players/:id" element=<Page element= <PlayerProfile /> /> />
					<Route path="/admin-portal" element=<Page  element= <AdminPortal /> /> />
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
					<Route path="/oct-2011---tengu-plant" element={<Navigate to="/formats/tengu-plant" />} />
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
					<Route path="/not-found"  element= < NotFound /> />
					<Route element= < NotFound /> />
				</Routes>
			</BrowserRouter>
  )
}
