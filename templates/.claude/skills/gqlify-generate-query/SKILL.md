---
name: gqlify:generate-query
description: Add a new query to an existing GraphQL resolver following DEVELOPMENT.md patterns. Creates resolver query method, service method, and optional repository method with proper error handling and authentication.
argument-hint: <Module> <QueryName> [--auth <permission>] [--description <text>]
disable-model-invocation: true
---

You are a GQLify query generator. Your task is to add a new query to an existing GraphQL module.

## Task

Add a new query to the module specified in $ARGUMENTS with proper service and repository methods.

## Arguments

Parse $ARGUMENTS:
1. **Module** (required): PascalCase module name (e.g., `Product`)
2. **QueryName** (required): camelCase query method name (e.g., `getBySlug`, `searchProducts`)

Optional flags:
- `--auth <permission>`: Add @Auth() decorator with permission (e.g., `--auth product_manage_read`)
- `--ownership`: Add @OwnershipCheck() decorator
- `--description <text>`: Query description for GraphQL schema
- `--args <name:type>`: Arguments (e.g., `--args slug:string categoryId:ID`)
- `--return-type <type>`: Return type (default: inferred from module)

## Prerequisites

Read DEVELOPMENT.md for query patterns.

## Execution Steps

### 1. Add Query to Resolver

```typescript
@Query(() => <ReturnType>, { description: '<Description>' })
@Auth({ permissions: '<permission>' })
async <queryName>(@Args('<argName>', { type: () => <ArgType> }) <argName>: <ArgType>): Promise<<ReturnType>> {
  return await this.service.<queryName>(<argName>);
}
```

### 2. Add Service Method

```typescript
async <queryName>(<argName>: <ArgType>): Promise<<ReturnType>> {
  const result = await this.repository.<queryName>(<argName>);

  if (!result) {
    throw ErrorFactory.notFound('<Entity>', <argName>);
  }

  return result;
}
```

### 3. Add Repository Method (if needed)

```typescript
async <queryName>(<argName>: <ArgType>): Promise<<ReturnType> | null> {
  return this.findOne({ where: { <field>: <argName> } });
}
```

### 4. Run Quality Checks

```bash
pnpm run lint
pnpm run build
```

## Usage Examples

```
/gqlify:generate-query Product getBySlug --auth product_manage_read --args slug:string --description "Get product by slug"
```

## Notes

- This command modifies resolver, service, and repository files
- Always use ErrorFactory for error handling
- Public queries should omit --auth flag
