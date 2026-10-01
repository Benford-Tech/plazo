import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { ValidationException } from './validation.middleware';

// Error body: { message, code?, fields?, details? }. Clients translate `code` and `fields`.
export const ErrorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const message: string = status === 500 ? 'Something went wrong, please try again' : error.message;
    if (status === 500) logger.error(error.stack ?? String(error));
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);
    res.status(status).json({
      message,
      ...(status !== 500 && error.code ? { code: error.code } : {}),
      ...(error instanceof ValidationException ? { fields: error.fields } : {}),
      ...(status !== 500 && error.details !== undefined ? { details: error.details } : {}),
    });
  } catch (err) {
    next(err);
  }
};
