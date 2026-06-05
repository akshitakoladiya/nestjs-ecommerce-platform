import { IsEmail, IsString, MinLength, MaxLength, IsEnum, Optional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'akshita@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  password: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  confirmPassword: string;

  @ApiProperty({ example: 'Akshita' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Koladiya' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @Optional()
  @IsString()
  mobileNo?: string;

  @ApiPropertyOptional({ example: 'female' })
  @Optional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;
}
