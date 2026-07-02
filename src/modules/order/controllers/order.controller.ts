import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { CurrentUser, Roles, Public } from '../../../common/decorators';
import { GlobalExceptionFilter } from '../../../common/filters';
import { UserRole } from '../../../common/constants/roles';
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

@ApiTags('Order')
@Controller('api/v1/orders')
@UseFilters(GlobalExceptionFilter)
export class OrderController {
  constructor(private orderService: OrderService) {}

  // Customer endpoints
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order from cart' })
  async createOrder(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(user.id, createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my orders' })
  async getUserOrders(@CurrentUser() user: any, @Query() queryDto: QueryOrderDto) {
    return this.orderService.getUserOrders(user.id, queryDto);
  }

  @Get(':orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details' })
  async getOrder(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.orderService.getOrderById(orderId, user.id);
  }

  @Put(':orderId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.orderService.cancelOrder(orderId, user.id);
  }

  @Post(':orderId/return/request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request return' })
  async requestReturn(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() requestReturnDto: RequestReturnDto,
  ) {
    return this.orderService.requestReturn(orderId, user.id, requestReturnDto);
  }

  // Admin/Manager endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders' })
  async getAllOrders(@Query() queryDto: QueryOrderDto) {
    return this.orderService.getAllOrders(queryDto);
  }

  @Get('number/:orderNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by number' })
  async getOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderService.getOrderByNumber(orderNumber);
  }

  @Put(':orderId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(orderId, updateStatusDto, user.id);
  }

  @Put(':orderId/payment-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment status' })
  async updatePaymentStatus(
    @Param('orderId') orderId: string,
    @Body() updatePaymentDto: UpdatePaymentStatusDto,
  ) {
    return this.orderService.updatePaymentStatus(orderId, updatePaymentDto);
  }

  @Put(':orderId/shipping-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update shipping status' })
  async updateShippingStatus(
    @Param('orderId') orderId: string,
    @Body() updateShippingDto: UpdateShippingStatusDto,
  ) {
    return this.orderService.updateShippingStatus(orderId, updateShippingDto);
  }

  @Post(':orderId/assign-delivery-boy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign delivery boy' })
  async assignDeliveryBoy(
    @Param('orderId') orderId: string,
    @Body() assignDto: AssignDeliveryBoyDto,
  ) {
    return this.orderService.assignDeliveryBoy(orderId, assignDto);
  }

  @Put(':orderId/return/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process return request' })
  async processReturn(
    @Param('orderId') orderId: string,
    @Body() processReturnDto: ProcessReturnDto,
  ) {
    return this.orderService.processReturn(orderId, processReturnDto);
  }

  @Post(':orderId/refund/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process refund' })
  async processRefund(
    @Param('orderId') orderId: string,
    @Body() processRefundDto: ProcessRefundDto,
  ) {
    return this.orderService.processRefund(orderId, processRefundDto);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order statistics' })
  async getStatistics(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.orderService.getOrderStatistics(start, end);
  }
}