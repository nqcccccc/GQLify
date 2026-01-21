---
name: gqlify:generate-module
description: Generate a complete GraphQL module following DEVELOPMENT.md patterns. Creates entity, repository, DTOs, service, resolver, and types with proper validation, authentication, and DataLoader support. Automatically registers module and generates migration.
argument-hint: <EntityName> [--skip-migration] [--skip-tests]
disable-model-invocation: true
---

You are a GQLify module generator. Your task is to create a complete, production-ready GraphQL module following the exact architectural patterns defined in DEVELOPMENT.md.

## Task

Generate a full GraphQL module for the entity specified in $ARGUMENTS.

## Arguments

Parse $ARGUMENTS:
- First argument (required): Entity name in PascalCase (e.g., `Product`, `Category`, `Order`)
- `--skip-migration`: Skip migration generation
- `--skip-tests`: Skip test file generation
- `--skip-validation`: Skip quality checks after generation

## Prerequisites

1. **Read DEVELOPMENT.md**
   - Load "Creating a New GraphQL Module" section
   - Understand all patterns and conventions
   - Use as authoritative reference for code generation

2. **Validate Entity Name**
   - Must be PascalCase (e.g., Product, not product or PRODUCT)
   - Must not conflict with existing modules
   - Check if `src/modules/<entity-lower>` already exists

## Interactive Field Definition

Before generating files, prompt the user for entity structure:

```
Generating module: <EntityName>

Define entity fields (press Enter when done):

Field 1:
  Name (camelCase):
  Type (string|number|boolean|text|date|enum):
  Required (y/n):
  Unique (y/n):

Field 2:
  ...

Define relations (press Enter to skip):

Relation 1:
  Field name (camelCase):
  Related entity (PascalCase):
  Type (many-to-one|one-to-many):
  Nullable (y/n):
```

## File Generation Order

### 1. Entity (`modules/<entity-lower>/repository/entities/<entity-lower>.entity.ts`)

Pattern from DEVELOPMENT.md:
```typescript
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity } from 'typeorm';
import { BaseUUIDEntity } from '@common/database/entities/base-uuid.entity';

@ObjectType()
@Entity('<table_name>')  // snake_case
export class <Entity> extends BaseUUIDEntity {
  @Field()
  @Column({ length: 255 })
  <fieldName>: string;

  @Field(() => ID, { nullable: true })
  @Column({ nullable: true })
  <foreignKey>Id?: number;

  // Relations (lazy-loaded via DataLoader)
  <relationField>?: <RelatedEntity>;
}
```

Key rules:
- Extend `BaseUUIDEntity`
- Use `@ObjectType()` decorator
- Table name in snake_case
- All strings: `{ length: 255 }`
- Foreign keys: camelCase in code
- Relations: Not stored in DB, loaded via DataLoader

### 2. Repository (`modules/<entity-lower>/repository/repositories/<entity-lower>.repository.ts`)

Pattern:
```typescript
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { <Entity> } from '../entities/<entity-lower>.entity';
import { Filter<Entity>Input } from '../../dtos/filter-<entity-lower>.dto';
import { IPaginatedResponse } from '@common/types/paginated-response.interface';
import { applyQueryPaging, applyQuerySorting } from '@common/database/helpers/query.helper';

@Injectable()
export class <Entity>Repository extends Repository<<Entity>> {
  constructor(private dataSource: DataSource) {
    super(<Entity>, dataSource.createEntityManager());
  }

  async getList(params: Filter<Entity>Input): Promise<IPaginatedResponse<<Entity>>> {
    const query = this.createQueryBuilder('<entity-lower>');

    // Apply filters
    if (params.search) {
      query.andWhere('<entity-lower>.name LIKE :search', { search: `%${params.search}%` });
    }

    // Apply pagination and sorting
    applyQuerySorting(query, params, '<entity-lower>');
    return applyQueryPaging(query, params);
  }

  async getById(id: string): Promise<<Entity> | null> {
    return this.findOne({ where: { id } });
  }

  async getByIds(ids: string[]): Promise<<Entity>[]> {
    return this.findBy({ id: In(ids) });
  }
}
```

### 3. Repository Module (`modules/<entity-lower>/repository/<entity-lower>.repository.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { <Entity> } from './entities/<entity-lower>.entity';
import { <Entity>Repository } from './repositories/<entity-lower>.repository';

