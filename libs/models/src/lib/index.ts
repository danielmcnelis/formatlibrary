
import { Archetype } from './Archetype'
import { Article } from './Article'
import { BlogPost } from './BlogPost'
import { CardDeckType } from './CardDeckType'
import { Card } from './Card'
import { Cube } from './Cube'
import { Deck } from './Deck'
import { DeckTypeArchetype } from './DeckTypeArchetype'
import { DeckThumb } from './DeckThumb'
import { DeckType } from './DeckType'
import { Entry } from './Entry'
import { Errata } from './Errata'
import { Event } from './Event'
import { Format } from './Format'
import { Iron } from './Iron'
import { LikedArticle } from './LikedArticle'
import { LikedCube } from './LikedCube'
import { LikedDeck } from './LikedDeck'
import { LikedFormat } from './LikedFormat'
import { LikedVideo } from './LikedVideo'
import { Match } from './Match'
import { Matchup } from './Matchup'
import { Membership } from './Membership'
import { Player } from './Player'
import { Price } from './Price'
import { Print } from './Print'
import { Pool } from './Pool'
import { Role } from './Role'
import { Ruling } from './Ruling'
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

//ARTICLE
Article.belongsTo(Player)
Player.hasMany(Article)

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

//DECKTYPE
DeckType.hasMany(Deck)
Deck.belongsTo(DeckType)

DeckType.hasMany(DeckThumb)
DeckThumb.belongsTo(DeckType)

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
Event.hasMany(BlogPost)
BlogPost.belongsTo(Event)

Event.hasMany(Deck)
Deck.belongsTo(Event)

Event.belongsTo(Tournament)
Tournament.hasOne(Event)

//FORMAT
Format.hasMany(Deck)
Deck.belongsTo(Format)

Format.hasMany(Event)
Event.belongsTo(Format)

Format.hasMany(Match)
Match.belongsTo(Format)

//IRON
Iron.belongsTo(Player)
Player.hasMany(Iron)

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

//MATCHUP
Matchup.belongsTo(Match)
Match.hasOne(Matchup)

Matchup.belongsTo(Tournament)
Tournament.hasMany(Matchup)

//MEMBERSHIP
Membership.belongsTo(Player)
Player.hasMany(Membership)

Membership.belongsTo(Server)
Server.hasMany(Membership)

//PLAYER
Player.hasMany(Cube)
Cube.belongsTo(Player)

Player.hasMany(Deck)
Deck.belongsTo(Player)

Player.hasMany(Event)
Event.belongsTo(Player)

//PRICE
Price.belongsTo(Print)
Print.hasMany(Price)

//PRINT
Print.belongsTo(Card)
Card.hasMany(Print)

Print.belongsTo(Set)
Set.hasMany(Print)

//RATED POOL
Pool.belongsTo(Player)
Player.hasMany(Pool)

//ROLE
Role.belongsTo(Membership)
Membership.hasMany(Role)

//RULING
Ruling.belongsTo(Card)
Card.hasMany(Ruling)

//STATS
Stats.belongsTo(Player)
Player.hasMany(Stats)

Stats.belongsTo(Server)
Server.hasMany(Stats)

//STATUS
Status.belongsTo(Card)
Card.hasMany(Status)

//SUBSCRIPTION
Subscription.belongsTo(Format)
Format.hasMany(Subscription)

Subscription.belongsTo(Player)
Player.hasMany(Subscription)

//TOURNAMENT
Tournament.belongsTo(Server)
Server.hasMany(Tournament)

//TEAM
Team.belongsTo(Tournament)
Tournament.hasMany(Team)

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
  Archetype,
  Article,
  BlogPost,
  Card,
  CardDeckType,
  Cube,
  Deck,
  DeckTypeArchetype,
  DeckThumb,
  DeckType,
  Entry,
  Event,
  Format,
  Iron,
  Match,
  Matchup,
  Membership,
  Player,
  Pool,
  Price,
  Print,
  Role,
  Server,
  Set,
  Stats,
  Status,
  Team,
  Tournament,
  TriviaEntry,
  TriviaKnowledge,
  TriviaQuestion,
  Video
}
