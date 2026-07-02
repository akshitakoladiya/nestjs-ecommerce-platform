import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CartService } from '../services/cart.service';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser, Public } from '../../../common/decorators';
import { GlobalExceptionFilter } from '../../../common/filters';
import { AddToCartDto, UpdateCartItemDto, UpdateCartItemQuantityDto } from '../dtos';

@ApiTags('Cart')
@Controller('api/v1/cart')
@UseFilters(GlobalExceptionFilter)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  async getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.id);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get cart summary with totals' })
  async getCartSummary(@CurrentUser() user: any) {
    return this.cartService.getCartSummary(user.id);
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate cart items and stock availability' })
  async validateCart(@CurrentUser() user: any) {
    return this.cartService.validateCart(user.id);
  }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(@CurrentUser() user: any, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Put('item/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateCartItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(user.id, itemId, updateCartItemDto);
  }

  @Put('item/:itemId/quantity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update item quantity with action (increase/decrease/set)' })
  async updateItemQuantity(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCartItemQuantityDto,
  ) {
    return this.cartService.updateItemQuantityWithAction(user.id, itemId, updateDto);
  }

  @Delete('item/:itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeFromCart(@CurrentUser() user: any, @Param('itemId') itemId: string) {
    return this.cartService.removeFromCart(user.id, itemId);
  }

  @Delete('clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear entire cart' })
  async clearCart(@CurrentUser() user: any) {
    return this.cartService.clearCart(user.id);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert cart to order (checkout)' })
  async checkout(@CurrentUser() user: any) {
    return this.cartService.convertToOrder(user.id);
  }

  @Post('abandon')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark cart as abandoned' })
  async abandonCart(@CurrentUser() user: any) {
    return this.cartService.markAsAbandoned(user.id);
  }
}