import { App } from './app';
import AppRoutes from './routes';
import { ValidateEnv } from './utils/validateEnv';

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

ValidateEnv();

const app = new App(AppRoutes);

app.listen();
