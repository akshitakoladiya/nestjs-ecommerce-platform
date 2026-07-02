import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderItemSchema } from './order-item.schema';
import { OrderAddressSchema } from './order-address.schema';
import { OrderStatusHistorySchema } from './order-status-history.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string; // e.g., ORD-2024-001

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItemSchema[];

  @Prop({ required: true })
  shippingAddress: OrderAddressSchema;

  @Prop({ sparse: true })
  billingAddress: OrderAddressSchema;

  @Prop({ default: 0, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  totalDiscount: number;

  @Prop({ default: 0, min: 0 })
  shippingCost: number;

  @Prop({ default: 0, min: 0 })
  taxAmount: number;

  @Prop({ default: 0, min: 0 })
  totalAmount: number; // subtotal - discount + shipping + tax

  @Prop({ type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'], default: 'pending' })
  status: string;

  @Prop({ type: String, enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'], default: 'unpaid' })
  paymentStatus: string;

  @Prop({ type: String, enum: ['not_shipped', 'pending_shipment', 'shipped', 'out_for_delivery', 'delivered', 'failed_delivery'], default: 'not_shipped' })
  shippingStatus: string;

  @Prop({ type: String, enum: ['cod', 'online', 'wallet', 'other'], sparse: true })
  paymentMethod: string;

  @Prop({ sparse: true })
  transactionId: string;

  @Prop({ sparse: true })
  trackingNumber: string;

  @Prop({ sparse: true })
  shippingProvider: string; // e.g., Flipkart, Delhivery

  @Prop({ type: Date, sparse: true })
  shippedDate: Date;

  @Prop({ type: Date, sparse: true })
  deliveredDate: Date;

  @Prop({ type: Date, sparse: true })
  cancelledDate: Date;

  @Prop({ type: Date, sparse: true })
  expectedDeliveryDate: Date;

  @Prop({ type: [OrderStatusHistorySchema], default: [] })
  statusHistory: OrderStatusHistorySchema[];

  @Prop({ type: String, enum: ['no_return', 'pending', 'approved', 'rejected', 'completed'], default: 'no_return' })
  returnStatus: string;

  @Prop({ type: Date, sparse: true })
  returnRequestedAt: Date;

  @Prop({ sparse: true })
  returnReason: string;

  @Prop({ sparse: true })
  returnNotes: string;

  @Prop({ default: 0, min: 0 })
  refundAmount: number;

  @Prop({ type: String, enum: ['none', 'partial', 'full'], default: 'none' })
  refundType: string;

  @Prop({ sparse: true })
  refundReason: string;

  @Prop({ type: Date, sparse: true })
  refundProcessedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', sparse: true })
  assignedDeliveryBoyId: Types.ObjectId;

  @Prop({ sparse: true })
  deliveryBoyNotes: string;

  @Prop({ type: Object, sparse: true })
  location: {
    latitude: number;
    longitude: number;
  };
  
  @Prop({ sparse: true })
  paymentIntentId: string; // Stripe Payment Intent ID for reference

  @Prop({ sparse: true })
  stripePaymentId: string; // Our Payment document ID for reference

  @Prop({ sparse: true })
  idempotencyKey: string; // Idempotency key for payment

  @Prop({ sparse: true })
  customerNotes: string;

  @Prop({ sparse: true })
  adminNotes: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ shippingStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ assignedDeliveryBoyId: 1 });
OrderSchema.index({ 'items.productId': 1 });