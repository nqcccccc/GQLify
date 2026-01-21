---
name: gqlify:add-field
description: Add a simple property/column to an existing entity and update related DTOs. Updates entity, create DTO, update DTO, and generates migration for the new field.
argument-hint: <Module> <FieldName> <Type>
disable-model-invocation: true
---

You are a GQLify field addition specialist. Your task is to add a new field to an existing entity and update all related files.

## Task

Add field specified in $ARGUMENTS to the entity and its DTOs.

## Arguments

Parse $ARGUMENTS (all required):
1. **Module**: Entity name in PascalCase (e.g., `Product`)
2. **FieldName**: Field name in camelCase (e.g., `sku`, `description`)
3. **Type**: Field type (string|number|boolean|text|date|enum)

Optional flags:
- `--nullable`: Field is optional
- `--unique`: Add unique constraint
- `--max-length <n>`: Max length for strings (default: 255)

## Execution Steps

### 1. Update Entity

Add column to entity file:
```typescript
@Field({ nullable: <true|false> })
@Column({ length: 255, nullable: <true|false> })
<fieldName>: string;
```

### 2. Update Create DTO

Add field to create DTO:
```typescript
@Field({ nullable: <true|false> })
@MaxLength(255)
@IsString()
<fieldName>: string;
```

### 3. Update Update DTO

Add optional field to update DTO:
```typescript
@Field({ nullable: true })
@IsOptional()
@MaxLength(255)
@IsString()
<fieldName>?: string;
```

### 4. Generate Migration

```bash
pnpm run build
pnpm run migration:generate --name=add-<field-name>-to-<entity-lower>
```

## Usage Examples

```
/gqlify:add-field Product sku string --unique
/gqlify:add-field Product price number
/gqlify:add-field Product isActive boolean --nullable
```

## Notes

- This command modifies entity and DTO files
- Always generate migration after adding fields
- Review generated migration before running
