import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartItemDocument = HydratedDocument<CartItem>;

@Schema({ timestamps: true })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  packageId: Types.ObjectId; // References package within product

  @Prop({ required: true })
  size: string; // e.g., "100gm", "500gm"

  @Prop({ required: true })
  unit: string; // e.g., "gm", "ml"

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number; // Price at time of adding to cart

  @Prop({ default: 0, min: 0 })
  discountPrice: number;

  @Prop({ default: 0, min: 0, max: 100 })
  discountPercentage: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number; // quantity * price

  @Prop({ required: true, min: 0 })
  totalDiscountPrice: number; // quantity * discountPrice

  @Prop({ type: String, enum: ['pending', 'reserved', 'expired'], default: 'pending' })
  status: string;

  @Prop({ type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) })
  reservationExpires: Date; // Cart items expire after 24 hours

  @Prop({ type: Date, default: Date.now })
  addedAt: Date;

  @Prop({ type: Date, sparse: true })
  updatedAt: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);