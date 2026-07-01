import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from './services/s3.service';

@Injectable()
export class UploadService {
  private logger = new Logger('UploadService');

  constructor(private s3Service: S3Service) {}

  async uploadCategoryImage(file: Express.Multer.File): Promise<any> {
    const result = await this.s3Service.uploadCategoryImage(file);

    this.logger.log(`Category image uploaded to S3: ${result.key}`);

    return {
      url: result.url,
      presignedUrl: result.presignedUrl,
      key: result.key,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
    };
  }

  async uploadCategoryIcon(file: Express.Multer.File): Promise<any> {
    const result = await this.s3Service.uploadCategoryIcon(file);

    this.logger.log(`Category icon uploaded to S3: ${result.key}`);

    return {
      url: result.url,
      presignedUrl: result.presignedUrl,
      key: result.key,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
    };
  }

  async uploadProductImage(file: Express.Multer.File): Promise<any> {
    const result = await this.s3Service.uploadProductImage(file);

    this.logger.log(`Product image uploaded to S3: ${result.key}`);

    return {
      url: result.url,
      presignedUrl: result.presignedUrl,
      key: result.key,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
    };
  }

  async uploadProductThumbnail(file: Express.Multer.File): Promise<any> {
    const result = await this.s3Service.uploadProductThumbnail(file);

    this.logger.log(`Product thumbnail uploaded to S3: ${result.key}`);

    return {
      url: result.url,
      presignedUrl: result.presignedUrl,
      key: result.key,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
    };
  }

  async uploadMultipleProductImages(files: Express.Multer.File[]): Promise<any[]> {
    return this.s3Service.uploadMultipleProductImages(files);
  }

  async deleteFile(key: string): Promise<{ message: string }> {
    return this.s3Service.deleteFile(key);
  }

  async generatePresignedUrl(key: string, expiresIn?: number): Promise<string> {
    return this.s3Service.generatePresignedUrl(key, expiresIn);
  }

  async getPublicUrl(key: string): Promise<string> {
    return this.s3Service.getPublicUrl(key);
  }
}
