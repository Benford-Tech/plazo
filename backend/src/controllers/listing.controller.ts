import { Response } from 'express';
import { Container } from 'typedi';
import { UpdateListingDto, UpdatePricingDto } from '@/dtos/listing.dto';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { ListingService } from '@/services/listing.service';
import catchAsync from '@/utils/catchAsync';

export class ListingController {
  public listingService = Container.get(ListingService);

  /** GET /internal/listing */
  public getListing = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.listingService.getListing(req.staff));
  });

  /** PUT /internal/listing */
  public updateListing = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdateListingDto = req.body;
    res.json({ message: 'Listing saved', data: await this.listingService.updateListing(req.staff, data) });
  });

  /** POST /internal/listing/submit */
  public submit = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Listing sent for validation', data: await this.listingService.submit(req.staff) });
  });

  /** POST /internal/listing/withdraw */
  public withdraw = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ message: 'Listing withdrawn', data: await this.listingService.withdraw(req.staff) });
  });

  /** GET /internal/pricing */
  public getPricing = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json(await this.listingService.getPricing(req.staff));
  });

  /** PUT /internal/pricing */
  public updatePricing = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    const data: UpdatePricingDto = req.body;
    res.json({ message: 'Pricing saved', data: await this.listingService.updatePricing(req.staff, data) });
  });
}
