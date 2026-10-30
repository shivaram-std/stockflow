import { Router } from 'express';
import { signup, login, getCurrentUser } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { signupSchema, loginSchema } from '../schemas/auth.schema';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', requireAuth, getCurrentUser);

export default router;
