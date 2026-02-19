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
import { CategoryResponseDto } from '../../category/dto/category-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * Controller pentru gestionarea produselor
 * CRUD pentru produse. GET list și GET :id sunt publice; create/update/delete doar pentru admin.
 */
@ApiTags('Produse')
@ApiBearerAuth()
@ApiExtraModels(ErrorResponseDto, ProductResponseDto, CategoryResponseDto, CreateProductDto, UpdateProductDto)
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
    description: 'Fără categoryId: returnează toate produsele, indiferent de categorie. Cu categoryId: returnează doar produsele din categoria respectivă. Rută publică – nu necesită autentificare.',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: 'Opțional. Dacă lipsește – toate produsele. Dacă este indicat – doar produsele din acea categorie.',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produse',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ProductResponseDto) },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria specificată nu a fost găsită',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Categoria cu ID-ul 999 nu a fost găsită', error: 'Not Found' },
  })
  async findAll(@Query('categoryId') categoryId?: string) {
    const parsedCategoryId = categoryId && categoryId.trim() !== '' ? parseInt(categoryId, 10) : undefined;
    if (parsedCategoryId !== undefined && isNaN(parsedCategoryId)) {
      throw new BadRequestException('categoryId trebuie să fie un număr valid');
    }
    return this.productService.findAll(parsedCategoryId);
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
