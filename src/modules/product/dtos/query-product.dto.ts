import { IsOptional, IsNumber, IsString, IsEnum, Min, Max, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'organic tea' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @ApiPropertyOptional({ example: 'price' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'discontinued'])
  status?: string;

  @ApiPropertyOptional({ example: 'in_stock' })
  @IsOptional()
  @IsEnum(['in_stock', 'low_stock', 'out_of_stock'])
  stockStatus?: string;

  @ApiPropertyOptional({ example: 'Premium Brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: ['organic', 'tea'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
