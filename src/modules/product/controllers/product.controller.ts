import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { UploadService } from '../../upload/upload.service';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { CurrentUser, Roles, Public } from '../../../common/decorators';
import { GlobalExceptionFilter } from '../../../common/filters';
import { UserRole } from '../../../common/constants/roles';
import { CreateProductDto, UpdateProductDto, QueryProductDto, AdjustPackageStockDto } from '../dtos';
import { FileUploadUtil } from '../../../common/utils/file-upload.util';

@ApiTags('Product')
@Controller('api/v1/products')
@UseFilters(GlobalExceptionFilter)
export class ProductController {
  constructor(
    private productService: ProductService,
    private uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product with packages' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() thumbnailFile: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    let thumbnailData = null;

    if (thumbnailFile) {
      FileUploadUtil.validateImageFile(thumbnailFile);
      thumbnailData = await this.uploadService.uploadProductThumbnail(thumbnailFile);
      createProductDto.thumbnail = thumbnailData.url;
    }

    const product = await this.productService.create(createProductDto, user.id);

    if (thumbnailData) {
      product['thumbnailDetails'] = thumbnailData;
    }

    return product;
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all products with filters' })
  async findAll(@Query() queryDto: QueryProductDto) {
    return this.productService.findAll(queryDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  async findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() thumbnailFile: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    let thumbnailData = null;

    if (thumbnailFile) {
      FileUploadUtil.validateImageFile(thumbnailFile);
      thumbnailData = await this.uploadService.uploadProductThumbnail(thumbnailFile);
      updateProductDto.thumbnail = thumbnailData.url;
    }

    const product = await this.productService.update(id, updateProductDto, user.id);

    if (thumbnailData) {
      product['thumbnailDetails'] = thumbnailData;
    }

    return product;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product' })
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  // Package endpoints
  @Post(':productId/packages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add package to product' })
  async addPackage(@Param('productId') productId: string, @Body() packageData: any) {
    return this.productService.addPackage(productId, packageData);
  }

  @Put(':productId/packages/:packageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product package' })
  async updatePackage(
    @Param('productId') productId: string,
    @Param('packageId') packageId: string,
    @Body() updateData: any,
  ) {
    return this.productService.updatePackage(productId, packageId, updateData);
  }

  @Delete(':productId/packages/:packageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product package' })
  async deletePackage(
    @Param('productId') productId: string,
    @Param('packageId') packageId: string,
  ) {
    return this.productService.deletePackage(productId, packageId);
  }

  @Get(':productId/packages/:packageId')
  @Public()
  @ApiOperation({ summary: 'Get specific package' })
  async getPackage(
    @Param('productId') productId: string,
    @Param('packageId') packageId: string,
  ) {
    return this.productService.getPackage(productId, packageId);
  }

  // Stock management
  @Get(':id/stock-status')
  @Public()
  @ApiOperation({ summary: 'Get product stock status' })
  async getStockStatus(@Param('id') id: string) {
    return this.productService.getStockStatus(id);
  }

  @Put(':productId/packages/:packageId/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adjust package stock' })
  async adjustPackageStock(
    @Param('productId') productId: string,
    @Param('packageId') packageId: string,
    @Body() adjustStockDto: AdjustPackageStockDto,
  ) {
    return this.productService.adjustPackageStock(productId, packageId, adjustStockDto);
  }
}
