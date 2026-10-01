import { config } from 'dotenv';

config({ quiet: true });
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.SECRET_KEY = 'test-secret';
process.env.CLIENT_URL = 'http://localhost:8080';
process.env.PORT = '3005';
process.env.CRON_SECRET = 'test-cron-secret';
