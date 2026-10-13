import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { JOINABLE_ROLES, JoinableRole } from '@/domain/join-request';
import { trimString } from './reservation.dto';

// 13/10/2026: Plazo Pro sign-in with Apple / Google and joining a parking with the daily code. Validation messages are
// codes translated by the clients.

/** Sign in with Apple: the identity token, the raw nonce the app hashed into it, and the name (first authorisation only). */
export class AppleSignInDto {
  @MaxLength(8192, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public identityToken: string;

  @MaxLength(200, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public rawNonce: string;

  @IsOptional()
  @MaxLength(200, { message: 'too_long' })
  @IsString({ message: 'invalid' })
  public givenName?: string;

  @IsOptional()
  @MaxLength(200, { message: 'too_long' })
  @IsString({ message: 'invalid' })
  public familyName?: string;
}

/** Google Sign-In: the ID token (audience: the Web client ID). */
export class GoogleSignInDto {
  @MaxLength(8192, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public idToken: string;
}

/** Linking Apple from « Mon compte »: no name needed. */
export class LinkAppleDto {
  @MaxLength(8192, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public identityToken: string;

  @MaxLength(200, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public rawNonce: string;
}

/** « Envoyer ma demande »: the code of the day, the person's names and the post they ask for (never manager). */
export class JoinParkingDto {
  // Any other wrong value (too long, wrong characters) is a wrong code (400 join_code_invalid), counted as a failure.
  @Transform(trimString)
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public code: string;

  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public firstName: string;

  @Transform(trimString)
  @MaxLength(60, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public lastName: string;

  @IsIn(JOINABLE_ROLES, { message: 'invalid_role' })
  public wishedRole: JoinableRole;
}

/** Deleting an identity that never joined: Apple's fresh authorization code, to revoke its tokens. */
export class DeleteIdentityDto {
  @IsOptional()
  @MaxLength(2048, { message: 'too_long' })
  @IsString({ message: 'invalid' })
  public authorizationCode?: string;
}

/** A manager accepts a join request with a role below manager. */
export class AcceptJoinRequestDto {
  @IsIn(JOINABLE_ROLES, { message: 'invalid_role' })
  public role: JoinableRole;
}

/**
 * « Supprimer mon compte »: a proof that it is really the person. With an Apple identity linked, Apple's fresh
 * authorization code is required (Plazo must leave the Apple account); otherwise the password or a fresh Google token.
 */
export class DeleteAccountDto {
  @IsOptional()
  @MaxLength(200, { message: 'too_long' })
  @IsString({ message: 'invalid' })
  public password?: string;

  @IsOptional()
  @MaxLength(2048, { message: 'too_long' })
  @IsString({ message: 'invalid' })
  public appleAuthorizationCode?: string;

  @IsOptional()
  @MaxLength(8192, { message: 'too_long' })
  @IsString({ message: 'invalid' })
  public googleIdToken?: string;
}
