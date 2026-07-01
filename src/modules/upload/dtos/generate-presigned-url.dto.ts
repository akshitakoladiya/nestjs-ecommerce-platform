import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GeneratePresignedUrlDto {
  @ApiProperty({ example: 'categories/images/uuid-filename.jpg' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ example: 604800 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  expiresIn?: number;
}
