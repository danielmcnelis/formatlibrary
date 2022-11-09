import { Router } from 'express'
import { formatsName, formatsAll } from '../middleware'

const router = Router()

router.get('/api/formats/:name', formatsName)

router.get('/api/formats/', formatsAll)

export default router
