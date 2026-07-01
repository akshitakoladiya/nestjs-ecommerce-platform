import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoryDto } from '../dtos';
import { generateSlug } from '../../../common/utils/slug.util';

@Injectable()
export class CategoryService {
  private logger = new Logger('CategoryService');

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<CategoryDocument> {
    const { name, parentCategoryId } = createCategoryDto;

    const existingCategory = await this.categoryModel.findOne({ name });
    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    if (parentCategoryId) {
      const parentCategory = await this.categoryModel.findById(parentCategoryId);
      if (!parentCategory) {
        throw new BadRequestException('Parent category not found');
      }
      if (parentCategory.type !== 'main') {
        throw new BadRequestException('Parent category must be a main category');
      }
    }

    const slug = createCategoryDto.slug || generateSlug(name);

    const category = await this.categoryModel.create({
      ...createCategoryDto,
      slug,
      createdBy: userId,
    });

    return category;
  }

  async findAll(queryDto: QueryCategoryDto): Promise<{ data: CategoryDocument[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, search, status, type, parentCategoryId, sortBy = 'displayOrder', sortOrder = 'asc' } = queryDto;

    const filter: any = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    if (parentCategoryId) {
      filter.parentCategoryId = parentCategoryId;
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    const total = await this.categoryModel.countDocuments(filter);
    const data = await this.categoryModel
      .find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<CategoryDocument> {
    const category = await this.findById(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryModel.findOne({ name: updateCategoryDto.name });
      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    if (updateCategoryDto.parentCategoryId) {
      const parentCategory = await this.categoryModel.findById(updateCategoryDto.parentCategoryId);
      if (!parentCategory) {
        throw new BadRequestException('Parent category not found');
      }
      if (parentCategory.type !== 'main') {
        throw new BadRequestException('Parent category must be a main category');
      }
    }

    const slug = updateCategoryDto.name ? generateSlug(updateCategoryDto.name) : category.slug;

    const updatedCategory = await this.categoryModel.findByIdAndUpdate(
      id,
      { ...updateCategoryDto, slug, updatedBy: userId },
      { new: true },
    );

    return updatedCategory;
  }

  async delete(id: string): Promise<{ message: string }> {
    const category = await this.findById(id);

    if (category.type === 'main') {
      const subCategoriesCount = await this.categoryModel.countDocuments({
        parentCategoryId: id,
        isActive: true,
      });

      if (subCategoriesCount > 0) {
        throw new BadRequestException(
          `Cannot delete main category with ${subCategoriesCount} subcategories. Please delete all subcategories first.`,
        );
      }
    }

    category.isActive = false;
    await category.save();

    return { message: 'Category deleted successfully' };
  }

  async getMainCategories(): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ type: 'main', isActive: true, status: 'active' }).sort({ displayOrder: 1 });
  }

  async getSubCategories(parentCategoryId: string): Promise<CategoryDocument[]> {
    const parentCategory = await this.findById(parentCategoryId);
    if (parentCategory.type !== 'main') {
      throw new BadRequestException('Parent must be a main category');
    }

    return this.categoryModel.find({
      parentCategoryId,
      type: 'sub',
      isActive: true,
      status: 'active',
    }).sort({ displayOrder: 1 });
  }

  async getCategoryTree(): Promise<any[]> {
    const mainCategories = await this.getMainCategories();

    const categoryTree = await Promise.all(
      mainCategories.map(async (mainCategory) => {
        const subCategories = await this.categoryModel.find({
          parentCategoryId: mainCategory._id,
          type: 'sub',
          isActive: true,
          status: 'active',
        }).sort({ displayOrder: 1 });

        return {
          ...mainCategory.toObject(),
          subCategories,
        };
      }),
    );

    return categoryTree;
  }

  async createSubCategory(parentCategoryId: string, createCategoryDto: CreateCategoryDto, userId: string): Promise<CategoryDocument> {
    const parentCategory = await this.findById(parentCategoryId);
    if (parentCategory.type !== 'main') {
      throw new BadRequestException('Parent category must be a main category');
    }

    const existingSubCategory = await this.categoryModel.findOne({
      name: createCategoryDto.name,
      parentCategoryId,
    });
    if (existingSubCategory) {
      throw new ConflictException('Subcategory with this name already exists under this parent');
    }

    const slug = createCategoryDto.slug || generateSlug(createCategoryDto.name);

    const subCategory = await this.categoryModel.create({
      ...createCategoryDto,
      parentCategoryId,
      slug,
      type: 'sub',
      createdBy: userId,
    });

    return subCategory;
  }

  async updateSubCategory(
    parentCategoryId: string,
    subCategoryId: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ): Promise<CategoryDocument> {
    const parentCategory = await this.findById(parentCategoryId);
    if (parentCategory.type !== 'main') {
      throw new BadRequestException('Parent category must be a main category');
    }

    const subCategory = await this.findById(subCategoryId);
    if (subCategory.type !== 'sub' || subCategory.parentCategoryId.toString() !== parentCategoryId) {
      throw new BadRequestException('Subcategory does not belong to this parent category');
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== subCategory.name) {
      const existingSubCategory = await this.categoryModel.findOne({
        name: updateCategoryDto.name,
        parentCategoryId,
        _id: { $ne: subCategoryId },
      });
      if (existingSubCategory) {
        throw new ConflictException('Subcategory with this name already exists under this parent');
      }
    }

    const slug = updateCategoryDto.name ? generateSlug(updateCategoryDto.name) : subCategory.slug;

    const updatedSubCategory = await this.categoryModel.findByIdAndUpdate(
      subCategoryId,
      {
        ...updateCategoryDto,
        slug,
        updatedBy: userId,
        parentCategoryId,
        type: 'sub',
      },
      { new: true },
    );

    return updatedSubCategory;
  }

  async deleteSubCategory(parentCategoryId: string, subCategoryId: string): Promise<{ message: string }> {
    const parentCategory = await this.findById(parentCategoryId);
    if (parentCategory.type !== 'main') {
      throw new BadRequestException('Parent category must be a main category');
    }

    const subCategory = await this.findById(subCategoryId);
    if (subCategory.type !== 'sub' || subCategory.parentCategoryId.toString() !== parentCategoryId) {
      throw new BadRequestException('Subcategory does not belong to this parent category');
    }

    subCategory.isActive = false;
    await subCategory.save();

    return { message: 'Subcategory deleted successfully' };
  }

  async getSubCategoryById(parentCategoryId: string, subCategoryId: string): Promise<CategoryDocument> {
    const subCategory = await this.findById(subCategoryId);

    if (subCategory.type !== 'sub' || subCategory.parentCategoryId.toString() !== parentCategoryId) {
      throw new BadRequestException('Subcategory does not belong to this parent category');
    }

    return subCategory;
  }
}
