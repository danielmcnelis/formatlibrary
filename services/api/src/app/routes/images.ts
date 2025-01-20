import { Router } from 'express'
import { createImage, updateCardImage } from '../middleware'

const router = Router()

router.post('/api/images/update-card', updateCardImage)

router.post('/api/images/create', createImage)

export default router
