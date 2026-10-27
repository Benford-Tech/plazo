import { config } from 'dotenv';

config({ quiet: true });
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.SECRET_KEY = 'test-secret';
// 27/10/2026: the site's key, so that a test can speak as the site and name the traveller's address.
process.env.SITE_API_KEY = 'test-site-key';
process.env.CLIENT_URL = 'http://localhost:8080';
process.env.PORT = '3005';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.INBOUND_EMAIL_DOMAIN = 'in.plazo.test';
process.env.INBOUND_EMAIL_SECRET = 'inbound-test-secret';
