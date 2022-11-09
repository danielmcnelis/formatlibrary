import { Router } from 'express'
import { countBlogPosts, getBlogPosts } from '../middleware'

const router = Router()

router.get('/api/blogposts/count', countBlogPosts)

router.get('/api/blogposts/', getBlogPosts)


export default router
