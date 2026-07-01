import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from '../upload.service';
import { JwtAuthGuard } from '../../../common/guards';
import { GlobalExceptionFilter } from '../../../common/filters';
import { GeneratePresignedUrlDto } from '../dtos/generate-presigned-url.dto';
import { FileUploadUtil } from '../../../common/utils/file-upload.util';

@ApiTags('Upload')
@Controller('api/v1/upload')
@UseFilters(GlobalExceptionFilter)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('category-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload category image to S3' })
  async uploadCategoryImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    FileUploadUtil.validateImageFile(file);
    return this.uploadService.uploadCategoryImage(file);
  }

  @Post('category-icon')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('icon'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload category icon to S3' })
  async uploadCategoryIcon(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    FileUploadUtil.validateImageFile(file);
    return this.uploadService.uploadCategoryIcon(file);
  }

  @Post('product-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload product image to S3' })
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    FileUploadUtil.validateImageFile(file);
    return this.uploadService.uploadProductImage(file);
  }

  @Post('product-thumbnail')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload product thumbnail to S3' })
  async uploadProductThumbnail(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    FileUploadUtil.validateImageFile(file);
    return this.uploadService.uploadProductThumbnail(file);
  }

  @Post('generate-presigned-url')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate pre-signed URL for downloading file from S3' })
  async generatePresignedUrl(@Body() generatePresignedUrlDto: GeneratePresignedUrlDto) {
    const { key, expiresIn } = generatePresignedUrlDto;
    const presignedUrl = await this.uploadService.generatePresignedUrl(key, expiresIn);

    return {
      presignedUrl,
      expiresIn: expiresIn || 7 * 24 * 60 * 60,
    };
  }

  @Get('public-url')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get public URL for a file' })
  async getPublicUrl(@Body('key') key: string) {
    if (!key) {
      throw new BadRequestException('Key is required');
    }

    const publicUrl = await this.uploadService.getPublicUrl(key);

    return { url: publicUrl };
  }
}
