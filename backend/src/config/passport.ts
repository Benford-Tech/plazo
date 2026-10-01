import { Passport } from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import { SECRET_KEY } from '@/config';
import prisma, { StaffTokenType } from '@/database';
import { DataStoredInToken } from '@/interfaces/auth.interface';

export const staffPassport = new Passport();

// Tokens are stateful: a JWT is only accepted while its row exists in staff_tokens.
export const staffJwtStrategy = new JwtStrategy(
  { secretOrKey: SECRET_KEY as string, jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() },
  async (payload: DataStoredInToken, done: VerifiedCallback) => {
    try {
      if (payload.type !== StaffTokenType.access) return done(null, false);
      const token = await prisma.staffToken.findUnique({
        where: { uid: payload.uuid },
        include: { staff: { include: { operator: true } } },
      });
      if (!token || token.staffId !== payload.sub || token.type !== StaffTokenType.access || token.expiresAt <= new Date()) {
        return done(null, false);
      }
      const { operator, ...staff } = token.staff;
      done(null, { ...staff, operatorName: operator.name }, { tokenUid: token.uid });
    } catch (error) {
      done(error, false);
    }
  },
);

staffPassport.use('internal', staffJwtStrategy);
