import { Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithStaffSession } from '@/middlewares/staff-auth.middleware';
import { BlogService } from '@/services/blog.service';
import catchAsync from '@/utils/catchAsync';

export class BlogController {
  public blog = Container.get(BlogService);

  /** GET /internal/platform/blog?semaine= */
  public week = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    res.json(await this.blog.week(req.query.semaine));
  });

  public get = catchAsync(async (req: Request, res: Response) => {
    res.json({ data: await this.blog.get(req.params.id as string) });
  });

  public update = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.blog.update(req.staff, req.params.id as string, req.body ?? {}) });
  });

  public rewrite = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.blog.rewrite(req.staff, req.params.id as string, req.body?.instruction) });
  });

  public write = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.blog.writeDay(req.staff, req.body?.day) });
  });

  public publish = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.blog.publish(req.staff, req.params.id as string) });
  });

  public unpublish = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.blog.unpublish(req.staff, req.params.id as string) });
  });

  public reject = catchAsync(async (req: RequestWithStaffSession, res: Response) => {
    res.json({ data: await this.blog.reject(req.staff, req.params.id as string) });
  });

  /** GET /public/blog */
  public list = catchAsync(async (_req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ articles: await this.blog.listPublished() });
  });

  /** GET /public/blog/:slug */
  public article = catchAsync(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ article: await this.blog.getPublished(req.params.slug as string) });
  });
}
