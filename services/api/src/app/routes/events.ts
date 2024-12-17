import { Router } from 'express'
import { authenticate, getEvents, countEvents, eventsRecent, getEventById, eventsCreate, eventsCommunity, eventsGallery, getEventByIdAsSubscriber } from '../middleware'

const router = Router()

router.get('/api/events/recent/:format', eventsRecent)

router.get('/api/events/gallery/:format', eventsGallery)

router.get('/api/events/community/:community', eventsCommunity)

router.get('/api/events/count', countEvents)

router.get('/api/events/subscriber/:id', [authenticate, getEventByIdAsSubscriber])

router.get('/api/events/:id', getEventById)

router.get('/api/events/', getEvents)

router.post('/api/events/create', eventsCreate)

export default router
