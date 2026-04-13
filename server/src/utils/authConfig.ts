const INSECURE_JWT_SECRETS = new Set([
  'secret',
  'your-secret-key-change-in-production',
]);

export const getJwtSecret = (): string => {
  const jwtSecret = process.env.JWT_SECRET?.trim();

  if (!jwtSecret || INSECURE_JWT_SECRETS.has(jwtSecret)) {
    throw new Error(
      'JWT_SECRET is not configured securely. Set a strong JWT_SECRET environment variable.'
    );
  }

  return jwtSecret;
};

export const getAccessTokenTtl = (): string => {
  return process.env.ACCESS_TOKEN_TTL || '15m';
};

export const getRefreshTokenTtlDays = (): number => {
  const rawDays = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10);
  if (!Number.isFinite(rawDays) || rawDays <= 0) {
    return 30;
  }
  return rawDays;
};
