import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { CartService } from '../../cart/services/cart.service';
import { ProductService } from '../../product/services/product.service';
import { EmailService } from '../../email/email.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  UpdateShippingStatusDto,
  AssignDeliveryBoyDto,
  RequestReturnDto,
  ProcessReturnDto,
  ProcessRefundDto,
  QueryOrderDto,
} from '../dtos';

@Injectable()
export class OrderService {
  private logger = new Logger('OrderService');

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private cartService: CartService,
    private productService: ProductService,
    private emailService: EmailService,
  ) {}

  // Create order from cart
  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    // Get user's cart
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate cart stock one more time
    const validation = await this.cartService.validateCart(userId);
    if (!validation.isValid) {
      throw new BadRequestException(`Cart validation failed: ${JSON.stringify(validation.issues)}`);
    }

    // Prepare order items
    const orderItems = cart.items.map(item => ({
      productId: item.productId,
      packageId: item.packageId,
      productName: '', // Will be filled from product
      size: item.size,
      unit: item.unit,
      quantity: (item as any).quantity,
      price: item.price,
      discountPrice: item.discountPrice,
      discountPercentage: item.discountPercentage,
      totalPrice: (item as any).totalPrice,
      totalDiscountPrice: (item as any).totalDiscountPrice,
      status: 'pending',
      createdAt: new Date(),
    }));

    // Calculate totals
    const subtotal = cart.subtotal;
    const totalDiscount = cart.totalDiscount;
    const shippingCost = createOrderDto.shippingCost || 0;
    const taxAmount = createOrderDto.taxAmount || 0;
    const totalAmount = subtotal - totalDiscount + shippingCost + taxAmount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create initial status history
    const initialStatus = {
      status: 'pending',
      reason: 'Order created',
      changedAt: new Date(),
    };

    // Create order
    const order = await this.orderModel.create({
      orderNumber,
      userId,
      items: orderItems,
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress: createOrderDto.billingAddress || createOrderDto.shippingAddress,
      subtotal,
      totalDiscount,
      shippingCost,
      taxAmount,
      totalAmount,
      paymentMethod: createOrderDto.paymentMethod || 'cod',
      customerNotes: createOrderDto.customerNotes,
      statusHistory: [initialStatus],
      status: 'pending',
      paymentStatus: createOrderDto.paymentMethod === 'cod' ? 'unpaid' : 'pending',
      shippingStatus: 'not_shipped',
    });

    // Convert cart to order (release reservations)
    await this.cartService.convertToOrder(userId);

    // Decrease product stock
    for (const item of orderItems) {
      await this.productService.adjustPackageStock(
        item.productId.toString(),
        item.packageId.toString(),
        {
          action: 'decrease',
          quantity: item.quantity,
          reason: 'Order placed',
          referenceId: orderNumber,
        },
      );
    }

    this.logger.log(`Order created: ${orderNumber}`);

    return order;
  }

  // Get all orders for user
  async getUserOrders(userId: string, queryDto: QueryOrderDto): Promise<{
    data: OrderDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, status, paymentStatus, shippingStatus, sortOrder = 'desc' } = queryDto;

    const filter: any = { userId, isActive: true };

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (shippingStatus) filter.shippingStatus = shippingStatus;

    const skip = (page - 1) * limit;
    const total = await this.orderModel.countDocuments(filter);

    const data = await this.orderModel
      .find(filter)
      .populate('userId', 'email firstName lastName')
      .populate('assignedDeliveryBoyId', 'firstName lastName mobileNo')
      .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    return { data, total, page, limit };
  }

  // Get order by ID
  async getOrderById(orderId: string, userId?: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(orderId)
      .populate('userId', 'email firstName lastName mobileNo')
      .populate('assignedDeliveryBoyId', 'firstName lastName mobileNo');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify ownership if userId provided
    if (userId && order.userId.toString() !== userId) {
      throw new BadRequestException('Unauthorized access to order');
    }

    return order;
  }

  // Get order by order number
  async getOrderByNumber(orderNumber: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne({ orderNumber })
      .populate('userId', 'email firstName lastName mobileNo')
      .populate('assignedDeliveryBoyId', 'firstName lastName mobileNo');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // Get all orders (admin)
  async getAllOrders(queryDto: QueryOrderDto): Promise<{
    data: OrderDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, status, paymentStatus, shippingStatus, orderNumber, sortOrder = 'desc' } = queryDto;

    const filter: any = { isActive: true };

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (shippingStatus) filter.shippingStatus = shippingStatus;
    if (orderNumber) filter.orderNumber = { $regex: orderNumber, $options: 'i' };

    const skip = (page - 1) * limit;
    const total = await this.orderModel.countDocuments(filter);

    const data = await this.orderModel
      .find(filter)
      .populate('userId', 'email firstName lastName mobileNo')
      .populate('assignedDeliveryBoyId', 'firstName lastName mobileNo')
      .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    return { data, total, page, limit };
  }

  // Update order status
  async updateOrderStatus(
    orderId: string,
    updateStatusDto: UpdateOrderStatusDto,
    userId?: string,
  ): Promise<OrderDocument> {
    const order = await this.getOrderById(orderId);

    const validTransitions = this.getValidStatusTransitions(order.status);
    if (!validTransitions.includes(updateStatusDto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${updateStatusDto.status}`,
      );
    }

    order.status = updateStatusDto.status;
    order.statusHistory.push({
      status: updateStatusDto.status,
      reason: updateStatusDto.reason,
      notes: updateStatusDto.notes,
      changedBy: userId,
      changedAt: new Date(),
    } as any);

    if (updateStatusDto.status === 'cancelled') {
      order.cancelledDate = new Date();
    }

    await order.save();

    this.logger.log(`Order ${order.orderNumber} status updated to ${updateStatusDto.status}`);

    return order;
  }

  // Update payment status
  async updatePaymentStatus(
    orderId: string,
    updatePaymentDto: UpdatePaymentStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.getOrderById(orderId);

    order.paymentStatus = updatePaymentDto.paymentStatus;
    if (updatePaymentDto.transactionId) {
      order.transactionId = updatePaymentDto.transactionId;
    }

    if (updatePaymentDto.paymentStatus === 'paid' && order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        reason: 'Payment confirmed',
        notes: updatePaymentDto.notes,
        changedAt: new Date(),
      } as any);
    }

    await order.save();

    this.logger.log(`Order ${order.orderNumber} payment status updated to ${updatePaymentDto.paymentStatus}`);

    return order;
  }

  // Update shipping status
  async updateShippingStatus(
    orderId: string,
    updateShippingDto: UpdateShippingStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.getOrderById(orderId);

    order.shippingStatus = updateShippingDto.shippingStatus;

    if (updateShippingDto.trackingNumber) {
      order.trackingNumber = updateShippingDto.trackingNumber;
    }

    if (updateShippingDto.shippingProvider) {
      order.shippingProvider = updateShippingDto.shippingProvider;
    }

    if (updateShippingDto.shippingStatus === 'shipped') {
      order.shippedDate = new Date();
      order.expectedDeliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days
      order.status = 'shipped';
    } else if (updateShippingDto.shippingStatus === 'delivered') {
      order.deliveredDate = new Date();
      order.status = 'delivered';
    }

    await order.save();

    this.logger.log(`Order ${order.orderNumber} shipping status updated to ${updateShippingDto.shippingStatus}`);

    return order;
  }

  // Assign delivery boy
  async assignDeliveryBoy(orderId: string, assignDto: AssignDeliveryBoyDto): Promise<OrderDocument> {
    const order = await this.getOrderById(orderId);

    order.assignedDeliveryBoyId = assignDto.deliveryBoyId as any;
    if (assignDto.notes) {
      order.deliveryBoyNotes = assignDto.notes;
    }

    await order.save();

    this.logger.log(`Delivery boy assigned to order ${order.orderNumber}`);

    return order;
  }

  // Request return
  async requestReturn(orderId: string, userId: string, requestReturnDto: RequestReturnDto): Promise<OrderDocument> {
    const order = await this.getOrderById(orderId, userId);

    if (order.status !== 'delivered') {
      throw new BadRequestException('Return can only be requested for delivered orders');
    }

    if (order.returnStatus !== 'no_return') {
      throw new BadRequestException('Return request already exists for this order');
    }

    const deliveryDate = order.deliveredDate;
    const daysSinceDelivery = Math.floor((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceDelivery > 7) {
      throw new BadRequestException('Return request can only be made within 7 days of delivery');
    }

    order.returnStatus = 'pending';
    order.returnRequestedAt = new Date();
    order.returnReason = requestReturnDto.reason;
    order.returnNotes = requestReturnDto.notes;

    await order.save();

    this.logger.log(`Return requested for order ${order.orderNumber}`);

    return order;
  }

  // Process return
  async processReturn(orderId: string, processReturnDto: ProcessReturnDto): Promise<OrderDocument> {
    const order = await this.getOrderById(orderId);

    if (order.returnStatus !== 'pending') {
      throw new BadRequestException('No pending return request for this order');
    }

    if (processReturnDto.action === 'approved') {
      order.returnStatus = 'approved';

      // Create refund
      const refundAmount = processReturnDto.refundType === 'full' ? order.totalAmount : order.totalAmount * 0.5;
      order.refundAmount = refundAmount;
      order.refundType = processReturnDto.refundType;
      order.refundReason = processReturnDto.reason;

      // Restore stock
      for (const item of order.items) {
        await this.productService.adjustPackageStock(
          item.productId.toString(),
          item.packageId.toString(),
          {
            action: 'increase',
            quantity: item.quantity,
            reason: 'Return approved',
            referenceId: order.orderNumber,
          },
        );
      }
    } else {
      order.returnStatus = 'rejected';
    }

    await order.save();

    this.logger.log(`Return ${processReturnDto.action} for order ${order.orderNumber}`);

    return order;
  }

  // Process refund
  async processRefund(orderId: string, processRefundDto: ProcessRefundDto): Promise<OrderDocument> {
    const order = await this.getOrderById(orderId);

    if (order.returnStatus !== 'approved') {
      throw new BadRequestException('Return must be approved before processing refund');
    }

    const refundAmount = processRefundDto.refundAmount || order.totalAmount;

    if (refundAmount > order.totalAmount) {
      throw new BadRequestException('Refund amount cannot exceed order total');
    }

    order.refundAmount = refundAmount;
    order.refundType = processRefundDto.refundType;
    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    order.refundProcessedAt = new Date();

    await order.save();

    this.logger.log(`Refund processed for order ${order.orderNumber}: ${refundAmount}`);

    return order;
  }

  // Cancel order
  async cancelOrder(orderId: string, userId?: string): Promise<OrderDocument> {
    const order = await this.getOrderById(orderId);

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled in current status');
    }

    order.status = 'cancelled';
    order.cancelledDate = new Date();
    order.statusHistory.push({
      status: 'cancelled',
      reason: 'Cancelled by user',
      changedAt: new Date(),
    } as any);

    // Restore stock
    for (const item of order.items) {
      await this.productService.adjustPackageStock(
        item.productId.toString(),
        item.packageId.toString(),
        {
          action: 'increase',
          quantity: item.quantity,
          reason: 'Order cancelled',
          referenceId: order.orderNumber,
        },
      );
    }

    await order.save();

    this.logger.log(`Order ${order.orderNumber} cancelled`);

    return order;
  }

  async updateOrderPaymentIntentId(
    orderId: string,
    paymentId: string,
    paymentIntentId: string,
  ): Promise<void> {
    await this.orderModel.findByIdAndUpdate(orderId, {
      paymentId,
      paymentIntentId,
    });
  }

  // Get order statistics (admin)
  async getOrderStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const filter: any = { isActive: true };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const totalOrders = await this.orderModel.countDocuments(filter);
    const totalRevenue = await this.orderModel.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const ordersByStatus = await this.orderModel.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const paymentStatus = await this.orderModel.aggregate([
      { $match: filter },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      ordersByStatus,
      paymentStatus,
    };
  }

  // Helper methods
  private async generateOrderNumber(): Promise<string> {
    const count = await this.orderModel.countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = String(count + 1).padStart(5, '0');

    return `ORD-${year}${month}${day}-${sequence}`;
  }

  private getValidStatusTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'failed'],
      shipped: ['out_for_delivery', 'failed'],
      out_for_delivery: ['delivered', 'failed_delivery'],
      delivered: ['returned'],
      cancelled: [],
      failed: ['cancelled'],
      returned: ['refunded'],
      refunded: [],
    };

    return transitions[currentStatus] || [];
  }
}