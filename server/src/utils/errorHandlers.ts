import { Response } from 'express';
import { z } from 'zod';

export const handleControllerError = (error: unknown, res: Response, message: string = 'Operation failed') => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: 'Validation error', details: error.errors });
  }
  console.error(`${message}:`, error);
  res.status(500).json({ error: message });
};

export const handleNotFound = (res: Response, resource: string = 'Resource') => {
  return res.status(404).json({ error: `${resource} not found` });
};

export const handleUnauthorized = (res: Response, message: string = 'Unauthorized') => {
  return res.status(401).json({ error: message });
};

export const handleForbidden = (res: Response, message: string = 'Permission denied') => {
  return res.status(403).json({ error: message });
};

export const handleBadRequest = (res: Response, message: string) => {
  return res.status(400).json({ error: message });
};
