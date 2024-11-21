
import { BlogPost, Team } from '@fl/models'

export const countBlogPosts = async (req, res, next) => {
    try {
      const count = await BlogPost.count()
      res.json(count)
    } catch (err) {
      next(err)
    }
}
  

export const getBlogPosts = async (req, res, next) => {
  try {
    const blogposts = await BlogPost.findAll({
      attributes: [
        'eventName', 'eventAbbreviation', 'eventDate', 'winnerName', 
        'winnerPfp', 'teamName', 'winningTeamId', 'formatName', 'formatIcon', 
        'winningDeckType', 'winningDeckTypeIsPopular', 'winningDeckId',
        'communityName', 'serverInviteLink'
      ],
      offset: (req.query.page - 1) * 10,
      limit: 10,
      include: Team,
      order: [['eventDate', 'DESC']]
    })

    res.json(blogposts)
  } catch (err) {
    next(err)
  }
}
