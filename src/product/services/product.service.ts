import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductFiltersResponseDto } from '../dto/product-filters-response.dto';
import { FilterOptionDto } from '../dto/filter-option.dto';
import { CategoryResponseDto } from '../../category/dto/category-response.dto';
import { ProductType, ItemStatus, CategoryStatus } from '@prisma/client';

/**
 * Serviciu pentru gestionarea produselor
 * CRUD cu validare categoryId și slug unic. Rezultatele sunt mapate la ProductResponseDto.
 */
@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creează un produs nou
   * @param dto - Datele pentru crearea produsului
   * @returns Produsul creat
   * @throws BadRequestException dacă categoria nu există
   * @throws ConflictException dacă slug-ul există deja
   */
  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        `Categoria cu ID-ul ${dto.categoryId} nu există`,
      );
    }

    const existingSlug = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException(
        `Un produs cu slug-ul "${dto.slug}" există deja`,
      );
    }

    const product = await this.prisma.product.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        imageUrl: dto.imageUrl ?? null,
        type: dto.type ?? ProductType.SIMPLE,
        status: dto.status ?? ItemStatus.ACTIVE,
        categoryId: dto.categoryId,
        ingredients: dto.ingredients ?? [],
        sizes: dto.sizes ?? [],
      },
      include: { category: true },
    });

    return this.toResponseDto(product);
  }

  /**
   * Returnează produsele: toate dacă categoryId lipsește, sau doar cele din categoria indicată
   * @param categoryId - Opțional. Dacă lipsește: toate produsele. Dacă este indicat: filtrare după categorie
   * @returns Lista de produse
   * @throws NotFoundException dacă categoryId este indicat dar categoria nu există
   */
  async findAll(categoryId?: number): Promise<ProductResponseDto[]> {
    if (categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Categoria cu ID-ul ${categoryId} nu a fost găsită`,
        );
      }
    }

    const products = await this.prisma.product.findMany({
      where: categoryId !== undefined ? { categoryId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
    return products.map((p) => this.toResponseDto(p));
  }

  /**
   * Returnează un produs după ID
   * @param id - ID-ul produsului
   * @returns Produsul găsit
   * @throws NotFoundException dacă produsul nu există
   */
  async findOne(id: number): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Produsul cu ID-ul ${id} nu a fost găsit`);
    }
    return this.toResponseDto(product);
  }

  /**
   * Actualizează un produs existent
   * @param id - ID-ul produsului
   * @param dto - Datele de actualizat
   * @returns Produsul actualizat
   * @throws NotFoundException dacă produsul nu există
   * @throws BadRequestException dacă categoria nouă nu există
   * @throws ConflictException dacă noul slug există deja
   */
  async update(
    id: number,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Produsul cu ID-ul ${id} nu a fost găsit`);
    }

    if (dto.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Categoria cu ID-ul ${dto.categoryId} nu există`,
        );
      }
    }

    if (dto.slug !== undefined && dto.slug !== product.slug) {
      const existingSlug = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        throw new ConflictException(
          `Un produs cu slug-ul "${dto.slug}" există deja`,
        );
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.ingredients !== undefined && { ingredients: dto.ingredients }),
        ...(dto.sizes !== undefined && { sizes: dto.sizes }),
      },
      include: { category: true },
    });

    return this.toResponseDto(updated);
  }

  /**
   * Șterge un produs
   * @param id - ID-ul produsului
   * @throws NotFoundException dacă produsul nu există
   */
  async remove(id: number): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Produsul cu ID-ul ${id} nu a fost găsit`);
    }
    await this.prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Returnează filtrele disponibile pentru produse (types, ingrediente, mărimi)
   * Doar produsele ACTIVE sunt incluse în filtre (status nu este expus public)
   * @param categoryId - Opțional. Dacă lipsește: filtre pentru toate produsele ACTIVE. Dacă este indicat: filtre pentru produsele ACTIVE din categoria respectivă
   * @returns Filtrele disponibile cu id și name pentru fiecare opțiune
   * @throws NotFoundException dacă categoryId este indicat dar categoria nu există
   */
  async getFilters(categoryId?: number): Promise<ProductFiltersResponseDto> {
    if (categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Categoria cu ID-ul ${categoryId} nu a fost găsită`,
        );
      }
    }

    // Filtrează doar produsele ACTIVE pentru client
    const products = await this.prisma.product.findMany({
      where: {
        status: ItemStatus.ACTIVE,
        ...(categoryId !== undefined && { categoryId }),
      },
      select: {
        type: true,
        ingredients: true,
        sizes: true,
      },
    });

    const typeSet = new Set<ProductType>();
    const ingredientsSet = new Set<string>();
    const sizesSet = new Set<string>();

    products.forEach((product) => {
      typeSet.add(product.type);
      // Validare defensivă pentru cazul în care Prisma Client nu a fost regenerat
      if (product.ingredients && Array.isArray(product.ingredients)) {
        product.ingredients.forEach((ing) => ingredientsSet.add(ing));
      }
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach((size) => sizesSet.add(size));
      }
    });

    // Mapare types cu label-uri românești
    const typeLabels: Record<ProductType, string> = {
      SIMPLE: 'Simplu',
      CONFIGURABLE: 'Personalizabil',
    };

    const types: FilterOptionDto[] = Array.from(typeSet)
      .sort()
      .map((type) => ({
        id: type,
        name: typeLabels[type],
      }));

    // Mapare ingredients cu capitalize prima literă
    const ingredients: FilterOptionDto[] = Array.from(ingredientsSet)
      .sort()
      .map((ing) => ({
        id: ing,
        name: ing.charAt(0).toUpperCase() + ing.slice(1),
      }));

    // Mapare sizes cu capitalize prima literă
    const sizes: FilterOptionDto[] = Array.from(sizesSet)
      .sort()
      .map((size) => ({
        id: size,
        name: size.charAt(0).toUpperCase() + size.slice(1),
      }));

    return {
      types,
      ingredients,
      sizes,
    };
  }

  private toResponseDto(product: {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    type: ProductType;
    status: ItemStatus;
    categoryId: number;
    ingredients: string[];
    sizes: string[];
    createdAt: Date;
    updatedAt: Date;
    category: {
      id: number;
      slug: string;
      name: string;
      status: CategoryStatus;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }): ProductResponseDto {
    const categoryDto: CategoryResponseDto | null = product.category
      ? {
          id: product.category.id,
          slug: product.category.slug,
          name: product.category.name,
          status: product.category.status,
          createdAt: product.category.createdAt.toISOString(),
          updatedAt: product.category.updatedAt.toISOString(),
        }
      : null;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      type: product.type,
      status: product.status,
      categoryId: product.categoryId,
      category: categoryDto,
      ingredients: product.ingredients,
      sizes: product.sizes,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
