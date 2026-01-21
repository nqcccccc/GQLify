---
name: gqlify:generate-field
description: Add a field resolver with DataLoader to an existing GraphQL module to prevent N+1 query problems. Creates field resolver, DataLoader factory method, and repository method for efficient relation loading.
argument-hint: <Module> <FieldName> <RelationType> [--nullable] [--array]
disable-model-invocation: true
---

You are a GQLify field resolver generator specializing in DataLoader implementation to prevent N+1 query problems.

## Task

Add a field resolver with DataLoader support to an existing GraphQL module for the relationship specified in $ARGUMENTS.

## Arguments

Parse $ARGUMENTS (all required):
1. **Module**: Entity name in PascalCase (e.g., `Product`)
2. **FieldName**: Field name in camelCase (e.g., `category`, `reviews`)
3. **RelationType**: Related entity in PascalCase (e.g., `Category`, `Review`)

Optional flags:
- `--nullable`: Field is nullable (default: true for many-to-one)
- `--array`: Field returns array (for one-to-many relations)
- `--foreign-key <name>`: Custom foreign key name (default: `<fieldName>Id`)

## Prerequisites

1. **Read DEVELOPMENT.md**
   - Load DataLoader patterns
   - Understand N+1 problem prevention

2. **Locate Files**
   - Resolver: `modules/<module-lower>/resolvers/<module-lower>.resolver.ts`
   - Entity: `modules/<module-lower>/repository/entities/<module-lower>.entity.ts`
   - DataLoader Factory: `src/common/dataloader/dataloader.factory.ts`
   - Related Repository: `modules/<relation-lower>/repository/repositories/<relation-lower>.repository.ts`

3. **Determine Relation Type**
   - Many-to-one: Entity has foreign key, returns single entity or null
   - One-to-many: Related entity has foreign key, returns array

## Execution Steps

### 1. Add Relation Property to Entity

For many-to-one (e.g., Product -> Category):
```typescript
@Field(() => ID, { nullable: true })
@Column({ nullable: true })
categoryId?: number;

// Relations (lazy-loaded via DataLoader)
category?: Category;
```

For one-to-many (e.g., Product -> Reviews):
```typescript
// Relations (lazy-loaded via DataLoader)
reviews?: Review[];
```

### 2. Add Field Resolver to Resolver

For many-to-one relation:
```typescript
@ResolveField(() => <RelationType>, { nullable: true })
async <fieldName>(
  @Parent() <entity>: <Entity>,
  @Context() ctx: { loaders: DataLoaders },
): Promise<<RelationType> | null> {
  // If already loaded (from query join)
  if (<entity>.<fieldName>) {
    return <entity>.<fieldName>;
  }

  // If no foreign key, return null
  if (!<entity>.<foreignKey>) {
    return null;
  }

  // Use DataLoader to batch and cache
  return ctx.loaders.<loaderName>.load(<entity>.<foreignKey>);
}
```

For one-to-many relation:
```typescript
@ResolveField(() => [<RelationType>])
async <fieldName>(
  @Parent() <entity>: <Entity>,
  @Context() ctx: { loaders: DataLoaders },
): Promise<<RelationType>[]> {
  // If already loaded
  if (<entity>.<fieldName>) {
    return <entity>.<fieldName>;
  }

  // Use DataLoader for batch loading
  return ctx.loaders.<loaderName>ByParent.load(<entity>.id);
}
```

### 3. Update DataLoader Factory

**3.1 Add to DataLoaders Interface**

```typescript
export interface DataLoaders {
  // ... existing loaders
  <loaderName>: DataLoader<<KeyType>, <RelationType>>;
  // or for one-to-many:
  <loaderName>ByParent: DataLoader<string, <RelationType>[]>;
}
```

**3.2 Inject Repository in Constructor**

```typescript
constructor(
  // ... existing repositories
  private readonly <relation>Repository: <Relation>Repository,
) {}
```

**3.3 Create Loader Method**

For many-to-one:
```typescript
private create<Relation>Loader(): DataLoader<<KeyType>, <RelationType>> {
  return new DataLoader<<KeyType>, <RelationType>>(async (ids: <KeyType>[]) => {
    const items = await this.<relation>Repository.getByIds(ids);
    const itemMap = new Map(items.map((item) => [item.id, item]));
    return ids.map((id) => itemMap.get(id) || null);
  });
}
```

