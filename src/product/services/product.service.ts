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
import { ProductListResponseDto } from '../dto/product-list-response.dto';
import { ProductFiltersResponseDto } from '../dto/product-filters-response.dto';
import { FilterOptionDto } from '../dto/filter-option.dto';
import { CategoryResponseDto } from '../../category/dto/category-response.dto';
import { IngredientResponseDto } from '../../ingredient/dto/ingredient-response.dto';
import { Prisma, ProductType, ItemStatus, CategoryStatus } from '@prisma/client';

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

    if (dto.ingredientIds && dto.ingredientIds.length > 0) {
      const found = await this.prisma.ingredient.findMany({
        where: { id: { in: dto.ingredientIds } },
        select: { id: true },
      });
      const foundIds = new Set(found.map((f) => f.id));
      const missing = dto.ingredientIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Ingrediente cu ID-urile ${missing.join(', ')} nu există`,
        );
      }
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
        sizes: dto.sizes ?? [],
        ...(dto.ingredientIds && dto.ingredientIds.length > 0 && {
          ingredients: { connect: dto.ingredientIds.map((id) => ({ id })) },
        }),
      },
      include: { category: true, ingredients: true },
    });

    return this.toResponseDto(product);
  }

  /** Număr fix de produse per pagină pentru GET /products */
  private static readonly PRODUCTS_PAGE_SIZE = 10;

  /**
   * Returnează produsele cu suport pentru filtrare și paginare (10 produse per pagină)
   * @param categoryId - Opțional. Dacă lipsește: toate produsele. Dacă este indicat: filtrare după categorie
   * @param types - Opțional. Array de tipuri de produse (SIMPLE, CONFIGURABLE) pentru filtrare
   * @param ingredients - Opțional. Array de ingrediente pentru filtrare
   * @param sizes - Opțional. Array de mărimi pentru filtrare
   * @param page - Numărul paginii (1-based)
   * @returns Lista de produse cu meta informații pentru paginare
   * @throws NotFoundException dacă categoryId este indicat dar categoria nu există
   */
  async findAll(
    categoryId?: number,
    types?: ProductType[],
    ingredientIds?: number[],
    sizes?: string[],
    page: number = 1,
  ): Promise<ProductListResponseDto> {
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

    const pageSize = ProductService.PRODUCTS_PAGE_SIZE;
    const pageNumber = Math.max(1, Math.floor(Number(page)));

    const where: Prisma.ProductWhereInput = {
      status: ItemStatus.ACTIVE,
    };

    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }

    if (types && types.length > 0) {
      where.type = { in: types };
    }

    if (sizes && sizes.length > 0) {
      where.sizes = { hasSome: sizes };
    }

    if (ingredientIds && ingredientIds.length > 0) {
      where.ingredients = { some: { id: { in: ingredientIds } } };
    }

    const skip = (pageNumber - 1) * pageSize;

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        include: { category: true, ingredients: true },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: products.map((p) => this.toResponseDto(p)),
      meta: {
        totalItems: total,
        currentPage: pageNumber,
        itemsPerPage: pageSize,
        totalPages,
      },
    };
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
      include: { category: true, ingredients: true },
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

    if (dto.ingredientIds && dto.ingredientIds.length > 0) {
      const found = await this.prisma.ingredient.findMany({
        where: { id: { in: dto.ingredientIds } },
        select: { id: true },
      });
      const foundIds = new Set(found.map((f) => f.id));
      const missing = dto.ingredientIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Ingrediente cu ID-urile ${missing.join(', ')} nu există`,
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
        ...(dto.sizes !== undefined && { sizes: dto.sizes }),
        ...(dto.ingredientIds !== undefined && {
          ingredients: { set: dto.ingredientIds.map((id) => ({ id })) },
        }),
      },
      include: { category: true, ingredients: true },
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
        ingredients: { select: { id: true, slug: true, name: true, imageUrl: true } },
        sizes: true,
      },
    });

    const typeSet = new Set<ProductType>();
    const ingredientIdsSet = new Set<number>();
    const sizesSet = new Set<string>();

    products.forEach((product) => {
      typeSet.add(product.type);
      product.ingredients?.forEach((ing) => ingredientIdsSet.add(ing.id));
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach((size) => sizesSet.add(size));
      }
    });

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

    const ingredientIds = Array.from(ingredientIdsSet);
    const ingredientsList: IngredientResponseDto[] =
      ingredientIds.length === 0
        ? []
        : (
            await this.prisma.ingredient.findMany({
              where: { id: { in: ingredientIds } },
              orderBy: { name: 'asc' },
            })
          ).map((i) => ({ id: i.id, slug: i.slug, name: i.name, imageUrl: i.imageUrl }));

    const sizes: FilterOptionDto[] = Array.from(sizesSet)
      .sort()
      .map((size) => ({
        id: size,
        name: size.charAt(0).toUpperCase() + size.slice(1),
      }));

    return {
      types,
      ingredients: ingredientsList,
      sizes,
    };
  }

  /**
   * Mapează un array de string-uri la FilterOptionDto[] (sizes)
   */
  private mapToFilterOptions(items: string[] | undefined | null): FilterOptionDto[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items.map((item) => ({
      id: item,
      name: item && item.length > 0 ? item.charAt(0).toUpperCase() + item.slice(1) : item,
    }));
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
    ingredients: Array<{ id: number; slug: string; name: string; imageUrl: string | null }>;
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

    const ingredientsDto: IngredientResponseDto[] = (product.ingredients ?? []).map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      imageUrl: i.imageUrl,
    }));

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
      ingredients: ingredientsDto,
      sizes: this.mapToFilterOptions(product.sizes),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
