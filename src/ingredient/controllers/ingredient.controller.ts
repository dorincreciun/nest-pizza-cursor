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
import { IngredientService } from '../services/ingredient.service';
import { CreateIngredientDto } from '../dto/create-ingredient.dto';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto';
import { IngredientResponseDto } from '../dto/ingredient-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * Controller pentru gestionarea ingredientelor.
 * Un ingredient poate fi atașat la mai multe produse. GET public; create/update/delete doar admin.
 */
@ApiTags('Ingrediente')
@ApiBearerAuth()
@ApiExtraModels(ErrorResponseDto, IngredientResponseDto, CreateIngredientDto, UpdateIngredientDto)
@Controller('ingredients')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creare ingredient', description: 'Creează un ingredient nou. Slug unic.' })
  @ApiResponse({
    status: 201,
    description: 'Ingredientul a fost creat',
    schema: { type: 'object', required: ['data'], properties: { data: { $ref: getSchemaPath(IngredientResponseDto) } } },
  })
  @ApiResponse({
    status: 400,
    description: 'Validare eșuată',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 400, message: 'Slug-ul trebuie să fie în format kebab-case', error: 'Bad Request' },
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
    description: 'Doar administratorii pot crea ingrediente',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 403, message: 'Doar administratorii pot efectua această acțiune', error: 'Forbidden' },
  })
  @ApiResponse({
    status: 409,
    description: 'Slug existent',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 409, message: 'Un ingredient cu slug-ul "rosii" există deja', error: 'Conflict' },
  })
  async create(@Body() dto: CreateIngredientDto) {
    return this.ingredientService.create(dto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lista ingrediente', description: 'Toate ingredientele. Rută publică.' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ingrediente (toate cu imageUrl null dacă nu au imagine)',
    schema: {
      type: 'object',
      required: ['data'],
      properties: { data: { type: 'array', items: { $ref: getSchemaPath(IngredientResponseDto) } } },
    },
  })
  async findAll() {
    return this.ingredientService.findAll();
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detalii ingredient' })
  @ApiResponse({
    status: 200,
    description: 'Ingredient găsit (imageUrl poate fi null)',
    schema: { type: 'object', required: ['data'], properties: { data: { $ref: getSchemaPath(IngredientResponseDto) } } },
  })
  @ApiResponse({
    status: 404,
    description: 'Ingredient negăsit',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Ingredientul cu ID-ul 999 nu a fost găsit', error: 'Not Found' },
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizare ingredient' })
  @ApiResponse({
    status: 200,
    description: 'Ingredient actualizat',
    schema: { type: 'object', required: ['data'], properties: { data: { $ref: getSchemaPath(IngredientResponseDto) } } },
  })
  @ApiResponse({
    status: 404,
    description: 'Ingredient negăsit',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Ingredientul cu ID-ul 999 nu a fost găsit', error: 'Not Found' },
  })
  @ApiResponse({
    status: 403,
    description: 'Doar administratorii',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 403, message: 'Doar administratorii pot efectua această acțiune', error: 'Forbidden' },
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIngredientDto) {
    return this.ingredientService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ștergere ingredient' })
  @ApiResponse({ status: 204, description: 'Ingredient șters' })
  @ApiResponse({
    status: 404,
    description: 'Ingredient negăsit',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 404, message: 'Ingredientul cu ID-ul 999 nu a fost găsit', error: 'Not Found' },
  })
  @ApiResponse({
    status: 403,
    description: 'Doar administratorii',
    type: ErrorResponseDto,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
    example: { statusCode: 403, message: 'Doar administratorii pot efectua această acțiune', error: 'Forbidden' },
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.ingredientService.remove(id);
  }
}
