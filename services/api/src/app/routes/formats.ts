import { Router } from 'express'
import { getFormatByName, getFormats, updateFormatDescription, updateFormatInfo } from '../middleware'

const router = Router()

router.get('/api/formats/:name', getFormatByName)

router.get('/api/formats/', getFormats)

router.post('/api/formats/update', updateFormatInfo)

export default router
