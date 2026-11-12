import { Service } from 'typedi';
import { isPublicHttpsUrl } from '@/domain/public-url';
import { logger } from '@/utils/logger';

/**
 * Client of "SMS Gateway for Android" (capcom6/android-sms-gateway) in its Cloud-server (or private
 * server) mode: the operator's own Android phone sends the SMS. API checked against the project's
 * OpenAPI specification (https://capcom6.github.io/android-sms-gateway/swagger.json):
 *   - base URL https://api.sms-gate.app/3rdparty/v1, HTTP Basic auth with the login and password the
 *     app shows in its "Cloud server" section;
 *   - POST /messages { textMessage: { text }, phoneNumbers: ["+33…"], ttl } → 202 { id, state, … }
 *     (the README's /message path and `message` field are the deprecated spellings);
 *   - GET /messages/{id} → { id, state } with state Pending | Processed | Sent | Delivered | Failed
 *     (plus Cancelling | Cancelled);
 *   - GET /devices → [{ id, name, lastSeen, deletedAt?, … }] (06/11/2026: the phone's history);
 *   - GET /settings, PATCH /settings { ping: { interval_seconds } }: the app pings the server, so an idle phone is seen;
 *     PATCH /settings { messages: { send_interval_min, send_interval_max } }: the app waits between two SMS (07/11/2026);
 *   - POST /webhooks { id, url, event }: the phone calls `url` on `event` (sms:sent, sms:delivered, sms:failed…); the
 *     same id replaces the webhook (09/11/2026).
 * Nothing logged here ever contains a number, a text or a credential.
 */

export const SMS_GATEWAY_CLOUD_URL = 'https://api.sms-gate.app/3rdparty/v1';
const TIMEOUT_MS = 10_000;

export type GatewayState = 'Pending' | 'Processed' | 'Sent' | 'Delivered' | 'Failed' | 'Cancelling' | 'Cancelled';

export interface GatewayCredentials {
  baseUrl: string | null;
  login: string;
  password: string;
}

/** Machine codes shown to the operator (translated by the pro space). */
export type GatewayErrorCode =
  'sms_gateway_unauthorized' | 'sms_gateway_unreachable' | 'sms_gateway_rejected' | 'sms_gateway_offline' | 'sms_gateway_error';

export class GatewayError extends Error {
  constructor(
    public readonly code: GatewayErrorCode,
    public readonly status?: number,
  ) {
    super(code);
    this.name = 'GatewayError';
  }
}

export interface GatewayMessage {
  id: string;
  state: GatewayState;
}

function errorFor(status: number): GatewayError {
  if (status === 401 || status === 403) return new GatewayError('sms_gateway_unauthorized', status);
  // 503: "Queue limits exceeded; ensure device is online".
  if (status === 503) return new GatewayError('sms_gateway_offline', status);
  if (status >= 400 && status < 500) return new GatewayError('sms_gateway_rejected', status);
  return new GatewayError('sms_gateway_error', status);
}

function parseState(value: unknown): GatewayState {
  return typeof value === 'string' && ['Pending', 'Processed', 'Sent', 'Delivered', 'Failed', 'Cancelling', 'Cancelled'].includes(value)
    ? (value as GatewayState)
    : 'Pending';
}

const PROGRESS: GatewayState[] = ['Pending', 'Processed', 'Sent', 'Delivered'];

/**
 * The real state of a message (09/11/2026, « les envois ont fonctionné mais Plazo dit qu'il y a une erreur »): the
 * message-level `state` can lag behind what the phone reported, so the furthest state among `state`, each recipient's
 * `state` and the `states` timestamps wins; Failed counts only when nothing says the SMS left.
 */
export function messageState(data: any): GatewayState {
  const seen: GatewayState[] = [parseState(data?.state)];
  if (Array.isArray(data?.recipients)) for (const r of data.recipients) seen.push(parseState(r?.state));
  if (data?.states && typeof data.states === 'object') for (const key of Object.keys(data.states)) seen.push(parseState(key));
  const best = seen.reduce((a, b) => (PROGRESS.indexOf(b) > PROGRESS.indexOf(a) ? b : a), 'Pending' as GatewayState);
  if (best === 'Sent' || best === 'Delivered') return best;
  const stopped = seen.find(s => s === 'Failed' || s === 'Cancelled' || s === 'Cancelling');
  return stopped ?? best;
}

