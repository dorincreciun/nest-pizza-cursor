import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductListResponseDto } from '../dto/product-list-response.dto';
import { ProductFiltersResponseDto } from '../dto/product-filters-response.dto';
import { FilterSectionDto } from '../dto/filter-section.dto';
import { FilterOptionDto } from '../dto/filter-option.dto';
import { CategoryResponseDto } from '../../category/dto/category-response.dto';
import { IngredientResponseDto } from '../../ingredient/dto/ingredient-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PaginatedMetaDto } from '../../common/dto/paginated-meta.dto';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { ProductType } from '@prisma/client';
import {
  PRODUCT_TYPE_ID_TO_ENUM,
  SIZE_ID_TO_SLUG,
} from '../services/product.service';

/**
 * Controller pentru gestionarea produselor
 * CRUD pentru produse. GET list și GET :id sunt publice; create/update/delete doar pentru admin.
 */
@ApiTags('Produse')
@ApiBearerAuth()
@ApiExtraModels(ErrorResponseDto, ProductResponseDto, ProductListResponseDto, PaginatedMetaDto, ProductFiltersResponseDto, FilterSectionDto, FilterOptionDto, IngredientResponseDto, CategoryResponseDto, CreateProductDto, UpdateProductDto)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Creare produs',
    description: 'Creează un produs nou. Slug-ul trebuie să fie unic. Categoria trebuie să existe.',
  })
  @ApiResponse({
    status: 201,
    description: 'Produsul a fost creat',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ProductResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Date de validare invalide sau categoria nu există',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: {
      statusCode: 400,
      message: ['price must be a positive number', 'Categoria cu ID-ul 999 nu există'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Neautorizat',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 401, message: 'Token invalid sau expirat', error: 'Unauthorized' },
  })
  @ApiResponse({
    status: 403,
    description: 'Doar administratorii pot crea produse',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 403, message: 'Doar administratorii pot efectua această acțiune', error: 'Forbidden' },
  })
  @ApiResponse({
    status: 409,
    description: 'Slug-ul există deja',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 409, message: 'Un produs cu slug-ul "margherita" există deja', error: 'Conflict' },
  })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productService.create(dto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista produse',
    description: 'Returnează lista de produse cu suport pentru filtrare și paginare. Poți filtra după categoryId, types, ingredients, sizes. Rută publică – nu necesită autentificare.',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: 'Opțional. Dacă lipsește – toate produsele. Dacă este indicat – doar produsele din acea categorie.',
    example: 1,
  })
  @ApiQuery({
    name: 'types',
    required: false,
    type: [Number],
    isArray: true,
    description: 'Opțional. ID-uri numerice: 1=SIMPLE, 2=CONFIGURABLE. Exemplu: ?types=1&types=2',
    example: [1, 2],
  })
  @ApiQuery({
    name: 'ingredients',
    required: false,
    type: [Number],
    isArray: true,
    description: 'Opțional. Array de ID-uri de ingrediente pentru filtrare. Exemplu: ?ingredients=1&ingredients=2',
    example: [1, 2],
  })
  @ApiQuery({
    name: 'sizes',
    required: false,
    type: [Number],
    isArray: true,
    description: 'Opțional. ID-uri numerice: 1=mică, 2=medie, 3=mare, 4=familie. Exemplu: ?sizes=1&sizes=2',
    example: [1, 2],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Opțional. Numărul paginii (default: 1). Fiecare pagină are 10 produse.',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produse cu meta informații pentru paginare',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ProductResponseDto) },
        },
        meta: { $ref: getSchemaPath(PaginatedMetaDto) },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parametri invalizi (categoryId sau page nu sunt numere valide)',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 400, message: 'categoryId trebuie să fie un număr valid', error: 'Bad Request' },
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria specificată nu a fost găsită',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Categoria cu ID-ul 999 nu a fost găsită', error: 'Not Found' },
  })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('types') types?: string | string[],
    @Query('ingredients') ingredients?: string | string[],
    @Query('sizes') sizes?: string | string[],
    @Query('page') page?: string,
  ) {
    // Parse categoryId
    const parsedCategoryId = categoryId && categoryId.trim() !== '' ? parseInt(categoryId, 10) : undefined;
    if (parsedCategoryId !== undefined && isNaN(parsedCategoryId)) {
      throw new BadRequestException('categoryId trebuie să fie un număr valid');
    }

    // Parse types: acceptă ID numerici (1=SIMPLE, 2=CONFIGURABLE) sau string-uri enum
    let parsedTypes: ProductType[] | undefined;
    if (types) {
      const typesArray = Array.isArray(types) ? types : [types];
      const resolved: ProductType[] = [];
      for (const t of typesArray) {
        if (t == null || String(t).trim() === '') continue;
        const num = parseInt(String(t).trim(), 10);
        if (!isNaN(num) && PRODUCT_TYPE_ID_TO_ENUM[num]) {
          resolved.push(PRODUCT_TYPE_ID_TO_ENUM[num]);
        } else if (t === 'SIMPLE' || t === 'CONFIGURABLE') {
          resolved.push(t as ProductType);
        } else {
          throw new BadRequestException(
            `Tip invalid: ${t}. Valori valide: 1 (SIMPLE), 2 (CONFIGURABLE) sau SIMPLE, CONFIGURABLE`,
          );
        }
      }
      if (resolved.length > 0) {
        parsedTypes = resolved;
      }
    }

    // Parse ingredients (array de ID-uri de ingrediente)
    let parsedIngredientIds: number[] | undefined;
    if (ingredients) {
      const arr = Array.isArray(ingredients) ? ingredients : [ingredients];
      const ids = arr.map((i) => parseInt(String(i).trim(), 10)).filter((n) => !isNaN(n) && n >= 1);
      if (ids.length > 0) {
        parsedIngredientIds = ids;
      }
    }

    // Parse sizes: acceptă ID numerici (1=mică, 2=medie, 3=mare, 4=familie) sau slug-uri
    let parsedSizes: string[] | undefined;
    if (sizes) {
      const sizesArray = Array.isArray(sizes) ? sizes : [sizes];
      const resolved: string[] = [];
      for (const s of sizesArray) {
        if (s == null || String(s).trim() === '') continue;
        const num = parseInt(String(s).trim(), 10);
        if (!isNaN(num) && SIZE_ID_TO_SLUG[num]) {
          resolved.push(SIZE_ID_TO_SLUG[num]);
        } else {
          resolved.push(String(s).trim());
        }
      }
      if (resolved.length > 0) {
        parsedSizes = resolved;
      }
    }

    // Parse page (default: 1, minim: 1)
    let parsedPage = 1;
    if (page !== undefined && page !== null && String(page).trim() !== '') {
      const num = parseInt(String(page).trim(), 10);
      if (isNaN(num) || num < 1) {
        throw new BadRequestException('page trebuie să fie un număr valid mai mare sau egal cu 1');
      }
      parsedPage = num;
    }

    return this.productService.findAll(
      parsedCategoryId,
      parsedTypes,
      parsedIngredientIds,
      parsedSizes,
      parsedPage,
    );
  }

  @Get('filters')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Filtre disponibile pentru produse',
    description: 'Fără categoryId: returnează filtrele pentru toate produsele ACTIVE. Cu categoryId: returnează filtrele doar pentru produsele ACTIVE din categoria respectivă. Status nu este expus în filtre (doar produsele active sunt disponibile pentru client). Rută publică – nu necesită autentificare.',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: 'Opțional. Dacă lipsește – filtre pentru toate produsele ACTIVE. Dacă este indicat – filtre doar pentru produsele ACTIVE din acea categorie.',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Filtrele disponibile',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ProductFiltersResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'categoryId invalid',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 400, message: 'categoryId trebuie să fie un număr valid', error: 'Bad Request' },
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria specificată nu a fost găsită',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Categoria cu ID-ul 999 nu a fost găsită', error: 'Not Found' },
  })
  async getFilters(@Query('categoryId') categoryId?: string) {
    const parsedCategoryId = categoryId && categoryId.trim() !== '' ? parseInt(categoryId, 10) : undefined;
    if (parsedCategoryId !== undefined && isNaN(parsedCategoryId)) {
      throw new BadRequestException('categoryId trebuie să fie un număr valid');
    }
    return this.productService.getFilters(parsedCategoryId);
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detalii produs',
    description: 'Returnează un produs după ID. Rută publică – nu necesită autentificare.',
  })
  @ApiResponse({
    status: 200,
    description: 'Produsul a fost găsit',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ProductResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Produsul nu a fost găsit',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Produsul cu ID-ul 999 nu a fost găsit', error: 'Not Found' },
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductResponseDto> {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizare produs',
    description: 'Actualizează un produs existent. Toate câmpurile sunt opționale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Produsul a fost actualizat',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ProductResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Date de validare invalide sau categoria nu există',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 400, message: 'Categoria cu ID-ul 999 nu există', error: 'Bad Request' },
  })
  @ApiResponse({
    status: 401,
    description: 'Neautorizat',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 401, message: 'Token invalid sau expirat', error: 'Unauthorized' },
  })
  @ApiResponse({
    status: 403,
    description: 'Doar administratorii pot actualiza produse',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 403, message: 'Doar administratorii pot efectua această acțiune', error: 'Forbidden' },
  })
  @ApiResponse({
    status: 404,
    description: 'Produsul nu a fost găsit',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Produsul cu ID-ul 999 nu a fost găsit', error: 'Not Found' },
  })
  @ApiResponse({
    status: 409,
    description: 'Slug-ul există deja',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 409, message: 'Un produs cu slug-ul "margherita" există deja', error: 'Conflict' },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Ștergere produs',
    description: 'Șterge un produs.',
  })
  @ApiResponse({
    status: 204,
    description: 'Produsul a fost șters',
  })
  @ApiResponse({
    status: 401,
    description: 'Neautorizat',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 401, message: 'Token invalid sau expirat', error: 'Unauthorized' },
  })
  @ApiResponse({
    status: 403,
    description: 'Doar administratorii pot șterge produse',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 403, message: 'Doar administratorii pot efectua această acțiune', error: 'Forbidden' },
  })
  @ApiResponse({
    status: 404,
    description: 'Produsul nu a fost găsit',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Produsul cu ID-ul 999 nu a fost găsit', error: 'Not Found' },
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productService.remove(id);
  }
}
