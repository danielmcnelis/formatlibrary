
import { BlogPost } from '@fl/models'

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
      attributes: ['content', 'publishDate'],
      offset: (req.query.page - 1) * 10,
      limit: 10,
      order: [['eventDate', 'DESC']]
    })

    res.json(blogposts)
  } catch (err) {
    next(err)
  }
}
