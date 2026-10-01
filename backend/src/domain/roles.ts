import { StaffRole } from '@/database';

export type Permission =
  | 'dashboard:view'
  | 'parking:manage'
  | 'team:manage'
  | 'reservations:view'
  | 'reservations:manage' // create and edit
  | 'reservations:force' // save despite a full night
  | 'reservations:status'; // record arrival, shuttle, return

const PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  manager: [
    'dashboard:view',
    'parking:manage',
    'team:manage',
    'reservations:view',
    'reservations:manage',
    'reservations:force',
    'reservations:status',
  ],
  agent: ['dashboard:view', 'reservations:view', 'reservations:manage', 'reservations:force', 'reservations:status'],
  driver: ['dashboard:view', 'reservations:view', 'reservations:status'],
  valet: ['dashboard:view', 'reservations:view', 'reservations:status'],
};

export function can(role: StaffRole, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission);
}
