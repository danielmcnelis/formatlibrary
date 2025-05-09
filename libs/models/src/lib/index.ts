
import { db } from './db'
import { Alius } from './Alius'
import { Archetype } from './Archetype'
import { Article } from './Article'
import { Artwork } from './Artwork'
import { BlogPost } from './BlogPost'
import { CardDeckType } from './CardDeckType'
import { Card } from './Card'
import { ChronRecord } from './ChronRecord'
import { Community } from './Community'
import { Cube } from './Cube'
import { Deck } from './Deck'
import { DeckTypeArchetype } from './DeckTypeArchetype'
import { DeckThumb } from './DeckThumb'
import { DeckType } from './DeckType'
import { Draft } from './Draft'
import { DraftEntry } from './DraftEntry'
import { Entry } from './Entry'
import { Errata } from './Errata'
import { Event } from './Event'
import { Format } from './Format'
import { Inventory } from './Inventory'
import { LikedArticle } from './LikedArticle'
import { LikedCube } from './LikedCube'
import { LikedDeck } from './LikedDeck'
import { LikedFormat } from './LikedFormat'
import { LikedVideo } from './LikedVideo'
import { Match } from './Match'
import { Matchup } from './Matchup'
import { Membership } from './Membership'
import { PackContent } from './PackContent'
import { Pairing } from './Pairing'
import { Player } from './Player'
import { Price } from './Price'
import { Print } from './Print'
import { Pool } from './Pool'
import { Replay } from './Replay'
import { Role } from './Role'
import { Ruling } from './Ruling'
import { Series } from './Series'
import { Server } from './Server'
import { Set } from './Set'
import { Stats } from './Stats'
import { Status } from './Status'
import { Subscription } from './Subscription'
import { Team } from './Team'
import { Tournament } from './Tournament'
import { TriviaEntry } from './TriviaEntry'
import { TriviaKnowledge } from './TriviaKnowledge'
import { TriviaQuestion } from './TriviaQuestion'
import { Video } from './Video'

//ALIUS
Alius.belongsTo(Player)
Player.hasMany(Alius)

//ARTICLE
Article.belongsTo(Player, {
    as: 'author',
    id: 'authorId'
})

Article.belongsTo(Format)
Format.hasMany(Article)

//ARTWORK
Artwork.belongsTo(Card)
Card.hasMany(Artwork)

//BLOGPOST
BlogPost.belongsTo(Player, {
    as: 'winner',
    id: 'winnerId'
})

BlogPost.belongsTo(Team, {
    as: 'winningTeam',
    id: 'winningTeamId'
})

BlogPost.belongsTo(Format)

BlogPost.belongsTo(Deck, {
    as: 'winningDeck',
    id: 'winningDeckId'
})

Event.hasOne(BlogPost)
BlogPost.belongsTo(Event)

BlogPost.belongsTo(Server)

//CardDeckType
// CardDeckType.hasOne(Card)
// Card.hasMany(CardDeckType)

// CardDeckType.hasOne(DeckType)
// DeckType.hasMany(CardDeckType)

//DECKTYPEARCHETYPE
// DeckTypeArchetype.hasOne(Archetype)
// Archetype.hasMany(DeckTypeArchetype)

// DeckTypeArchetype.hasOne(DeckType)
// DeckType.hasMany(DeckTypeArchetype)

// CUBE
Cube.belongsTo(Player, {
    as: 'builder',
    id: 'builderId'
})

// DECK
Deck.belongsTo(Player, {
    as: 'builder',
    id: 'builderId'
})

//DECKTYPE
DeckType.hasMany(Deck)
Deck.belongsTo(DeckType)

DeckType.hasMany(DeckThumb)
DeckThumb.belongsTo(DeckType)

//CUBE
Draft.belongsTo(Cube)
Cube.hasMany(Draft)

Draft.belongsTo(Set)
Set.hasMany(Draft)

