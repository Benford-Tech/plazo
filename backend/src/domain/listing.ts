export const SERVICES = ['shuttle', 'valet', 'covered', 'ev_charging', 'open_24h', 'fenced', 'cctv'] as const;
export type Service = (typeof SERVICES)[number];

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
