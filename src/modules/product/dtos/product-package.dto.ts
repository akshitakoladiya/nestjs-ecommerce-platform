import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductPackageDto {
  @ApiProperty({ example: '100gm' })
  @IsString()
  size: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 'gm' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPrice?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercentage?: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumStockLevel?: number;

  @ApiPropertyOptional({ example: 'PROD-001-100GM' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: '9876543210100' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailableForSale?: boolean;
}

export class UpdateProductPackageDto {
  @ApiPropertyOptional({ example: '100gm' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ example: 'gm' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPrice?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumStockLevel?: number;

  @ApiPropertyOptional({ example: 'PROD-001-100GM' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: '9876543210100' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailableForSale?: boolean;
}
