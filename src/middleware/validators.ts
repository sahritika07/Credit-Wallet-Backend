import { Request, Response, NextFunction } from 'express';

export const requireFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing: string[] = [];
    for (const f of fields) {
      if (req.body[f] === undefined || req.body[f] === null || req.body[f] === '') missing.push(f);
    }
    if (missing.length) {
      return res.status(400).json({ success: false, error: { message: 'Missing required fields', details: missing } });
    }
    next();
  };
};
