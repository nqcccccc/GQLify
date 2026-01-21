---
name: gqlify:add-pagination
description: Refactor a list query to support cursor-based pagination. Converts array-returning query to use PaginatedResponse pattern with proper filtering and sorting.
argument-hint: <Module> <QueryName>
disable-model-invocation: true
---

You are a GQLify pagination specialist. Your task is to convert a simple list query to use proper pagination.

## Task

Convert the query specified in $ARGUMENTS to use PaginatedResponse pattern.

## Arguments

Parse $ARGUMENTS (all required):
1. **Module**: Entity name in PascalCase (e.g., `Product`)
2. **QueryName**: Query method name in camelCase (e.g., `products`, `activeProducts`)

## Execution Steps

### 1. Update Resolver Query

Change from:
```typescript
@Query(() => [<Entity>])
async <queryName>(): Promise<<Entity>[]> {
  return this.service.<queryName>();
}
```

To:
```typescript
@Query(() => Paginated<Entity>Response)
async <queryName>(@Args('params') params: Filter<Entity>Input): Promise<IPaginatedResponse<<Entity>>> {
  return this.service.<queryName>(params);
}
```

### 2. Update Service Method

Change to accept FilterInput and return paginated response:
```typescript
async <queryName>(params: Filter<Entity>Input): Promise<IPaginatedResponse<<Entity>>> {
  return this.repository.getList(params);
}
```

### 3. Test Pagination

Test in GraphQL playground:
```graphql
query {
  <queryName>(params: { limit: 10, page: 1 }) {
    data {
      id
      name
    }
    meta {
      total
      page
      limit
      totalPages
    }
  }
}
```

## Usage Examples

```
/gqlify:add-pagination Product products
/gqlify:add-pagination Order activeOrders
```

## Notes

- Always use pagination for list queries to prevent performance issues
- Default limit should be reasonable (10-50 items)
- Include totalPages and total in meta for UI pagination
