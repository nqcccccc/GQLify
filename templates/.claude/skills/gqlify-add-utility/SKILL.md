---
name: gqlify:add-utility
description: Add a utility function to common/utils with proper TypeScript types and documentation for reusable helper logic
argument-hint: <UtilityName> --category <date|string|object|transaction|custom>
disable-model-invocation: false
---

# GQLify: Add Utility Function

You are a GQLify utility function specialist. Your expertise is in creating reusable utility functions following the NestJS GraphQL boilerplate patterns.

## Task

Add a utility function for: $ARGUMENTS

This command helps organize common utility functions into categorized files following the boilerplate structure.

## Pre-requisites Check

Before implementing, verify:

1. **Utils Directory Exists**:
   - `src/common/utils/` exists
   - Category files exist (date.util.ts, string.util.ts, object.util.ts, etc.)

2. **Common Dependencies**:
   - TypeScript configured
   - Necessary libraries installed (dayjs for dates, etc.)

## Implementation Steps

### Step 1: Determine Utility Category

Parse `$ARGUMENTS` to determine category:
- `--category date`: Date/time utilities → `date.util.ts`
- `--category string`: String manipulation → `string.util.ts`
- `--category object`: Object/array operations → `object.util.ts`
- `--category transaction`: Database transactions → `transactionBuilder.util.ts`
- `--category custom` or new name: Create new file → `<name>.util.ts`

Extract utility name from arguments (first argument, use camelCase for function name).

### Step 2: Implement Utility Function

Based on category, add function to appropriate file:

#### Category: Date Utilities

**Location**: `src/common/utils/date.util.ts`

**Existing utilities**:
- `formatDate()` - Format dates with timezone offset
- `greaterThanNow()` - Compare date to current time
- `diffTimes()` - Calculate difference between dates
- `startOfDay()` - Get start of day timestamp
- `endOfDay()` - Get end of day timestamp

**Pattern from**: `date.util.ts`

**Template**:
```typescript
import dayjs, { OpUnitType } from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * <Brief description of what this function does>
 * @param <paramName> - <description>
 * @param <paramName> - <description>
 * @returns <description of return value>
 * @example
 * ```typescript
 * const result = <functionName>(param1, param2);
 * console.log(result); // <expected output>
 * ```
 */
export function <functionName>(
  <paramName>: <type>,
  <paramName>: <type>,
): <returnType> {
  // Implementation
}
```

**Real-World Examples**:

```typescript
/**
 * Format a date with timezone offset
 * @param date - Date to format (string or Date object)
 * @param format - dayjs format string (default: 'DD/MM/YYYY HH:mm:ss')
 * @param offset - Timezone offset in hours (default: 7 for UTC+7)
 * @returns Formatted date string, or null if date is invalid
 */
export function formatDate(
  date: string | Date,
  format = 'DD/MM/YYYY HH:mm:ss',
  offset = 7,
) {
  if (!date) {
    return null;
  }

  return dayjs(date).utcOffset(offset).format(format);
}

/**
 * Check if date difference from now is greater than specified value
 * @param date - Date to compare
 * @param compareValue - Numeric threshold
 * @param unit - Time unit for comparison (default: 'day')
 * @returns true if difference >= compareValue
 */
export function greaterThanNow(
  date: string | Date,
  compareValue: number,
  unit?: OpUnitType,
): boolean {
  return Math.abs(dayjs(date).diff(dayjs(), unit ?? 'day')) >= compareValue;
}

/**
 * Calculate difference between two dates
 * @param dt1 - First date
 * @param dt2 - Second date
 * @param unit - Time unit for difference (default: 'minutes')
 * @returns Numeric difference in specified unit
 */
export function diffTimes(
  dt1: string | Date,
  dt2: string | Date,
  unit?: OpUnitType,
) {
  return dayjs(dt2).diff(dayjs(dt1), unit ?? 'minutes');
}

/**
 * Get ISO timestamp for start of day (00:00:00)
 * @param date - Input date
 * @returns ISO string for start of day
 */
export function startOfDay(date: string | Date) {
  return dayjs(date).startOf('date').toISOString();
}

/**
 * Get ISO timestamp for end of day (23:59:59)
 * @param date - Input date
 * @returns ISO string for end of day
 */
export function endOfDay(date: string | Date) {
  return dayjs(date).endOf('date').toISOString();
}
```

#### Category: String Utilities

**Location**: `src/common/utils/string.util.ts`

**Existing utilities**:
- `hashPassword()` - Hash password with bcrypt
- `comparePassword()` - Compare password with hash
- `capitalizeText()` - Capitalize first letter
- `generateCode()` - Generate random codes
- `stringReplacer()` - Variable interpolation

