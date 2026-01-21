---
name: gqlify:add-validator
description: Add a custom class-validator decorator for DTO validation with constraint implementation and error messages
argument-hint: <ValidatorName> [--async]
disable-model-invocation: false
---

# GQLify: Add Custom Validator

You are a GQLify custom validator specialist. Your expertise is in creating class-validator decorators following the NestJS GraphQL boilerplate patterns.

## Task

Add a custom validator decorator for: $ARGUMENTS

This command creates custom validation decorators using class-validator's constraint API.

## Pre-requisites Check

Before implementing, verify:

1. **Validation Setup**:
   - `class-validator` installed
   - `class-transformer` installed
   - ValidationPipe configured in AppModule

2. **Validations Directory**:
   - `src/common/request/validations/` exists
   - Existing validators as reference

## Implementation Steps

### Step 1: Determine Validator Type

Parse `$ARGUMENTS`:
- If `--async`: Create async validator (for DB queries, API calls)
- Default: Create sync validator

Extract validator name (convert to PascalCase for class, kebab-case for file).

### Step 2: Create Validator File

**Location**: `src/common/request/validations/request.<validator-name>.validation.ts`

**Pattern from**: `request.enum-value.validation.ts`, `request.date-range.validation.ts`

**Template (Sync Validator)**:
```typescript
import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validator constraint for <description>
 * Implements the actual validation logic
 */
@ValidatorConstraint({ async: false }) // Set to true for async validators
@Injectable()
export class <ValidatorName>Constraint implements ValidatorConstraintInterface {
  /**
   * Validate the value
   * @param value - Value to validate
   * @param args - Validation arguments (includes constraints, object, property)
   * @returns true if valid, false otherwise
   */
  validate(value: <valueType>, args: ValidationArguments): boolean {
    // Extract constraints if passed
    const [param1, param2] = args.constraints as [<type1>, <type2>];

    // Access the full DTO object if needed
    const dto = args.object as Record<string, unknown>;

    // Implement validation logic
    // Return true if valid, false if invalid

    return <validationLogic>;
  }

  /**
   * Default error message if validation fails
   * @param args - Validation arguments
   * @returns Error message string
   */
  defaultMessage?(args?: ValidationArguments): string {
    if (!args) {
      return '<Default error message>';
    }

    // Customize message based on constraints or property name
    const [param1] = args.constraints as [<type1>];
    return `${args.property} <error description>`;
  }
}

/**
 * Decorator function for <ValidatorName>
 * Use this in your DTOs
 * @param <param1> - <description>
 * @param validationOptions - Optional validation options (message, groups, etc.)
 * @returns PropertyDecorator
 * @example
 * ```typescript
 * class MyDto {
 *   @<ValidatorName>(<param1>)
 *   myField: <type>;
 * }
 * ```
 */
export function <ValidatorName>(
  <param1>: <type1>,
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: '<ValidatorName>',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [<param1>], // Pass parameters to constraint
      validator: <ValidatorName>Constraint,
    });
  };
}
```

**Template (Async Validator)**:
```typescript
import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: true }) // Enable async validation
@Injectable()
export class <ValidatorName>Constraint implements ValidatorConstraintInterface {
  constructor(
    // Inject services if needed
    // private readonly userService: UserService,
  ) {}

  /**
   * Async validation
   * @param value - Value to validate
   * @param args - Validation arguments
   * @returns Promise<boolean>
   */
  async validate(value: <valueType>, args: ValidationArguments): Promise<boolean> {
    // Perform async operations (DB queries, API calls)
    // const exists = await this.userService.exists(value);

    return <asyncValidationLogic>;
  }

  defaultMessage?(args?: ValidationArguments): string {
    return `<Error message>`;
  }
}

export function <ValidatorName>(
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: '<ValidatorName>',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: <ValidatorName>Constraint,
    });
  };
}
```

### Step 3: Real-World Examples

#### Example 1: Enum Value Validator (Sync)

**Pattern from**: `request.enum-value.validation.ts`

**Use case**: Validate that value exists in enum/object

```typescript
import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
@Injectable()
export class IsEnumValueConstraint implements ValidatorConstraintInterface {
  validate(value: string | number, args: ValidationArguments): boolean {
    const [enumObject] = args.constraints as [Record<string, string | number>];

    // Check if value exists in enum values
    return value in enumObject;
  }
}

export function IsEnumValue(
  enumObject: any,
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: 'IsEnumValue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [enumObject],
      validator: IsEnumValueConstraint,
    });
  };
}

// Usage in DTO
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

class CreateUserDto {
  @IsEnumValue(UserRole, { message: 'Invalid role' })
  role: string;
}
```

#### Example 2: Date Range Validator (Sync)

**Pattern from**: `request.date-range.validation.ts`

**Use case**: Validate date is within range from another field

```typescript
import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import dayjs from 'dayjs';

@ValidatorConstraint({ async: false })
@Injectable()
export class CheckDateRangeConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    const [dateRange, startDateField] = args.constraints as [number, string];

    // Get the start date from another field in the DTO
    const startDate = (args.object as Record<string, unknown>)[
      startDateField
    ] as string;

    // Calculate difference in days
    const diffDays = dayjs(value).diff(startDate, 'days');

    // End date must be after start date and within range
    return diffDays > 0 && diffDays <= dateRange;
  }

  defaultMessage?(args?: ValidationArguments): string {
    if (!args) {
      return 'Date range validation failed';
    }

    const [dateRange, startDateField] = args.constraints as [number, string];
    return `End date must be within ${dateRange} days from ${startDateField}`;
  }
}

export function CheckDateRange(
  dateRange: number,
  startDateField: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: 'CheckDateRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [dateRange, startDateField],
      validator: CheckDateRangeConstraint,
    });
  };
}

// Usage in DTO
class BookingDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  @CheckDateRange(30, 'startDate', {
    message: 'Booking cannot be longer than 30 days'
  })
  endDate: string;
}
```

