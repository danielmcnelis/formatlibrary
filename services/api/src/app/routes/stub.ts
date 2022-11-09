import { Router } from 'express'
import { stub } from '../middleware'

const router = Router()

router.get('/api/stub/id', stub)

export default router
