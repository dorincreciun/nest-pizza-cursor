import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * Controller pentru gestionarea categoriilor
 * Oferă CRUD pentru categorii. Categoriile vor fi atașate produselor ulterior.
 */
@ApiTags('Categorii')
@ApiBearerAuth()
@ApiExtraModels(ErrorResponseDto, CategoryResponseDto, CreateCategoryDto, UpdateCategoryDto)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Creare categorie',
    description: 'Creează o categorie nouă. Slug-ul trebuie să fie unic.',
  })
  @ApiResponse({
    status: 201,
    description: 'Categoria a fost creată',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(CategoryResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Date de validare invalide',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: {
      statusCode: 400,
      message: ['slug must match the following pattern...', 'name must be longer than or equal to 2 characters'],
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
    description: 'Doar administratorii pot crea categorii',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 403, message: 'Doar administratorii pot efectua această acțiune', error: 'Forbidden' },
  })
  @ApiResponse({
    status: 409,
    description: 'Slug-ul există deja',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 409, message: 'O categorie cu slug-ul "pizza-clasica" există deja', error: 'Conflict' },
  })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoryService.create(dto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lista categorii',
    description: 'Returnează toate categoriile. Rută publică – nu necesită autentificare.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorii',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(CategoryResponseDto) },
        },
      },
    },
  })
  async findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detalii categorie',
    description: 'Returnează o categorie după ID. Rută publică – nu necesită autentificare.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria a fost găsită',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(CategoryResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria nu a fost găsită',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Categoria cu ID-ul 999 nu a fost găsită', error: 'Not Found' },
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryResponseDto> {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizare categorie',
    description: 'Actualizează o categorie existentă. Toate câmpurile sunt opționale.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria a fost actualizată',
    schema: {
      type: 'object',
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(CategoryResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Date de validare invalide',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 400, message: ['slug must match the following pattern...'], error: 'Bad Request' },
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
    description: 'Doar administratorii pot actualiza categorii',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 403, message: 'Doar administratorii pot efectua această acțiune', error: 'Forbidden' },
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria nu a fost găsită',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Categoria cu ID-ul 999 nu a fost găsită', error: 'Not Found' },
  })
  @ApiResponse({
    status: 409,
    description: 'Slug-ul există deja',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 409, message: 'O categorie cu slug-ul "pizza-clasica" există deja', error: 'Conflict' },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Ștergere categorie',
    description: 'Șterge o categorie. Versiune de test – poate fi refăcută ulterior cu soft delete.',
  })
  @ApiResponse({
    status: 204,
    description: 'Categoria a fost ștearsă',
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
    description: 'Doar administratorii pot șterge categorii',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 403, message: 'Doar administratorii pot efectua această acțiune', error: 'Forbidden' },
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria nu a fost găsită',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Categoria cu ID-ul 999 nu a fost găsită', error: 'Not Found' },
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoryService.remove(id);
  }
}
