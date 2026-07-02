import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderItemDocument = HydratedDocument<OrderItem>;

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  packageId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  size: string; // e.g., "100gm", "500gm"

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number; // Price per unit at time of order

  @Prop({ default: 0, min: 0 })
  discountPrice: number;

  @Prop({ default: 0, min: 0, max: 100 })
  discountPercentage: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number; // quantity * price

  @Prop({ required: true, min: 0 })
  totalDiscountPrice: number; // quantity * discountPrice

  @Prop({ default: 'pending', type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'] })
  status: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);