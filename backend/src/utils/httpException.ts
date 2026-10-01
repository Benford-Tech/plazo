export class HttpException extends Error {
  public status: number;
  public message: string;
  /** Stable machine-readable code, translated by the clients (e.g. `email_taken`). */
  public code?: string;
  /** Extra machine-readable data for the client (e.g. the full nights of an overbooking). */
  public details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.message = message;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