**Pattern from**: `string.util.ts`

**Template**:
```typescript
/**
 * <Description>
 * @param <param> - <description>
 * @returns <description>
 */
export function <functionName>(<param>: <type>): <returnType> {
  // Implementation
}
```

**Real-World Examples**:

```typescript
import bcrypt from 'bcrypt';

/**
 * Hash a plain text password using bcrypt
 * @param plainText - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, 10);
}

/**
 * Compare a password with a stored hash
 * @param password - Plain text password to check
 * @param storedHash - Stored bcrypt hash
 * @returns true if password matches hash
 */
export async function comparePassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, storedHash);
}

/**
 * Capitalize first letter of text
 * @param text - Input text
 * @returns Text with first letter uppercase, rest lowercase
 */
export function capitalizeText(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Character sets for code generation
 */
export enum ECharset {
  numbers = 'numbers',
  alphabetic = 'alphabetic',
  alphanumeric = 'alphanumeric',
}

/**
 * Generate a random code with specified options
 * @param options - Configuration object
 * @param options.length - Length of generated code
 * @param options.charset - Character set to use
 * @param options.prefix - Optional prefix
 * @param options.postfix - Optional postfix
 * @param options.isUpperCase - Convert to uppercase
 * @returns Generated code
 */
export function generateCode(options: {
  length: number;
  charset: ECharset;
  prefix?: string | number;
  postfix?: string | number;
  isUpperCase?: boolean;
}) {
  const charsets = {
    numbers: '0123456789',
    alphabetic: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alphanumeric:
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  };
  const charset = charsets[options.charset];
  let str = '';
  for (let i = 0; i < options.length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    str += charset.charAt(randomIndex);
  }
  str = (options?.prefix || '') + str + (options?.postfix || '');
  if (options?.isUpperCase) {
    str = str.toLocaleUpperCase();
  }
  return str;
}

/**
 * Replace %variables% in template string with values from object
 * @param template - Template string with %var% placeholders
 * @param replacer - Object with variable values
 * @returns String with variables replaced
 * @example
 * ```typescript
 * stringReplacer('Hello %name%', { name: 'John' }); // 'Hello John'
 * ```
 */
export function stringReplacer<T>(template: string, replacer: T) {
  return template.replace(
    /%(\\w+)?%/g,
    (_, $2: string): string => replacer[$2] as string,
  );
}
```

#### Category: Object Utilities

**Location**: `src/common/utils/object.util.ts`

**Existing utilities**:
- `wrapPagination()` - Wrap data in pagination response
- `parseJson()` - Safe JSON parsing
- `isEmpty()` - Check if value is empty

**Pattern from**: `object.util.ts`

**Template**:
```typescript
import { Logger } from '@nestjs/common';

/**
 * <Description>
 * @param <param> - <description>
 * @returns <description>
 */
export function <functionName><T>(<param>: <type>): <returnType> {
  // Implementation
}
```

**Real-World Examples**:

```typescript
import {
  ListPaginate,
  QueryPaginate,
} from '@common/database/types/database.type';
import { Logger } from '@nestjs/common';

/**
 * Wrap array data in pagination response
 * @param data - Array of data items
 * @param totalCount - Total number of records (without pagination)
 * @param paginationCfg - Pagination config (page, limit)
 * @returns Paginated response object
 */
export function wrapPagination<T>(
  data: T[],
  totalCount: number,
  paginationCfg: QueryPaginate,
): ListPaginate<T> {
  return {
    data: data,
    totalPages: Math.ceil(totalCount / (paginationCfg.limit || 10)),
    limit: paginationCfg.limit || 10,
    page: paginationCfg.page || 1,
    totalRecords: totalCount,
  };
}

/**
 * Safely parse JSON string with error handling
 * @param input - JSON string to parse
 * @returns Parsed object or null if parsing fails
 */
export function parseJson<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch (e) {
    Logger.error('Failed to parse JSON', e);
    return null;
  }
}

/**
 * Check if value is null, undefined, or empty string
 * @param value - Value to check
 * @returns true if value is empty
 */
export const isEmpty = (value: unknown): boolean => {
  return (
    value == null || (typeof value === 'string' && value.trim().length === 0)
  );
};
```

#### Category: Transaction Utilities

**Location**: `src/common/utils/transactionBuilder.util.ts`

**Existing utilities**:
- `getTransaction()` - Create TypeORM query runner for transactions

**Pattern from**: `transactionBuilder.util.ts`

