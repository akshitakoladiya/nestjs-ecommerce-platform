import { IsString, IsNumber, IsArray, IsOptional, IsEnum, Min, Max, IsMongoId, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateProductPackageDto } from './product-package.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'Organic Tea Powder' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Premium organic tea powder from Darjeeling' })
  @IsString()
  description: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  basePrice: number;

  @ApiProperty({ example: 300 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice: number;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  categoryId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  @IsOptional()
  @IsMongoId()
  subCategoryId?: string;

  @ApiProperty({ type: [CreateProductPackageDto], example: [{ size: '100gm', quantity: 100, unit: 'gm', price: 150, stock: 500 }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductPackageDto)
  packages: CreateProductPackageDto[];

  @ApiPropertyOptional({ example: ['tea.jpg', 'tea-2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: 'thumbnail.jpg' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'discontinued'])
  status?: string;

  @ApiPropertyOptional({ example: ['organic', 'tea', 'darjeeling'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: { origin: 'Darjeeling', type: 'Black Tea' } })
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({ example: 'ABC Tea Company' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'Premium Brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumStockLevel?: number;
}
