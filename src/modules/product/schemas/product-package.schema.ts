import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductPackageDocument = HydratedDocument<ProductPackage>;

@Schema({ timestamps: true })
export class ProductPackage {
  @Prop({ required: true })
  size: string; // e.g., "100gm", "500gm", "1kg"

  @Prop({ required: true, min: 0 })
  quantity: number; // e.g., 100 for 100gm package

  @Prop({ required: true })
  unit: string; // e.g., "gm", "ml", "kg", "ltr"

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  discountPrice: number;

  @Prop({ default: 0, min: 0, max: 100 })
  discountPercentage: number;

  @Prop({ required: true, min: 0 })
  stock: number;

  @Prop({ default: 0, min: 0 })
  soldQuantity: number;

  @Prop({ default: 0, min: 0 })
  reservedQuantity: number; // For pending orders

  @Prop({ type: String, enum: ['available', 'low_stock', 'out_of_stock'], default: 'available' })
  stockStatus: string;

  @Prop({ default: 0, min: 0 })
  minimumStockLevel: number;

  @Prop({ type: String, sparse: true })
  sku: string; // e.g., PROD-001-100GM

  @Prop({ type: String, sparse: true })
  barcode: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  isAvailableForSale: boolean;

  @Prop({ type: Date, default: null })
  createdAt: Date;

  @Prop({ type: Date, default: null })
  updatedAt: Date;
}

export const ProductPackageSchema = SchemaFactory.createForClass(ProductPackage);
