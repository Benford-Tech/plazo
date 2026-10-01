import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';

export class HealthRoute implements Routes {
  public router = Router();

  constructor() {
    this.router.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
  }
}
