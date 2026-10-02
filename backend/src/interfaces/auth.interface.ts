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
}

export type AuthenticatedStaff = Staff & { operatorName: string; actingAs?: ActingAs };

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

export interface TokenObj {
  token: string;
  expires: Date;
}

export interface TokenData {
  access: TokenObj;
  refresh: TokenObj;
}