@Module({
  imports: [TypeOrmModule.forFeature([<Entity>])],
  providers: [<Entity>Repository],
  exports: [<Entity>Repository],
})
export class <Entity>RepositoryModule {}
```

### 4. DTOs

**Create DTO** (`modules/<entity-lower>/dtos/create-<entity-lower>.dto.ts`):
```typescript
import { Field, InputType, ID } from '@nestjs/graphql';
import { IsString, MaxLength, IsOptional, IsNumber } from 'class-validator';

@InputType()
export class Create<Entity>Input {
  @Field()
  @MaxLength(255)
  @IsString()
  <fieldName>: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsNumber()
  <foreignKey>Id?: number;
}
```

**Update DTO** (`modules/<entity-lower>/dtos/update-<entity-lower>.dto.ts`):
```typescript
@InputType()
export class Update<Entity>Input {
  @Field(() => ID)
  @IsString()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(255)
  @IsString()
  <fieldName>?: string;
}
```

**Filter DTO** (`modules/<entity-lower>/dtos/filter-<entity-lower>.dto.ts`):
```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { BaseFilterParamInput } from '@common/dtos/base-filter-param.dto';

@InputType()
export class Filter<Entity>Input extends BaseFilterParamInput {
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(255)
  @IsString()
  search?: string;
}
```

### 5. Types (`modules/<entity-lower>/types/<entity-lower>.type.ts`)

```typescript
import { PaginatedResponse } from '@common/types/paginated-response.type';
import { <Entity> } from '../repository/entities/<entity-lower>.entity';

export const Paginated<Entity>Response = PaginatedResponse(<Entity>, '<Entity>');
```

### 6. Service (`modules/<entity-lower>/services/<entity-lower>.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { <Entity>Repository } from '../repository/repositories/<entity-lower>.repository';
import { Create<Entity>Input } from '../dtos/create-<entity-lower>.dto';
import { Update<Entity>Input } from '../dtos/update-<entity-lower>.dto';
import { Filter<Entity>Input } from '../dtos/filter-<entity-lower>.dto';
import { ErrorFactory } from '@common/error/error.factory';
import { IPaginatedResponse } from '@common/types/paginated-response.interface';
import { <Entity> } from '../repository/entities/<entity-lower>.entity';

@Injectable()
export class <Entity>Service {
  constructor(private readonly repository: <Entity>Repository) {}

  async getList(params: Filter<Entity>Input): Promise<IPaginatedResponse<<Entity>>> {
    return this.repository.getList(params);
  }

  async getById(id: string): Promise<<Entity>> {
    const entity = await this.repository.getById(id);

    if (!entity) {
      throw ErrorFactory.notFound('<Entity>', id);
    }

    return entity;
  }

  async create(input: Create<Entity>Input): Promise<<Entity>> {
    const entity = this.repository.create(input);
    return this.repository.save(entity);
  }

  async update(input: Update<Entity>Input): Promise<<Entity>> {
    const entity = await this.getById(input.id);

    Object.assign(entity, input);

    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.getById(id);

    await this.repository.softDelete(id);

    return true;
  }
}
```

### 7. Resolver (`modules/<entity-lower>/resolvers/<entity-lower>.resolver.ts`)

```typescript
import { Args, Context, ID, Mutation, Query, ResolveField, Resolver, Parent } from '@nestjs/graphql';
import { <Entity> } from '../repository/entities/<entity-lower>.entity';
import { <Entity>Service } from '../services/<entity-lower>.service';
import { Create<Entity>Input } from '../dtos/create-<entity-lower>.dto';
import { Update<Entity>Input } from '../dtos/update-<entity-lower>.dto';
import { Filter<Entity>Input } from '../dtos/filter-<entity-lower>.dto';
import { Paginated<Entity>Response } from '../types/<entity-lower>.type';
import { Auth } from '@common/decorators/auth.decorator';
import { IPaginatedResponse } from '@common/types/paginated-response.interface';
import { DataLoaders } from '@common/dataloader/dataloader.factory';

@Resolver(() => <Entity>)
export class <Entity>Resolver {
  constructor(private readonly service: <Entity>Service) {}

  // Queries
  @Query(() => Paginated<Entity>Response, { description: 'Get paginated list of <entities>' })
  @Auth({ permissions: '<entity-lower>_manage_read' })
  async <entities>(@Args('params') params: Filter<Entity>Input): Promise<IPaginatedResponse<<Entity>>> {
    return this.service.getList(params);
  }

  @Query(() => <Entity>, { description: 'Get <entity> by ID' })
  @Auth({ permissions: '<entity-lower>_manage_read' })
  async <entity>(@Args('id', { type: () => ID }) id: string): Promise<<Entity>> {
    return this.service.getById(id);
  }

