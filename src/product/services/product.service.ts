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

/** Mapare ID numeric -> ProductType pentru filtre (GET /products?types=1&types=2) */
export const PRODUCT_TYPE_ID_TO_ENUM: Record<number, ProductType> = {
  1: ProductType.SIMPLE,
  2: ProductType.CONFIGURABLE,
};

/** Mapare ProductType -> ID numeric pentru răspunsul de filtre */
export const PRODUCT_TYPE_ENUM_TO_ID: Record<ProductType, number> = {
  [ProductType.SIMPLE]: 1,
  [ProductType.CONFIGURABLE]: 2,
};

/** Mapare slug mărime -> ID numeric pentru filtre și răspunsuri */
export const SIZE_SLUG_TO_ID: Record<string, number> = {
  mică: 1,
  medie: 2,
  mare: 3,
  familie: 4,
};

/** Mapare ID numeric -> slug mărime */
export const SIZE_ID_TO_SLUG: Record<number, string> = Object.fromEntries(
  Object.entries(SIZE_SLUG_TO_ID).map(([slug, id]) => [id, slug]),
);

/**
 * Serviciu pentru gestionarea produselor.
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
        ...(dto.sizePriceModifiers !== undefined && {
          sizePriceModifiers: dto.sizePriceModifiers,
        }),
        ...(dto.stockQuantity !== undefined && {
          stockQuantity: dto.stockQuantity ?? null,
        }),
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
   * Returnează produsele cu suport pentru filtrare și paginare (10 produse per pagină).
   * Dacă userId este furnizat (utilizator logat), fiecare produs va conține și cartQuantity
   * care indică cantitatea produsului în coșul utilizatorului.
   * @param categoryId - Opțional. Dacă lipsește: toate produsele. Dacă este indicat: filtrare după categorie
   * @param types - Opțional. Array de tipuri de produse (SIMPLE, CONFIGURABLE) pentru filtrare
   * @param ingredientIds - Opțional. Array de ingrediente pentru filtrare
   * @param sizes - Opțional. Array de mărimi pentru filtrare
   * @param page - Numărul paginii (1-based)
   * @param userId - Opțional. ID-ul utilizatorului logat pentru calculul cantității din coș
   * @returns Lista de produse cu meta informații pentru paginare
   * @throws NotFoundException dacă categoryId este indicat dar categoria nu există
   */
  async findAll(
    categoryId?: number,
    types?: ProductType[],
    ingredientIds?: number[],
    sizes?: string[],
    page: number = 1,
    userId?: string,
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

    let cartQuantityByProductId: Record<number, number> = {};

    if (userId) {
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId },
        select: {
          productId: true,
          quantity: true,
        },
      });

      cartQuantityByProductId = cartItems.reduce<Record<number, number>>(
        (acc, item) => {
          acc[item.productId] = item.quantity;
          return acc;
        },
        {},
      );
    }

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: products.map((p) =>
        this.toResponseDto(
          p,
          userId ? cartQuantityByProductId[p.id] ?? null : null,
        ),
      ),
      meta: {
        totalItems: total,
        currentPage: pageNumber,
        itemsPerPage: pageSize,
        totalPages,
      },
    };
  }

  /**
   * Returnează întreaga entitate produs pentru fiecare ID cerut, plus qty (cantitatea cerută) și availableQuantity (stoc).
   * ID-urile inexistente sau invalide sunt omise. Ordinea răspunsului respectă ordinea din request.
   * @param items - Lista de perechi (productId, quantity) trimisă de client
   * @returns Lista de obiecte: ProductResponseDto (entitate completă) + qty + availableQuantity
   */
  async findBulk(
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<Array<ProductResponseDto & { qty: number; availableQuantity: number | null }>> {
    if (items.length === 0) {
      return [];
    }
    const numericIds = items
      .map((it) => parseInt(String(it.productId).trim(), 10))
      .filter((n) => !Number.isNaN(n) && n >= 1);
    if (numericIds.length === 0) {
      return [];
    }
    const uniqueIds = [...new Set(numericIds)];
    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueIds } },
      include: { category: true, ingredients: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const result: Array<ProductResponseDto & { qty: number; availableQuantity: number | null }> = [];
    for (const it of items) {
      const id = parseInt(String(it.productId).trim(), 10);
      if (Number.isNaN(id) || id < 1 || !byId.has(id)) continue;
      const p = byId.get(id)!;
      const dto = this.toResponseDto(p, null);
      result.push({
        ...dto,
        qty: it.quantity,
        availableQuantity: p.stockQuantity ?? null,
      });
    }
    return result;
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
        ...(dto.sizePriceModifiers !== undefined && {
          sizePriceModifiers: dto.sizePriceModifiers,
        }),
        ...(dto.stockQuantity !== undefined && {
          stockQuantity: dto.stockQuantity ?? null,
        }),
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
        sizePriceModifiers: true,
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
        id: PRODUCT_TYPE_ENUM_TO_ID[type],
        name: typeLabels[type],
        // Tipul de produs este doar pentru filtrare, nu modifică prețul de bază.
        extraPrice: null,
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
          ).map((i) => ({ id: i.id, slug: i.slug, name: i.name, imageUrl: i.imageUrl, defaultExtraPrice: i.defaultExtraPrice }));

    const sizes: FilterOptionDto[] = Array.from(sizesSet)
      .sort()
      .map((size) => ({
        id: SIZE_SLUG_TO_ID[size] ?? 100 + Array.from(sizesSet).indexOf(size),
        name: size.charAt(0).toUpperCase() + size.slice(1),
        // În contextul filtrelor, nu modificăm prețul – extraPrice rămâne null.
        extraPrice: null,
      }));

    return {
      filters: [
        { name: 'Tipuri', url_key: 'types', options: types },
        { name: 'Ingrediente', url_key: 'ingredients', options: ingredientsList },
        { name: 'Mărimi', url_key: 'sizes', options: sizes },
      ],
    };
  }

  /**
   * Mapează un array de slug-uri de mărimi la FilterOptionDto[] (id numeric, name pentru UI, extraPrice).
   * @param items - Slug-uri din baza de date (ex: ['mică', 'medie', 'mare'])
   * @param extraPriceBySlug - Mapare opțională slug -> extraPrice (lei) față de prețul de bază al produsului
   * @returns FilterOptionDto[] cu id numeric, name formatat și extraPrice (sau null dacă nu există)
   */
  private mapToFilterOptions(
    items: string[] | undefined | null,
    extraPriceBySlug?: Record<string, number | null>,
  ): FilterOptionDto[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items.map((item) => ({
      id: SIZE_SLUG_TO_ID[item] ?? 99,
      name:
        item && item.length > 0
          ? item.charAt(0).toUpperCase() + item.slice(1)
          : item,
      extraPrice:
        extraPriceBySlug && Object.prototype.hasOwnProperty.call(extraPriceBySlug, item)
          ? extraPriceBySlug[item] ?? null
          : null,
    }));
  }

  private toResponseDto(
    product: {
      id: number;
      slug: string;
      name: string;
      description: string | null;
      price: number;
      imageUrl: string | null;
      type: ProductType;
      status: ItemStatus;
      categoryId: number;
      ingredients: Array<{
        id: number;
        slug: string;
        name: string;
        imageUrl: string | null;
        defaultExtraPrice: number | null;
      }>;
      sizes: string[];
      createdAt: Date;
      updatedAt: Date;
      stockQuantity?: number | null;
      category: {
        id: number;
        slug: string;
        name: string;
        status: CategoryStatus;
        createdAt: Date;
        updatedAt: Date;
      } | null;
      sizePriceModifiers?: Prisma.JsonValue | null;
    },
    cartQuantity: number | null = null,
  ): ProductResponseDto {
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
      defaultExtraPrice: i.defaultExtraPrice ?? null,
    }));

    let sizeExtraPriceMap: Record<string, number | null> = {};
    if (product.sizePriceModifiers && typeof product.sizePriceModifiers === 'object') {
      const raw = product.sizePriceModifiers as Record<string, unknown>;
      sizeExtraPriceMap = Object.entries(raw).reduce<Record<string, number | null>>(
        (acc, [slug, value]) => {
          if (value === null || value === undefined) {
            acc[slug] = null;
            return acc;
          }
          const num = typeof value === 'number' ? value : Number(value);
          if (!Number.isNaN(num)) {
            acc[slug] = num;
          }
          return acc;
        },
        {},
      );
    }

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
      sizes: this.mapToFilterOptions(product.sizes, sizeExtraPriceMap),
      cartQuantity,
      stockQuantity: product.stockQuantity ?? null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
