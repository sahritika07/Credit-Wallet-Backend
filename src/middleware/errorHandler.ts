import { Request, Response, NextFunction } from 'express';

// Centralized error handler - sends uniform response structure
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const details = err.details || null;

  res.status(status).json({
    success: false,
    error: {
      message,
      details,
    },
  });
};
