import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './upload.service';
import { S3Service } from './services/s3.service';
import { UploadController } from './controllers/upload.controller';

@Module({
  imports: [ConfigModule],
  providers: [UploadService, S3Service],
  controllers: [UploadController],
  exports: [UploadService, S3Service],
})
export class UploadModule {}