**Template**:
```typescript
import { DataSource, QueryRunner } from 'typeorm';

/**
 * <Description>
 * @param dataSource - TypeORM DataSource
 * @returns <description>
 */
export async function <functionName>(
  dataSource: DataSource,
): Promise<QueryRunner> {
  // Implementation
}
```

**Real-World Example**:

```typescript
import { DataSource, QueryRunner } from 'typeorm';

/**
 * Create and connect a TypeORM query runner for database transactions
 * @param dataSource - TypeORM DataSource instance
 * @returns Connected QueryRunner
 * @example
 * ```typescript
 * const queryRunner = await getTransaction(dataSource);
 * await queryRunner.startTransaction();
 * try {
 *   await queryRunner.manager.save(entity);
 *   await queryRunner.commitTransaction();
 * } catch (error) {
 *   await queryRunner.rollbackTransaction();
 * } finally {
 *   await queryRunner.release();
 * }
 * ```
 */
export async function getTransaction(
  dataSource: DataSource,
): Promise<QueryRunner> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  return queryRunner;
}
```

#### Category: Custom (New File)

**Location**: `src/common/utils/<category>.util.ts`

**Template**:
```typescript
/**
 * Utilities for <category>
 * @module <category>.util
 */

/**
 * <Function description>
 * @param <param> - <description>
 * @returns <description>
 * @example
 * ```typescript
 * const result = <functionName>(param);
 * ```
 */
export function <functionName>(<param>: <type>): <returnType> {
  // Implementation
}

// Export additional functions as needed
```

### Step 3: Add Exports (if needed)

If the utils directory has an index file, add export:

**Location**: `src/common/utils/index.ts` (if exists)

```typescript
// Date utilities
export * from './date.util';

// String utilities
export * from './string.util';

// Object utilities
export * from './object.util';

// Transaction utilities
export * from './transactionBuilder.util';

// Add new export
export * from './<category>.util';
```

### Step 4: Validation Checklist

After implementation, verify:

- [ ] Function added to appropriate category file
- [ ] Function has JSDoc documentation
- [ ] TypeScript types defined for all parameters and return value
- [ ] Generic types used where appropriate (`<T>`)
- [ ] Function exported with `export function`
- [ ] Examples provided in JSDoc
- [ ] Error handling implemented if needed
- [ ] Dependencies imported (dayjs, bcrypt, etc.)
- [ ] No hardcoded values (use parameters/defaults)
- [ ] Function is pure (no side effects) when possible
- [ ] Async functions use `async/await` properly
- [ ] Edge cases handled (null, undefined, empty)
- [ ] Consistent with existing code style
- [ ] No TypeScript errors

### Step 5: Testing

#### Unit Test Creation

**Location**: `src/common/utils/__tests__/<category>.util.spec.ts` (if tests exist)

**Template**:
```typescript
import { <functionName> } from '../<category>.util';

describe('<functionName>', () => {
  it('should <expected behavior>', () => {
    // Arrange
    const input = <testInput>;
    const expected = <expectedOutput>;

    // Act
    const result = <functionName>(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it('should handle null/undefined', () => {
    expect(<functionName>(null)).toBe(<expected>);
    expect(<functionName>(undefined)).toBe(<expected>);
  });

  it('should handle edge cases', () => {
    // Test edge cases specific to your function
  });
});
```

#### Manual Testing

**1. Import and test in a service**:
```typescript
import { <functionName> } from '@common/utils/<category>.util';

// In a method
async testUtility() {
  const result = <functionName>(testParam);
  console.log('Result:', result);
  return result;
}
```

**2. Test edge cases**:
```typescript
// Null/undefined
<functionName>(null);
<functionName>(undefined);

// Empty values
<functionName>('');
<functionName>([]);
<functionName>({});

// Invalid types (if TypeScript allows)
<functionName>('invalid');
```

**3. Test performance (if needed)**:
```typescript
console.time('utility');
for (let i = 0; i < 10000; i++) {
  <functionName>(testParam);
}
console.timeEnd('utility');
```

### Step 6: Common Utility Patterns

#### Pattern 1: Date Formatting

**Use case**: Display dates in user-friendly format

**Implementation**:
```typescript
export function formatDate(
  date: string | Date,
  format = 'DD/MM/YYYY HH:mm:ss',
  offset = 7,
) {
  if (!date) {
    return null;
  }
  return dayjs(date).utcOffset(offset).format(format);
}

// Usage
formatDate(new Date(), 'YYYY-MM-DD'); // '2024-01-21'
formatDate(user.createdAt, 'MMM DD, YYYY'); // 'Jan 21, 2024'
```

#### Pattern 2: Safe Parsing

**Use case**: Parse data without throwing errors

