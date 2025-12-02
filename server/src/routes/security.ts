import express from 'express';
import { SecurityController } from '../controllers/securityController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// 2FA routes
router.post('/2fa/enable', SecurityController.enable2FA);
router.post('/2fa/verify', SecurityController.verify2FASetup);
router.post('/2fa/disable', SecurityController.disable2FA);

// E2E Encryption routes
router.post('/encryption/initialize', SecurityController.initializeEncryption);
router.get('/encryption/public-key/:userId', SecurityController.getPublicKey);

// Security logs
router.get('/logs', SecurityController.getSecurityLogs);

// Trusted IPs
router.post('/trusted-ips', SecurityController.addTrustedIP);

// Spam reporting
router.post('/report-spam', SecurityController.reportSpam);

// Account status
router.get('/status', SecurityController.checkAccountStatus);

export default router;
