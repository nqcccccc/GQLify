---
name: gqlify:add-filter
description: Add advanced filtering capabilities to a module's list query. Supports simple filters, multi-field OR searches, IN operator for arrays, and join-based filtering on relations.
argument-hint: <Module> <FilterName> <FilterType> [--multi-field] [--join]
disable-model-invocation: true
---

You are a GQLify filtering specialist. Your task is to add advanced filtering capability to the module specified in `$ARGUMENTS`.

## Task

Add filtering capability to **$ARGUMENTS** module that supports complex query patterns including multi-field searches, array filters, and relation-based filtering.

## Command Format

```
$ARGUMENTS = <Module> <FilterName> <FilterType> [options]
```

Examples:
- `User search string --multi-field` (search across email and username)
- `User roles string[] --join` (filter by role slugs with join)
- `Product minPrice number` (simple price filter)

## Filter Types Supported

1. **Simple Field Filter** - Direct field comparison
2. **Multi-Field OR Search** - Search across multiple fields with OR condition
3. **Array IN Filter** - Filter using IN operator for arrays
4. **Join-Based Filter** - Filter based on related entity fields

## Execution Steps

### Step 1: Analyze Current Filter DTO

Read the existing filter DTO:
- `src/modules/<module-lower>/dtos/filter-<module>.dto.ts`

Examine what filters already exist and the base structure.

### Step 2: Update Filter DTO

Add the new filter field to `Filter<Module>Input`:

#### Pattern 1: Simple Field Filter

```typescript
@InputType()
export class Filter<Module>Input extends BaseFilterParamInput {
  // ... existing filters

  @Field({ nullable: true, description: '<Description of filter>' })
  @IsOptional()
  @IsNumber() // or @IsString(), @IsBoolean(), etc.
  @Min(0) // Add constraints as needed
  <filterName>?: <FilterType>;
}
```

#### Pattern 2: Multi-Field OR Search

```typescript
@InputType()
export class Filter<Module>Input extends BaseFilterParamInput {
  // ... existing filters

  @Field({ nullable: true, description: 'Search across multiple fields (name, email, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
```

#### Pattern 3: Array IN Filter

```typescript
@InputType()
export class Filter<Module>Input extends BaseFilterParamInput {
  // ... existing filters

  @Field(() => [String], { nullable: true, description: 'Filter by <relation> slugs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  <filterName>?: string[];
}
```

#### Pattern 4: Enum Filter

```typescript
import { <EnumType> } from '../constants/<module>.enum';

@InputType()
export class Filter<Module>Input extends BaseFilterParamInput {
  // ... existing filters

  @Field(() => Int, { nullable: true, description: 'Filter by status' })
  @IsOptional()
  @IsEnumValue(<EnumType>)
  status?: <EnumType>;
}
```

### Step 3: Update Repository Query Logic

Modify the repository's `_applyQueryBase()` or `getList()` method:

#### Pattern 1: Simple Field Filter

```typescript
private _applyQueryBase(
  params: Filter<Module>Input,
  query: SelectQueryBuilder<<Module>>,
): void {
  const { filter, <filterName>, /* other filters */ } = params;

  // Existing filters...

  // Add new simple filter
  if (<filterName> !== undefined) {
    query.andWhere('<module>.<field> >= :<filterName>', { <filterName> });
    // Use operators: =, >=, <=, >, <, !=, LIKE, etc.
  }
}
```

#### Pattern 2: Multi-Field OR Search

```typescript
private _applyQueryBase(
  params: Filter<Module>Input,
  query: SelectQueryBuilder<<Module>>,
): void {
  const { search } = params;

  if (search) {
    query.andWhere(
      '(<module>.<field1> ILIKE :search OR <module>.<field2> ILIKE :search OR <module>.<field3> ILIKE :search)',
      { search: `%${search}%` }
    );
  }
}
```

**Real-world example from boilerplate:**
```typescript
if (filter) {
  query.andWhere(
    '(user.email LIKE :filter OR user.username LIKE :filter)',
    { filter: `%${filter}%` }
  );
}
```

**Key points:**
- Wrap multiple conditions in parentheses
- Use `ILIKE` for case-insensitive search (PostgreSQL)
- Use `LIKE` for case-sensitive or MySQL
- Use parameter binding (`:search`) to prevent SQL injection

#### Pattern 3: Array IN Filter (with Join)

