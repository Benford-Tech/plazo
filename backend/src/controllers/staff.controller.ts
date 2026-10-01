import { Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { ChangePasswordDto, CreateStaffDto, ResetPasswordDto, UpdateStaffDto } from '@/dtos/staff.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { StaffService, toPublicStaff } from '@/services/staff.service';
import catchAsync from '@/utils/catchAsync';

export class StaffController {
  public staffService = Container.get(StaffService);

  /** GET /internal/staff/me */
  public me = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(toPublicStaff(req.staff));
  });

  /** PATCH /internal/staff/me/password */
  public changePassword = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: ChangePasswordDto = req.body;
    await this.staffService.changeOwnPassword(req.staff, data);
    res.json({ message: 'Password changed, please log in again' });
  });

  /** GET /internal/staff */
  public list = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.staffService.list(req.staff));
  });

  /** POST /internal/staff */
  public create = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: CreateStaffDto = req.body;
    const staff = await this.staffService.create(req.staff, data);
    res.status(httpStatus.CREATED).json({ message: 'Staff member created', data: staff });
  });

  /** PATCH /internal/staff/:id */
  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateStaffDto = req.body;
    const staff = await this.staffService.update(req.staff, req.params.id as string, data);
    res.json({ message: 'Staff member updated', data: staff });
  });

  /** POST /internal/staff/:id/reset-password */
  public resetPassword = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: ResetPasswordDto = req.body;
    await this.staffService.resetPassword(req.staff, req.params.id as string, data.password);
    res.json({ message: 'Password reset' });
  });
}
