import { Router } from 'express'
import { getCards, countCards, createCard, getCardById, getCardsByPartialName, updateCard } from '../middleware'

const router = Router()

router.get('/api/cards/partial-name/:query', getCardsByPartialName)

router.get('/api/cards/count', countCards)

router.get('/api/cards/:id', getCardById)

router.get('/api/cards', getCards)

router.post('/api/cards/create', createCard)

router.post('/api/cards/update', updateCard)

export default router
