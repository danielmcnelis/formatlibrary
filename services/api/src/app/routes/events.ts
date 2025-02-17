import { Router } from 'express'
import { authenticate, getEvents, getCommunities, countEvents, getRecentEvents, getEventById, createEvents, getEventCommunity, getEventGallery, getEventByIdAsSubscriber } from '../middleware'

const router = Router()

router.get('/api/events/recent/:format', getRecentEvents)

router.get('/api/events/gallery/:format', getEventGallery)

router.get('/api/events/communities', getCommunities)

router.get('/api/events/community/:community', getEventCommunity)

router.get('/api/events/count', countEvents)

router.get('/api/events/subscriber/:id', [authenticate, getEventByIdAsSubscriber])

router.get('/api/events/:id', getEventById)

router.get('/api/events/', getEvents)

router.post('/api/events/create', createEvents)

export default router
