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
import { CategoryService } from '../services/category.service';
import { UploadService } from '../../upload/upload.service';
import { JwtAuthGuard, RolesGuard } from '../../../common/guards';
import { Public, CurrentUser, Roles } from '../../../common/decorators';
import { GlobalExceptionFilter } from '../../../common/filters';
import { UserRole } from '../../../common/constants/roles';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoryDto } from '../dtos';
import { FileUploadUtil } from '../../../common/utils/file-upload.util';

@ApiTags('Category')
@Controller('api/v1/categories')
@UseFilters(GlobalExceptionFilter)
export class CategoryController {
  constructor(
    private categoryService: CategoryService,
    private uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create main category with image' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    let imageData = null;

    if (imageFile) {
      FileUploadUtil.validateImageFile(imageFile);
      imageData = await this.uploadService.uploadCategoryImage(imageFile);
      createCategoryDto.image = imageData.url;
    }

    const category = await this.categoryService.create(createCategoryDto, user.id);

    if (imageData) {
      category['imageDetails'] = imageData;
    }

    return category;
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories with pagination' })
  async findAll(@Query() queryDto: QueryCategoryDto) {
    return this.categoryService.findAll(queryDto);
  }

  @Get('tree')
  @Public()
  @ApiOperation({ summary: 'Get category tree (main + subcategories)' })
  async getCategoryTree() {
    return this.categoryService.getCategoryTree();
  }

  @Get('main')
  @Public()
  @ApiOperation({ summary: 'Get main categories only' })
  async getMainCategories() {
    return this.categoryService.getMainCategories();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by ID' })
  async findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update main category with optional image' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    let imageData = null;

    if (imageFile) {
      FileUploadUtil.validateImageFile(imageFile);
      imageData = await this.uploadService.uploadCategoryImage(imageFile);
      updateCategoryDto.image = imageData.url;
    }

    const category = await this.categoryService.update(id, updateCategoryDto, user.id);

    if (imageData) {
      category['imageDetails'] = imageData;
    }

    return category;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete main category (only if no subcategories exist)' })
  async delete(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }

  @Get(':parentCategoryId/subcategories')
  @Public()
  @ApiOperation({ summary: 'Get all subcategories of a main category' })
  async getSubCategories(@Param('parentCategoryId') parentCategoryId: string) {
    return this.categoryService.getSubCategories(parentCategoryId);
  }

  @Post(':parentCategoryId/subcategories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create subcategory with image' })
  async createSubCategory(
    @Param('parentCategoryId') parentCategoryId: string,
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    let imageData = null;

    if (imageFile) {
      FileUploadUtil.validateImageFile(imageFile);
      imageData = await this.uploadService.uploadCategoryImage(imageFile);
      createCategoryDto.image = imageData.url;
    }

    const subCategory = await this.categoryService.createSubCategory(
      parentCategoryId,
      createCategoryDto,
      user.id,
    );

    if (imageData) {
      subCategory['imageDetails'] = imageData;
    }

    return subCategory;
  }

  @Get(':parentCategoryId/subcategories/:subCategoryId')
  @Public()
  @ApiOperation({ summary: 'Get specific subcategory' })
  async getSubCategoryById(
    @Param('parentCategoryId') parentCategoryId: string,
    @Param('subCategoryId') subCategoryId: string,
  ) {
    return this.categoryService.getSubCategoryById(parentCategoryId, subCategoryId);
  }

  @Put(':parentCategoryId/subcategories/:subCategoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subcategory with optional image' })
  async updateSubCategory(
    @Param('parentCategoryId') parentCategoryId: string,
    @Param('subCategoryId') subCategoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    let imageData = null;

    if (imageFile) {
      FileUploadUtil.validateImageFile(imageFile);
      imageData = await this.uploadService.uploadCategoryImage(imageFile);
      updateCategoryDto.image = imageData.url;
    }

    const subCategory = await this.categoryService.updateSubCategory(
      parentCategoryId,
      subCategoryId,
      updateCategoryDto,
      user.id,
    );

    if (imageData) {
      subCategory['imageDetails'] = imageData;
    }

    return subCategory;
  }

  @Delete(':parentCategoryId/subcategories/:subCategoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete subcategory' })
  async deleteSubCategory(
    @Param('parentCategoryId') parentCategoryId: string,
    @Param('subCategoryId') subCategoryId: string,
  ) {
    return this.categoryService.deleteSubCategory(parentCategoryId, subCategoryId);
  }
}
