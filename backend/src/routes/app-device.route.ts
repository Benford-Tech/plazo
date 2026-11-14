import { Router } from 'express';
import { AppDeviceController } from '@/controllers/app-device.controller';
import { AppDeviceDto } from '@/dtos/app-device.dto';
import { Routes } from '@/interfaces/routes.interface';
import { appDeviceLimiter } from '@/middlewares/rateLimiter';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: AppDevices
 *   description: The Plazo app's phones and their « Offres et bons plans » switch (13/11/2026, promotions choix A)
 * /public/app-devices/{subscriptionId}:
 *   put:
 *     summary: A Plazo app phone (OneSignal id) and whether it accepts the offers
 *     description: >
 *       Sent by the app at start-up (without `offers`: unchanged, off for a new phone) and when the switch of Plus ›
 *       Notifications changes. { offers?: boolean, platform?: ios | android } → { offers, offersAt }. 400 subscriptionId invalid.
 *       No personal data is kept: the id, the platform, the switch and when it changed.
 *     tags: [AppDevices]
 *   delete:
 *     summary: Forget the phone (204)
 *     tags: [AppDevices]
 */
export class AppDeviceRoute implements Routes {
  public router = Router();
  public devices = new AppDeviceController();

  constructor() {
    const path = '/public/app-devices/:subscriptionId';
    this.router.put(path, appDeviceLimiter, ValidationMiddleware(AppDeviceDto), this.devices.register);
    this.router.delete(path, appDeviceLimiter, this.devices.forget);
  }
}
