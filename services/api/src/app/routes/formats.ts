import { Router } from 'express'
import { getFormatByName, getFormats, getExclusives, updateFormatInfo } from '../middleware'

const router = Router()

router.get('/api/formats/exclusives/:name', getExclusives)

router.get('/api/formats/:name', getFormatByName)

router.get('/api/formats/', getFormats)

router.post('/api/formats/update', updateFormatInfo)

export default router
