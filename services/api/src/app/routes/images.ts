import { Router } from 'express'
import { createImage, getBracketImage, updateCardImage } from '../middleware'

const router = Router()

router.get('/api/images/brackets/:id', getBracketImage)

router.post('/api/images/update-card', updateCardImage)

router.post('/api/images/create', createImage)

export default router
