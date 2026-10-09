import { BookingNotify, StaffRole } from '@/database';

export type Permission =
  | 'dashboard:view'
  | 'parking:manage'
  | 'team:manage'
  | 'reservations:view'
  | 'reservations:manage' // create and edit
  | 'reservations:force' // save despite a full night
  | 'reservations:status' // record arrival, shuttle, return
  | 'revenue:view'; // CA-B (09/10/2026): the revenue of the bookings, managers only

const PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  manager: [
    'dashboard:view',
    'parking:manage',
    'team:manage',
    'reservations:view',
    'reservations:manage',
    'reservations:force',
    'reservations:status',
    'revenue:view',
  ],
  agent: ['dashboard:view', 'reservations:view', 'reservations:manage', 'reservations:force', 'reservations:status'],
  driver: ['dashboard:view', 'reservations:view', 'reservations:status'],
  valet: ['dashboard:view', 'reservations:view', 'reservations:status'],
};

export function can(role: StaffRole, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission);
}

/**
 * The posts a role may hold for the day (R-C, 04/10/2026): every post whose permissions the role
 * already has. A manager may take any post; a driver may act as valet and vice versa; an agent may
 * also drive or park. Permissions always come from the role, never from the post.
 */
export function allowedPosts(role: StaffRole): StaffRole[] {
  return (Object.keys(PERMISSIONS) as StaffRole[]).filter(post => PERMISSIONS[post].every(p => PERMISSIONS[role].includes(p)));
}

/** The post shown in the app: the one chosen, else the role itself. */
export function effectivePost(staff: { role: StaffRole; post: StaffRole | null }): StaffRole {
  return staff.post && allowedPosts(staff.role).includes(staff.post) ? staff.post : staff.role;
}

/**
 * N-A (08/10/2026): how a new staff member hears of the new bookings. A manager gets the hourly digest, the others a
 * push per booking (the counter and the drivers act on each one).
 */
export function defaultBookingNotify(role: StaffRole): BookingNotify {
  return role === 'manager' ? 'hourly' : 'immediate';
}
