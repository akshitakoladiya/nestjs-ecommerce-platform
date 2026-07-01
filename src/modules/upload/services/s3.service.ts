import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private logger = new Logger('S3Service');

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get('AWS_S3_BUCKET');
    this.region = this.configService.get('AWS_REGION', 'us-east-1');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadCategoryImage(file: Express.Multer.File): Promise<{
    url: string;
    presignedUrl: string;
    key: string;
    filename: string;
    size: number;
    mimeType: string;
  }> {
    const key = `categories/images/${uuidv4()}-${file.originalname}`;
    return this.uploadFile(file, key, 'categories/images');
  }

  async uploadCategoryIcon(file: Express.Multer.File): Promise<{
    url: string;
    presignedUrl: string;
    key: string;
    filename: string;
    size: number;
    mimeType: string;
  }> {
    const key = `categories/icons/${uuidv4()}-${file.originalname}`;
    return this.uploadFile(file, key, 'categories/icons');
  }

  async uploadProductImage(file: Express.Multer.File): Promise<{
    url: string;
    presignedUrl: string;
    key: string;
    filename: string;
    size: number;
    mimeType: string;
  }> {
    const key = `products/images/${uuidv4()}-${file.originalname}`;
    return this.uploadFile(file, key, 'products/images');
  }

  async uploadProductThumbnail(file: Express.Multer.File): Promise<{
    url: string;
    presignedUrl: string;
    key: string;
    filename: string;
    size: number;
    mimeType: string;
  }> {
    const key = `products/thumbnails/${uuidv4()}-${file.originalname}`;
    return this.uploadFile(file, key, 'products/thumbnails');
  }

  async uploadMultipleProductImages(
    files: Express.Multer.File[],
  ): Promise<
    Array<{
      url: string;
      presignedUrl: string;
      key: string;
      filename: string;
      size: number;
      mimeType: string;
    }>
  > {
    return Promise.all(files.map((file) => this.uploadProductImage(file)));
  }

  private async uploadFile(
    file: Express.Multer.File,
    key: string,
    folder: string,
  ): Promise<{
    url: string;
    presignedUrl: string;
    key: string;
    filename: string;
    size: number;
    mimeType: string;
  }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const getObjectCommand = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
        expiresIn: 7 * 24 * 60 * 60,
      });

      const publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully to S3: ${key}`);

      return {
        url: publicUrl,
        presignedUrl,
        key,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  async deleteFile(key: string): Promise<{ message: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully from S3: ${key}`);

      return { message: 'File deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete file from S3');
    }
  }

  async generatePresignedUrl(key: string, expiresIn: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return presignedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate pre-signed URL: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate pre-signed URL');
    }
  }

  async getPublicUrl(key: string): Promise<string> {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