For one-to-many:
```typescript
private create<Relation>ByParentLoader(): DataLoader<string, <RelationType>[]> {
  return new DataLoader<string, <RelationType>[]>(async (parentIds: string[]) => {
    const items = await this.<relation>Repository.findBy({
      <foreignKey>: In(parentIds)
    });

    const itemMap = new Map<string, <RelationType>[]>();
    items.forEach((item) => {
      const existing = itemMap.get(item.<foreignKey>) || [];
      existing.push(item);
      itemMap.set(item.<foreignKey>, existing);
    });

    return parentIds.map((id) => itemMap.get(id) || []);
  });
}
```

**3.4 Add to createLoaders()**

```typescript
createLoaders(): DataLoaders {
  return {
    // ... existing loaders
    <loaderName>: this.create<Relation>Loader(),
    // or:
    <loaderName>ByParent: this.create<Relation>ByParentLoader(),
  };
}
```

### 4. Add getByIds() to Related Repository (if missing)

```typescript
async getByIds(ids: <KeyType>[]): Promise<<RelationType>[]> {
  return this.findBy({ id: In(ids) });
}
```

### 5. Update Imports

Add necessary imports to all modified files:
- DataLoader types in factory
- Related entity types in resolver
- Context types in resolver
- `In` operator from TypeORM if needed

### 6. Run Quality Checks

```bash
pnpm run lint
pnpm run build
```

## Output Report

```
=================================================================
FIELD RESOLVER GENERATED
=================================================================

Module: <Entity>
Field: <fieldName>
Type: <RelationType>
Relation: <many-to-one|one-to-many>

Modified Files:
  ✓ modules/<module-lower>/resolvers/<module-lower>.resolver.ts
  ✓ modules/<module-lower>/repository/entities/<module-lower>.entity.ts
  ✓ src/common/dataloader/dataloader.factory.ts
  ✓ modules/<relation-lower>/repository/repositories/<relation-lower>.repository.ts

DataLoader Created:
  Name: <loaderName>
  Type: DataLoader<<KeyType>, <RelationType>>
  Batching: Enabled
  Caching: Per-request

Performance Impact:
  Before: 1 + N queries (N+1 problem)
  After: 2 queries (1 for entities + 1 for relations)

Next Steps:
  1. Review generated code
  2. Test field resolver in GraphQL playground
  3. Verify no N+1 queries in logs
  4. Add unit tests for field resolver

Example Query:
  query {
    <entities>(params: { limit: 10 }) {
      data {
        id
        name
        <fieldName> {
          id
          name
        }
      }
    }
  }

=================================================================
```

## Usage Examples

Many-to-one relation (Product -> Category):
```
/gqlify:generate-field Product category Category --foreign-key categoryId
```

One-to-many relation (Product -> Reviews):
```
/gqlify:generate-field Product reviews Review --array
```

Many-to-one with User:
```
/gqlify:generate-field Order user User --foreign-key userId
```

## Why DataLoader?

### Without DataLoader (N+1 Problem)
```
Query: Get 10 products with categories

Queries executed:
1. SELECT * FROM products LIMIT 10
2. SELECT * FROM categories WHERE id = 1
3. SELECT * FROM categories WHERE id = 2
4. SELECT * FROM categories WHERE id = 1  (duplicate!)
5. SELECT * FROM categories WHERE id = 3
...
Total: 1 + N queries (11 queries)
```

### With DataLoader
```
Query: Get 10 products with categories

Queries executed:
1. SELECT * FROM products LIMIT 10
2. SELECT * FROM categories WHERE id IN (1, 2, 3, ...)
Total: 2 queries
```

## DataLoader Benefits

1. **Batching**: Combines multiple `load()` calls into single query
2. **Caching**: Per-request cache prevents duplicate fetches
3. **Performance**: O(1) database queries instead of O(N)
4. **Scalability**: Handles large result sets efficiently

## Notes

- This command modifies multiple files
- Always review generated code before committing
- DataLoader cache is per-request (scoped to GraphQL context)
- For complex queries, consider adding query optimization
- Test with actual data to verify performance improvements
- Monitor database query logs to confirm batching works
