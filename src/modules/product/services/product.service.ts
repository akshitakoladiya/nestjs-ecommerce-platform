import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateProductDto, UpdateProductDto, QueryProductDto, ManageStockDto, AdjustPackageStockDto } from '../dtos';
import { generateSlug } from '../../../common/utils/slug.util';

@Injectable()
export class ProductService {
  private logger = new Logger('ProductService');

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string): Promise<ProductDocument> {
    const { name, categoryId, packages } = createProductDto;

    const existingProduct = await this.productModel.findOne({ name });
    if (existingProduct) {
      throw new ConflictException('Product with this name already exists');
    }

    if (!packages || packages.length === 0) {
      throw new BadRequestException('At least one package is required');
    }

    const skus = packages.filter(p => p.sku).map(p => p.sku);
    if (new Set(skus).size !== skus.length) {
      throw new BadRequestException('Duplicate SKUs found in packages');
    }

    const slug = createProductDto.slug || generateSlug(name);
    const totalStock = packages.reduce((sum, pkg) => sum + (pkg.stock || 0), 0);

    const product = await this.productModel.create({
      ...createProductDto,
      categoryId,
      packages,
      slug,
      totalStock,
      stockStatus: this.calculateStockStatus(totalStock, createProductDto.minimumStockLevel || 0),
      createdBy: userId,
    });

    return product;
  }

  async findAll(queryDto: QueryProductDto): Promise<{
    data: ProductDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      subCategoryId,
      status,
      stockStatus,
      brand,
      tags,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const filter: any = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (subCategoryId) {
      filter.subCategoryId = subCategoryId;
    }

    if (status) {
      filter.status = status;
    }

    if (stockStatus) {
      filter.stockStatus = stockStatus;
    }

    if (brand) {
      filter.brand = brand;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.basePrice = {};
      if (minPrice !== undefined) filter.basePrice.$gte = minPrice;
      if (maxPrice !== undefined) filter.basePrice.$lte = maxPrice;
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    const total = await this.productModel.countDocuments(filter);
    const data = await this.productModel
      .find(filter)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findById(id)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string): Promise<ProductDocument> {
    const product = await this.findById(id);

    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const existingProduct = await this.productModel.findOne({ name: updateProductDto.name });
      if (existingProduct) {
        throw new ConflictException('Product with this name already exists');
      }
    }

    const slug = updateProductDto.name ? generateSlug(updateProductDto.name) : product.slug;

    const updatedData: any = { ...updateProductDto, slug, updatedBy: userId };

    if (updateProductDto.packages) {
      updatedData.totalStock = updateProductDto.packages.reduce(
        (sum, pkg) => sum + (pkg.stock || 0),
        0,
      );
      updatedData.stockStatus = this.calculateStockStatus(
        updatedData.totalStock,
        updateProductDto.minimumStockLevel || product.minimumStockLevel,
      );
    }

    const updatedProduct = await this.productModel.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    return updatedProduct;
  }

  async delete(id: string): Promise<{ message: string }> {
    const product = await this.findById(id);

    product.isActive = false;
    await product.save();

    return { message: 'Product deleted successfully' };
  }

  async addPackage(productId: string, packageData: any): Promise<ProductDocument> {
    const product = await this.findById(productId);

    if (packageData.sku) {
      const existingSku = product.packages.find(p => p.sku === packageData.sku);
      if (existingSku) {
        throw new ConflictException('SKU already exists for this product');
      }
    }

    product.packages.push(packageData);
    product.totalStock = product.packages.reduce((sum, pkg) => sum + pkg.stock, 0);
    product.stockStatus = this.calculateStockStatus(product.totalStock, product.minimumStockLevel);

    await product.save();
    return product;
  }

  async updatePackage(productId: string, packageId: string, updateData: any): Promise<ProductDocument> {
    const product = await this.findById(productId);

    const packageIndex = product.packages.findIndex(p => p._id.toString() === packageId);
    if (packageIndex === -1) {
      throw new NotFoundException('Package not found');
    }

    if (updateData.sku && updateData.sku !== product.packages[packageIndex].sku) {
      const existingSku = product.packages.find(
        (p, idx) => idx !== packageIndex && p.sku === updateData.sku,
      );
      if (existingSku) {
        throw new ConflictException('SKU already exists for this product');
      }
    }

    product.packages[packageIndex] = { ...product.packages[packageIndex], ...updateData };
    product.totalStock = product.packages.reduce((sum, pkg) => sum + pkg.stock, 0);
    product.stockStatus = this.calculateStockStatus(product.totalStock, product.minimumStockLevel);

    await product.save();
    return product;
  }

  async deletePackage(productId: string, packageId: string): Promise<ProductDocument> {
    const product = await this.findById(productId);

    if (product.packages.length === 1) {
      throw new BadRequestException('Cannot delete the last package of a product');
    }

    product.packages = product.packages.filter(p => p._id.toString() !== packageId);
    product.totalStock = product.packages.reduce((sum, pkg) => sum + pkg.stock, 0);
    product.stockStatus = this.calculateStockStatus(product.totalStock, product.minimumStockLevel);

    await product.save();
    return product;
  }

  async getPackage(productId: string, packageId: string): Promise<any> {
    const product = await this.findById(productId);

    const packageData = product.packages.find(p => p._id.toString() === packageId);
    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    return packageData;
  }

  async manageStock(productId: string, manageStockDto: ManageStockDto): Promise<ProductDocument> {
    const { action, quantity, reason, referenceId } = manageStockDto;
    const product = await this.findById(productId);

    const currentTotal = product.totalStock;

    let newTotal: number;
    switch (action) {
      case 'increase':
        newTotal = currentTotal + quantity;
        break;
      case 'decrease':
        if (currentTotal < quantity) {
          throw new BadRequestException('Insufficient stock');
        }
        newTotal = currentTotal - quantity;
        break;
      case 'set':
        newTotal = quantity;
        break;
      default:
        throw new BadRequestException('Invalid action');
    }

    product.totalStock = newTotal;
    product.stockStatus = this.calculateStockStatus(newTotal, product.minimumStockLevel);

    this.logger.log(
      `Stock adjusted for product ${productId}: ${action} ${quantity} (Reference: ${referenceId})`,
    );

    await product.save();
    return product;
  }

  async adjustPackageStock(
    productId: string,
    packageId: string,
    adjustStockDto: AdjustPackageStockDto,
  ): Promise<ProductDocument> {
    const { action, quantity, reason, referenceId } = adjustStockDto;
    const product = await this.findById(productId);

    const packageIndex = product.packages.findIndex(p => p._id.toString() === packageId);
    if (packageIndex === -1) {
      throw new NotFoundException('Package not found');
    }

    const pkg = product.packages[packageIndex];
    let newStock: number;
    let newReserved: number = pkg.reservedQuantity;

    switch (action) {
      case 'increase':
        newStock = pkg.stock + quantity;
        break;
      case 'decrease':
        if (pkg.stock < quantity) {
          throw new BadRequestException('Insufficient stock for this package');
        }
        newStock = pkg.stock - quantity;
        break;
      case 'set':
        newStock = quantity;
        break;
      case 'reserve':
        if (pkg.stock - pkg.reservedQuantity < quantity) {
          throw new BadRequestException('Insufficient available stock to reserve');
        }
        newReserved = pkg.reservedQuantity + quantity;
        newStock = pkg.stock;
        break;
      case 'release':
        if (pkg.reservedQuantity < quantity) {
          throw new BadRequestException('Cannot release more than reserved');
        }
        newReserved = pkg.reservedQuantity - quantity;
        newStock = pkg.stock;
        break;
      default:
        throw new BadRequestException('Invalid action');
    }

    product.packages[packageIndex].stock = newStock;
    product.packages[packageIndex].reservedQuantity = newReserved;
    product.packages[packageIndex].stockStatus = this.calculatePackageStockStatus(
      newStock,
      pkg.minimumStockLevel,
    );

    product.totalStock = product.packages.reduce((sum, p) => sum + p.stock, 0);
    product.stockStatus = this.calculateStockStatus(product.totalStock, product.minimumStockLevel);

    this.logger.log(
      `Package stock adjusted for product ${productId}, package ${packageId}: ${action} ${quantity} (Reference: ${referenceId})`,
    );

    await product.save();
    return product;
  }

  async getStockStatus(productId: string): Promise<any> {
    const product = await this.findById(productId);

    return {
      totalStock: product.totalStock,
      stockStatus: product.stockStatus,
      totalSoldQuantity: product.totalSoldQuantity,
      packages: product.packages.map(pkg => ({
        size: pkg.size,
        stock: pkg.stock,
        reservedQuantity: pkg.reservedQuantity,
        availableQuantity: pkg.stock - pkg.reservedQuantity,
        soldQuantity: pkg.soldQuantity,
        stockStatus: pkg.stockStatus,
        minimumStockLevel: pkg.minimumStockLevel,
      })),
    };
  }

  private calculateStockStatus(stock: number, minimumLevel: number): string {
    if (stock === 0) return 'out_of_stock';
    if (stock <= minimumLevel) return 'low_stock';
    return 'in_stock';
  }

  private calculatePackageStockStatus(stock: number, minimumLevel: number): string {
    if (stock === 0) return 'out_of_stock';
    if (stock <= minimumLevel) return 'low_stock';
    return 'available';
  }
}
