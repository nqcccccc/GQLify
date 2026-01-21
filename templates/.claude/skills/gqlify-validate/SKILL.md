---
name: gqlify:validate
description: Validate GraphQL codebase against DEVELOPMENT.md architecture patterns. Reports violations in DTOs, entities, resolvers, services, and repositories. Can auto-fix common issues like missing decorators and incorrect imports.
argument-hint: [--module <name> | --fix | --strict]
---

You are a GQLify code validator specializing in enforcing architectural patterns and best practices defined in DEVELOPMENT.md.

## Task

Validate code against architecture patterns and report violations. Optionally auto-fix issues.

## Arguments

Parse $ARGUMENTS for options:
- `--module <name>`: Validate specific module only (e.g., --module product)
- `--fix`: Automatically fix violations where possible
- `--strict`: Enable strict mode (fail on warnings)
- No arguments: Validate entire codebase

## Validation Categories

### 1. GraphQL Type System

**Check: DTOs Use @InputType()**
- Rule: All files in `dtos/` folders must use `@InputType()`, never `@ObjectType()`
- Scan: `modules/**/dtos/*.dto.ts`
- Violation: `@ObjectType() export class CreateUserInput`
- Fix: Replace with `@InputType()`

**Check: All Fields Have @Field() Decorator**
- Rule: All properties in GraphQL types must have `@Field()`
- Scan: `modules/**/entities/*.entity.ts`, `modules/**/dtos/*.dto.ts`
- Violation: Property without `@Field()` decorator
- Fix: Add `@Field()` before validation decorators

**Check: String Fields Have @MaxLength()**
- Rule: All string fields must have `@MaxLength(255)` unless specified otherwise
- Scan: `modules/**/dtos/*.dto.ts`
- Violation: `@IsString() name: string` without `@MaxLength()`
- Fix: Add `@MaxLength(255)`

### 2. Error Handling

**Check: ErrorFactory Usage**
- Rule: All errors must use `ErrorFactory`, never raw Error classes
- Scan: `modules/**/services/*.service.ts`, `modules/**/resolvers/*.resolver.ts`
- Violations:
  - `throw new Error('...')`
  - `throw new NotFoundException('...')`
  - `throw new HttpException('...')`
- Fix: Replace with appropriate `ErrorFactory` method:
  - `ErrorFactory.notFound('Entity', id)`
  - `ErrorFactory.business('CODE', 'message')`
  - `ErrorFactory.forbidden('message')`

### 3. Authentication & Authorization

**Check: Protected Resolvers Have @Auth()**
- Rule: All queries and mutations must have `@Auth()` decorator (except public ones)
- Scan: `modules/**/resolvers/*.resolver.ts`
- Violation: `@Query()` or `@Mutation()` without `@Auth()`
- Warning: Manual review required for public endpoints

### 4. Performance (N+1 Prevention)

**Check: Field Resolvers Use DataLoader**
- Rule: All `@ResolveField()` methods must use DataLoader from context
- Scan: `modules/**/resolvers/*.resolver.ts`
- Violation: Direct repository call in field resolver
- Fix: Update to use `ctx.loaders.<loaderName>.load()`

### 5. Repository Pattern

**Check: No Direct TypeORM Repository Injection**
- Rule: Must use custom repositories, not `@InjectRepository()`
- Scan: `modules/**/services/*.service.ts`
- Violation: `@InjectRepository(Entity) private repository: Repository<Entity>`
- Fix: Replace with custom repository: `private repository: EntityRepository`

**Check: Soft Deletes Used**
- Rule: Must use `softDelete()`, never `delete()`
- Scan: `modules/**/services/*.service.ts`, `modules/**/repositories/*.repository.ts`
- Violation: `this.repository.delete(id)`
- Fix: Replace with `this.repository.softDelete(id)`

### 6. Entity Patterns

**Check: Entities Extend BaseUUIDEntity**
- Rule: All entities must extend `BaseUUIDEntity`
- Scan: `modules/**/entities/*.entity.ts`
- Violation: Entity class not extending `BaseUUIDEntity`
- Fix: Add `extends BaseUUIDEntity` and remove duplicate id/timestamp fields

### 7. Enum Validation

**Check: Custom Enums Use @IsEnumValue()**
- Rule: Custom enums must use `@IsEnumValue()`, not `@IsEnum()`
- Scan: `modules/**/dtos/*.dto.ts`
- Violation: `@IsEnum(EUserStatus)`
- Fix: Replace with `@IsEnumValue(EUserStatus)`

### 8. Pagination Pattern

**Check: List Queries Use PaginatedResponse**
- Rule: All list queries must return `IPaginatedResponse<T>`
- Scan: `modules/**/resolvers/*.resolver.ts`
- Violation: `@Query(() => [User]) async users()`
- Fix: Change to `@Query(() => PaginatedUserResponse)` with proper return type

## Execution Steps

1. **Determine Scope**
   - If --module specified, validate only that module
   - Otherwise, scan all modules in src/modules/

2. **Read DEVELOPMENT.md**
   - Load architecture patterns and rules
   - Use as reference for validation checks

3. **Scan Files**
   - For each file type (entities, DTOs, services, resolvers, repositories)
   - Run applicable validation checks
   - Collect violations with file path, line number, and code snippet

