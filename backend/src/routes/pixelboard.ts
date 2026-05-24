import { Router } from 'express'
import { getBoard, placePixel, resetBoard } from '../controllers/pixelboardController'
import { requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/', getBoard)
router.post('/pixel', placePixel)
router.delete('/', requireAdmin, resetBoard)

export default router
