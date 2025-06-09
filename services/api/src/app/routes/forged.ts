import { Router } from 'express'
import { getForgedCards, countForgedCards } from '../middleware'

const router = Router()

router.get('/api/forged/count', countForgedCards)

router.get('/api/forged', getForgedCards)

export default router
