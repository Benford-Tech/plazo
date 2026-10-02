import { Router } from 'express';
import { PlatformController } from '@/controllers/platform.controller';
import { CreateCapacityStudyDto, UpdateCapacityStudyDto } from '@/dtos/capacity-study.dto';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Platform
 *   description: Internal tools of the platform owner (emails listed in PLATFORM_ADMIN_EMAILS; 403 for everyone else)
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     CapacityStudyInput:
 *       type: object
 *       description: Geometries are GeoJSON in WGS84. Every field is optional on PATCH.
 *       properties:
 *         name: { type: string, maxLength: 120 }
 *         outline: { type: object, nullable: true, description: "GeoJSON Polygon (2000 vertices at most)" }
 *         parcels: { type: array, maxItems: 50, items: { type: object } }
 *         scaleFactor: { type: number, minimum: 0.5, maximum: 2 }
 *         zones: { type: array, maxItems: 50, items: { type: object, description: "{ id, name, geometry: Polygon }" } }
 *         exclusions:
 *           type: array
 *           maxItems: 200
 *           items: { type: object, description: "{ id, name, kind: building|reception|shuttle_lane|tree|post|other, geometry: Polygon|LineString|Point, clearance (m) }" }
 *         settings: { type: object, description: "Layout settings (10 kB at most)" }
 *         results: { type: object, description: "Summary of the last estimate (100 kB at most)" }
 *         carMarkers: { type: array, maxItems: 5000, items: { type: array, items: { type: number } } }
 * /internal/platform/capacity-studies:
 *   get:
 *     summary: List the capacity studies (most recent first)
 *     tags: [Platform]
 *   post:
 *     summary: Create a capacity study
 *     tags: [Platform]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CapacityStudyInput' }
 * /internal/platform/capacity-studies/{id}:
 *   get:
 *     summary: One capacity study
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *   patch:
 *     summary: Save part of a capacity study (autosave)
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CapacityStudyInput' }
 *   delete:
 *     summary: Delete a capacity study
 *     tags: [Platform]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 * /internal/platform/geo/parcels:
 *   get:
 *     summary: Cadastral parcels at a point (proxy to IGN API Carto, cadastre)
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: lon, required: true, schema: { type: number } }
 *       - { in: query, name: lat, required: true, schema: { type: number } }
 * /internal/platform/geo/parkings:
 *   get:
 *     summary: BD TOPO parking areas in a box of 0.05° at most (proxy to the Géoplateforme WFS)
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: bbox, required: true, schema: { type: string, example: "5.07,45.715,5.09,45.73" }, description: "minLon,minLat,maxLon,maxLat" }
 * /internal/platform/geo/geocode:
 *   get:
 *     summary: Address search (proxy to the Géoplateforme geocoding service)
 *     tags: [Platform]
 *     parameters:
 *       - { in: query, name: q, required: true, schema: { type: string, minLength: 3 } }
 */
export class PlatformRoute implements Routes {
  public router = Router();
  public platform = new PlatformController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const base = '/internal/platform';
    this.router.get(`${base}/capacity-studies`, PlatformAdminMiddleware(), this.platform.listStudies);
    this.router.post(`${base}/capacity-studies`, PlatformAdminMiddleware(), ValidationMiddleware(CreateCapacityStudyDto), this.platform.createStudy);
    this.router.get(`${base}/capacity-studies/:id`, PlatformAdminMiddleware(), this.platform.getStudy);
    this.router.patch(
      `${base}/capacity-studies/:id`,
      PlatformAdminMiddleware(),
      ValidationMiddleware(UpdateCapacityStudyDto),
      this.platform.updateStudy,
    );
    this.router.delete(`${base}/capacity-studies/:id`, PlatformAdminMiddleware(), this.platform.deleteStudy);
    this.router.get(`${base}/geo/parcels`, PlatformAdminMiddleware(), this.platform.parcels);
    this.router.get(`${base}/geo/parkings`, PlatformAdminMiddleware(), this.platform.parkings);
    this.router.get(`${base}/geo/geocode`, PlatformAdminMiddleware(), this.platform.geocode);
  }
}
