import axios from 'axios'
import config from '../config'

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
