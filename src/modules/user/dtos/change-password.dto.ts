import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  newPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  confirmPassword: string;
}
