import { IsString, MinLength, MaxLength, IsEnum, Optional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Akshita' })
  @Optional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Koladiya' })
  @Optional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @Optional()
  @IsString()
  mobileNo?: string;

  @ApiPropertyOptional({ example: 'female' })
  @Optional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;
}
