import { Router } from 'express'
import { imagesCreate, imagesUpdateCard } from '../middleware'

const router = Router()

router.post('/api/images/update-card', imagesUpdateCard)

router.post('/api/images/create', imagesCreate)

export default router
