import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'invalid_email' })
  public email: string;

  @IsString()
  @IsNotEmpty({ message: 'required' })
  public password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'required' })
  public refreshToken: string;
}
