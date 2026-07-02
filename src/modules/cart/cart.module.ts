import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './schemas/cart.schema';
import { CartItem, CartItemSchema } from './schemas/cart-item.schema';
import { CartService } from './services/cart.service';
import { CartController } from './controllers/cart.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: CartItem.name, schema: CartItemSchema },
    ]),
    ProductModule,
  ],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}