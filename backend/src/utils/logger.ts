import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';

const logDir: string = join(__dirname, '../../logs');
const isTest = process.env.NODE_ENV === 'test';
// Vercel's filesystem is read-only: log to the console only, Vercel collects it.
const writeFiles = !isTest && !process.env.VERCEL;

if (writeFiles && !existsSync(logDir)) {
  mkdirSync(logDir);
}

const logFormat = winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`);

const logger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  silent: isTest,
  transports: !writeFiles
    ? []
    : [
        new winstonDaily({
          level: 'debug',
          datePattern: 'YYYY-MM-DD',
          dirname: logDir + '/debug',
          filename: `%DATE%.log`,
          maxFiles: 30,
          json: false,
          zippedArchive: true,
        }),
        new winstonDaily({
          level: 'error',
          datePattern: 'YYYY-MM-DD',
          dirname: logDir + '/error',
          filename: `%DATE%.log`,
          maxFiles: 30,
          handleExceptions: true,
          json: false,
          zippedArchive: true,
        }),
      ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize()),
  }),
);

const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export { logger, stream };
