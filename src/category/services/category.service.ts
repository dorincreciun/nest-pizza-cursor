import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryStatus } from '@prisma/client';

/**
 * Serviciu pentru gestionarea categoriilor
 * Responsabil pentru CRUD pe categorii. Categoriile vor fi atașate produselor ulterior.
 */
@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creează o categorie nouă
   * @param dto - Datele pentru crearea categoriei
   * @returns Categoria creată
   * @throws ConflictException dacă slug-ul există deja
   */
  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(
        `O categorie cu slug-ul "${dto.slug}" există deja`,
      );
    }

    const category = await this.prisma.category.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        status: dto.status ?? CategoryStatus.ACTIVE,
      },
    });

    return this.toResponseDto(category);
  }

  /**
   * Returnează toate categoriile
   * @returns Lista de categorii
   */
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return categories.map((c) => this.toResponseDto(c));
  }

  /**
   * Returnează o categorie după ID
   * @param id - ID-ul categoriei
   * @returns Categoria găsită
   * @throws NotFoundException dacă categoria nu există
   */
  async findOne(id: number): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Categoria cu ID-ul ${id} nu a fost găsită`);
    }
    return this.toResponseDto(category);
  }

  /**
   * Actualizează o categorie existentă
   * @param id - ID-ul categoriei
   * @param dto - Datele de actualizat
   * @returns Categoria actualizată
   * @throws NotFoundException dacă categoria nu există
   * @throws ConflictException dacă noul slug există deja la altă categorie
   */
  async update(
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Categoria cu ID-ul ${id} nu a fost găsită`);
    }

    if (dto.slug !== undefined && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(
          `O categorie cu slug-ul "${dto.slug}" există deja`,
        );
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return this.toResponseDto(updated);
  }

  /**
   * Șterge o categorie
   * @param id - ID-ul categoriei
   * @throws NotFoundException dacă categoria nu există
   */
  async remove(id: number): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Categoria cu ID-ul ${id} nu a fost găsită`);
    }
    await this.prisma.category.delete({
      where: { id },
    });
  }

  private toResponseDto(category: {
    id: number;
    slug: string;
    name: string;
    status: CategoryStatus;
    createdAt: Date;
    updatedAt: Date;
  }): CategoryResponseDto {
    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      status: category.status,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
