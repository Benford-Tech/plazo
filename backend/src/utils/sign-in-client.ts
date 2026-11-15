import { Request } from 'express';
import { SignInClient } from '@/services/invitation-tracking.service';

/** The browser's User-Agent and Plazo Pro's own `X-Plazo-Client` header (15/11/2026), for a sign-in. */
export function signInClient(req: Request): SignInClient {
  return { userAgent: req.get('user-agent') ?? null, client: req.get('x-plazo-client')?.slice(0, 40) ?? null };
}
