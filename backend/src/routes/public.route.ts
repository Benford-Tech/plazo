import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { NODE_ENV } from '@/config';
import { PublicController } from '@/controllers/public.controller';
import { Routes } from '@/interfaces/routes.interface';

// Anonymous endpoints: every request counts, not only failures.
const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, skip: () => NODE_ENV === 'test' });

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Read-only data for the Plazo traveller site (no authentication, published pages only)
 */
/**
 * @swagger
 * /public/airports/{slug}:
 *   get:
 *     summary: Airport page — published parkings with their lowest package price
 *     tags: [Public]
 *     security: []
 *     parameters:
 *       - { in: path, name: slug, required: true, schema: { type: string, example: lyon-saint-exupery } }
 * /public/search:
 *   get:
 *     summary: Parkings for a stay — availability and total price, available first then cheapest
 *     tags: [Public]
 *     security: []
 *     parameters:
 *       - { in: query, name: airport, required: true, schema: { type: string, example: lyon-saint-exupery } }
 *       - { in: query, name: arrivalAt, required: true, schema: { type: string, example: "2026-10-04T06:30" } }
 *       - { in: query, name: returnAt, required: true, schema: { type: string, example: "2026-10-11T15:05" } }
 * /public/airports/{airport}/parkings/{slug}:
 *   get:
 *     summary: A parking's page, with the offer for a stay when dates are given
 *     tags: [Public]
 *     security: []
 *     parameters:
 *       - { in: path, name: airport, required: true, schema: { type: string } }
 *       - { in: path, name: slug, required: true, schema: { type: string } }
 *       - { in: query, name: arrivalAt, schema: { type: string } }
 *       - { in: query, name: returnAt, schema: { type: string } }
 */
export class PublicRoute implements Routes {
  public router = Router();
  public public = new PublicController();

  constructor() {
    this.router.use('/public', publicLimiter);
    this.router.get('/public/airports/:slug', this.public.airport);
    this.router.get('/public/search', this.public.search);
    this.router.get('/public/airports/:airport/parkings/:slug', this.public.parking);
  }
}