```typescript
async getList(params: Filter<Module>Input): Promise<[<Module>[], number]> {
  const query = this.createQueryBuilder('<module>');

  // Join relation if filtering by it
  if (params.<filterName>?.length) {
    query.innerJoin('<module>.<relation>', '<relation>');
  }

  this._applyQueryBase(params, query);

  // ... rest of query
}

private _applyQueryBase(
  params: Filter<Module>Input,
  query: SelectQueryBuilder<<Module>>,
): void {
  const { <filterName> } = params;

  if (<filterName>?.length) {
    query.andWhere('<relation>.<field> IN (:...<filterName>)', { <filterName> });
  }
}
```

**Real-world example from boilerplate:**
```typescript
// In getList()
if (params.roles?.length) {
  query.innerJoin('user.role', 'role');
}

// In _applyQueryBase()
if (roles?.length) {
  query.andWhere('role.slug IN(:...roles)', { roles });
}
```

**Key points:**
- Join the relation table first (in `getList()`)
- Use `innerJoin` if filtering (must have relation)
- Use `IN(:...paramName)` for array parameters
- The `...` spreads the array values

#### Pattern 4: Enum Filter

```typescript
private _applyQueryBase(
  params: Filter<Module>Input,
  query: SelectQueryBuilder<<Module>>,
): void {
  const { status } = params;

  if (status && !isNaN(status)) {
    query.andWhere('<module>.status = :status', { status: +status });
  }
}
```

**Real-world example from boilerplate:**
```typescript
if (status && !isNaN(status)) {
  query.andWhere('user.status = :status', { status: +status });
}
```

#### Pattern 5: Date Range Filter

```typescript
private _applyQueryBase(
  params: Filter<Module>Input,
  query: SelectQueryBuilder<<Module>>,
): void {
  const { startDate, endDate } = params;

  if (startDate) {
    query.andWhere('<module>.created_at >= :startDate', { startDate });
  }

  if (endDate) {
    query.andWhere('<module>.created_at <= :endDate', { endDate });
  }
}
```

### Step 4: Complex Filter Combinations

For advanced scenarios with multiple conditions:

```typescript
private _applyQueryBase(
  params: Filter<Module>Input,
  query: SelectQueryBuilder<<Module>>,
): void {
  const { search, status, roles, minPrice, maxPrice } = params;

  // Multi-field search
  if (search) {
    query.andWhere(
      '(<module>.name ILIKE :search OR <module>.description ILIKE :search)',
      { search: `%${search}%` }
    );
  }

  // Enum filter
  if (status && !isNaN(status)) {
    query.andWhere('<module>.status = :status', { status: +status });
  }

  // Array IN filter (requires join)
  if (roles?.length) {
    query.andWhere('role.slug IN(:...roles)', { roles });
  }

  // Range filters
  if (minPrice !== undefined) {
    query.andWhere('<module>.price >= :minPrice', { minPrice });
  }

  if (maxPrice !== undefined) {
    query.andWhere('<module>.price <= :maxPrice', { maxPrice });
  }
}
```

### Step 5: Handle Join Efficiency

Optimize joins for filtering:

```typescript
async getList(params: Filter<Module>Input): Promise<[<Module>[], number]> {
  const query = this.createQueryBuilder('<module>');

  // Only join if filtering by relation
  // Avoid duplicate joins
  if (params.<filterName>?.length) {
    query.innerJoin('<module>.<relation>', '<relation>');
  }

  this._applyQueryBase(params, query);

  // Don't select relation data unless needed
  // DataLoader will fetch it on-demand
  return await query.getManyAndCount();
}
```

**Key principle:** Join only for filtering, not for data loading. Use DataLoader for data.

### Step 6: Validation

After implementation, verify:

- [ ] Filter field added to DTO with proper decorators
- [ ] Field has appropriate validation (@IsOptional, type validators, constraints)
- [ ] Repository applies filter correctly
- [ ] SQL query uses parameterized queries (no string interpolation)
- [ ] Joins are added only when needed
- [ ] Multi-field OR searches use proper parentheses
- [ ] Array filters use IN operator correctly
- [ ] No TypeScript errors
- [ ] Build succeeds: `pnpm run build`

### Step 7: Testing

Test the filter with various queries:

#### Test 1: Simple Filter
```graphql
query {
  <modules>(params: {
    <filterName>: <value>
    limit: 10
  }) {
    data { id, name }
    totalRecords
  }
}
```

