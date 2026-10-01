import { ValidateEnv } from '@/utils/validateEnv';

describe('variables d’environnement', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('exige SITE_API_KEY en production (sinon tous les voyageurs partagent une limite)', () => {
    process.env = { ...saved, NODE_ENV: 'production', SECRET_KEY: 's', DATABASE_URL: 'postgresql://x', CRON_SECRET: 'c', SITE_API_KEY: '' };
    expect(() => ValidateEnv()).toThrow(/SITE_API_KEY/);
    process.env.SITE_API_KEY = '   ';
    expect(() => ValidateEnv()).toThrow(/SITE_API_KEY/);
    process.env.SITE_API_KEY = 'cle-partagee-du-site';
    expect(() => ValidateEnv()).not.toThrow();
  });

  it('la laisse facultative en développement', () => {
    process.env = { ...saved, NODE_ENV: 'development', SECRET_KEY: 's', DATABASE_URL: 'postgresql://x', CRON_SECRET: 'c' };
    delete process.env.SITE_API_KEY;
    expect(() => ValidateEnv()).not.toThrow();
  });
});
