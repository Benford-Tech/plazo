import { Request } from 'express';
import { Staff, StaffTokenType } from '@/database';

export type AuthenticatedStaff = Staff & { operatorName: string };

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
