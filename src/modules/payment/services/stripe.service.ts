import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private logger = new Logger('StripeService');

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16' as any,
    });
  }

  // Create Payment Intent with idempotency key
  async createPaymentIntent(
    amount: number,
    currency: string,
    orderId: string,
    idempotencyKey: string,
    metadata?: Record<string, any>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount,
          currency,
          metadata: {
            orderId,
            ...metadata,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        },
        {
          idempotencyKey,
        },
      );

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }

  // Confirm Payment Intent
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
    returnUrl?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: returnUrl,
      });

      this.logger.log(`Payment intent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to confirm payment intent: ${error.message}`);
      throw new InternalServerErrorException('Failed to confirm payment intent');
    }
  }

  // Retrieve Payment Intent
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve payment intent');
    }
  }

  // Cancel Payment Intent
  async cancelPaymentIntent(paymentIntentId: string, cancellationReason?: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: cancellationReason as any,
      });

      this.logger.log(`Payment intent cancelled: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to cancel payment intent: ${error.message}`);
      throw new InternalServerErrorException('Failed to cancel payment intent');
    }
  }

  // Retrieve Charge
  async getCharge(chargeId: string): Promise<Stripe.Charge> {
    try {
      const charge = await this.stripe.charges.retrieve(chargeId);
      return charge;
    } catch (error) {
      this.logger.error(`Failed to retrieve charge: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve charge');
    }
  }

  // Refund Payment
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as any,
      });

      this.logger.log(`Refund created for payment intent: ${paymentIntentId}`);
      return refund;
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw new InternalServerErrorException('Failed to create refund');
    }
  }

  // Verify Webhook Signature
  verifyWebhookSignature(body: string, signature: string): Record<string, any> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.configService.get('STRIPE_WEBHOOK_SECRET'),
      );

      return event;
    } catch (error) {
      this.logger.error(`Webhook verification failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  // Helper method to generate idempotency key
  generateIdempotencyKey(orderId: string, type: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${orderId}-${type}-${timestamp}-${random}`;
  }
}
