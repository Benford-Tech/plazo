import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { ContactDto, NewsletterDto } from '@/dtos/contact.dto';
import { ContactService } from '@/services/contact.service';
import { NewsletterService } from '@/services/newsletter.service';
import catchAsync from '@/utils/catchAsync';

export class ContactController {
  public contact = Container.get(ContactService);
  public newsletter = Container.get(NewsletterService);

  /** POST /public/contact */
  public send = catchAsync(async (req: Request, res: Response) => {
    const data: ContactDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.status(httpStatus.ACCEPTED).json(await this.contact.send(data));
  });

  /** POST /public/newsletter */
  public subscribe = catchAsync(async (req: Request, res: Response) => {
    const data: NewsletterDto = req.body;
    res.set('Cache-Control', 'no-store');
    res.status(httpStatus.ACCEPTED).json(await this.newsletter.subscribe(data));
  });
}
