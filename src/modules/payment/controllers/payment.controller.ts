import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  Query,
  Headers,
  RawBody,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { StripeService } from '../services/stripe.service';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { CurrentUser, Roles, Public } from '../../../common/decorators';
import { GlobalExceptionFilter } from '../../../common/filters';
import { UserRole } from '../../../common/constants/roles';
import { CreatePaymentIntentDto, ConfirmPaymentDto, QueryPaymentDto } from '../dtos';

@ApiTags('Payment')
@Controller('api/v1/payments')
@UseFilters(GlobalExceptionFilter)
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private stripeService: StripeService,
  ) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment for order' })
  async initiatePayment(
    @CurrentUser() user: any,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentService.initiatePayment(user.id, createPaymentIntentDto);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment with payment method' })
  async confirmPayment(
    @CurrentUser() user: any,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ) {
    return this.paymentService.confirmPayment(
      user.id,
      confirmPaymentDto.paymentIntentId,
      confirmPaymentDto.paymentMethodId,
    );
  }

  @Get(':paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details' })
  async getPayment(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPayment(paymentId);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by order ID' })
  async getPaymentByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentByOrderId(orderId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my payments' })
  async getUserPayments(@CurrentUser() user: any, @Query() queryDto: QueryPaymentDto) {
    return this.paymentService.getUserPayments(user.id, queryDto);
  }

  // Webhook endpoint - No database operations, just event handling
  @Post('webhook/stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ) {
    try {
      // Verify webhook signature
      const event = this.stripeService.verifyWebhookSignature(rawBody.toString(), signature);

      // Handle webhook event asynchronously
      this.paymentService.handleWebhookEvent(event.type, event.data).catch(error => {
        console.error('Async webhook processing error:', error);
      });

      // Always return 200 to acknowledge receipt
      return { received: true };
    } catch (error) {
      // Still return 200 to prevent Stripe from retrying
      console.error('Webhook error:', error.message);
      return { received: true };
    }
  }

  // Admin endpoints
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment statistics' })
  async getPaymentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.paymentService.getPaymentStats(start, end);
  }
}
