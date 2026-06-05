import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationEmailDto {
  @ApiProperty({ example: 'akshita@example.com' })
  @IsEmail()
  email: string;
}
