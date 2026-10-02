import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { HttpException } from '@/utils/httpException';

/**
 * Keeps a request's exact bytes in req.body (a Buffer), for signature checks (Stripe's webhook).
 *
 * Not express.raw: on Vercel, the Node runtime's helpers read the body before Express runs, then
 * replay it to "data"/"end" listeners. body-parser sees the stream as finished and skips it, and
 * req.body would be Vercel's parsed JSON, whose bytes differ from the signed ones. Listening to the
 * stream directly gets the original bytes in both cases (plain Node and Vercel).
 */
export const RawBodyMiddleware =
  (limitBytes = 1024 * 1024) =>
  (req: Request, res: Response, next: NextFunction) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let done = false;
    const finish = (error?: unknown) => {
      if (done) return;
      done = true;
      if (error) return next(error);
      // The JSON parser registered after this one leaves the request alone.
      Object.defineProperty(req, 'body', { value: Buffer.concat(chunks), writable: true, configurable: true, enumerable: true });
      (req as Request & { _body?: boolean })._body = true;
      next();
    };
    req.on('data', (chunk: Buffer | string) => {
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      size += buffer.length;
      if (size > limitBytes) return finish(new HttpException(httpStatus.REQUEST_ENTITY_TOO_LARGE, 'Payload too large', 'payload_too_large'));
      chunks.push(buffer);
    });
    req.on('end', () => finish());
    req.on('error', error => finish(error));
  };
