import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { AppDeviceDto } from '@/dtos/app-device.dto';
import { TravellerAppDeviceService } from '@/services/traveller-app-device.service';
import catchAsync from '@/utils/catchAsync';

export class AppDeviceController {
  public devices = Container.get(TravellerAppDeviceService);

  /** PUT /public/app-devices/:subscriptionId */
  public register = catchAsync(async (req: Request, res: Response) => {
    const data = req.body as AppDeviceDto;
    res.set('Cache-Control', 'no-store');
    res.json(await this.devices.register(String(req.params.subscriptionId), data));
  });

  /** DELETE /public/app-devices/:subscriptionId */
  public forget = catchAsync(async (req: Request, res: Response) => {
    await this.devices.forget(String(req.params.subscriptionId));
    res.status(httpStatus.NO_CONTENT).end();
  });
}
