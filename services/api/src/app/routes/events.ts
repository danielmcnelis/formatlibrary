import { Router } from 'express'
import { authenticate, getEvents, countEvents, eventsRecent, eventsId, eventsCreate, eventsCommunity, eventsGallery } from '../middleware'

const router = Router()

router.get('/api/events/recent/:format', eventsRecent)

router.get('/api/events/gallery/:format', eventsGallery)

router.get('/api/events/community/:community', eventsCommunity)

router.get('/api/events/count', countEvents)

router.get('/api/events/subscriber/:id', [authenticate, eventsId])

router.get('/api/events/:id', eventsId)

router.get('/api/events/', getEvents)

router.post('/api/events/create', eventsCreate)

export default router
