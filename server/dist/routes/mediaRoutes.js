"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const mediaController_1 = require("../controllers/mediaController");
const router = (0, express_1.Router)();
router.use((req, _res, next) => {
    const queryToken = typeof req.query.access_token === 'string' ? req.query.access_token : null;
    if (queryToken && !req.headers.authorization) {
        req.headers.authorization = `Bearer ${queryToken}`;
    }
    next();
});
router.use(auth_1.authenticate);
router.get('/uploads/*', mediaController_1.serveUploadedMedia);
exports.default = router;
//# sourceMappingURL=mediaRoutes.js.map