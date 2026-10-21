import { Request } from 'express';
import { Staff, StaffTokenType } from '@/database';

/**
 * Set while a platform admin acts inside an operator's space ("view-as"): the staff row is the
 * admin's own (real identity, used by the audit log), with operatorId, operatorName and role
 * replaced by the target operator's (role: manager).
 */
export interface ActingAs {
  realOperatorId: string;
  realOperatorName: string;
  /**
   * The viewed operator is the platform's own account (« Plazo (tests) »: a platform admin is one of its members,
   * 12/10/2026): its team can be managed in consultation too (RefuseInViewAsOutsidePlatformAccount).
   */
  platformAccount: boolean;
}

/**
 * `demo`: a session of the prospects' demo (21/10/2026, « Parking des Cèdres (démo) »): what would leave Plazo (team,
 * passwords, payments, SMS settings, devices) is refused (RefuseInViewAs), and nothing it does is sent outside.
 */
export type AuthenticatedStaff = Staff & { operatorName: string; actingAs?: ActingAs; demo?: boolean };

export interface RequestWithStaff extends Request {
  staff: AuthenticatedStaff;
}

export interface DataStoredInToken {
  sub: string;
  iat: number;
  exp: number;
  type: StaffTokenType;
  uuid: string;
}

/** The JWT of an onboarding session (an identity not linked to a member yet, 13/10/2026). */
export interface OnboardingTokenPayload {
  sub: string; // StaffIdentity id
  iat: number;
  exp: number;
  type: 'onboarding';
  uuid: string;
}

export interface TokenObj {
  token: string;
  expires: Date;
}

export interface TokenData {
  access: TokenObj;
  refresh: TokenObj;
}
