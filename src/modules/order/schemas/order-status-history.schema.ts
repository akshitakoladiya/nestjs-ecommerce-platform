import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderStatusHistoryDocument = HydratedDocument<OrderStatusHistory>;

@Schema({ timestamps: true })
export class OrderStatusHistory {
  @Prop({ required: true })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', sparse: true })
  changedBy: Types.ObjectId; // User who changed status (admin/manager)

  @Prop({ sparse: true })
  reason: string; // Reason for status change

  @Prop({ sparse: true })
  notes: string;

  @Prop({ type: Date, default: Date.now })
  changedAt: Date;
}

export const OrderStatusHistorySchema = SchemaFactory.createForClass(OrderStatusHistory);