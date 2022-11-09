import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  AdminPortal,
  Builder,
  CardTable,
  DeckGallery,
  DeckTable,
  DeckType,
  EventTable,
  FormatMaker,
  FormatMenu,
  FormatIntro,
  Home,
  LeaderBoard,
  NotFound,
  Page,
  PlayerProfile,
  Settings,
  SingleBanList,
  SingleCard,
  SingleDeck,
  SingleEvent
} from '@fl/components'

export const Router = () => {
  return (
			<BrowserRouter>
				<Routes>
					<Route path="/" element=<Page element=<Home /> /> />
					<Route path="/home" element=<Page element=<Home /> /> />
                    <Route path="/auth/"/>
					<Route path="/builder" element=<Page element=<Builder /> /> />
					<Route path="/settings" element=<Page element=<Settings /> /> />
					<Route path="/format-maker" element=<Page element=<FormatMaker /> /> />
					<Route path="/great-library.html" element=<Page element= <CardTable /> /> />
					<Route path="/great-library" element=<Page element= <CardTable /> /> />
					<Route path="/cards-by-format.html" element=<Page element= <CardTable /> /> />
					<Route path="/cards-by-format" element=<Page element= <CardTable /> /> />
					<Route path="/cards-by-year.html" element=<Page element= <CardTable /> /> />
					<Route path="/cards-by-year" element=<Page element= <CardTable /> /> />
					<Route path="/goat-pool.html" element=<Page element= <CardTable /> /> />
					<Route path="/goat-pool" element=<Page element= <CardTable /> /> />
					<Route path="/goat-card-pool.html" element=<Page element= <CardTable /> /> />
					<Route path="/goat-card-pool" element=<Page element= <CardTable /> />  />
					<Route path="/cards/" element=<Page element= <CardTable /> /> />
					<Route path="/cards?format=:id" element=<Page element= <CardTable /> /> />
					<Route path="/cards/:id" element=<Page element= <SingleCard /> /> />
					<Route path="/goat-deck-gallery" element={<Navigate to="/gallery/Goat" />} />
					<Route path="/decks/" element=<Page element= <DeckTable /> /> />
					<Route path="/decks/:id" element=<Page element= <SingleDeck /> /> />
					<Route path="/decktypes/:id" element=<Page element= <DeckType /> /> />
					<Route path="/gallery/:id" element=<Page element= <DeckGallery /> /> />
					<Route path="/events/" element=<Page element= <EventTable /> /> />
					<Route path="/events/:id" element=<Page element= <SingleEvent /> /> />
					<Route path="/ban-lists" element=<Page element= <FormatMenu /> /> />
					<Route path="/goat-intro.html" element={<Navigate to="/formats/Goat" />} />
					<Route path="/goat-intro" element={<Navigate to="/formats/Goat" />} />
					<Route path="/goat-history.html" element={<Navigate to="/formats/Goat" />} />
					<Route path="/goat-history" element={<Navigate to="/formats/Goat" />} />
					<Route path="/goat-rulings.html" element={<Navigate to="/formats/Goat" />} />
					<Route path="/goat-rulings" element={<Navigate to="/formats/Goat" />} />
					<Route path="/formats/" element=<Page element= <FormatMenu /> /> />
					<Route path="/formats/:id" element=<Page element= <FormatIntro /> /> />
					<Route path="/leaderboards/:id" element=<Page element= <LeaderBoard /> /> />
					<Route path="/banlists/:id" element=<Page element= <SingleBanList /> /> />
					<Route path="/players/:id" element=<Page element= <PlayerProfile /> /> />
					<Route path="/admin-portal" element=<Page element= <AdminPortal /> /> />
					<Route path="/may-2002---yugi-kaiba" element={<Navigate to="/formats/Yugi-Kaiba" />} />
					<Route path="/jul-2002---critter" element={<Navigate to="/formats/Critter" />} />
					<Route path="/apr-2003---android" element={<Navigate to="/formats/Android" />} />
					<Route path="/aug-2003---yata" element={<Navigate to="/formats/Yata" />} />
					<Route path="/aug-2004---chaos" element={<Navigate to="/formats/Chaos" />} />
					<Route path="/oct-2004---warrior" element={<Navigate to="/formats/Warrior" />} />
					<Route path="/apr-2005---goat" element={<Navigate to="/formats/Goat" />} />
					<Route path="/oct-2005---reaper" element={<Navigate to="/formats/Reaper" />} />
					<Route path="/apr-2006---chaos-return" element={<Navigate to="/formats/Chaos_Return" />} />
					<Route path="/oct-2006---stein-monarch" element={<Navigate to="/formats/Stein" />} />
					<Route path="/mar-2007---troop-dup" element={<Navigate to="/formats/Trooper" />} />
					<Route path="/jan-2008---perfect-circle" element={<Navigate to="/formats/Perfect_Circle" />} />
					<Route path="/sep-2008---teledad" element={<Navigate to="/formats/TeleDAD" />} />
					<Route path="/mar-2009---synchro-cat" element={<Navigate to="/formats/Cat" />} />
					<Route path="/mar-2010---edison" element={<Navigate to="/formats/Edison" />} />
					<Route path="/july-2010---glad-beast" element={<Navigate to="/formats/Frog" />} />
					<Route path="/oct-2011---tengu-plant" element={<Navigate to="/formats/Tengu_Plant" />} />
					<Route path="/dec-2012---wind-up" element={<Navigate to="/formats/Wind-Up" />} />
					<Route path="/mar-2013---baby-ruler" element={<Navigate to="/formats/Baby_Ruler" />} />
					<Route path="/sep-2013---ravine-ruler" element={<Navigate to="/formats/Ravine_Ruler" />} />
					<Route path="/july-2014---hat" element={<Navigate to="/formats/HAT" />} />
					<Route path="/july-2015---djinn-lock" element={<Navigate to="/formats/Nekroz" />} />
					<Route path="/aug-2015---newgioh" element={<Navigate to="/formats/" />} />
					<Route path="/flc1" element={<Navigate to="/events/FLC1" />} />
					<Route path="/flc2" element={<Navigate to="/events/FLC2" />} />
					<Route path="/flc3" element={<Navigate to="/events/FLC3" />} />
					<Route path="/flc4" element={<Navigate to="/events/FLC4" />} />
					<Route path="/flc5" element={<Navigate to="/events/FLC5" />} />
					<Route path="/not-found" element= <NotFound /> />
					<Route element= <NotFound /> />
				</Routes>
			</BrowserRouter>
  )
}
