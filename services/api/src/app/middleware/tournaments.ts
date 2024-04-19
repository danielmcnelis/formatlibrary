import axios from 'axios'
import {config} from '@fl/config'

export const tournamentsChallonge = async (req, res, next) => {
  try {
    const { data } = await axios.get(
      `https://api.challonge.com/v1/tournaments/${req.params.name}.json?api_key=${
        config.challonge[req.headers.community]
      }`
    )
    res.json(data.tournament)
  } catch (err) {
    next(err)
  }
}

export const createMockBracket = async (req, res, next) => {
    try {        
        const { data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments.json?api_key=${config.challonge['Format Library']}`,
            data: {
                tournament: {
                    name: req.body.name,
                    tournament_type: 'single elimination',
                    game_name: 'Yu-Gi-Oh!'
                }
            }
        })

        const participants = req.body.participants

        for (let i = 0; i < participants.length; i++) {
            try {
                await axios({
                    method: 'post',
                    url: `https://api.challonge.com/v1/tournaments/${data.tournament.id}/participants.json?api_key=${config.challonge['Format Library']}`,
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

      res.json(data.tournament)
    } catch (err) {
      next(err)
    }
  }
  