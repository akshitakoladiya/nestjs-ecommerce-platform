import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'confirmed' })
  @IsEnum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'])
  status: string;

  @ApiPropertyOptional({ example: 'Order confirmed by customer' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ example: 'paid' })
  @IsEnum(['unpaid', 'pending', 'paid', 'failed', 'refunded'])
  paymentStatus: string;

  @ApiPropertyOptional({ example: 'TXN-12345' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'Payment confirmed' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShippingStatusDto {
  @ApiProperty({ example: 'shipped' })
  @IsEnum(['not_shipped', 'pending_shipment', 'shipped', 'out_for_delivery', 'delivered', 'failed_delivery'])
  shippingStatus: string;

  @ApiPropertyOptional({ example: 'TRACK123456' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'Flipkart' })
  @IsOptional()
  @IsString()
  shippingProvider?: string;

  @ApiPropertyOptional({ example: 'Package shipped' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignDeliveryBoyDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  deliveryBoyId: string;

  @ApiPropertyOptional({ example: 'Assigned for delivery' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RequestReturnDto {
  @ApiProperty({ example: 'Product damaged' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Additional notes about return' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessReturnDto {
  @ApiProperty({ example: 'approved' })
  @IsEnum(['approved', 'rejected'])
  action: string;

  @ApiPropertyOptional({ example: 'Return approved' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'full' })
  @IsOptional()
  @IsEnum(['partial', 'full'])
  refundType?: string;
}

export class ProcessRefundDto {
  @ApiProperty({ example: 'full' })
  @IsEnum(['partial', 'full'])
  refundType: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  @ApiPropertyOptional({ example: 'Customer requested cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class QueryOrderDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'delivered' })
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'])
  status?: string;

  @ApiPropertyOptional({ example: 'paid' })
  @IsOptional()
  @IsEnum(['unpaid', 'pending', 'paid', 'failed', 'refunded'])
  paymentStatus?: string;

  @ApiPropertyOptional({ example: 'shipped' })
  @IsOptional()
  @IsEnum(['not_shipped', 'pending_shipment', 'shipped', 'out_for_delivery', 'delivered', 'failed_delivery'])
  shippingStatus?: string;

  @ApiPropertyOptional({ example: 'ORD-2024-001' })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}