DraftEntry.belongsTo(Player)
Player.hasMany(DraftEntry)

DraftEntry.belongsTo(Draft)
Draft.hasMany(DraftEntry)

PackContent.belongsTo(Draft)
Draft.hasMany(PackContent)

PackContent.belongsTo(Set)
Set.hasMany(PackContent)

Inventory.belongsTo(Draft)
Draft.hasMany(Inventory)

Inventory.belongsTo(DraftEntry)
DraftEntry.hasMany(Inventory)

Inventory.belongsTo(Card)
Card.hasMany(Inventory)

PackContent.belongsTo(Card)
Card.hasMany(PackContent)


//ENTRY
Entry.belongsTo(Player)
Player.hasMany(Entry)

Entry.belongsTo(Team)
Team.hasMany(Entry)

Entry.belongsTo(Tournament)
Tournament.hasMany(Entry)

//ERRATA
Errata.belongsTo(Card)
Card.hasMany(Errata)

//EVENT
Event.belongsTo(Player, {
    as: 'winner',
    id: 'winnerId'
})

Event.belongsTo(Team, {
    as: 'winningTeam',
    id: 'winningTeamId'
})

Deck.belongsTo(Event)
Event.hasMany(Deck)

Event.belongsTo(Tournament, {
    as: 'primaryTournament',
    id: 'primaryTournamentId'
})

Event.belongsTo(Tournament, {
    as: 'topCutTournament',
    id: 'topCutTournamentId'
})

Event.belongsTo(Server)
Server.hasMany(Event)

Event.belongsTo(Format)
Format.hasMany(Event)

//FORMAT
Format.hasMany(Deck)
Deck.belongsTo(Format)

Format.hasMany(Match)
Match.belongsTo(Format)

//LIKEDARTICLE
LikedArticle.belongsTo(Article)
Article.hasMany(LikedArticle)

LikedArticle.belongsTo(Player)
Player.hasMany(LikedArticle)

//LIKEDCUBE
LikedCube.belongsTo(Cube)
Cube.hasMany(LikedCube)

LikedCube.belongsTo(Player)
Player.hasMany(LikedCube)

//LIKEDDECK
LikedDeck.belongsTo(Deck)
Deck.hasMany(LikedDeck)

LikedDeck.belongsTo(Player)
Player.hasMany(LikedDeck)

//LIKEDFORMAT
LikedFormat.belongsTo(Format)
Format.hasMany(LikedFormat)

LikedFormat.belongsTo(Player)
Player.hasMany(LikedFormat)

//LIKEDVIDEO
LikedVideo.belongsTo(Video)
Video.hasMany(LikedVideo)

LikedVideo.belongsTo(Player)
Player.hasMany(LikedVideo)

//MATCH
Match.belongsTo(Server)
Server.hasMany(Match)

Match.belongsTo(Player, {
    as: 'loser',
    id: 'loserId'
})

Match.belongsTo(Player, {
    as: 'winner',
    id: 'winnerId'
})

//MATCHUP
Matchup.belongsTo(Match)
Match.hasOne(Matchup)

Matchup.belongsTo(Tournament)
Tournament.hasMany(Matchup)

Matchup.belongsTo(Pairing)
Pairing.hasOne(Matchup)

Matchup.belongsTo(Deck, {
    as: 'losingDeck',
    id: 'losingDeckId'
})

Matchup.belongsTo(Deck, {
    as: 'winningDeck',
    id: 'winningDeckId'
})

Matchup.belongsTo(DeckType, {
    as: 'losingDeckType',
    id: 'losingDeckTypeId'
})

Matchup.belongsTo(DeckType, {
    as: 'winningDeckType',
    id: 'winningDeckTypeId'
})

//MEMBERSHIP
Membership.belongsTo(Player)
Player.hasMany(Membership)

Membership.belongsTo(Server)
Server.hasMany(Membership)

//PRICE
Price.belongsTo(Print)
Print.hasMany(Price)

