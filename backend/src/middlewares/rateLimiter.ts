import rateLimit from 'express-rate-limit';
import { NODE_ENV } from '@/config';

const skip = () => NODE_ENV === 'test';

export const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, skipSuccessfulRequests: true, skip });

export const appLimiter = rateLimit({ windowMs: 10 * 1000, max: 30, skipSuccessfulRequests: true, skip });
