
import { Article } from './Article'
import { BlogPost } from './BlogPost'
import { Card } from './Card'
import { Cube } from './Cube'
import { Deck } from './Deck'
import { DeckThumb } from './DeckThumb'
import { DeckType } from './DeckType'
import { Entry } from './Entry'
import { Event } from './Event'
import { Format } from './Format'
import { Iron } from './Iron'
import { Match } from './Match'
import { Matchup } from './Matchup'
import { Membership } from './Membership'
import { Player } from './Player'
import { Print } from './Print'
import { Pool } from './Pool'
import { Role } from './Role'
import { Server } from './Server'
import { Set } from './Set'
import { Stats } from './Stats'
import { Status } from './Status'
import { Tournament } from './Tournament'
import { Upvote } from './Upvote'
import { Video } from './Video'

//ARTICLE
Article.belongsTo(Player)
Player.hasMany(Article)

//DECKTYPE
DeckType.hasMany(Deck)
Deck.belongsTo(DeckType)

DeckType.hasMany(DeckThumb)
DeckThumb.belongsTo(DeckType)

//ENTRY
Entry.belongsTo(Player)
Player.hasMany(Entry)

Entry.belongsTo(Tournament)
Tournament.hasMany(Entry)

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

//IRON
Iron.belongsTo(Player)
Player.hasMany(Iron)

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

//STATS
Stats.belongsTo(Player)
Player.hasMany(Stats)

Stats.belongsTo(Server)
Server.hasMany(Stats)

//STATUS
Status.belongsTo(Card)
Card.hasMany(Status)

//TOURNAMENT
Tournament.belongsTo(Server)
Server.hasMany(Tournament)

//UPVOTE
Upvote.belongsTo(Player)
Player.hasMany(Upvote)

//VIDEO
Video.belongsTo(Player)
Player.hasMany(Video)

exports = {
  Article,
  BlogPost,
  Card,
  Cube,
  Deck,
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
  Print,
  Role,
  Server,
  Set,
  Stats,
  Status,
  Tournament,
  Upvote,
  Video
}
