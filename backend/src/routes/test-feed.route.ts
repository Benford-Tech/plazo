import { Router } from 'express';
import { TestFeedController } from '@/controllers/test-feed.controller';
import { SetTestFeedDto } from '@/dtos/test-feed.dto';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAsOutsidePlatformAccount, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: TestFeed
 *   description: >
 *     The continuous fictional travellers of the platform's own test operator « Plazo (tests) » (15/10/2026): 40
 *     bookings TS-201-PZ to TS-240-PZ topped up by the server at each read of the driver's lists (at most every 3
 *     minutes), so that a driver always has travellers to take to the terminal and to fetch. Every route answers 404
 *     not_found for any other operator, but one that had the feed (renamed, or without its platform admin): it may still
 *     read it and switch it off (enabled false), never on (409 test_feed_unavailable). TEST_FEED=off stops everything.
 * /internal/test-feed:
 *   get:
 *     summary: The feed's switch, its last run and the pool
 *     tags: [TestFeed]
 *     responses:
 *       200:
 *         description: >
 *           { data: { enabled, available, killSwitch, ranAt, lastError, listingPublished, cap, report, pool: [{ plate,
 *           reference, status, arrivalAt, returnAt, onTrip }] } }. `report`: { at, ms, cap, seats, counts: { toTake,
 *           onSiteWaiting, expected, toPickUp, soonReturns, staying, back, active, free, onTrip, handsOff }, moves,
 *           rebooks, retimes, skipped, poolExhausted, listingPublished, error? }.
 *       404: { description: not_found (not the platform's test operator) }
 *   put:
 *     summary: Switches the feed on (a run at once) or off (the pool's open bookings closed, except those on a trip or busy)
 *     tags: [TestFeed]
 *     requestBody: { content: { application/json: { schema: { type: object, required: [enabled], properties: { enabled: { type: boolean } } } } } }
 *     responses:
 *       200: { description: "{ data: { …the view, left?: [{ plate, reason: on_trip | busy }] } }: call it again later for the rows left" }
 *       404: { description: not_found (not the platform's test operator) }
 *       409: { description: "test_feed_unavailable (on only: suspended, archived or demo operator, or no longer the test operator)" }
 * /internal/test-feed/run:
 *   post:
 *     summary: A run now (10 seconds after the last one at least)
 *     tags: [TestFeed]
 *     responses:
 *       200: { description: "{ data: …the view }" }
 *       404: { description: not_found (not the platform's test operator) }
 *       409: { description: "test_feed_off (switched off, or TEST_FEED=off), test_feed_unavailable (suspended, archived or demo operator, or no longer the test operator)" }
 */
export class TestFeedRoute implements Routes {
  public router = Router();
  public feed = new TestFeedController();

  constructor() {
    this.router.get('/internal/test-feed', StaffAuthMiddleware('reservations:view'), this.feed.view);
    this.router.put(
      '/internal/test-feed',
      StaffAuthMiddleware('reservations:manage'),
      RefuseInViewAsOutsidePlatformAccount(),
      ValidationMiddleware(SetTestFeedDto),
      this.feed.set,
    );
    this.router.post('/internal/test-feed/run', StaffAuthMiddleware('reservations:manage'), this.feed.run);
  }
}
