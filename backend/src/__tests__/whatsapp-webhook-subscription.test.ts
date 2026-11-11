import { Container } from 'typedi';
import './utils/helpers';
import { WhatsappService } from '@/services/whatsapp.service';

const config = () => ({
  token: 'tok',
  phoneNumberId: 'pn',
  appSecret: 'sec',
  verifyToken: 'ver',
  template: 'plazo_message',
  language: 'fr',
  graphVersion: 'v21.0',
  reminderTemplate: '',
  templates: '',
  businessAccountId: 'waba',
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('Abonnement du webhook WhatsApp chez Meta (11/11/2026, « Le webhook est branché ? »)', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("abonne le champ « messages » vers l'adresse de Plazo et relie l'app au compte, puis ne refait rien pendant 6 h", async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    global.fetch = jest.fn(async (url: any, init: any = {}) => {
      calls.push({ url: String(url), method: init.method ?? 'GET', body: init.body?.toString() });
      const u = String(url);
      if (u.endsWith('/app')) return json({ id: '123' });
      if (u.includes('/123/subscriptions') && !init.method) return json({ data: [] });
      if (u.includes('/123/subscriptions')) return json({ success: true });
      if (u.includes('/waba/subscribed_apps') && !init.method) return json({ data: [] });
      return json({ success: true });
    }) as any;
    const service = Object.create(Container.get(WhatsappService)) as WhatsappService;
    service.config = config;
    service.siteUrl = 'https://www.plazo.fr';
    expect(await service.ensureWebhook(1_000_000_000)).toBe('subscribed');
    const subscribe = calls.find(c => c.method === 'POST' && c.url.includes('/123/subscriptions'))!;
    const params = new URLSearchParams(subscribe.body);
    expect(params.get('object')).toBe('whatsapp_business_account');
    expect(params.get('callback_url')).toBe('https://www.plazo.fr/api/public/whatsapp/webhook');
    expect(params.get('verify_token')).toBe('ver');
    expect(params.get('fields')).toBe('messages');
    expect(calls.some(c => c.method === 'POST' && c.url.includes('/waba/subscribed_apps'))).toBe(true);
    expect(await service.ensureWebhook(1_000_000_000 + 60_000)).toBe('skipped');
  });

  it('ne réécrit rien quand le webhook est déjà en place', async () => {
    const posts: string[] = [];
    global.fetch = jest.fn(async (url: any, init: any = {}) => {
      if (init.method === 'POST') posts.push(String(url));
      const u = String(url);
      if (u.endsWith('/app')) return json({ id: '123' });
      if (u.includes('/123/subscriptions'))
        return json({
          data: [
            {
              object: 'whatsapp_business_account',
              callback_url: 'https://www.plazo.fr/api/public/whatsapp/webhook',
              active: true,
              fields: [{ name: 'messages' }],
            },
          ],
        });
      return json({ data: [{ whatsapp_business_api_data: { id: '123' } }] });
    }) as any;
    const service = Object.create(Container.get(WhatsappService)) as WhatsappService;
    service.config = config;
    service.siteUrl = 'https://www.plazo.fr';
    expect(await service.ensureWebhook(2_000_000_000)).toBe('ok');
    expect(posts).toEqual([]);
  });

  it("sans clés, rien n'est tenté ; un refus de Meta ne lève pas d'erreur", async () => {
    const service = Object.create(Container.get(WhatsappService)) as WhatsappService;
    service.config = () => ({ ...config(), appSecret: '' });
    service.siteUrl = 'https://www.plazo.fr';
    expect(await service.ensureWebhook(3_000_000_000)).toBe('skipped');
    global.fetch = jest.fn(async () => json({ error: { code: 190 } }, 400)) as any;
    service.config = config;
    expect(await service.ensureWebhook(3_000_000_000)).toBe('failed');
  });
});