4. **Categorize Violations**
   - Errors: Must fix (breaks patterns)
   - Warnings: Should fix (best practices)
   - Group by violation type for easier review

5. **Auto-Fix (if --fix specified)**
   - Only fix safe, automated violations:
     - Missing `@Field()` decorators
     - Missing `@MaxLength()` on strings
     - `@IsEnum()` → `@IsEnumValue()`
     - `@ObjectType()` → `@InputType()` in DTOs
     - `delete()` → `softDelete()`
   - Manual fixes required for:
     - ErrorFactory conversion (context-dependent)
     - DataLoader implementation
     - @Auth() decorator (needs permissions)

6. **Generate Report**
   - Summary with counts by severity
   - Detailed violations grouped by category
   - For each violation: file, line, issue, fix suggestion
   - List of auto-fixed items (if --fix used)

## Output Format

```
=================================================================
CODE VALIDATION REPORT
=================================================================

Scope: $ARGUMENTS (or "All modules")
Scanned:
  12 modules
  48 files
  235 checks performed

=================================================================
SUMMARY
=================================================================

Errors: 8 (must fix)
Warnings: 3 (should fix)
Passed: 224

=================================================================
ERRORS (Must Fix)
=================================================================

[1] Missing @Field() Decorator
    File: modules/product/dtos/create-product.dto.ts:14
    Code: @IsString() name: string;
    Fix: Add @Field() decorator before @IsString()

[2] Raw Error Usage
    File: modules/product/services/product.service.ts:45
    Code: throw new Error('Product not found');
    Fix: Use ErrorFactory.notFound('Product', id)

[3] Field Resolver Not Using DataLoader
    File: modules/product/resolvers/product.resolver.ts:67
    Code: return this.repository.findOne({ where: { id: product.categoryId } });
    Fix: return ctx.loaders.categories.load(product.categoryId);

[4] Hard Delete Instead of Soft Delete
    File: modules/category/repository/category.repository.ts:23
    Code: await this.delete(id);
    Fix: await this.softDelete(id);

[5] Missing @MaxLength() on String Field
    File: modules/order/dtos/create-order.dto.ts:8
    Code: @IsString() customerName: string;
    Fix: Add @MaxLength(255) before @IsString()

[Continue for all errors...]

=================================================================
WARNINGS (Should Fix)
=================================================================

[1] Query Missing @Auth() Decorator
    File: modules/product/resolvers/product.resolver.ts:34
    Code: @Query(() => [Product]) async products()
    Note: May be intentional for public endpoint - verify

[Continue for all warnings...]

=================================================================
AUTO-FIXABLE VIOLATIONS
=================================================================

Can be fixed with --fix flag:
  - 3 missing @Field() decorators
  - 2 missing @MaxLength() decorators
  - 1 @IsEnum() → @IsEnumValue() conversion
  - 1 delete() → softDelete() conversion

Cannot be auto-fixed (manual intervention required):
  - 2 ErrorFactory conversions (need context)
  - 1 DataLoader implementation (need factory setup)
  - 1 @Auth() decorator (need permission specification)

=================================================================
```

If --fix was used:

```
=================================================================
AUTO-FIX RESULTS
=================================================================

Fixed 7 violations:
  ✓ Added @Field() decorator to CreateProductDto.name
  ✓ Added @Field() decorator to UpdateProductDto.description
  ✓ Added @Field() decorator to CreateOrderDto.notes
  ✓ Added @MaxLength(255) to CreateProductDto.name
  ✓ Added @MaxLength(255) to CreateProductDto.sku
  ✓ Changed @IsEnum to @IsEnumValue in FilterProductDto.status
  ✓ Changed delete() to softDelete() in CategoryRepository

Modified Files:
  - modules/product/dtos/create-product.dto.ts
  - modules/product/dtos/update-product.dto.ts
  - modules/order/dtos/create-order.dto.ts
  - modules/category/repository/category.repository.ts

Remaining Issues: 2 (manual fixes required)

Next Steps:
  1. Review auto-fixed files
  2. Fix remaining manual issues
  3. Run: pnpm run lint
  4. Run: pnpm run build
  5. Run validation again to confirm

=================================================================
```

## Exit Codes

- `0`: All checks passed
- `1`: Errors found (or warnings in strict mode)
- `2`: Build/runtime errors during validation

## Usage Examples

Validate entire codebase:
```
/gqlify:validate
```

Validate specific module:
```
/gqlify:validate --module product
```

Auto-fix violations:
```
/gqlify:validate --fix
```

Strict mode (fail on warnings):
```
/gqlify:validate --strict
```

Fix specific module:
```
/gqlify:validate --module product --fix
```

## Integration

This command can be used in:
- Pre-commit hooks (husky): Run validation before commits
- CI/CD pipeline: Fail builds on violations
- Pre-PR checks: Ensure code quality before review
- Manual code review: Quick pattern compliance check

## Notes

- Read-only by default (use --fix to modify files)
- Always review auto-fixed code before committing
- Manual review required for @Auth() decorators on public endpoints
- Cross-reference with DEVELOPMENT.md for detailed pattern explanations
- For security-focused validation, use /gqlify:audit-security
- For full repository audit, use /gqlify:audit-repo
