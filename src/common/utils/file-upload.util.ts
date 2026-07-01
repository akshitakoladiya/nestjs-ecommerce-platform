import { BadRequestException } from '@nestjs/common';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export class FileUploadUtil {
  static validateImageFile(file: Express.Multer.File): boolean {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      );
    }

    return true;
  }
}
