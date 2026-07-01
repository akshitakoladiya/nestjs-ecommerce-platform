import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ type: String, sparse: true, unique: true })
  slug: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ sparse: true })
  image: string;

  @Prop({
    type: {
      url: String,
      publicId: String,
      key: String,
      filename: String,
      size: Number,
      mimeType: String,
    },
    sparse: true,
  })
  imageDetails: {
    url?: string;
    publicId?: string;
    key?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  };

  @Prop({ sparse: true })
  icon: string;

  @Prop({
    type: {
      url: String,
      publicId: String,
      key: String,
      filename: String,
      size: Number,
      mimeType: String,
    },
    sparse: true,
  })
  iconDetails: {
    url?: string;
    publicId?: string;
    key?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'Category', sparse: true })
  parentCategoryId: Types.ObjectId;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ type: String, enum: ['main', 'sub'], default: 'main' })
  type: string;

  @Prop({ type: [String], sparse: true })
  tags: string[];

  @Prop({ type: String, sparse: true })
  metaTitle: string;

  @Prop({ type: String, sparse: true })
  metaDescription: string;

  @Prop({ type: String, sparse: true })
  metaKeywords: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ name: 'text', description: 'text' });
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentCategoryId: 1 });
CategorySchema.index({ status: 1 });
CategorySchema.index({ createdAt: -1 });
