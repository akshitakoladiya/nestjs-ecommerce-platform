import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { StripeService } from './stripe.service';
import { OrderService } from '../../order/services/order.service';
import { CreatePaymentIntentDto, QueryPaymentDto } from '../dtos';

@Injectable()
export class PaymentService {
  private logger = new Logger('PaymentService');

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private stripeService: StripeService,
    private orderService: OrderService,
  ) {}

  // Initiate payment for order
  async initiatePayment(userId: string, createPaymentIntentDto: CreatePaymentIntentDto): Promise<PaymentDocument> {
    const { orderId, amount, currency, paymentMethod, customerEmail, description } =
      createPaymentIntentDto;

    // Get order
    const order = await this.orderService.getOrderById(orderId, userId);

    // Check if payment already exists for this order
    const existingPayment = await this.paymentModel.findOne({
      orderId,
      status: { $ne: 'canceled' },
    });

    if (existingPayment) {
      throw new ConflictException('Payment already initiated for this order');
    }

    // Validate amount matches order
    if (amount !== order.totalAmount) {
      throw new BadRequestException('Payment amount does not match order total');
    }

    // Generate idempotency key
    const idempotencyKey = this.stripeService.generateIdempotencyKey(orderId, 'payment');

    try {
      // Create Payment Intent on Stripe
      const stripePaymentIntent = await this.stripeService.createPaymentIntent(
        amount * 100, // Convert to cents
        currency,
        orderId,
        idempotencyKey,
        {
          description: description || `Payment for order ${order.orderNumber}`,
          customerEmail,
        },
      );

      // Store payment record
      const payment = await this.paymentModel.create({
        paymentIntentId: stripePaymentIntent.id,
        orderId,
        userId,
        amount,
        currency,
        status: stripePaymentIntent.status,
        paymentMethod,
        clientSecret: stripePaymentIntent.client_secret,
        idempotencyKey,
        stripeMetadata: stripePaymentIntent,
        webhookEvents: [],
        isProcessed: false,
      });

      // Update order with payment intent ID
      await this.orderService.updateOrderPaymentIntentId(orderId, payment._id.toString(), stripePaymentIntent.id);

      this.logger.log(`Payment initiated: ${payment.paymentIntentId} for order ${orderId}`);

      return payment;
    } catch (error) {
      this.logger.error(`Failed to initiate payment: ${error.message}`);
      throw error;
    }
  }

  // Confirm payment
  async confirmPayment(userId: string, paymentIntentId: string, paymentMethodId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ paymentIntentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId.toString() !== userId) {
      throw new BadRequestException('Unauthorized payment access');
    }

    try {
      const stripePaymentIntent = await this.stripeService.confirmPaymentIntent(
        paymentIntentId,
        paymentMethodId,
      );

      payment.status = stripePaymentIntent.status;
      payment.stripeMetadata = stripePaymentIntent;

      if (stripePaymentIntent.charges && stripePaymentIntent.charges.data.length > 0) {
        payment.chargeId = stripePaymentIntent.charges.data[0].id;
      }

      await payment.save();

      return payment;
    } catch (error) {
      this.logger.error(`Failed to confirm payment: ${error.message}`);
      throw error;
    }
  }

  // Get payment by ID
  async getPayment(paymentId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // Get payment by order ID
  async getPaymentByOrderId(orderId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ orderId });

    if (!payment) {
      throw new NotFoundException('Payment not found for this order');
    }

    return payment;
  }

  // Get all payments for user
  async getUserPayments(userId: string, queryDto: QueryPaymentDto): Promise<{
    data: PaymentDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, status } = queryDto;

    const filter: any = { userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const total = await this.paymentModel.countDocuments(filter);

    const data = await this.paymentModel
      .find(filter)
      .populate('orderId', 'orderNumber totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return { data, total, page, limit };
  }

  // Handle Stripe webhook event
  async handleWebhookEvent(eventType: string, eventData: any): Promise<void> {
    try {
      switch (eventType) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(eventData);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(eventData);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(eventData);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(eventData);
          break;
        case 'charge.dispute.created':
          await this.handleDisputeCreated(eventData);
          break;
        default:
          this.logger.warn(`Unhandled webhook event type: ${eventType}`);
      }

      this.logger.log(`Webhook event processed: ${eventType}`);
    } catch (error) {
      this.logger.error(`Failed to handle webhook event: ${error.message}`);
      throw error;
    }
  }

  // Handle payment intent succeeded
  private async handlePaymentIntentSucceeded(eventData: any): Promise<void> {
    const paymentIntentId = eventData.object.id;
    const payment = await this.paymentModel.findOne({ paymentIntentId });

    if (!payment) {
      this.logger.warn(`Payment record not found for intent: ${paymentIntentId}`);
      return;
    }

    // Check if already processed (idempotency)
    if (payment.isProcessed) {
      this.logger.log(`Payment already processed: ${paymentIntentId}`);
      return;
    }

    payment.status = 'succeeded';
    payment.completedAt = new Date();
    payment.isProcessed = true;

    if (eventData.object.charges && eventData.object.charges.data.length > 0) {
      payment.chargeId = eventData.object.charges.data[0].id;
    }

    payment.webhookEvents.push({
      eventType: 'payment_intent.succeeded',
      eventData,
      receivedAt: new Date(),
    });

    await payment.save();

    // Update order payment status
    await this.orderService.updatePaymentStatus(payment.orderId.toString(), {
      paymentStatus: 'paid',
      transactionId: payment.paymentIntentId,
      notes: 'Payment confirmed via webhook',
    });

    this.logger.log(`Payment succeeded: ${paymentIntentId}`);
  }

  // Handle payment intent failed
  private async handlePaymentIntentFailed(eventData: any): Promise<void> {
    const paymentIntentId = eventData.object.id;
    const payment = await this.paymentModel.findOne({ paymentIntentId });

    if (!payment) {
      this.logger.warn(`Payment record not found for intent: ${paymentIntentId}`);
      return;
    }

    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.failedReason = eventData.object.last_payment_error?.message;

    payment.webhookEvents.push({
      eventType: 'payment_intent.payment_failed',
      eventData,
      receivedAt: new Date(),
    });

    await payment.save();

    // Update order payment status
    await this.orderService.updatePaymentStatus(payment.orderId.toString(), {
      paymentStatus: 'failed',
      notes: 'Payment failed - ' + payment.failedReason,
    });

    this.logger.log(`Payment failed: ${paymentIntentId}`);
  }

  // Handle payment intent canceled
  private async handlePaymentIntentCanceled(eventData: any): Promise<void> {
    const paymentIntentId = eventData.object.id;
    const payment = await this.paymentModel.findOne({ paymentIntentId });

    if (!payment) {
      this.logger.warn(`Payment record not found for intent: ${paymentIntentId}`);
      return;
    }

    payment.status = 'canceled';

    payment.webhookEvents.push({
      eventType: 'payment_intent.canceled',
      eventData,
      receivedAt: new Date(),
    });

    await payment.save();

    this.logger.log(`Payment canceled: ${paymentIntentId}`);
  }

  // Handle charge refunded
  private async handleChargeRefunded(eventData: any): Promise<void> {
    const chargeId = eventData.object.id;
    const payment = await this.paymentModel.findOne({ chargeId });

    if (!payment) {
      this.logger.warn(`Payment record not found for charge: ${chargeId}`);
      return;
    }

    payment.status = 'refunded';

    payment.webhookEvents.push({
      eventType: 'charge.refunded',
      eventData,
      receivedAt: new Date(),
    });

    await payment.save();

    this.logger.log(`Charge refunded: ${chargeId}`);
  }

  // Handle dispute created
  private async handleDisputeCreated(eventData: any): Promise<void> {
    const chargeId = eventData.object.charge;
    const payment = await this.paymentModel.findOne({ chargeId });

    if (!payment) {
      this.logger.warn(`Payment record not found for dispute charge: ${chargeId}`);
      return;
    }

    this.logger.warn(`Dispute created for payment: ${payment.paymentIntentId}`);

    payment.webhookEvents.push({
      eventType: 'charge.dispute.created',
      eventData,
      receivedAt: new Date(),
    });

    await payment.save();
  }

  // Get payment statistics (admin)
  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<any> {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const totalPayments = await this.paymentModel.countDocuments(filter);
    const totalRevenue = await this.paymentModel.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const paymentsByStatus = await this.paymentModel.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);

    const paymentsByMethod = await this.paymentModel.aggregate([
      { $match: filter },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
    ]);

    return {
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      paymentsByStatus,
      paymentsByMethod,
    };
  }
}
