import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min, IsOptional } from 'class-validator';

export class CartResponseDto {
  userId: string;
  items: any[];
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  totalDiscount: number;
  totalPrice: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class QueryCartDto {
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
  @Type(() => Number)
  limit?: number = 20;
}