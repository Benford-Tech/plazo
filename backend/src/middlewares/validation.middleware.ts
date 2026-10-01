import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { HttpException } from '@/utils/httpException';

export class ValidationException extends HttpException {
  /** First error code per field, e.g. { totalCapacity: 'min_1' }. */
  public fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super(
      httpStatus.BAD_REQUEST,
      Object.entries(fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', '),
      'validation_failed',
    );
    this.fields = fields;
  }
}

export const ValidationMiddleware = (type: any, location: 'body' | 'params' = 'body', skipMissingProperties = false, whitelist = true) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(type, req[location] ?? {});
    validateOrReject(dto, { skipMissingProperties, whitelist, forbidUnknownValues: true })
      .then(() => {
        req[location] = dto;
        next();
      })
      .catch((errors: ValidationError[]) => {
        const fields: Record<string, string> = {};
        for (const error of errors) {
          fields[error.property] = Object.values(error.constraints ?? { invalid: 'invalid' })[0];
        }
        next(new ValidationException(fields));
      });
  };
};
