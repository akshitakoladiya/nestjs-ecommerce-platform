import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ required: true, unique: true })
  paymentIntentId: string; // Stripe Payment Intent ID

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Amount in cents (e.g., 5000 for $50.00)

  @Prop({ required: true })
  currency: string; // e.g., 'usd', 'inr'

  @Prop({ type: String, enum: ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded'], default: 'requires_payment_method' })
  status: string;

  @Prop({ type: String, enum: ['card', 'upi', 'wallet', 'bank_transfer', 'other'], sparse: true })
  paymentMethod: string;

  @Prop({ sparse: true })
  paymentMethodDetails: {
    type?: string;
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
    upi?: {
      id: string;
    };
  };

  @Prop({ sparse: true })
  chargeId: string; // Stripe Charge ID after successful payment

  @Prop({ sparse: true })
  clientSecret: string; // Stripe client secret for frontend

  @Prop({ required: true, unique: true })
  idempotencyKey: string; // Unique key to prevent duplicate charges

  @Prop({ default: false })
  isProcessed: boolean; // Flag to track if payment is fully processed

  @Prop({ type: Date, default: Date.now })
  initiatedAt: Date;

  @Prop({ type: Date, sparse: true })
  completedAt: Date;

  @Prop({ sparse: true })
  failedReason: string;

  @Prop({ type: Date, sparse: true })
  failedAt: Date;

  @Prop({ type: Object, sparse: true })
  stripeMetadata: Record<string, any>; // Full Stripe response

  @Prop({
    type: [
      {
        eventType: String,
        eventData: Object,
        receivedAt: Date,
      },
    ],
    sparse: true,
  })
  webhookEvents: Array<{
    eventType: string;
    eventData: any;
    receivedAt: Date;
  }>;

  @Prop({ default: true })
  isActive: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ paymentIntentId: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ idempotencyKey: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
