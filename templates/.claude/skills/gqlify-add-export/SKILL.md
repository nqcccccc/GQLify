---
name: gqlify:add-export
description: Add CSV/Excel export functionality to an existing module's list query. Adds export mutation, updates repository to support export mode, and creates export DTOs.
argument-hint: <Module> [--format csv|excel]
disable-model-invocation: true
---

You are a GQLify export specialist. Your task is to add CSV/Excel export functionality to the module specified in `$ARGUMENTS`.

## Task

Add export capability to the **$ARGUMENTS** module that allows downloading the list query results as CSV or Excel format.

## Pre-requisites

Before starting, verify:
1. The module exists in `src/modules/<module-lower>/`
2. The module has a `getList()` method in its repository
3. The module has a list query in its resolver

## Execution Steps

### Step 1: Analyze Current Structure

Read the following files to understand the current implementation:
- `src/modules/<module-lower>/repository/repositories/<module>.repository.ts`
- `src/modules/<module-lower>/resolvers/<module>.resolver.ts`
- `src/modules/<module-lower>/services/<module>.service.ts`
- `src/modules/<module-lower>/dtos/filter-<module>.dto.ts`

### Step 2: Update Repository

Modify the `getList()` method in `<Module>Repository` to support export mode:

```typescript
async getList(
  params: Filter<Module>Input,
  isExport = false,
): Promise<[<Module>[], number]> {
  const query = this.createQueryBuilder('<module>');

  // Only join relations for filtering if needed
  if (params.someRelationFilter?.length) {
    query.innerJoin('<module>.relation', 'relation');
  }

  // Apply base filters
  this._applyQueryBase(params, query);

  // Apply pagination
  applyQueryPaging(params, query, isExport);

  if (isExport) {
    // For export, we need to include relation data in the result
    // Add joins for relations that should appear in export
    if (!params.someRelationFilter?.length) {
      query.leftJoin('<module>.relation', 'relation');
    }

    // Select additional fields for export
    query.addSelect(['relation.slug', 'relation.name']);

    // Return raw results for export formatting
    return [await query.getRawMany(), 0];
  } else {
    // Normal mode: return entities with count
    return await query.getManyAndCount();
  }
}
```

**Key points:**
- Add `isExport = false` parameter (default false for backward compatibility)
- Conditionally join relations to avoid duplicate joins
- Use `getRawMany()` for export mode to get flattened data
- Use `addSelect()` to include relation fields in export

### Step 3: Create Export DTO

Create `src/modules/<module-lower>/dtos/export-<module>.dto.ts`:

```typescript
import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { Filter<Module>Input } from './filter-<module>.dto';

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
}

registerEnumType(ExportFormat, {
  name: 'ExportFormat',
  description: 'Export file format',
});

@InputType()
export class Export<Module>Input extends Filter<Module>Input {
  @Field(() => ExportFormat, {
    defaultValue: ExportFormat.CSV,
    description: 'Export format (CSV or Excel)'
  })
  @IsEnum(ExportFormat)
  @IsNotEmpty()
  format: ExportFormat;
}
```

**Key points:**
- Extends existing filter DTO to reuse all filter logic
- Adds `format` field for CSV/Excel selection
- Uses enum for type safety
- Registers GraphQL enum

### Step 4: Update Service

Add export method to `<Module>Service`:

```typescript
import { Export<Module>Input, ExportFormat } from '../dtos/export-<module>.dto';

async export(params: Export<Module>Input): Promise<string> {
  const [data] = await this.repository.getList(params, true);

  if (params.format === ExportFormat.CSV) {
    return this._formatAsCSV(data);
  } else {
    return this._formatAsExcel(data);
  }
}

private _formatAsCSV(data: any[]): string {
  if (!data.length) return '';

  // Get headers from first row
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header] ?? '';
        // Escape values containing commas or quotes
        if (String(value).includes(',') || String(value).includes('"')) {
          return `"${String(value).replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

