import { Router } from 'express'
import { cards, cardsCount, cardsCreate, cardsId, cardsQuery } from '../middleware'

const router = Router()

router.get('/api/cards/query/:query', cardsQuery)

router.get('/api/cards/count', cardsCount)

router.get('/api/cards/:id', cardsId)

router.get('/api/cards', cards)

router.post('/api/cards/create', cardsCreate)

export default router
