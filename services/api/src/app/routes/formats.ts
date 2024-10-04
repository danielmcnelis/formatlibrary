import { Router } from 'express'
import { formatsName, formatsAll, updateFormatInfo } from '../middleware'

const router = Router()

router.get('/api/formats/:name', formatsName)

router.get('/api/formats/', formatsAll)

router.post('/api/formats/update', updateFormatInfo)

export default router
