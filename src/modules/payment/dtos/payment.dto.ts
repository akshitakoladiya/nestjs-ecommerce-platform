import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class InitiatePaymentDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'usd' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ example: 'card' })
  @IsOptional()
  @IsEnum(['card', 'upi', 'wallet', 'bank_transfer', 'other'])
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Custom metadata' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  customerEmail?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'pi_1234567890' })
  @IsString()
  paymentIntentId: string;

  @ApiProperty({ example: 'pm_1234567890' })
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  savePaymentMethod?: boolean;
}

export class CreatePaymentIntentDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'usd' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ example: 'card' })
  @IsOptional()
  @IsEnum(['card', 'upi', 'wallet', 'bank_transfer', 'other'])
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 'Payment for order ORD-2024-001' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class QueryPaymentDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'succeeded' })
  @IsOptional()
  status?: string;
}
