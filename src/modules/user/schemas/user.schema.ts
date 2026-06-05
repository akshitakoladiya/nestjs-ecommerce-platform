import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../../common/constants/roles';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ sparse: true })
  mobileNo: string;

  @Prop({ enum: ['male', 'female', 'other'], sparse: true })
  gender: string;

  @Prop({ sparse: true })
  profilePic: string;

  @Prop({ type: [String], enum: Object.values(UserRole), default: [UserRole.CUSTOMER] })
  roles: UserRole[];

  @Prop({ type: String, sparse: true })
  stripeCustomerId: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ sparse: true })
  emailVerificationToken: string;

  @Prop({ sparse: true })
  passwordResetToken: string;

  @Prop({ sparse: true })
  passwordResetExpires: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  lastLogin: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1 });
