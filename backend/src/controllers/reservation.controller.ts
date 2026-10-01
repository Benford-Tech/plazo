import { Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { ChangeStatusDto, CreateReservationDto, ParseEmailDto, UpdateReservationDto } from '@/dtos/reservation.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ReservationService } from '@/services/reservation.service';
import catchAsync from '@/utils/catchAsync';

const str = (value: unknown) => (typeof value === 'string' ? value : undefined);

export class ReservationController {
  public reservationService = Container.get(ReservationService);

  /** GET /internal/planning?date=YYYY-MM-DD */
  public planning = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.reservationService.planning(req.staff, str(req.query.date)));
  });

  /** GET /internal/capacity?arrivalAt=&returnAt=&excludeId= */
  public capacity = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const { arrivalAt, returnAt, excludeId } = req.query;
    res.json(await this.reservationService.previewCapacity(req.staff, str(arrivalAt) ?? '', str(returnAt) ?? '', str(excludeId)));
  });

  /** GET /internal/reservations?q=&page=&limit= */
  public list = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(
      await this.reservationService.list(req.staff, {
        q: str(req.query.q),
        page: Number(req.query.page) || undefined,
        limit: Number(req.query.limit) || undefined,
      }),
    );
  });

  /** GET /internal/reservations/:id */
  public get = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.reservationService.get(req.staff, req.params.id as string));
  });

  /** POST /internal/reservations */
  public create = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: CreateReservationDto = req.body;
    const reservation = await this.reservationService.create(req.staff, data);
    res.status(httpStatus.CREATED).json({ message: 'Reservation created', data: reservation });
  });

  /** PATCH /internal/reservations/:id */
  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateReservationDto = req.body;
    res.json({ message: 'Reservation updated', data: await this.reservationService.update(req.staff, req.params.id as string, data) });
  });

  /** POST /internal/imports/email */
  public parseEmail = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: ParseEmailDto = req.body;
    res.json(await this.reservationService.parseEmail(req.staff, data.text));
  });

  /** POST /internal/reservations/:id/status */
  public changeStatus = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: ChangeStatusDto = req.body;
    res.json({ message: 'Status changed', data: await this.reservationService.changeStatus(req.staff, req.params.id as string, data) });
  });
}
