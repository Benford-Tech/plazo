import { Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { ChangePasswordDto, CreateStaffDto, ResetPasswordDto, UpdateMeDto, UpdateStaffDto, SetPostDto, SetVehicleDto } from '@/dtos/staff.dto';
import { AcceptJoinRequestDto, DeleteAccountDto, GoogleSignInDto, LinkAppleDto } from '@/dtos/identity.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { JoinRequestService } from '@/services/join-request.service';
import { StaffAccountService } from '@/services/staff-account.service';
import { StaffService } from '@/services/staff.service';
import { StaffPhotoService } from '@/services/staff-photo.service';
import { InboundEmailService } from '@/services/inbound-email.service';
import { ExtraService } from '@/services/extra.service';
import { can } from '@/domain/roles';
import catchAsync from '@/utils/catchAsync';

export class StaffController {
  public staffService = Container.get(StaffService);
  public joinRequests = Container.get(JoinRequestService);
  public account = Container.get(StaffAccountService);

  public photos = Container.get(StaffPhotoService);

  /** POST /internal/staff/me/photo (30/10/2026) */
  public setPhoto = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.photos.set(req.staff, req.body));
  });

  /** DELETE /internal/staff/me/photo */
  public removePhoto = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    await this.photos.remove(req.staff);
    res.status(httpStatus.NO_CONTENT).end();
  });

  /** GET /internal/staff/:id/photo */
  public photo = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const photo = await this.photos.get(req.staff, req.params.id as string);
    res.set('Content-Type', photo.contentType);
    // The pro space asks with the photo's date: a changed photo is a new address, so a long private cache is safe.
    res.set('Cache-Control', 'private, max-age=86400');
    if (photo.size != null) res.set('Content-Length', String(photo.size));
    photo.stream.pipe(res);
  });

  /** GET /internal/nav/counts (30/10/2026): the menu's counters. */
  public navCounts = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const [inbox, extras] = await Promise.all([
      can(req.staff.role, 'reservations:manage') ? Container.get(InboundEmailService).todoCount(req.staff.operatorId) : null,
      Container.get(ExtraService).todoCount(req.staff.operatorId),
    ]);
    res.set('Cache-Control', 'no-store');
    res.json({ inbox, extras });
  });

  /** GET /internal/staff/me */
  public me = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.staffService.sessionUser(req.staff));
  });

  /** PATCH /internal/staff/me (09/10/2026: one's own first and last name) */
  public updateMe = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateMeDto = req.body;
    res.json(await this.staffService.updateMe(req.staff, data));
  });

  /** PATCH /internal/staff/me/post */
  public setPost = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: SetPostDto = req.body;
    res.json(await this.staffService.setPost(req.staff, data.post));
  });

  /** PATCH /internal/staff/me/vehicle */
  public setVehicle = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: SetVehicleDto = req.body;
    res.json(await this.staffService.setVehicle(req.staff, data.vehicleId ?? null));
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
    const { staff, invitation } = await this.staffService.create(req.staff, data);
    res.status(httpStatus.CREATED).json({ message: 'Staff member created', data: staff, invitation });
  });

  /** POST /internal/staff/:id/invite (26/10/2026): emails the member a new « Choisir mon mot de passe » link. */
  public invite = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const invitation = await this.staffService.invite(req.staff, req.params.id as string);
    res.json({ message: 'Invitation sent', invitation });
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

  // ---------------------------------------------------------------- « Rejoindre un parking » (13/10/2026)

  /** GET /internal/staff/join-code */
  public joinCode = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.joinRequests.joinCode(req.staff));
  });

  /** GET /internal/staff/join-requests */
  public listJoinRequests = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.joinRequests.list(req.staff));
  });

  /** POST /internal/staff/join-requests/:id/accept */
  public acceptJoinRequest = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: AcceptJoinRequestDto = req.body;
    res.status(httpStatus.CREATED).json(await this.joinRequests.accept(req.staff, req.params.id as string, data.role));
  });

  /** POST /internal/staff/join-requests/:id/refuse */
  public refuseJoinRequest = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.joinRequests.refuse(req.staff, req.params.id as string));
  });

  /** POST /internal/staff/me/identities/apple */
  public linkApple = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: LinkAppleDto = req.body;
    res.json(await this.account.linkApple(req.staff, data));
  });

  /** POST /internal/staff/me/identities/google */
  public linkGoogle = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: GoogleSignInDto = req.body;
    res.json(await this.account.linkGoogle(req.staff, data.idToken));
  });

  /** DELETE /internal/staff/me/identities/:provider */
  public unlinkIdentity = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.account.unlink(req.staff, req.params.provider as string));
  });

  /** POST /internal/staff/me/leave */
  public leave = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.account.leave(req.staff));
  });

  /** DELETE /internal/staff/me */
  public deleteMe = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: DeleteAccountDto = req.body;
    await this.account.deleteAccount(req.staff, data);
    res.status(httpStatus.NO_CONTENT).send();
  });
}
