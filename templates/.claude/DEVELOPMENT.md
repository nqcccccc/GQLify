# Development Guide

This document covers commands, workflows, code generation templates, and troubleshooting for development.

---

## Table of Contents

1. [Commands](#commands)
2. [Before Starting Work](#before-starting-work)
3. [Code Generation Templates](#code-generation-templates)
4. [Migration Workflow](#migration-workflow)
5. [GraphQL Schema Evolution](#graphql-schema-evolution)
6. [Code Quality Gates](#code-quality-gates)
7. [Session Completion Checklist](#session-completion-checklist)
8. [Troubleshooting](#troubleshooting)
9. [Configuration Files](#configuration-files)

---

## Commands

### Development

```bash
pnpm install                              # Install dependencies
pnpm run start:dev                        # Start in watch mode (hot reload)
pnpm run start:debug                      # Start with debugger
```

### Database

```bash
pnpm run migration:generate --name=<name> # Generate migration from entity changes
pnpm run migration:create --name=<name>   # Create empty migration
pnpm run migration:run                    # Apply pending migrations
pnpm run migration:revert                 # Rollback last migration
pnpm run seed                             # Run database seeds
```

### Testing

```bash
pnpm run test                             # Run unit tests
pnpm run test:watch                       # Run tests in watch mode
pnpm run test:e2e                         # Run e2e tests
pnpm run test:cov                         # Generate coverage report
pnpm run test:debug                       # Run tests with debugger
pnpm run test -- --testPathPattern=<file> # Run single test file
pnpm run test -- --testNamePattern=<name> # Run tests matching name
```

### Build & Production

```bash
pnpm run build                            # Build for production
pnpm run start:prod                       # Run production build
pnpm run lint                             # Lint and fix code
pnpm run format                           # Format code with Prettier
```

---

## Before Starting Work

1. **Read CONVENTIONS.md** - Review patterns and conventions
2. **Check existing modules** - Look at `src/modules/user` as reference
3. **Verify GraphQL schema** - Check `src/schema.gql` for existing types
4. **Review error patterns** - All errors must use `ErrorFactory`

---

## Code Generation Templates

### Complete Module Workflow

When creating a new module (e.g., "Product"):

#### Step 1: Entity

`modules/product/repository/entities/product.entity.ts`

```typescript
import { BaseUUIDEntity } from '@common/database/entities/base-uuid.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity } from 'typeorm';

@ObjectType()
@Entity('products')
export class Product extends BaseUUIDEntity {
  @Field()
  @Column({ length: 255 })
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Field(() => ID, { nullable: true })
  @Column({ type: 'int', nullable: true })
  categoryId?: number;

  // Relations (lazy-loaded via DataLoader)
  category?: Category;
}
```

#### Step 2: Repository

`modules/product/repository/repositories/product.repository.ts`

```typescript
import { applyQueryPaging, applyQuerySorting } from '@common/database/helper/query.helper';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';

import { FilterProductInput } from '../../dtos/filter-product.dto';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends Repository<Product> {
  constructor(private readonly dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  async getList(params: FilterProductInput): Promise<[Product[], number]> {
    const query = this.createQueryBuilder('product');

    if (params.filter) {
      query.andWhere('product.name ILIKE :filter', { filter: `%${params.filter}%` });
    }

    applyQueryPaging(params, query);
    applyQuerySorting(params.sorting, query, 'product');

    return query.getManyAndCount();
  }

  async getById(id: string): Promise<Product | null> {
    return this.findOne({ where: { id } });
  }

  async getByIds(ids: string[]): Promise<Product[]> {
    return this.findBy({ id: In(ids) });
  }
}
```

#### Step 3: Repository Module

`modules/product/repository/product.repository.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [ProductRepository],
  exports: [ProductRepository],
})
export class ProductRepositoryModule {}
```

#### Step 4: DTOs

**Create DTO** (`dtos/create-product.dto.ts`):

```typescript
import { Field, InputType, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @Min(0)
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  categoryId?: number;
}
```

**Update DTO** (`dtos/update-product.dto.ts`):

```typescript
import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

@InputType()
export class UpdateProductInput {
  @Field(() => ID)
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @MaxLength(255)
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @Min(0)
  @IsNumber()
  @IsOptional()
  price?: number;
}
```

**Filter DTO** (`dtos/filter-product.dto.ts`):

```typescript
import { BaseFilterParamInput } from '@common/database/dtos/base-filter.dto';
import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class FilterProductInput extends BaseFilterParamInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  categoryId?: number;
}
```

#### Step 5: Types

`types/product.type.ts`

```typescript
import { PaginatedResponse } from '@common/response/types/paginated-response.type';
import { Product } from '../repository/entities/product.entity';

export const PaginatedProductResponse = PaginatedResponse(Product, 'Product');
```

#### Step 6: Service

`services/product.service.ts`

```typescript
import { ErrorFactory } from '@common/error/factories/error.factory';
import { IPaginatedResponse } from '@common/response/types/paginated-response.type';
import { Injectable } from '@nestjs/common';

import { CreateProductInput } from '../dtos/create-product.dto';
import { FilterProductInput } from '../dtos/filter-product.dto';
import { UpdateProductInput } from '../dtos/update-product.dto';
import { Product } from '../repository/entities/product.entity';
import { ProductRepository } from '../repository/repositories/product.repository';

@Injectable()
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async getList(params: FilterProductInput): Promise<IPaginatedResponse<Product>> {
    const [data, totalRecords] = await this.repository.getList(params);
    const limit = params.limit || 10;
    const page = params.page || 1;

    return {
      data,
      totalRecords,
      limit,
      page,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  async getById(id: string): Promise<Product> {
    const product = await this.repository.getById(id);
    if (!product) {
      throw ErrorFactory.notFound('Product', id);
    }
    return product;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const product = this.repository.create(input);
    return await this.repository.save(product);
  }

  async update(input: UpdateProductInput): Promise<Product> {
    const product = await this.getById(input.id);
    Object.assign(product, input);
    return await this.repository.save(product);
  }

  async delete(id: string): Promise<void> {
    const product = await this.getById(id);
    await this.repository.softDelete(product.id);
  }
}
```

#### Step 7: Resolver

`resolvers/product.resolver.ts`

```typescript
import { Auth } from '@auth/decorators/auth.jwt.decorator';
import { DataLoaders } from '@common/dataloader/dataloader.factory';
import { Category } from '@modules/category/repository/entities/category.entity';
import { Args, Context, ID, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { CreateProductInput } from '../dtos/create-product.dto';
import { FilterProductInput } from '../dtos/filter-product.dto';
import { UpdateProductInput } from '../dtos/update-product.dto';
import { Product } from '../repository/entities/product.entity';
import { ProductService } from '../services/product.service';
import { PaginatedProductResponse } from '../types/product.type';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly service: ProductService) {}

  // Field Resolvers - Use DataLoader for N+1 prevention
  @ResolveField(() => Category, { nullable: true })
  async category(
    @Parent() product: Product,
    @Context() ctx: { loaders: DataLoaders },
  ): Promise<Category | null> {
    if (product.category) return product.category;
    if (!product.categoryId) return null;
    return ctx.loaders.categories.load(product.categoryId);
  }

  // Queries
  @Query(() => PaginatedProductResponse, { description: 'Get paginated products' })
  @Auth({ permissions: 'product_manage_read' })
  async products(@Args('params') params: FilterProductInput) {
    return await this.service.getList(params);
  }

  @Query(() => Product, { description: 'Get product by ID' })
  @Auth({ permissions: 'product_manage_read' })
  async product(@Args('id', { type: () => ID }) id: string): Promise<Product> {
    return await this.service.getById(id);
  }

  // Mutations
  @Mutation(() => Product, { description: 'Create a new product' })
  @Auth({ permissions: 'product_manage_create' })
  async createProduct(@Args('input') input: CreateProductInput): Promise<Product> {
    return await this.service.create(input);
  }

  @Mutation(() => Product, { description: 'Update a product' })
  @Auth({ permissions: 'product_manage_update' })
  async updateProduct(@Args('input') input: UpdateProductInput): Promise<Product> {
    return await this.service.update(input);
  }

  @Mutation(() => Boolean, { description: 'Delete a product' })
  @Auth({ permissions: 'product_manage_delete' })
  async deleteProduct(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
```

#### Step 8: Module

`product.module.ts`

```typescript
import { Module } from '@nestjs/common';

import { ProductRepositoryModule } from './repository/product.repository.module';
import { ProductResolver } from './resolvers/product.resolver';
import { ProductService } from './services/product.service';

@Module({
  imports: [ProductRepositoryModule],
  providers: [ProductService, ProductResolver],
  exports: [ProductService],
})
export class ProductModule {}
```

#### Step 9: Register in ResolverModule

```typescript
// src/resolver/resolver.module.ts
@Module({
  imports: [
    // ... existing modules
    ProductModule,
  ],
})
export class ResolverModule {}
```

#### Step 10: Generate Migration

```bash
pnpm run build
pnpm run migration:generate --name=create-products-table
pnpm run migration:run
```

### Code Generation Checklist

- [ ] Entity extends `BaseUUIDEntity` with `@ObjectType()` decorator
- [ ] Repository extends TypeORM `Repository` with custom methods
- [ ] Repository module exports the repository
- [ ] Create DTO uses `@InputType()` (never `@ObjectType()`)
- [ ] Update DTO has ID field + all optional fields
- [ ] Filter DTO extends `BaseFilterParamInput`
- [ ] All `@Field()` decorators combined with validation decorators
- [ ] All strings have `@MaxLength(255)` unless specified
- [ ] Service uses `ErrorFactory` for all errors
- [ ] Service `getList()` returns `IPaginatedResponse<T>`
- [ ] Resolver uses `@Auth()` decorator with permissions
- [ ] Field resolvers use DataLoader from context
- [ ] PaginatedResponse type created in `types/` folder
- [ ] Module registered in `ResolverModule`
- [ ] DataLoader added to `dataloader.factory.ts` if needed
- [ ] Migration generated with `pnpm run migration:generate`

---

## Migration Workflow

```bash
# 1. Make entity changes in TypeScript
# 2. Build the project (required)
pnpm run build

# 3. Generate migration
pnpm run migration:generate --name=descriptive-name

# 4. Review generated migration
# 5. Test migration locally
pnpm run migration:run

# 6. If needed, revert and fix
pnpm run migration:revert
```

### Migration Naming Conventions

| Pattern | Usage |
|---------|-------|
| `create-table-name` | New table |
| `add-column-to-table` | New column |
| `update-table-name-constraints` | Constraint changes |
| `add-index-to-table-column` | New index |

---

## GraphQL Schema Evolution

1. **Never break existing queries/mutations** - Only add, never remove or rename
2. **Mark fields as deprecated** - Use `@deprecationReason` decorator
3. **Version breaking changes** - Create new types (e.g., `CreateUserInputV2`)
4. **Test schema generation** - Run `pnpm run start:dev` to verify
5. **Check schema.gql** - Review generated schema

---

## Code Quality Gates

Run before committing:

```bash
pnpm run lint      # Linting (auto-fix)
pnpm run format    # Format code
pnpm run build     # Type checking
pnpm run test      # All tests
```

### Pre-commit Hooks

Automatically run:
- ESLint with auto-fix
- Prettier formatting
- Commit message linting (conventional commits)

---

## Session Completion Checklist

When ending a work session, complete ALL steps:

1. **Run quality gates** (if code changed):
   ```bash
   pnpm run lint && pnpm run test && pnpm run build
   ```

2. **Verify GraphQL schema** (if schema changed):
   ```bash
   pnpm run start:dev  # Check src/schema.gql
   ```

3. **Update migrations** (if entities changed):
   ```bash
   pnpm run build
   pnpm run migration:generate --name=descriptive-name
   pnpm run migration:run
   ```

4. **PUSH TO REMOTE**:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```

**CRITICAL:** Work is NOT complete until `git push` succeeds.

---

## Troubleshooting

### GraphQL Schema Not Updating

```bash
rm src/schema.gql
pnpm run build
pnpm run start:dev
```

### Migration Errors

```bash
pnpm run migration:revert
pnpm run typeorm migration:show
pnpm run migration:create --name=manual-fix
```

### TypeScript Import Errors

```bash
pnpm run build
cat tsconfig.json | grep paths
```

### Foreign Key Column Issues

Check that both `@JoinColumn` and `@Column` have matching `name` properties in snake_case.

### Duplicate Columns in Migration

Ensure you're not mixing explicit and implicit column names. Be consistent.

---

## Configuration Files

| File | Purpose |
|------|---------|
| `src/configs/database.config.ts` | Database configuration |
| `src/configs/auth.config.ts` | Auth settings (JWT secrets, expiry) |
| `src/configs/cache.config.ts` | Redis configuration |
| `src/configs/smtp.config.ts` | Email configuration |
| `src/configs/app.config.ts` | General app settings |

### Environment Variables

**Required:**
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (optional)
- `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRE` (e.g., "15m")
- `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRE` (e.g., "7d")
- `SENTRY_DSN` (optional)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Module structure and patterns
- [CONVENTIONS.md](./CONVENTIONS.md) - Code generation rules
- [TESTING.md](./TESTING.md) - Testing patterns