export interface GatewayDevice {
  id: string;
  lastSeen: Date | null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  // The API's zero time ("0001-01-01T00:00:00Z") means never.
  return Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2000 ? null : date;
}

@Service()
export class SmsGatewayClient {
  public timeoutMs = TIMEOUT_MS;

  /** Hands the SMS to the gateway; the phone sends it when online (within `ttlSeconds`). */
  public async send(credentials: GatewayCredentials, to: string, text: string, ttlSeconds: number): Promise<GatewayMessage> {
    const data = await this.request(credentials, 'POST', '/messages', { textMessage: { text }, phoneNumbers: [to], ttl: ttlSeconds });
    if (typeof data?.id !== 'string') throw new GatewayError('sms_gateway_error');
    return { id: data.id, state: parseState(data.state) };
  }

  public async state(credentials: GatewayCredentials, id: string): Promise<GatewayMessage> {
    const data = await this.request(credentials, 'GET', `/messages/${encodeURIComponent(id)}`);
    return { id, state: messageState(data) };
  }

  /** The phones registered with this login, with when each was last seen (null: never). */
  public async devices(credentials: GatewayCredentials): Promise<GatewayDevice[]> {
    const data = await this.request(credentials, 'GET', '/devices');
    if (!Array.isArray(data)) return [];
    return data.filter(d => d && typeof d === 'object' && !d.deletedAt).map(d => ({ id: String(d.id ?? ''), lastSeen: parseDate(d.lastSeen) }));
  }

  /** The app's ping interval (seconds), null when it does not ping. */
  public async pingInterval(credentials: GatewayCredentials): Promise<number | null> {
    const data = await this.request(credentials, 'GET', '/settings');
    const value = data?.ping?.interval_seconds;
    return typeof value === 'number' && value > 0 ? value : null;
  }

  public async setPingInterval(credentials: GatewayCredentials, seconds: number): Promise<void> {
    await this.request(credentials, 'PATCH', '/settings', { ping: { interval_seconds: seconds } });
  }

  /** The app's pause between two SMS (seconds; nulls when not set). */
  public async sendInterval(credentials: GatewayCredentials): Promise<{ min: number | null; max: number | null }> {
    const data = await this.request(credentials, 'GET', '/settings');
    const num = (v: unknown) => (typeof v === 'number' && v > 0 ? v : null);
    return { min: num(data?.messages?.send_interval_min), max: num(data?.messages?.send_interval_max) };
  }

  /** 07/11/2026 (« Faudrait espacer les envois »): the app waits min to max seconds between two SMS. */
  public async setSendInterval(credentials: GatewayCredentials, min: number, max: number): Promise<void> {
    await this.request(credentials, 'PATCH', '/settings', { messages: { send_interval_min: min, send_interval_max: max } });
  }

  /** 09/11/2026: the phone calls `url` on `event`; registering the same id again replaces it. */
  public async registerWebhook(credentials: GatewayCredentials, id: string, url: string, event: string): Promise<void> {
    await this.request(credentials, 'POST', '/webhooks', { id, url, event });
  }

  private async request(credentials: GatewayCredentials, method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown): Promise<any> {
    const base = (credentials.baseUrl || SMS_GATEWAY_CLOUD_URL).replace(/\/+$/, '');
    if (!isPublicHttpsUrl(base)) throw new GatewayError('sms_gateway_unreachable');
    const auth = Buffer.from(`${credentials.login}:${credentials.password}`, 'utf8').toString('base64');
    let res: Response;
    try {
      res = await fetch(`${base}${path}`, {
        method,
        headers: { accept: 'application/json', 'content-type': 'application/json', authorization: `Basic ${auth}` },
        body: body === undefined ? undefined : JSON.stringify(body),
        // Never followed: a redirect could lead to an internal address.
        redirect: 'error',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      logger.warn(`[SMS gateway] ${method} ${path} unreachable: ${error instanceof Error ? error.name : 'unknown error'}`);
      throw new GatewayError('sms_gateway_unreachable');
    }
    if (!res.ok) {
      logger.warn(`[SMS gateway] ${method} ${path} failed: HTTP ${res.status}`);
      throw errorFor(res.status);
    }
    return res.json().catch(() => ({}));
  }
}
