import { Router } from 'express'
import { getEvents, countEvents, eventsRecent, eventsId, eventsCreate } from '../middleware'

const router = Router()

router.get('/api/events/recent/:format', eventsRecent)

router.get('/api/events/count', countEvents)

router.get('/api/events/:id', eventsId)

router.get('/api/events/', getEvents)

router.post('/api/events/create', eventsCreate)

export default router
