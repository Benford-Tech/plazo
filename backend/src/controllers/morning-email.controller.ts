import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { PRODUCT_NAME } from '@/config';
import { escapeHtml } from '@/domain/prospecting';
import { MorningEmailService } from '@/services/morning-email.service';
import catchAsync from '@/utils/catchAsync';

/** The small French page of « Ne plus le recevoir » (no script; the button posts to the same address). */
export function morningUnsubscribePage(kind: 'ask' | 'done' | 'invalid', action = ''): string {
  const title = kind === 'invalid' ? 'Lien invalide' : kind === 'done' ? 'C’est noté' : 'Ne plus recevoir le mail du matin';
  const text =
    kind === 'invalid'
      ? `Ce lien n’est pas valide. Vous pouvez couper le mail du matin dans Mon compte, sur l’espace pro de ${PRODUCT_NAME}.`
      : kind === 'done'
        ? `Vous ne recevrez plus le mail du matin. Vous pouvez le rallumer dans Mon compte, sur l’espace pro de ${PRODUCT_NAME}.`
        : 'Confirmez pour ne plus recevoir chaque matin le planning, le chiffre d’affaires et l’état des intégrations.';
  const form = kind === 'ask' ? `<form method="post" action="${escapeHtml(action)}"><button type="submit">Ne plus le recevoir</button></form>` : '';
  return (
    '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<meta name="robots" content="noindex"><title>${escapeHtml(title)}</title>` +
    '<style>body{margin:0;background:#EEF0EE;font-family:Arial,Helvetica,sans-serif;color:#1A1D1A}' +
    'main{max-width:480px;margin:48px auto;padding:24px;background:#fff;border:1px solid #E4E6E2;border-radius:14px}' +
    'h1{font-size:20px;margin:0 0 12px;color:#1E5E2E}p{line-height:1.5;margin:0 0 16px}' +
    'button{min-height:44px;padding:0 18px;border:0;border-radius:10px;background:#A3E635;color:#0F2A14;font-weight:700;font-size:15px;cursor:pointer}</style>' +
    `</head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p>${form}</main></body></html>`
  );
}

/** « Mail du matin » (21/10/2026): its public opt-out link. */
export class MorningEmailController {
  public morning = Container.get(MorningEmailService);

  /** GET /public/morning-email/unsubscribe/:token: a page with a button; never turns it off by itself (link scanners). */
  public unsubscribePage = catchAsync(async (req: Request, res: Response) => {
    const state = await this.morning.unsubscribeState(req.params.token);
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex');
    res.type('html');
    if (!state) return res.status(httpStatus.NOT_FOUND).send(morningUnsubscribePage('invalid'));
    res.send(morningUnsubscribePage(state.off ? 'done' : 'ask', req.originalUrl.split('?')[0]));
  });

  /** POST /public/morning-email/unsubscribe/:token: the page's button and the one-click unsubscription (RFC 8058). */
  public unsubscribe = catchAsync(async (req: Request, res: Response) => {
    const ok = await this.morning.unsubscribe(req.params.token);
    res.set('Cache-Control', 'no-store');
    res.type('html');
    res.status(ok ? httpStatus.OK : httpStatus.NOT_FOUND).send(morningUnsubscribePage(ok ? 'done' : 'invalid'));
  });
}