  // Mutations
  @Mutation(() => <Entity>, { description: 'Create new <entity>' })
  @Auth({ permissions: '<entity-lower>_manage_create' })
  async create<Entity>(@Args('input') input: Create<Entity>Input): Promise<<Entity>> {
    return this.service.create(input);
  }

  @Mutation(() => <Entity>, { description: 'Update <entity>' })
  @Auth({ permissions: '<entity-lower>_manage_update' })
  async update<Entity>(@Args('input') input: Update<Entity>Input): Promise<<Entity>> {
    return this.service.update(input);
  }

  @Mutation(() => Boolean, { description: 'Delete <entity>' })
  @Auth({ permissions: '<entity-lower>_manage_delete' })
  async delete<Entity>(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.service.delete(id);
  }

  // Field Resolvers (for relations)
  // Add @ResolveField() methods here for each relation
}
```

### 8. Module (`modules/<entity-lower>/<entity-lower>.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { <Entity>RepositoryModule } from './repository/<entity-lower>.repository.module';
import { <Entity>Service } from './services/<entity-lower>.service';
import { <Entity>Resolver } from './resolvers/<entity-lower>.resolver';

@Module({
  imports: [<Entity>RepositoryModule],
  providers: [<Entity>Service, <Entity>Resolver],
  exports: [<Entity>Service],
})
export class <Entity>Module {}
```

## Post-Generation Steps

### 1. Register Module in ResolverModule

Update `src/resolver/resolver.module.ts`:
```typescript
import { <Entity>Module } from '@modules/<entity-lower>/<entity-lower>.module';

@Module({
  imports: [
    // ... existing modules
    <Entity>Module,
  ],
})
export class ResolverModule {}
```

### 2. Generate Migration (unless --skip-migration)

```bash
pnpm run build
pnpm run migration:generate --name=create-<entity-lower>-table
```

### 3. Run Quality Checks (unless --skip-validation)

```bash
pnpm run lint
pnpm run build
```

## Output Report

```
=================================================================
MODULE GENERATION COMPLETE
=================================================================

Entity: <Entity>
Table: <table_name>

Files Created:
  ✓ modules/<entity-lower>/repository/entities/<entity-lower>.entity.ts
  ✓ modules/<entity-lower>/repository/repositories/<entity-lower>.repository.ts
  ✓ modules/<entity-lower>/repository/<entity-lower>.repository.module.ts
  ✓ modules/<entity-lower>/dtos/create-<entity-lower>.dto.ts
  ✓ modules/<entity-lower>/dtos/update-<entity-lower>.dto.ts
  ✓ modules/<entity-lower>/dtos/filter-<entity-lower>.dto.ts
  ✓ modules/<entity-lower>/types/<entity-lower>.type.ts
  ✓ modules/<entity-lower>/services/<entity-lower>.service.ts
  ✓ modules/<entity-lower>/resolvers/<entity-lower>.resolver.ts
  ✓ modules/<entity-lower>/<entity-lower>.module.ts

Files Modified:
  ✓ src/resolver/resolver.module.ts

Migration:
  ✓ src/common/database/migrations/<timestamp>-create-<entity-lower>-table.ts

Validation:
  ✓ Build: Success
  ✓ Lint: Passed

GraphQL Schema:
  Queries:
    - <entities>(params: Filter<Entity>Input): Paginated<Entity>Response
    - <entity>(id: ID!): <Entity>

  Mutations:
    - create<Entity>(input: Create<Entity>Input!): <Entity>
    - update<Entity>(input: Update<Entity>Input!): <Entity>
    - delete<Entity>(id: ID!): Boolean

Permissions Required:
  - <entity-lower>_manage_read
  - <entity-lower>_manage_create
  - <entity-lower>_manage_update
  - <entity-lower>_manage_delete

Next Steps:
  1. Run migration: pnpm run migration:run
  2. Add to permission seed data
  3. If entity has relations, add DataLoaders
  4. Write unit tests for service
  5. Write e2e tests for resolver
  6. Test in GraphQL playground

=================================================================
```

## Usage Examples

Generate basic module:
```
/gqlify:generate-module Product
```

Generate module without migration:
```
/gqlify:generate-module Category --skip-migration
```

Generate module without validation:
```
/gqlify:generate-module Order --skip-validation
```

## Notes

- This command modifies files and creates new ones
- Always review generated code before committing
- Ensure DEVELOPMENT.md is up-to-date before running
- For adding fields later, use /gqlify:add-field
- For adding relations, add DataLoader with /gqlify:generate-field
- Run /gqlify:validate after generation to ensure compliance