**Implementation**:
```typescript
export function parseJson<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch (e) {
    Logger.error('Failed to parse JSON', e);
    return null;
  }
}

// Usage
const data = parseJson<User>(jsonString);
if (data) {
  // Use data
} else {
  // Handle parse error
}
```

#### Pattern 3: Validation Helpers

**Use case**: Reusable validation logic

**Implementation**:
```typescript
export const isEmpty = (value: unknown): boolean => {
  return (
    value == null || (typeof value === 'string' && value.trim().length === 0)
  );
};

export const isEmail = (email: string): boolean => {
  const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return regex.test(email);
};

// Usage
if (!isEmpty(user.name) && isEmail(user.email)) {
  // Valid data
}
```

#### Pattern 4: Code Generation

**Use case**: Generate tokens, codes, IDs

**Implementation**:
```typescript
export function generateCode(options: {
  length: number;
  charset: ECharset;
  prefix?: string | number;
  postfix?: string | number;
  isUpperCase?: boolean;
}) {
  const charsets = {
    numbers: '0123456789',
    alphabetic: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alphanumeric:
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  };
  const charset = charsets[options.charset];
  let str = '';
  for (let i = 0; i < options.length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    str += charset.charAt(randomIndex);
  }
  str = (options?.prefix || '') + str + (options?.postfix || '');
  if (options?.isUpperCase) {
    str = str.toLocaleUpperCase();
  }
  return str;
}

// Usage
generateCode({ length: 6, charset: ECharset.numbers }); // '123456'
generateCode({
  length: 10,
  charset: ECharset.alphanumeric,
  prefix: 'USER-',
  isUpperCase: true,
}); // 'USER-A1B2C3D4E5'
```

#### Pattern 5: Pagination Wrapper

**Use case**: Consistent pagination response

**Implementation**:
```typescript
export function wrapPagination<T>(
  data: T[],
  totalCount: number,
  paginationCfg: QueryPaginate,
): ListPaginate<T> {
  return {
    data: data,
    totalPages: Math.ceil(totalCount / (paginationCfg.limit || 10)),
    limit: paginationCfg.limit || 10,
    page: paginationCfg.page || 1,
    totalRecords: totalCount,
  };
}

// Usage in repository
const [data, totalCount] = await this.findAndCount(query);
return wrapPagination(data, totalCount, { page: 1, limit: 10 });
```

## Output Format

After successful implementation, output:

```
✅ Utility Function Created: <functionName>

📁 File Modified/Created:
  - src/common/utils/<category>.util.ts (MODIFIED/NEW)
  - src/common/utils/index.ts (MODIFIED) - if exports added

🔧 Function Details:
  Name: <functionName>
  Category: <category>
  Parameters: <param list>
  Return Type: <returnType>
  Async: Yes/No

📝 Next Steps:
  1. Review JSDoc documentation
  2. Add unit tests in __tests__/<category>.util.spec.ts
  3. Import and test in actual service
  4. Verify TypeScript types
  5. Test edge cases (null, undefined, empty)

💡 Usage Example:
  ```typescript
  import { <functionName> } from '@common/utils/<category>.util';

  const result = <functionName>(param1, param2);
  ```
```

## Notes and Best Practices

### Function Design

1. **Single Responsibility**:
   - One function does one thing well
   - Don't create multi-purpose functions
   - Split complex logic into multiple functions

2. **Pure Functions**:
   - Prefer pure functions (no side effects)
   - Same input always produces same output
   - Don't modify input parameters
   - Don't access external state

3. **Type Safety**:
   - Use TypeScript types for all parameters
   - Define return types explicitly
   - Use generics for reusable types (`<T>`)
   - Avoid `any` type

