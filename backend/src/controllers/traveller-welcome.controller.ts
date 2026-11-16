import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { PRODUCT_NAME } from '@/config';
import { escapeHtml } from '@/domain/prospecting';
import { TravellerWelcomeService } from '@/services/traveller-welcome.service';
import catchAsync from '@/utils/catchAsync';

/** The small page of « Ne plus recevoir ces messages » under the welcome email (no script; the button posts to itself). */
export function welcomeUnsubscribePage(kind: 'ask' | 'done' | 'invalid', action = ''): string {
  const title = kind === 'invalid' ? 'Lien invalide' : kind === 'done' ? 'C’est noté' : 'Ne plus recevoir ces messages';
  const text =
    kind === 'invalid'
      ? 'Ce lien n’est pas valide.'
      : kind === 'done'
        ? `Vous ne recevrez plus de message de présentation ni d’offre de ${PRODUCT_NAME}. Les messages de votre réservation (rappel de la veille, point de rendez-vous) continuent.`
        : `Confirmez pour ne plus recevoir de message de présentation ni d’offre de ${PRODUCT_NAME}.`;
  const form = kind === 'ask' ? `<form method="post" action="${escapeHtml(action)}"><button type="submit">Ne plus les recevoir</button></form>` : '';
  return (
    '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<meta name="robots" content="noindex"><title>${escapeHtml(title)}</title>` +
    '<style>body{margin:0;background:#F7F3EE;font-family:Arial,Helvetica,sans-serif;color:#2B211B}' +
    'main{max-width:480px;margin:48px auto;padding:24px;background:#fff;border:1px solid #E7DDD1;border-radius:16px}' +
    'h1{font-size:20px;margin:0 0 12px}p{line-height:1.5;margin:0 0 16px}' +
    'button{min-height:44px;padding:0 18px;border:0;border-radius:999px;background:#FF6600;color:#fff;font-weight:700;font-size:15px;cursor:pointer}</style>' +
    `</head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p>${form}</main></body></html>`
  );
}

/** 15/11/2026: the public opt-out link of the welcome email to the travellers. */
export class TravellerWelcomeController {
  public welcome = Container.get(TravellerWelcomeService);

  /** GET: a page with a button; never opts out by itself (link scanners). */
  public unsubscribePage = catchAsync(async (req: Request, res: Response) => {
    const state = await this.welcome.unsubscribeState(req.params.token);
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex');
    res.type('html');
    if (!state) return res.status(httpStatus.NOT_FOUND).send(welcomeUnsubscribePage('invalid'));
    res.send(welcomeUnsubscribePage(state.off ? 'done' : 'ask', req.originalUrl.split('?')[0]));
  });

  /** POST: the page's button and the one-click unsubscription (RFC 8058). */
  public unsubscribe = catchAsync(async (req: Request, res: Response) => {
    const ok = await this.welcome.unsubscribe(req.params.token);
    res.set('Cache-Control', 'no-store');
    res.type('html');
    res.status(ok ? httpStatus.OK : httpStatus.NOT_FOUND).send(welcomeUnsubscribePage(ok ? 'done' : 'invalid'));
  });
}
