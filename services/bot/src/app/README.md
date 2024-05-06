# RetroBot

A sleek Discord bot for hosting tournaments, matchmaking, and leaderboards for a wide range of different Yu-Gi-Oh! TCG formats. It is also by far the highest quality Discord bot for looking up Yu-Gi-Oh! cards.

Features are gated behind access tiers: Free and Partner ($15 setup). A handful of features such as access to Rated Play for all formats will remain FormatLibrary.com exclusives.

This app was built with Discord.js (user interaction and front-end output), FuzzySet (card search algorithms), Canvas (drawing decks), QuickChart (plotting charts), Axios (fetching external data), PostgreSQL (internal database), and Sequelize (interacting with internal database).

Click here to add this bot to your Discord server: https://discord.com/application-directory/730922003296419850<br/>
For additional help: contact me on Discord: @daniel.mcnelis

![Bot Profile](/public/Bot-Profile.png)

# Tournament Host - Partner Tier

RetroBot makes it easy to run large, real-time Yu-Gi-Oh! tournaments from your Discord server.

• RetroBot connects to Challonge.com via your Challonge API Key to manage tournament brackets.<br/>
• Hosts create new tournament brackets on their Challonge accounts with **/create**.<br/>
• Players register for tournaments with **/join** and submit a deck (via YDK File).<br/>
• Hosts can register players for tournaments with **/signup**.<br/>
• RetroBot saves players's decks as .YDKs and checks their legality when they register.<br/>
• RetroBot adds players to brackets on Challonge and removes them if they **/drop**.<br/>

![Tournament Registration](/public/Tournament-Registration.png)

• Hosts can remove players from tournaments with **/remove**.<br/>
• Hosts can control registration windows with **/close** and **/open**.<br/>
• Hosts **/start** the tournament, which triggers seeding based on players's rankings.<br/>
• Players are notified when paired and the loser of the match is asked to report with **/loss**.<br/>
• Hosts can directly manage the bracket with **/noshow** or **/manual**.<br/>
• Hosts and Judges can inspect decks with **/deck**.<br/>
• Players and spectators can view the Challonge bracket with **/bracket**.<br/>
• Hosts **/end** the tournament, which uploads a spreadsheet summary and .YDKs to your Google Drive.<br/>
• Hosts can delete unstarted tournaments on their Challonge accounts with **/destroy**.<br/>
• Hosts can time rounds if desired with **/settimer** and users can check the time remaining with **/timer**.<br/>

![Tournament Hosting](/public/Tournament-Hosting.png)

• RetroBot posts a notification in all servers and channels that support that Rated Pool when someone joins.<br/>
• RetroBot attempts to match players who (1) share a common Discord server and (2) have not played recently.<br/>
• Any player waiting in the pool less than 10 minutes must play if matched, otherwise they need to reconfirm.<br/>
• Players can leave a Rated Pool at any time by DM'ing **/exit** to RetroBot.<br/>
• When 2 players are successfully paired, they (1) receive a DM telling them who to play, and (2) RetroBot announces the pairing in the host server.<br/>

![Rated Pairing](/public/Rated-Pairing.png)

# Rated Play - Partner Tier

RetroBot grants your server access to FormatLibrary.com Rated Play for one (1) format of your choosing.

• Players are asked to report match results with **/loss**.<br/>
• Moderators can report a result for other players with **/manual**.<br/>
• RetroBot calculates the resulting change in Elo and updates both players's stats for the format they played.<br/>
• Players can undo their own report and Moderators can undo any report with **/undo** if a mistake is made.<br/>
• Players can check their stats (ranking, Elo, medal, W/L record) or another player's with **/stats**.<br/>

![Stats](/public/Stats.png)

• Players can view the current leaderboard with **/leaderboard**, where n = desired cutoff (default is 10).<br/>
• Players can view a graph of their Elo history with **/history**, where n = number of recent matches (default is 250).<br/>
• Players can check their head-to-head record against another player with **/h2h**.<br/>

![History](/public/History.png)

# Format Information - Free Tier

RetroBot provides useful information about various Yu-Gi-Oh! formats, decks, and players.

• Players can view the Forbidden and Limited lists governing any format with **/info**.<br/>
• Players can check deck legality with **/legal** and they DM their deck to RetroBot (via YDK File).<br/>
• Players can check their FormatLibrary.com profile or another player's with **/profile**.<br/>

![Legality Check](/public/Legality-Check.png)

# Card Search - Free Tier

RetroBot is the most powerful Discord bot for looking up Yu-Gi-Oh! cards. Cards are updated nightly.

• Discord users can search for cards with **/card**.<br/>
• RetroBot posts results in visually appealing Discord Message Embeds using colorful emojis and quality images.<br/>
• RetroBot links the card's mobile-friendly FormatLibrary.com webpage, which provides further information.<br/>
• RetroBot automatically displays legality and forbidden/limited status in Partner servers.<br/>
• Free Tier users can set the format for their server one (1) time with **/format**. To change this please contact me.<br/>

![Card Search](/public/Card-Search.png)
