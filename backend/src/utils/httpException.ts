export class HttpException extends Error {
  public status: number;
  public message: string;
  /** Stable machine-readable code, translated by the clients (e.g. `email_taken`). */
  public code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.message = message;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
