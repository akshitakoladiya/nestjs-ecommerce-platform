import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentService } from './services/payment.service';
import { StripeService } from './services/stripe.service';
import { PaymentController } from './controllers/payment.controller';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
    ConfigModule,
    OrderModule,
  ],
  providers: [PaymentService, StripeService],
  controllers: [PaymentController],
  exports: [PaymentService, StripeService],
})
export class PaymentModule {}
