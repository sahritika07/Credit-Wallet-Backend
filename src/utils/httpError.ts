export class HttpError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details: unknown = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const createHttpError = (status: number, message: string, details: unknown = null) => {
  return new HttpError(status, message, details);
};
