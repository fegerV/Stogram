"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefreshTokenTtlDays = exports.getAccessTokenTtl = exports.getJwtSecret = void 0;
const INSECURE_JWT_SECRETS = new Set([
    'secret',
    'your-secret-key-change-in-production',
]);
const getJwtSecret = () => {
    const jwtSecret = process.env.JWT_SECRET?.trim();
    if (!jwtSecret || INSECURE_JWT_SECRETS.has(jwtSecret)) {
        throw new Error('JWT_SECRET is not configured securely. Set a strong JWT_SECRET environment variable.');
    }
    return jwtSecret;
};
exports.getJwtSecret = getJwtSecret;
const getAccessTokenTtl = () => {
    return process.env.ACCESS_TOKEN_TTL || '15m';
};
exports.getAccessTokenTtl = getAccessTokenTtl;
const getRefreshTokenTtlDays = () => {
    const rawDays = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10);
    if (!Number.isFinite(rawDays) || rawDays <= 0) {
        return 30;
    }
    return rawDays;
};
exports.getRefreshTokenTtlDays = getRefreshTokenTtlDays;
//# sourceMappingURL=authConfig.js.map