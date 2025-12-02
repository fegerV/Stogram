import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  verifyEmail, 
  resendVerificationEmail,
  refreshAccessToken,
  logout,
  logoutAll
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { strictIPRateLimit, moderateIPRateLimit } from '../middleware/ipRateLimit';

const router = Router();

// Strict rate limiting for auth endpoints (5 requests per 15 minutes per IP)
router.post('/register', strictIPRateLimit, register);
router.post('/login', strictIPRateLimit, login);
router.get('/me', authenticate, getMe);
router.post('/verify-email', moderateIPRateLimit, verifyEmail);
router.post('/resend-verification', authenticate, moderateIPRateLimit, resendVerificationEmail);
router.post('/refresh', moderateIPRateLimit, refreshAccessToken);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);

export default router;
