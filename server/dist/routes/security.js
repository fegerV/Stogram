"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const securityController_1 = require("../controllers/securityController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
// 2FA routes
router.post('/2fa/enable', securityController_1.SecurityController.enable2FA);
router.post('/2fa/verify', securityController_1.SecurityController.verify2FASetup);
router.post('/2fa/disable', securityController_1.SecurityController.disable2FA);
// E2E Encryption routes
router.post('/encryption/initialize', securityController_1.SecurityController.initializeEncryption);
router.get('/encryption/public-key/:userId', securityController_1.SecurityController.getPublicKey);
// Security logs
router.get('/logs', securityController_1.SecurityController.getSecurityLogs);
// Trusted IPs
router.post('/trusted-ips', securityController_1.SecurityController.addTrustedIP);
// Spam reporting
router.post('/report-spam', securityController_1.SecurityController.reportSpam);
// Account status
router.get('/status', securityController_1.SecurityController.checkAccountStatus);
exports.default = router;
//# sourceMappingURL=security.js.map