4. **Error Handling**:
   - Use try-catch for operations that can fail
   - Return null/undefined for failed operations (don't throw in utilities)
   - Log errors with context
   - Document error cases in JSDoc

5. **Defaults**:
   - Provide sensible defaults for optional parameters
   - Use ES6 default parameters: `param = defaultValue`
   - Document default values in JSDoc

### Documentation

1. **JSDoc Required**:
   - Every exported function must have JSDoc
   - Include description, parameters, return value
   - Add `@example` for complex functions
   - Document edge cases and error behavior

2. **JSDoc Structure**:
```typescript
/**
 * Brief one-line description
 *
 * Optional longer description explaining details, use cases, or important notes
 *
 * @param paramName - Description of parameter
 * @param optionalParam - Description (optional)
 * @returns Description of return value
 * @throws Only if function actually throws (rare for utilities)
 * @example
 * ```typescript
 * const result = functionName(param);
 * console.log(result); // expected output
 * ```
 */
```

3. **Parameter Descriptions**:
   - Describe what the parameter is used for
   - Mention expected format (e.g., "ISO string", "positive integer")
   - Note if null/undefined is allowed

### Organization

1. **File Categories**:
   - `date.util.ts` - Date/time operations
   - `string.util.ts` - String manipulation
   - `object.util.ts` - Object/array operations
   - `transaction.util.ts` - Database transactions
   - Custom files for specific domains

2. **Naming Conventions**:
   - Use descriptive names: `formatDate` not `format`
   - Use verbs for actions: `generateCode`, `parseJson`
   - Use `is` prefix for boolean checks: `isEmpty`, `isEmail`
   - Use camelCase for function names

3. **Dependencies**:
   - Keep dependencies minimal
   - Import only what you need
   - Document required peer dependencies
   - Use path aliases (@common/utils)

### Performance

1. **Optimization**:
   - Avoid unnecessary loops
   - Cache expensive operations
   - Use built-in methods when possible
   - Benchmark critical paths

2. **Memory**:
   - Don't create unnecessary objects
   - Reuse variables when possible
   - Clear large data structures after use

3. **Async Operations**:
   - Use `async/await` for clarity
   - Handle promises properly
   - Don't block event loop unnecessarily

### Testing

1. **Test Coverage**:
   - Test happy path
   - Test edge cases (null, undefined, empty)
   - Test invalid inputs
   - Test boundary values

2. **Test Organization**:
   - One describe block per function
   - Multiple it blocks for different scenarios
   - Use descriptive test names
   - Arrange-Act-Assert pattern

3. **Mocking**:
   - Mock external dependencies
   - Don't mock the utility itself
   - Use realistic test data

## Real-World Examples

### Example 1: Date Range Validation

**Scenario**: Validate that end date is after start date

**Implementation**:
```typescript
/**
 * Validate date range
 * @param startDate - Range start date
 * @param endDate - Range end date
 * @returns true if end date is after start date
 */
export function isValidDateRange(
  startDate: string | Date,
  endDate: string | Date,
): boolean {
  return dayjs(endDate).isAfter(dayjs(startDate));
}

// Usage in DTO validation
@ValidateIf((o) => !isValidDateRange(o.startDate, o.endDate))
@IsNotEmpty({ message: 'End date must be after start date' })
endDate: Date;
```

### Example 2: Slug Generation

**Scenario**: Generate URL-friendly slugs from titles

**Implementation**:
```typescript
/**
 * Generate URL-friendly slug from text
 * @param text - Text to convert to slug
 * @returns Lowercase slug with hyphens
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\\w\\s-]/g, '') // Remove special chars
    .replace(/[\\s_-]+/g, '-')  // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '');   // Remove leading/trailing hyphens
}

// Usage
generateSlug('Hello World!'); // 'hello-world'
generateSlug('My   Product   Name'); // 'my-product-name'
```

### Example 3: Deep Clone

**Scenario**: Create deep copy of objects

**Implementation**:
```typescript
/**
 * Create deep clone of object
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// Usage
const original = { a: 1, b: { c: 2 } };
const copy = deepClone(original);
copy.b.c = 3;
console.log(original.b.c); // Still 2
```

### Example 4: Currency Formatting

**Scenario**: Format numbers as currency

**Implementation**:
```typescript
/**
 * Format number as currency
 * @param amount - Numeric amount
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

// Usage
formatCurrency(1234.56); // '$1,234.56'
formatCurrency(1234.56, 'EUR', 'de-DE'); // '1.234,56 €'
```

## Troubleshooting

### TypeScript Errors

**Symptoms**: Type errors when using utility

**Checks**:
1. Return type matches actual return
2. Generic types used correctly
3. Null/undefined handled in types
4. Imports have correct types

**Solution**: Add explicit types and null checks.

### Import Errors

**Symptoms**: Cannot find module

**Checks**:
1. Path alias configured in tsconfig.json
2. File exported from category file
3. File exported from index.ts (if exists)
4. File extension not included in import

**Solution**: Use path aliases (@common/utils).

### Runtime Errors

**Symptoms**: Utility throws errors at runtime

**Checks**:
1. Dependencies installed (dayjs, bcrypt, etc.)
2. Input validation in function
3. Error handling with try-catch
4. Null/undefined checks

**Solution**: Add defensive programming (null checks, validation).

---

**End of Skill: gqlify:add-utility**

This skill creates production-ready utility functions following the NestJS GraphQL boilerplate patterns. All code examples are based on actual implementations from the boilerplate at `/Users/cuongnq/Desktop/Learning.nosync/NESTJS/nestjs-graphql-boilerplate`.
