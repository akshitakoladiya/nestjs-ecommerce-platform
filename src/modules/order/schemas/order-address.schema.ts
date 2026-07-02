import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class OrderAddress {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  country: string;

  @Prop({ sparse: true })
  landmark: string;

  @Prop({ type: String, enum: ['home', 'work', 'other'], default: 'home' })
  addressType: string;
}

export const OrderAddressSchema = SchemaFactory.createForClass(OrderAddress);