#### Example 3: Unique Email Validator (Async)

**Use case**: Check if email is unique in database

```typescript
import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UserRepository } from '@modules/user/repository/repositories/user.repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(private readonly userRepository: UserRepository) {}

  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    // Query database to check if email exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    // Valid if no user found
    return !existingUser;
  }

  defaultMessage?(args?: ValidationArguments): string {
    return `Email ${args?.value} already exists`;
  }
}

export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      name: 'IsUniqueEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueEmailConstraint,
    });
  };
}

// Usage
class CreateUserDto {
  @IsEmail()
  @IsUniqueEmail({ message: 'This email is already registered' })
  email: string;
}
```

### Step 4: Register Validator (for async validators with DI)

If your validator uses dependency injection, register it as a provider:

**Location**: `src/common/common.module.ts` or appropriate module

```typescript
import { Module } from '@nestjs/common';
import { <ValidatorName>Constraint } from './request/validations/request.<validator-name>.validation';

@Module({
  providers: [
    <ValidatorName>Constraint, // Register constraint as provider
    // ... other providers
  ],
})
export class CommonModule {}
```

### Step 5: Validation Checklist

- [ ] Validator file created in `src/common/request/validations/`
- [ ] Constraint class implements `ValidatorConstraintInterface`
- [ ] `@ValidatorConstraint()` decorator with correct `async` flag
- [ ] `validate()` method implements logic
- [ ] `defaultMessage()` provides helpful error message
- [ ] Decorator function created and exported
- [ ] `registerDecorator()` called with correct options
- [ ] JSDoc documentation for both constraint and decorator
- [ ] Usage example in JSDoc
- [ ] Dependencies injected if async (and registered as provider)
- [ ] No TypeScript errors

### Step 6: Testing

**1. Create test DTO**:
```typescript
class TestDto {
  @<ValidatorName>(<params>)
  testField: <type>;
}
```

**2. Test validation**:
```typescript
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

const dto = plainToClass(TestDto, {
  testField: <testValue>,
});

const errors = await validate(dto);
console.log(errors); // Should show validation errors if invalid
```

**3. Test in resolver/controller**:
```typescript
@Mutation(() => Boolean)
async testValidation(@Args('input') input: TestDto): Promise<boolean> {
  // If this executes, validation passed
  return true;
}
```

**4. Test edge cases**:
- Null/undefined values
- Empty strings
- Invalid types
- Boundary values

## Output Format

```
✅ Custom Validator Created: <ValidatorName>

📁 File Created:
  - src/common/request/validations/request.<validator-name>.validation.ts (NEW)

🔧 Validator Details:
  Name: <ValidatorName>
  Type: Sync/Async
  Constraints: <param list>
  Default Message: "<error message>"

📝 Registration (if async with DI):
  Add to CommonModule providers:
  - <ValidatorName>Constraint

💡 Usage Example:
  ```typescript
  import { <ValidatorName> } from '@common/request/validations/request.<validator-name>.validation';

  class MyDto {
    @<ValidatorName>(<params>, { message: 'Custom error' })
    myField: <type>;
  }
  ```
```

## Notes and Best Practices

### Validation Logic

1. **Return boolean**: `validate()` must return `boolean` (or `Promise<boolean>` for async)
2. **Constraints**: Pass parameters via `constraints` array in `registerDecorator()`
3. **Access DTO**: Use `args.object` to access other fields
4. **Property name**: Use `args.property` for field name

### Error Messages

1. **Default message**: Implement `defaultMessage()` for helpful errors
2. **Custom messages**: Allow override via `validationOptions`
3. **Dynamic messages**: Use constraints or values in message
4. **Clear wording**: Explain what's wrong and how to fix it

### Async Validators

1. **Performance**: Avoid unnecessary async operations
2. **Caching**: Cache DB queries when possible
3. **Timeout**: Add timeout for external API calls
4. **Error handling**: Catch and log async errors

### Dependency Injection

1. **Injectable**: Mark constraint with `@Injectable()` if using DI
2. **Register provider**: Add to module providers
3. **Constructor injection**: Inject services in constraint constructor
4. **Circular deps**: Be careful with module dependencies

## Troubleshooting

### Validator Not Working

**Check**:
1. Validator registered as provider (for async/DI)
2. `@ValidatorConstraint()` decorator present
3. Class implements `ValidatorConstraintInterface`
4. Decorator exported and imported correctly

### Default Message Not Showing

**Check**:
1. Method named `defaultMessage` (no typo)
2. Signature matches: `defaultMessage?(args?: ValidationArguments): string`
3. Returns string, not undefined

### Async Validator Blocking

**Solution**: Set timeout, add logging, check async operations.

---

**End of Skill: gqlify:add-validator**

This skill creates production-ready custom validators following the NestJS GraphQL boilerplate patterns. All code examples are based on actual implementations from the boilerplate.
