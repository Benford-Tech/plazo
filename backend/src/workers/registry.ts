export const JobNames = {
  PurgeExpiredTokens: 'tokens.purge-expired',
} as const;

export interface MaintenanceJobRegistry {
  [JobNames.PurgeExpiredTokens]: Record<string, never>;
}

export type JobRegistry = MaintenanceJobRegistry;
