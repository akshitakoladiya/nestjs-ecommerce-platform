import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProductPackageSchema } from './product-package.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: String, sparse: true })
  slug: string;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ required: true, min: 0 })
  costPrice: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', sparse: true })
  subCategoryId: Types.ObjectId;

  @Prop({ type: [ProductPackageSchema], default: [] })
  packages: ProductPackageSchema[];

  @Prop({ required: true, min: 0 })
  totalStock: number; // Sum of all package stocks

  @Prop({ default: 0, min: 0 })
  totalSoldQuantity: number; // Sum of all sold quantities

  @Prop({ type: [String], sparse: true })
  images: string[];

  @Prop({
    type: [
      {
        url: String,
        publicId: String,
        key: String,
        filename: String,
        size: Number,
        mimeType: String,
      },
    ],
    sparse: true,
  })
  imageDetails: Array<{
    url?: string;
    publicId?: string;
    key?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  }>;

  @Prop({ default: '' })
  thumbnail: string;

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
  thumbnailDetails: {
    url?: string;
    publicId?: string;
    key?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  };

  @Prop({ type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' })
  status: string;

  @Prop({ type: [String], sparse: true })
  tags: string[];

  @Prop({ default: 0, min: 0, max: 5 })
  averageRating: number;

  @Prop({ default: 0, min: 0 })
  totalReviews: number;

  @Prop({ type: Object, sparse: true })
  specifications: Record<string, any>;

  @Prop({ type: String, sparse: true })
  manufacturer: string;

  @Prop({ type: String, sparse: true })
  brand: string;

  @Prop({
    type: {
      length: Number,
      width: Number,
      height: Number,
      weight: Number,
    },
    sparse: true,
  })
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };

  @Prop({ type: String, enum: ['in_stock', 'low_stock', 'out_of_stock'], default: 'in_stock' })
  stockStatus: string;

  @Prop({ default: 0, min: 0 })
  minimumStockLevel: number;

  @Prop({ type: String, sparse: true })
  metaTitle: string;

  @Prop({ type: String, sparse: true })
  metaDescription: string;

  @Prop({ type: String, sparse: true })
  metaKeywords: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ subCategoryId: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ stockStatus: 1 });
