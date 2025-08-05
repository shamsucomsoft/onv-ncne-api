import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get take(): number {
    return this.limit;
  }
}

export class PaginationMetaDto {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;

  constructor(paginationQuery: PaginationQueryDto, totalItems: number) {
    this.page = paginationQuery.page || 1;
    this.limit = paginationQuery.limit || 10;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / this.limit);
    this.hasNextPage = this.page < this.totalPages;
    this.hasPreviousPage = this.page > 1;
  }
}

export class PaginatedResponseDto<T> {
  readonly data: T[];
  readonly meta: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
