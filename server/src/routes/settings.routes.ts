import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate';
import { updateSettingsSchema } from '../schemas/settings.schema';

const router = Router();

router.use(requireAuth);
router.get('/', getSettings);
router.put('/', validateBody(updateSettingsSchema), updateSettings);

export default router;
