import { Service } from 'typedi';
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
 *     (plus Cancelling | Cancelled).
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
    return { id, state: parseState(data?.state) };
  }

  private async request(credentials: GatewayCredentials, method: 'GET' | 'POST', path: string, body?: unknown): Promise<any> {
    const base = (credentials.baseUrl || SMS_GATEWAY_CLOUD_URL).replace(/\/+$/, '');
    const auth = Buffer.from(`${credentials.login}:${credentials.password}`, 'utf8').toString('base64');
    let res: Response;
    try {
      res = await fetch(`${base}${path}`, {
        method,
        headers: { accept: 'application/json', 'content-type': 'application/json', authorization: `Basic ${auth}` },
        body: body === undefined ? undefined : JSON.stringify(body),
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
