import axios from 'axios'
import {config} from '@fl/config'
// import {updateApiRequests} from '@fl/bot-functions'

//GENERATE RANDOM STRING
const generateRandomString = (length, chars) => {
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}

// TOURNAMENTS CHALLONGE
export const getTournamentByChallongeName = async (req, res, next) => {
  try {
    const { data } = await axios.get(
      `https://api.challonge.com/v1/tournaments/${req.params.name}.json?api_key=${
        config.challonge[req.headers.communityName]
      }`
    )

    return res.json(data.tournament)
  } catch (err) {
    next(err)
  }
}

// CREATE MOCK BRACKET
export const createMockBracket = async (req, res, next) => {
    let tournament
    try {        
        const { data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments.json?api_key=${config.challonge['Format Library']}`,
            data: {
                tournament: {
                    name: req.body.name,
                    url: req.body.abbreviation,
                    tournament_type: 'single elimination',
                    game_name: 'Yu-Gi-Oh!'
                }
            }
        })

        // await updateApiRequests(server)
        tournament = data.tournament
    } catch (err) {
        console.log(err)

        try {
            const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')
            const { data } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments.json?api_key=${config.challonge['Format Library']}`,
                data: {
                    tournament : {
                        name: req.body.name,
                        url: str,
                        tournament_type: 'single elimination',
                        game_name: 'Yu-Gi-Oh!',
                        pts_for_match_tie: "0.0"
                    }
                }
            })

            // await updateApiRequests(server)
            tournament = data.tournament
        } catch (err) {
            console.log(err)
        }
    }

    try {
        const participants = req.body.participants
        
        for (let i = 0; i < participants.length; i++) {
            try {
                await axios({
                    method: 'post',
                    url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${config.challonge['Format Library']}`,
                    data: {
                        participant: {
                            name: participants[i]
                        }
                    }
                })
            } catch (err) {
                console.log(err)
            }
        }

        // await updateApiRequests(server)
        return res.json(tournament)
    } catch (err) {
      next(err)
    }
  }
  