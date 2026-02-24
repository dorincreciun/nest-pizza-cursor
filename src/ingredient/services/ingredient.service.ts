import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto } from '../dto/create-ingredient.dto';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto';
import { IngredientResponseDto } from '../dto/ingredient-response.dto';

/**
 * Serviciu pentru gestionarea ingredientelor.
 * Un ingredient poate fi atașat la mai multe produse (many-to-many).
 */
@Injectable()
export class IngredientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIngredientDto): Promise<IngredientResponseDto> {
    const existing = await this.prisma.ingredient.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Un ingredient cu slug-ul "${dto.slug}" există deja`);
    }
    const ingredient = await this.prisma.ingredient.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        imageUrl: dto.imageUrl ?? null,
      },
    });
    return this.toResponseDto(ingredient);
  }

  async findAll(): Promise<IngredientResponseDto[]> {
    const list = await this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });
    return list.map((i) => this.toResponseDto(i));
  }

  async findOne(id: number): Promise<IngredientResponseDto> {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    });
    if (!ingredient) {
      throw new NotFoundException(`Ingredientul cu ID-ul ${id} nu a fost găsit`);
    }
    return this.toResponseDto(ingredient);
  }

  async update(id: number, dto: UpdateIngredientDto): Promise<IngredientResponseDto> {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Ingredientul cu ID-ul ${id} nu a fost găsit`);
    }
    if (dto.slug !== undefined && dto.slug !== existing.slug) {
      const bySlug = await this.prisma.ingredient.findUnique({ where: { slug: dto.slug } });
      if (bySlug) {
        throw new ConflictException(`Un ingredient cu slug-ul "${dto.slug}" există deja`);
      }
    }
    const updated = await this.prisma.ingredient.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      },
    });
    return this.toResponseDto(updated);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Ingredientul cu ID-ul ${id} nu a fost găsit`);
    }
    await this.prisma.ingredient.delete({ where: { id } });
  }

  private toResponseDto(ingredient: { id: number; slug: string; name: string; imageUrl: string | null }): IngredientResponseDto {
    return {
      id: ingredient.id,
      slug: ingredient.slug,
      name: ingredient.name,
      imageUrl: ingredient.imageUrl,
    };
  }
}