private _formatAsExcel(data: any[]): string {
  // For Excel, you might want to use a library like 'exceljs'
  // This is a simplified Base64 representation
  // In production, use a proper Excel library
  throw ErrorFactory.business(
    'NOT_IMPLEMENTED',
    'Excel export not yet implemented. Use CSV format.'
  );
}
```

**Key points:**
- Calls repository with `isExport=true`
- Formats data based on requested format
- Handles CSV escaping properly
- Returns formatted string (can be Base64 for downloads)

### Step 5: Add Resolver Mutation

Add export mutation to `<Module>Resolver`:

```typescript
import { Export<Module>Input } from '../dtos/export-<module>.dto';

@Mutation(() => String, {
  description: 'Export <module> list as CSV or Excel. Returns Base64 encoded file content.'
})
@Auth({ permissions: '<module>_manage_read' })
async export<Module>s(@Args('params') params: Export<Module>Input): Promise<string> {
  const csvContent = await this.service.export(params);

  // Return Base64 encoded content for download
  return Buffer.from(csvContent).toString('base64');
}
```

**Alternative (File URL approach):**
```typescript
@Mutation(() => String, {
  description: 'Export <module> list. Returns download URL.'
})
@Auth({ permissions: '<module>_manage_read' })
async export<Module>s(@Args('params') params: Export<Module>Input): Promise<string> {
  const csvContent = await this.service.export(params);

  // Save to temporary file or S3
  const filename = `<module>s-export-${Date.now()}.csv`;
  const filepath = path.join('/tmp', filename);
  await fs.writeFile(filepath, csvContent);

  // Return download URL
  return `/downloads/${filename}`;
}
```

**Key points:**
- Same authentication as list query
- Returns Base64 for direct download or file URL
- Uses same filter params as list query for consistency

### Step 6: Validation

After implementation, verify:

- [ ] Repository `getList()` accepts `isExport` parameter
- [ ] Export mode returns raw data with joined fields
- [ ] Export DTO extends filter DTO properly
- [ ] Service export method handles format selection
- [ ] CSV formatting escapes special characters
- [ ] Resolver mutation has proper authentication
- [ ] GraphQL schema includes export mutation
- [ ] No TypeScript errors
- [ ] Build succeeds: `pnpm run build`

### Step 7: Testing

Test the export functionality:

```graphql
mutation ExportUsers {
  exportUsers(params: {
    format: CSV
    limit: 1000
    filter: "john"
  })
}
```

Expected response:
```json
{
  "data": {
    "exportUsers": "aWQsZW1haWwsdXNlcm5hbWUsc3RhdHVzLHJvbGVfbmFtZQ0K..."
  }
}
```

Decode Base64 to verify CSV content.

## Real-World Pattern from Boilerplate

This pattern is based on the actual implementation in the NestJS GraphQL boilerplate:

```typescript
// From user.repository.ts
async getList(params: FilterUserInput, isExport = false): Promise<[User[], number]> {
  const query = this.createQueryBuilder('user');

  if (params.roles?.length) {
    query.innerJoin('user.role', 'role');
  }

  this._applyQueryBase(params, query);
  applyQueryPaging(params, query, isExport);

  if (isExport) {
    // For export, join role if not already joined
    if (!params.roles?.length) {
      query.leftJoin('user.role', 'role');
    }
    query.addSelect(['role.slug', 'role.name']);
    return [await query.getRawMany(), 0];
  } else {
    return await query.getManyAndCount();
  }
}
```

## Output Format

After successful execution, report:

```
✅ Export Functionality Added to <Module>

Modified files:
  - src/modules/<module>/repository/repositories/<module>.repository.ts
  - src/modules/<module>/services/<module>.service.ts
  - src/modules/<module>/resolvers/<module>.resolver.ts

Created files:
  - src/modules/<module>/dtos/export-<module>.dto.ts

Next steps:
  1. Test export mutation in GraphQL playground
  2. Verify CSV output format
  3. Implement Excel format if needed
  4. Add download endpoint if using file URL approach
```

## Notes

- Export queries should respect the same filters as list queries for consistency
- Consider adding pagination limits for exports to prevent memory issues
- For large exports, consider implementing streaming or background job processing
- Always validate user permissions before allowing exports
- Consider adding audit logging for export operations