#### Test 2: Multi-Field Search
```graphql
query {
  users(params: {
    search: "john"
    limit: 10
  }) {
    data { id, email, username }
    totalRecords
  }
}
```

#### Test 3: Array IN Filter
```graphql
query {
  users(params: {
    roles: ["admin", "moderator"]
    limit: 10
  }) {
    data { id, email, role { slug } }
    totalRecords
  }
}
```

#### Test 4: Combined Filters
```graphql
query {
  products(params: {
    search: "laptop"
    categories: ["electronics"]
    minPrice: 500
    maxPrice: 2000
    limit: 20
  }) {
    data { id, name, price }
    totalRecords
  }
}
```

### Step 8: Query Performance Check

Enable query logging to verify SQL:

```typescript
// In database config
logging: true
```

Expected SQL (multi-field search):
```sql
SELECT * FROM users
WHERE (email LIKE '%john%' OR username LIKE '%john%')
LIMIT 10
```

Expected SQL (array IN with join):
```sql
SELECT users.* FROM users
INNER JOIN roles ON users.role_id = roles.id
WHERE roles.slug IN ('admin', 'moderator')
LIMIT 10
```

## Real-World Patterns from Boilerplate

### Pattern: User Filtering (Multi-field + Enum + Array IN)

```typescript
// filter-user.dto.ts
@InputType()
export class FilterUserInput extends BaseFilterParamInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsEnumValue(EUserStatus)
  status?: EUserStatus;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

// user.repository.ts
async getList(params: FilterUserInput): Promise<[User[], number]> {
  const query = this.createQueryBuilder('user');

  // Join role only if filtering by it
  if (params.roles?.length) {
    query.innerJoin('user.role', 'role');
  }

  this._applyQueryBase(params, query);
  applyQueryPaging(params, query);
  applyQuerySorting(params.sorting, query, 'user');

  return await query.getManyAndCount();
}

private _applyQueryBase(
  params: FilterUserInput,
  query: SelectQueryBuilder<User>,
): void {
  const { filter, status, roles } = params;

  // Multi-field OR search
  if (filter) {
    query.andWhere(
      '(user.email LIKE :filter OR user.username LIKE :filter)',
      { filter: `%${filter}%` }
    );
  }

  // Enum filter
  if (status && !isNaN(status)) {
    query.andWhere('user.status = :status', { status: +status });
  }

  // Array IN filter
  if (roles?.length) {
    query.andWhere('role.slug IN(:...roles)', { roles });
  }
}
```

## Common Filtering Operators

| Operator | SQL | Use Case |
|----------|-----|----------|
| `=` | `field = :value` | Exact match |
| `!=` | `field != :value` | Not equal |
| `>` | `field > :value` | Greater than |
| `>=` | `field >= :value` | Greater or equal |
| `<` | `field < :value` | Less than |
| `<=` | `field <= :value` | Less or equal |
| `LIKE` | `field LIKE :value` | Pattern match (case-sensitive) |
| `ILIKE` | `field ILIKE :value` | Pattern match (case-insensitive, PostgreSQL) |
| `IN` | `field IN (:...values)` | Match any in array |
| `NOT IN` | `field NOT IN (:...values)` | Match none in array |
| `IS NULL` | `field IS NULL` | Null check |
| `IS NOT NULL` | `field IS NOT NULL` | Not null check |
| `BETWEEN` | `field BETWEEN :start AND :end` | Range |

## Output Format

After successful execution, report:

```
✅ Filter Added to <Module>

Modified files:
  - src/modules/<module>/dtos/filter-<module>.dto.ts
  - src/modules/<module>/repository/repositories/<module>.repository.ts

Filter details:
  - Name: <filterName>
  - Type: <filterType>
  - Pattern: <Simple/Multi-field OR/Array IN/Join-based>
  - SQL operator: <operator>

Example query:
  <modules>(params: { <filterName>: <exampleValue> })

Next steps:
  1. Test filter in GraphQL playground
  2. Verify SQL query is optimized (enable logging)
  3. Add unit tests for filter logic
```

## Notes

- Always use parameterized queries (`:param`) to prevent SQL injection
- NEVER use string interpolation in WHERE clauses
- Join relations only when filtering, not for data loading (use DataLoader)
- Use `ILIKE` for case-insensitive search on PostgreSQL
- Wrap OR conditions in parentheses for correct precedence
- Array filters should check `.length` before applying
- Validate enum values with `!isNaN()` check
- Consider adding indexes on frequently filtered columns
