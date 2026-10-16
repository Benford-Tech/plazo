import { Transform } from 'class-transformer';
import { Equals, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from './reservation.dto';

// Footer A (15/10/2026): the site's contact form and « La lettre Plazo ». Validation messages are codes the site translates.
// class-validator reports a field's failed constraints from the lowest decorator up, and the API returns the first one: the
// most basic check ("required") goes last.

/** One-line fields (they reach the email's headers: subject, Reply-To): control characters, line breaks included, become spaces. */
const oneLine = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim() : value);

/** The optional reference: one line, and blank means not given. */
const optionalOneLine = (params: { value: unknown }) => {
  const value = oneLine(params);
  return value === '' ? undefined : value;
};

/** The message keeps its line breaks (normalised to \n); the other control characters go. */
const multiLine = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
        .trim()
    : value;

export const CONTACT_NAME_MAX = 80;
export const CONTACT_REFERENCE_MAX = 20;
export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 2000;

/** A message of the site's contact form (POST /public/contact). */
export class ContactDto {
  @Transform(oneLine)
  @MaxLength(CONTACT_NAME_MAX, { message: 'too_long' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public name: string;

  @Transform(trimString)
  @IsEmail({}, { message: 'invalid_email' })
  @MaxLength(254, { message: 'invalid_email' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public email: string;

  /** The booking the message is about, when the visitor has one (not checked: the support looks it up). */
  @Transform(optionalOneLine)
  @IsOptional()
  @MaxLength(CONTACT_REFERENCE_MAX, { message: 'too_long' })
  @IsString({ message: 'too_long' })
  public reference?: string;

  @Transform(multiLine)
  @MaxLength(CONTACT_MESSAGE_MAX, { message: 'too_long' })
  @MinLength(CONTACT_MESSAGE_MIN, { message: 'too_short' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public message: string;

  /** Honeypot: hidden from people, filled by bots. Anything in it and nothing is sent (the answer is the same). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  public website?: string;
}

/** A subscription to « La lettre Plazo » (POST /public/newsletter): Brevo then asks the address to confirm. */
export class NewsletterDto {
  @Transform(trimString)
  @IsEmail({}, { message: 'invalid_email' })
  @MaxLength(254, { message: 'invalid_email' })
  @IsNotEmpty({ message: 'required' })
  @IsString({ message: 'required' })
  public email: string;

  /** The visitor agreed to receive the newsletter (RGPD: an explicit consent, never pre-ticked). */
  @Equals(true, { message: 'consent_required' })
  public consent: boolean;

  /** Honeypot, as on the contact form. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  public website?: string;
}
