import { Response } from 'express';
import { Container } from 'typedi';
import { UpdateParkingDto } from '@/dtos/parking.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ParkingService } from '@/services/parking.service';
import catchAsync from '@/utils/catchAsync';

export class ParkingController {
  public parkingService = Container.get(ParkingService);

  /** GET /internal/parking */
  public getPrimary = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.parkingService.getPrimary(req.staff));
  });

  /** PATCH /internal/parkings/:id */
  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateParkingDto = req.body;
    const parking = await this.parkingService.update(req.staff, req.params.id as string, data);
    res.json({ message: 'Parking updated', data: parking });
  });
}
