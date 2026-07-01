import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductService } from './services/product.service';
import { ProductController } from './controllers/product.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    UploadModule,
  ],
  providers: [ProductService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