//PRINT
Print.belongsTo(Card)
Card.hasMany(Print)

Print.belongsTo(Set)
Set.hasMany(Print)

//PAIRING
Pairing.belongsTo(Format)
Format.hasMany(Pairing)

Pairing.belongsTo(Player, {
    as: 'playerA',
    id: 'playerAId'
})

Pairing.belongsTo(Player, {
    as: 'playerB',
    id: 'playerBId'
})

//POOL
Pool.belongsTo(Format)
Format.hasMany(Pool)

Pool.belongsTo(Player)
Player.hasMany(Pool)

//REPLAY
Replay.belongsTo(Tournament)
Tournament.hasMany(Replay)

Replay.belongsTo(Format)
Format.hasMany(Replay)

Replay.belongsTo(Event)
Event.hasMany(Replay)

Replay.belongsTo(Match)
Match.hasOne(Replay)

Replay.belongsTo(Player, {
    as: 'loser',
    id: 'loserId'
})

Replay.belongsTo(Player, {
    as: 'winner',
    id: 'winnerId'
})

Replay.belongsTo(Deck, {
    as: 'losingDeck',
    id: 'losingDeckId'
})

Replay.belongsTo(Deck, {
    as: 'winningDeck',
    id: 'winningDeckId'
})

//ROLE
Role.belongsTo(Membership)
Membership.hasMany(Role)

//RULING
Ruling.belongsTo(Format)
Format.hasMany(Ruling)

Ruling.belongsTo(Card)
Card.hasMany(Ruling)

//SERIES
Series.belongsTo(Server)
Server.hasMany(Series)

//STATS
Stats.belongsTo(Player)
Player.hasMany(Stats)

Stats.belongsTo(Format)
Format.hasMany(Stats)

Stats.belongsTo(Server)
Server.hasMany(Stats)

//STATUS
Status.belongsTo(Card)
Card.hasMany(Status)

//STATS
Subscription.belongsTo(Player)
Player.hasMany(Subscription)

//TOURNAMENT
Tournament.belongsTo(Series)
Series.hasMany(Tournament)

Tournament.belongsTo(Server)
Server.hasMany(Tournament)

Tournament.belongsTo(Format)
Format.hasMany(Tournament)

//TEAM
Team.belongsTo(Tournament)
Tournament.hasMany(Team)

Team.belongsTo(Player, {
    as: 'captain',
    id: 'captainId'
})

Team.belongsTo(Player, {
    as: 'playerA',
    id: 'playerAId'
})

Team.belongsTo(Player, {
    as: 'playerB',
    id: 'playerBId'
})

Team.belongsTo(Player, {
    as: 'playerC',
    id: 'playerCId'
})

//TriviaEntry
TriviaEntry.belongsTo(Player)
Player.hasMany(TriviaEntry)

//TriviaKnowledge
TriviaKnowledge.belongsTo(Player)
Player.hasMany(TriviaKnowledge)

//VIDEO
Video.belongsTo(Player)
Player.hasMany(Video)

export {
  db,
  Alius,
  Archetype,
  Article,
  Artwork,
  BlogPost,
  Card,
  CardDeckType,
  ChronRecord,
  Community,
  Cube,
  Deck,
  DeckTypeArchetype,
  DeckThumb,
  DeckType,
  Draft,
  DraftEntry,
  Entry,
  Errata,
  Event,
  Format,
  Inventory,
  LikedArticle,
  LikedCube,
  LikedDeck,
  LikedFormat,
  LikedVideo,
  Match,
  Matchup,
  Membership,
  PackContent,
  Pairing,
  Player,
  Pool,
  Price,
  Print,
  Replay,
  Role,
  Ruling,
  Series,
  Server,
  Set,
  Stats,
  Status,
  Subscription,
  Team,
  Tournament,
  TriviaEntry,
  TriviaKnowledge,
  TriviaQuestion,
  Video
}
