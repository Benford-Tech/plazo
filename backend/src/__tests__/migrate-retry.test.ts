import { RETRY_DELAYS_MS, retryDelay, transientCodeIn } from '@/domain/migrate-retry';

describe('migrate retry', () => {
  it('recognises a database that cannot be reached yet', () => {
    const log = "Error: P1001: Can't reach database server at `ep-xxx-pooler.eu-central-1.aws.neon.tech:5432`";
    expect(transientCodeIn(log)).toBe('P1001');
    expect(transientCodeIn('Error: P1002\nThe database server was reached but timed out.')).toBe('P1002');
    expect(transientCodeIn('Error: P1017: Server has closed the connection.')).toBe('P1017');
  });

  it('never retries a failed migration', () => {
    expect(transientCodeIn('Error: P3009\nmigrate found failed migrations in the target database')).toBeNull();
    expect(transientCodeIn('Error: P3018\nA migration failed to apply.')).toBeNull();
    expect(transientCodeIn('P10011 is not a code')).toBeNull();
  });

  it('waits longer each time, five attempts in all', () => {
    expect(retryDelay(1)).toBe(5_000);
    expect(retryDelay(4)).toBe(30_000);
    expect(retryDelay(5)).toBeNull();
    expect(RETRY_DELAYS_MS.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(70_000);
  });
});
