import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { PRODUCT_NAME } from '@/config';
import { escapeHtml } from '@/domain/prospecting';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ProspectingService } from '@/services/prospecting.service';
import catchAsync from '@/utils/catchAsync';

/** The small French page of the opt-out link (no script; the button posts to the same address). */
export function unsubscribePage(kind: 'ask' | 'done' | 'invalid', action = ''): string {
  const title = kind === 'invalid' ? 'Lien invalide' : kind === 'done' ? 'C’est noté' : `Ne plus recevoir de messages de ${PRODUCT_NAME}`;
  const text =
    kind === 'invalid'
      ? 'Ce lien n’est pas valide. Si vous ne souhaitez plus recevoir nos messages, répondez simplement au mail reçu.'
      : kind === 'done'
        ? `Vous ne recevrez plus de messages de prospection de ${PRODUCT_NAME} à cette adresse.`
        : `Confirmez pour ne plus recevoir de messages de prospection de ${PRODUCT_NAME} à cette adresse.`;
  const form =
    kind === 'ask' ? `<form method="post" action="${escapeHtml(action)}"><button type="submit">Ne plus recevoir de messages</button></form>` : '';
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

/** Plateforme › Prospection (18/10/2026) and its public opt-out link. */
export class ProspectingController {
  public prospecting = Container.get(ProspectingService);

  /** GET /internal/platform/prospects */
  public list = catchAsync(async (req: Request, res: Response) => {
    res.json(await this.prospecting.list({ status: req.query.status, airport: req.query.airport }));
  });

  /** POST /internal/platform/prospects */
  public create = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.status(httpStatus.CREATED).json({ data: await this.prospecting.create(req.staff, req.body ?? {}) });
  });

  /** PATCH /internal/platform/prospects/:id */
  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.prospecting.update(req.staff, req.params.id as string, req.body ?? {}) });
  });

  /** DELETE /internal/platform/prospects/:id */
  public remove = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.prospecting.remove(req.staff, req.params.id as string) });
  });

  /** POST /internal/platform/prospects/import */
  public import = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const body = req.body ?? {};
    res.json(await this.prospecting.importRows(req.staff, body.rows, body.dryRun === true));
  });

  /** POST /internal/platform/prospects/:id/status */
  public setStatus = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.prospecting.setStatus(req.staff, req.params.id as string, req.body?.status) });
  });

  /** POST /internal/platform/prospects/:id/stop */
  public stop = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.prospecting.stop(req.staff, req.params.id as string) });
  });

  /** POST /internal/platform/prospects/send */
  public send = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.prospecting.sendNow(req.staff, req.body?.ids));
  });

  /** POST /internal/platform/prospects/test */
  public test = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.prospecting.sendTest(req.staff, req.body ?? {}));
  });

  /** GET /internal/platform/prospects/settings */
  public settings = catchAsync(async (req: Request, res: Response) => {
    res.json({ data: await this.prospecting.settingsView() });
  });

  /** PUT /internal/platform/prospects/settings */
  public updateSettings = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.prospecting.updateSettings(req.staff, req.body ?? {}) });
  });

  /** GET /public/prospecting/unsubscribe/:token: a page with a button; never unsubscribes by itself (link scanners). */
  public unsubscribePage = catchAsync(async (req: Request, res: Response) => {
    const token = req.params.token as string;
    const state = await this.prospecting.unsubscribeState(token);
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex');
    res.type('html');
    if (!state) return res.status(httpStatus.NOT_FOUND).send(unsubscribePage('invalid'));
    res.send(unsubscribePage(state.unsubscribed ? 'done' : 'ask', req.originalUrl.split('?')[0]));
  });

  /** POST /public/prospecting/unsubscribe/:token: the button of the page, and the one-click unsubscription of RFC 8058. */
  public unsubscribe = catchAsync(async (req: Request, res: Response) => {
    const ok = await this.prospecting.unsubscribe(req.params.token as string);
    res.set('Cache-Control', 'no-store');
    res.type('html');
    res.status(ok ? httpStatus.OK : httpStatus.NOT_FOUND).send(unsubscribePage(ok ? 'done' : 'invalid'));
  });
}
