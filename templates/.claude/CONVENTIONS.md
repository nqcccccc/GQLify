# Conventions Guide

This document covers the coding conventions, naming standards, validation patterns, and anti-patterns for this NestJS GraphQL boilerplate.

---

## Table of Contents

1. [GraphQL Rules](#graphql-rules)
2. [Database Naming Conventions](#database-naming-conventions)
3. [Validation Patterns](#validation-patterns)
4. [Anti-Patterns](#anti-patterns)

---

## GraphQL Rules

### ALWAYS Do

| Rule | Description |
|------|-------------|
| Use `@InputType()` | For mutation/query arguments (never `@ObjectType()`) |
| Use `@Field()` | On all GraphQL properties |
| Combine decorators | `@Field()` with `class-validator` decorators |
| Extend `BaseFilterParamInput` | For list query filters |
| Create `PaginatedResponse` | For list queries (in `types/` folder) |
| Use DataLoader | In `@ResolveField()` for relational fields |
| Use `ErrorFactory` | For all errors (never throw raw exceptions) |
| Add `@MaxLength()` | On all string fields (255 unless specified) |
| Use `@Auth()` | Decorator for protected resolvers |
| Use `@IsEnumValue()` | For custom enum validation (not `@IsEnum()`) |

### NEVER Do

| Rule | Description |
|------|-------------|
| Use `@ObjectType()` for inputs | Only for output types |
| Forget `@Field()` | On GraphQL properties |
| Direct TypeORM injection | Always use custom repositories |
| Throw raw errors | No `new Error()`, `NotFoundException()`, `HttpException()` |
| Create REST controllers | Except health checks |
| Use `delete()` | Always use `softDelete()` for entities |
| Forget ResolverModule | Register all resolvers |
| Access DB in resolvers | Always go through service layer |

---

## Database Naming Conventions

This project uses `SnakeNamingStrategy` from `typeorm-naming-strategies` to automatically convert all table and column names from camelCase to snake_case.

### Basic Naming

| Entity Property | Database Column |
|----------------|----------------|
| `email` | `email` |
| `firstName` | `first_name` |
| `createdAt` | `created_at` |
| `isActive` | `is_active` |
| `roleId` (FK) | `role_id` |

### General Rules

- **Tables**: snake_case (e.g., `user_profiles`)
- **Columns**: snake_case (e.g., `created_at`, `first_name`)
- **TypeORM entities**: camelCase properties auto-convert
- **Foreign keys**: snake_case with `_id` suffix (e.g., `role_id`)
- **Indexes**: `idx_table_column` (e.g., `idx_users_email`)

### Foreign Key Columns

**IMPORTANT**: For foreign key relationships, **explicitly specify the column name** in both `@JoinColumn` and `@Column` decorators:

```typescript
// CORRECT - Explicit column names
@Entity()
export class User extends BaseUUIDEntity {
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: number;
}

// WRONG - Without explicit names
@Entity()
export class User extends BaseUUIDEntity {
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn()  // Will cause issues
  role: Role;

  @Column()  // TypeORM might create roleId instead of role_id
  roleId: number;
}
```

### Many-to-Many Join Table

```typescript
@Entity()
export class PermissionRole extends BaseEntity {
  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: number;

  @ManyToOne(() => Permission, (permission) => permission.permissionRoles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @Column({ name: 'permission_id' })
  permissionId: number;
}
```

### Why Explicit Names Are Required

1. **Consistency**: Ensures column name matches expectation
2. **TypeORM Behavior**: May not apply naming strategy to foreign keys
3. **Migration Safety**: Prevents migration issues
4. **Query Building**: Clear column names in raw queries

---

## Validation Patterns

### Standard Decorators

Always combine `@Field()` with validation decorators:

```typescript
// String fields
@Field()
@MaxLength(255)
@IsString()
@IsNotEmpty()
name: string;

// Optional string
@Field({ nullable: true })
@IsString()
@IsOptional()
description?: string;

// Email
@Field()
@IsEmail()
@MaxLength(255)
@IsNotEmpty()
email: string;

// Number with constraints
@Field()
@Min(0)
@Max(1000)
@IsNumber()
@IsNotEmpty()
quantity: number;

// Enum (custom enum validation)
@Field(() => EUserStatus)
@IsEnumValue(EUserStatus)
status: EUserStatus;

// Boolean
@Field()
@IsBoolean()
isActive: boolean;

// Array
@Field(() => [String])
@IsArray()
@IsString({ each: true })
tags: string[];

// Nested object
@Field(() => AddressInput)
@ValidateNested()
@Type(() => AddressInput)
address: AddressInput;

// UUID
@Field(() => ID)
@IsUUID()
@IsNotEmpty()
id: string;
```

### DTO Patterns

**Create DTO**: All required fields + optional fields

```typescript
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
}
```

**Update DTO**: ID field + all fields as optional

```typescript
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
}
```

**Filter DTO**: Extend `BaseFilterParamInput` + add custom filters

```typescript
@InputType()
export class FilterProductInput extends BaseFilterParamInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  categoryId?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Min(0)
  @IsNumber()
  minPrice?: number;
}
```

---

## Anti-Patterns

### GraphQL Anti-Patterns

**Using @ObjectType() for inputs**

```typescript
// WRONG
@ObjectType()
export class CreateUserInput { ... }

// CORRECT
@InputType()
export class CreateUserInput { ... }
```

**Forgetting @Field()**

```typescript
// WRONG - Not exposed in GraphQL
@InputType()
export class CreateUserInput {
  @IsString()
  name: string;
}

// CORRECT
@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  name: string;
}
```

**N+1 queries in field resolvers**

```typescript
// WRONG - N+1 queries
@ResolveField(() => Role)
async role(@Parent() user: User): Promise<Role> {
  return this.roleRepository.findOne({ where: { id: user.roleId } });
}

// CORRECT - Uses DataLoader
@ResolveField(() => Role)
async role(
  @Parent() user: User,
  @Context() ctx: { loaders: DataLoaders },
): Promise<Role> {
  return ctx.loaders.roles.load(user.roleId);
}
```

### Error Handling Anti-Patterns

**Throwing raw errors**

```typescript
// WRONG
throw new Error('User not found');
throw new NotFoundException('User not found');
throw new HttpException('Error', 400);

// CORRECT
throw ErrorFactory.notFound('User', userId);
```

**Missing context in errors**

```typescript
// WRONG - Missing context
throw ErrorFactory.business('INSUFFICIENT_BALANCE', 'Not enough balance');

// CORRECT - Rich context
throw ErrorFactory.business(
  'INSUFFICIENT_BALANCE',
  'Insufficient balance for transaction',
  { required: 100.00, available: 50.00, userId: user.id }
);
```

### Database Anti-Patterns

**Using hard delete**

```typescript
// WRONG
await this.repository.delete(id);

// CORRECT
await this.repository.softDelete(id);
```

**Direct repository injection**

```typescript
// WRONG
@InjectRepository(User)
private userRepository: Repository<User>;

// CORRECT - Custom repository
private userRepository: UserRepository;
```

**SQL injection vulnerability**

```typescript
// WRONG - SQL Injection risk
.where(`user.id = '${userId}'`)
.where(`name LIKE '%${search}%'`)

// CORRECT - Parameterized
.where('user.id = :userId', { userId })
.where('name LIKE :search', { search: `%${search}%` })
```

### Validation Anti-Patterns

**Missing MaxLength on strings**

```typescript
// WRONG - May cause database errors
@Field()
@IsString()
name: string;

// CORRECT
@Field()
@MaxLength(255)
@IsString()
name: string;
```

**Using @IsEnum() for custom enums**

```typescript
// WRONG - Doesn't work with GraphQL enums properly
@Field(() => EUserStatus)
@IsEnum(EUserStatus)
status: EUserStatus;

// CORRECT
@Field(() => EUserStatus)
@IsEnumValue(EUserStatus)
status: EUserStatus;
```

### Architecture Anti-Patterns

**Accessing database in resolvers**

```typescript
// WRONG
@Query(() => User)
async user(@Args('id') id: string) {
  return this.userRepository.findOne({ where: { id } });
}

// CORRECT - Through service layer
@Query(() => User)
async user(@Args('id') id: string) {
  return this.userService.getById(id);
}
```

**Missing @Auth() decorator**

```typescript
// WRONG - Unprotected endpoint
@Query(() => [User])
async users() { ... }

// CORRECT
@Auth({ permissions: 'user_manage_read' })
@Query(() => [User])
async users() { ... }
```

**Returning unpaginated lists**

```typescript
// WRONG - No pagination
@Query(() => [User])
async users(): Promise<User[]> {}

// CORRECT - Paginated
@Query(() => PaginatedUserResponse)
async users(@Args('params') params: FilterUserInput): Promise<IPaginatedResponse<User>> {}
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Module structure and patterns
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [TESTING.md](./TESTING.md) - Testing patterns
