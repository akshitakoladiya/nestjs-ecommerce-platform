import { IsArray, IsObject, IsString, IsNumber, IsOptional, IsEnum, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  state: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: 'Near the park' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({ example: 'home' })
  @IsOptional()
  @IsEnum(['home', 'work', 'other'])
  addressType?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shippingCost?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxAmount?: number;

  @ApiPropertyOptional({ example: 'cod' })
  @IsOptional()
  @IsEnum(['cod', 'online', 'wallet', 'other'])
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Some notes' })
  @IsOptional()
  @IsString()
  customerNotes?: string;
}