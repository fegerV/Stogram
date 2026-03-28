const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^\[::1\]$/i,
  /^::1$/i,
  /^fc/i,
  /^fd/i,
  /^fe80:/i,
];

const isPrivateIpv4 = (hostname: string) => {
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return true;
  }

  const match = hostname.match(/^172\.(\d{1,3})\./);
  if (!match) {
    return false;
  }

  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
};

const isPrivateHostname = (hostname: string) => {
  const normalized = hostname.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  if (normalized.endsWith('.local') || normalized.endsWith('.internal')) {
    return true;
  }

  if (normalized.includes(':')) {
    return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(normalized));
  }

  return isPrivateIpv4(normalized);
};

export const validateOutgoingWebhookUrl = (value: string) => {
  try {
    const url = new URL(value);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';

    if (!isHttp) {
      return { ok: false, error: 'Webhook URL must use http or https' };
    }

    if (isPrivateHostname(url.hostname)) {
      return { ok: false, error: 'Webhook URL cannot target localhost or private network hosts' };
    }

    return { ok: true as const };
  } catch {
    return { ok: false, error: 'Webhook URL must be a valid http(s) URL' };
  }
};
