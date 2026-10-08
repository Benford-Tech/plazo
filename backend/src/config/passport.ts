import { Passport } from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import { SECRET_KEY, isVerifiedPlatformAdmin } from '@/config';
import prisma, { StaffTokenType } from '@/database';
import { AuthenticatedStaff, DataStoredInToken } from '@/interfaces/auth.interface';

export const staffPassport = new Passport();

/** Metadata of a view-as session (see TokenService.generateViewAsToken). */
export type ViewAsMetadata = { actingAs?: string };

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
      const actingAs = (token.metadata as ViewAsMetadata | null)?.actingAs;

      if (actingAs) {
        // View-as: only while the real person is still a platform admin; works on a suspended
        // operator too (the platform must be able to look at it).
        if (!isVerifiedPlatformAdmin(staff)) return done(null, false);
        const target = await prisma.operator.findUnique({ where: { id: actingAs } });
        if (!target) return done(null, false);
        const scoped: AuthenticatedStaff = {
          ...staff,
          operatorId: target.id,
          operatorName: target.name,
          role: 'manager',
          actingAs: { realOperatorId: operator.id, realOperatorName: operator.name },
        };
        return done(null, scoped, { tokenUid: token.uid });
      }

      if (operator.status !== 'active') return done(null, false, { code: 'account_suspended' });
      done(null, { ...staff, operatorName: operator.name }, { tokenUid: token.uid });
    } catch (error) {
      done(error, false);
    }
  },
);

staffPassport.use('internal', staffJwtStrategy);
