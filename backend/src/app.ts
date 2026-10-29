import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { API_PREFIX, CLIENT_URLS, NODE_ENV, PORT, PRODUCT_NAME } from './config';
import { staffPassport } from './config/passport';
import { Routes } from './interfaces/routes.interface';
import { ErrorMiddleware } from './middlewares/error.middleware';
import { RawBodyMiddleware } from './middlewares/raw-body.middleware';
import { MAX_PHOTO_BYTES } from './domain/inspection';
import { MAX_CONTRACT_BYTES } from './domain/partner-contract';
import { appLimiter, authLimiter, publicLimiter } from './middlewares/rateLimiter';
import { logger, stream } from './utils/logger';
import { BOOKING_IMPORT_PATH } from './routes/booking-import.route';
import { INBOUND_PASTE_PATH } from './routes/inbound-email.route';

export const STRIPE_WEBHOOK_PATH = `${API_PREFIX}/public/stripe/webhook`;
export const INSPECTION_PHOTO_PATH = new RegExp(
  `^${API_PREFIX}/(internal/reservations/[^/]+/inspections/(dropoff|return)/photos|public/bookings/[^/]+/inspections/(dropoff|return)/mine/photos)$`,
);

// The Plazo ↔ operator contract (20/10/2026): the PDF's bytes, 4 MB at most.
export const PARTNER_CONTRACT_PATH = new RegExp(`^${API_PREFIX}/internal/platform/operators/[^/]+/contracts$`);
// The parking's own contract (26/10/2026): the same, uploaded by its managers.
export const CONTRACT_TEMPLATE_PATH = `${API_PREFIX}/internal/contract-template`;

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3005;

    this.app.disable('x-powered-by');
    this.app.set('trust proxy', 1);

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    // The API documentation maps every internal route: development only (08/10/2026).
    if (this.env !== 'production') this.initializeSwagger();
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`🚀 API docs are at http://localhost:${this.port}${API_PREFIX}/docs`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    if (this.env !== 'test') this.app.use(morgan('common', { stream }));
    // Bearer tokens only (no cookies), so CORS only needs the known front-end origins.
    this.app.use(cors({ origin: CLIENT_URLS.length ? CLIENT_URLS : false }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    // Stripe signs the exact bytes it sends: its webhook gets the raw body (a Buffer), before the
    // JSON parser (which then leaves the request alone). See RawBodyMiddleware for Vercel.
    this.app.post(STRIPE_WEBHOOK_PATH, RawBodyMiddleware());
    // Condition report photos (19/10/2026): the image's bytes, shrunk by the app (3 MB at most).
    this.app.post(INSPECTION_PHOTO_PATH, RawBodyMiddleware(MAX_PHOTO_BYTES + 64 * 1024));
    this.app.post(PARTNER_CONTRACT_PATH, RawBodyMiddleware(MAX_CONTRACT_BYTES + 64 * 1024));
    this.app.post(CONTRACT_TEMPLATE_PATH, RawBodyMiddleware(MAX_CONTRACT_BYTES + 64 * 1024));
    // A file of old bookings (28/10/2026): 2 000 rows at most, read under a larger limit than the other requests.
    this.app.post(`${API_PREFIX}${BOOKING_IMPORT_PATH}`, express.json({ limit: '4mb' }));
    this.app.post(`${API_PREFIX}${INBOUND_PASTE_PATH}`, express.json({ limit: '4mb' }));
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(staffPassport.initialize());

    this.app.use(API_PREFIX, appLimiter);
    this.app.use(`${API_PREFIX}/internal/auth`, authLimiter);
    // Stripe's webhook deliveries come in bursts from a few addresses: not limited as a traveller.
    this.app.use(`${API_PREFIX}/public`, (req, res, next) =>
      req.originalUrl.split('?')[0] === STRIPE_WEBHOOK_PATH ? next() : publicLimiter(req, res, next),
    );
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use(API_PREFIX, route.router);
    });
  }

  private initializeSwagger() {
    const specs = swaggerJSDoc({
      definition: {
        openapi: '3.0.0',
        info: { title: `${PRODUCT_NAME} API`, version: '1.0.0', description: `${PRODUCT_NAME} API documentation` },
        servers: [{ url: API_PREFIX }],
        components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
        security: [{ bearerAuth: [] }],
      },
      apis: [`${__dirname}/routes/*.{ts,js}`],
    });
    this.app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}
