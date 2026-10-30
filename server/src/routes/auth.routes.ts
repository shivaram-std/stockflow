import { Router } from 'express';
import { signup, login, getCurrentUser, demoLogin } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { signupSchema, loginSchema } from '../schemas/auth.schema';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.post('/demo', demoLogin);
router.get('/me', requireAuth, getCurrentUser);

export default router;
