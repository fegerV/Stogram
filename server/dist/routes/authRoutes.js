"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const ipRateLimit_1 = require("../middleware/ipRateLimit");
const router = (0, express_1.Router)();
// Strict rate limiting for auth endpoints (5 requests per 15 minutes per IP)
router.post('/register', ipRateLimit_1.strictIPRateLimit, authController_1.register);
router.post('/login', ipRateLimit_1.strictIPRateLimit, authController_1.login);
router.post('/forgot-password', ipRateLimit_1.moderateIPRateLimit, authController_1.forgotPassword);
router.post('/reset-password', ipRateLimit_1.moderateIPRateLimit, authController_1.resetPassword);
router.get('/me', auth_1.authenticate, authController_1.getMe);
router.post('/verify-email', ipRateLimit_1.moderateIPRateLimit, authController_1.verifyEmail);
router.post('/resend-verification-request', ipRateLimit_1.moderateIPRateLimit, authController_1.resendVerificationEmailPublic);
router.post('/resend-verification', auth_1.authenticateAllowUnverified, ipRateLimit_1.moderateIPRateLimit, authController_1.resendVerificationEmail);
router.post('/refresh', ipRateLimit_1.moderateIPRateLimit, authController_1.refreshAccessToken);
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.post('/logout-all', auth_1.authenticate, authController_1.logoutAll);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map