import { Router } from 'express';
import { ValetController } from '@/controllers/valet.controller';
import { Routes } from '@/interfaces/routes.interface';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Valet
 *   description: >
 *     « Voiturier au terminal » (27/10/2026, direction B): a valet booking gives an arrival run (the car taken at the
 *     terminal) and a departure run (brought back there), each taken by one valet.
 * /internal/valet/runs:
 *   get:
 *     summary: The runs around today { serverTime, meetingPoint, runs[], counts { todo, taken, done } }
 * /internal/valet/runs/{reservationId}/{kind}/take:
 *   post:
 *     summary: « Je prends » (409 run_taken, run_closed; 400 not_valet); kind = arrival | departure
 * /internal/valet/runs/{reservationId}/{kind}/release:
 *   post:
 *     summary: Gives the run back (its valet or a manager)
 * /internal/valet/runs/{reservationId}/{kind}/done:
 *   post:
 *     summary: « Voiture récupérée » (arrival → Sur place) or « Voiture rendue » (departure → Rendu), optional { note }
 */
export class ValetRoute implements Routes {
  public router = Router();
  public valet = new ValetController();

  constructor() {
    this.router.get('/internal/valet/runs', StaffAuthMiddleware('reservations:view'), this.valet.runs);
    this.router.post('/internal/valet/runs/:reservationId/:kind/take', StaffAuthMiddleware('reservations:status'), this.valet.take);
    this.router.post('/internal/valet/runs/:reservationId/:kind/release', StaffAuthMiddleware('reservations:status'), this.valet.release);
    this.router.post('/internal/valet/runs/:reservationId/:kind/done', StaffAuthMiddleware('reservations:status'), this.valet.done);
  }
}
