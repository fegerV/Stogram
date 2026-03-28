import { validateOutgoingWebhookUrl } from '../utils/webhookValidation';

describe('validateOutgoingWebhookUrl', () => {
  it('accepts public https urls', () => {
    expect(validateOutgoingWebhookUrl('https://example.com/webhook')).toEqual({ ok: true });
  });

  it('rejects localhost and private network targets', () => {
    expect(validateOutgoingWebhookUrl('http://localhost:3000/webhook')).toEqual({
      ok: false,
      error: 'Webhook URL cannot target localhost or private network hosts',
    });

    expect(validateOutgoingWebhookUrl('http://192.168.1.10/hook')).toEqual({
      ok: false,
      error: 'Webhook URL cannot target localhost or private network hosts',
    });
  });

  it('rejects non-http protocols', () => {
    expect(validateOutgoingWebhookUrl('ftp://example.com/webhook')).toEqual({
      ok: false,
      error: 'Webhook URL must use http or https',
    });
  });
});
