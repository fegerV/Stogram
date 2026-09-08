"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBadRequest = exports.handleForbidden = exports.handleUnauthorized = exports.handleNotFound = exports.handleControllerError = void 0;
const zod_1 = require("zod");
const handleControllerError = (error, res, message = 'Operation failed') => {
    if (error instanceof zod_1.z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error(`${message}:`, error);
    res.status(500).json({ error: message });
};
exports.handleControllerError = handleControllerError;
const handleNotFound = (res, resource = 'Resource') => {
    return res.status(404).json({ error: `${resource} not found` });
};
exports.handleNotFound = handleNotFound;
const handleUnauthorized = (res, message = 'Unauthorized') => {
    return res.status(401).json({ error: message });
};
exports.handleUnauthorized = handleUnauthorized;
const handleForbidden = (res, message = 'Permission denied') => {
    return res.status(403).json({ error: message });
};
exports.handleForbidden = handleForbidden;
const handleBadRequest = (res, message) => {
    return res.status(400).json({ error: message });
};
exports.handleBadRequest = handleBadRequest;
//# sourceMappingURL=errorHandlers.js.map