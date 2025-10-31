import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  verifyEmail, 
  resendVerificationEmail 
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', authenticate, resendVerificationEmail);

export default router;
