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

  /**
   * Creează un ingredient nou.
   * @param dto - Datele pentru crearea ingredientului (slug, name, imageUrl, defaultExtraPrice)
   * @returns Ingredientul creat mapat la IngredientResponseDto
   * @throws ConflictException dacă slug-ul există deja
   */
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
        defaultExtraPrice: dto.defaultExtraPrice ?? null,
      },
    });
    return this.toResponseDto(ingredient);
  }

  /**
   * Returnează toate ingredientele în format paginat (un singur batch – fără paginare reală).
   * Conform standardelor API: { data: T[], meta: { totalItems, currentPage, itemsPerPage, totalPages } }.
   * @returns Obiect cu data (lista de ingrediente) și meta
   */
  async findAll(): Promise<{ data: IngredientResponseDto[]; meta: { totalItems: number; currentPage: number; itemsPerPage: number; totalPages: number } }> {
    const list = await this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });
    const data = list.map((i) => this.toResponseDto(i));
    const totalItems = data.length;
    return {
      data,
      meta: {
        totalItems,
        currentPage: 1,
        itemsPerPage: totalItems === 0 ? 0 : totalItems,
        totalPages: totalItems === 0 ? 0 : 1,
      },
    };
  }

  /**
   * Returnează un ingredient după ID.
   * @param id - ID-ul ingredientului
   * @returns Ingredientul găsit
   * @throws NotFoundException dacă ingredientul nu există
   */
  async findOne(id: number): Promise<IngredientResponseDto> {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    });
    if (!ingredient) {
      throw new NotFoundException(`Ingredientul cu ID-ul ${id} nu a fost găsit`);
    }
    return this.toResponseDto(ingredient);
  }

  /**
   * Actualizează un ingredient existent.
   * @param id - ID-ul ingredientului
   * @param dto - Câmpurile de actualizat (slug, name, imageUrl, defaultExtraPrice)
   * @returns Ingredientul actualizat
   * @throws NotFoundException dacă ingredientul nu există
   * @throws ConflictException dacă noul slug există deja
   */
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
        ...(dto.defaultExtraPrice !== undefined && { defaultExtraPrice: dto.defaultExtraPrice }),
      },
    });
    return this.toResponseDto(updated);
  }

  /**
   * Șterge un ingredient.
   * @param id - ID-ul ingredientului
   * @throws NotFoundException dacă ingredientul nu există
   */
  async remove(id: number): Promise<void> {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Ingredientul cu ID-ul ${id} nu a fost găsit`);
    }
    await this.prisma.ingredient.delete({ where: { id } });
  }

  private toResponseDto(ingredient: {
    id: number;
    slug: string;
    name: string;
    imageUrl: string | null;
    defaultExtraPrice: number | null;
  }): IngredientResponseDto {
    return {
      id: ingredient.id,
      slug: ingredient.slug,
      name: ingredient.name,
      imageUrl: ingredient.imageUrl,
      defaultExtraPrice: ingredient.defaultExtraPrice,
    };
  }
}
