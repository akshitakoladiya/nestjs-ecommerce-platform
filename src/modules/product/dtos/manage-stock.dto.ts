import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ManageStockDto {
  @ApiProperty({ example: 'increase' })
  @IsEnum(['increase', 'decrease', 'set'])
  action: 'increase' | 'decrease' | 'set';

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ example: 'Stock adjustment' })
  reason?: string;

  @ApiPropertyOptional({ example: 'IN-001' })
  referenceId?: string;
}

export class AdjustPackageStockDto {
  @ApiProperty({ example: 'increase' })
  @IsEnum(['increase', 'decrease', 'set', 'reserve', 'release'])
  action: 'increase' | 'decrease' | 'set' | 'reserve' | 'release';

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ example: 'Order placement' })
  reason?: string;

  @ApiPropertyOptional({ example: 'ORD-001' })
  referenceId?: string;
}
