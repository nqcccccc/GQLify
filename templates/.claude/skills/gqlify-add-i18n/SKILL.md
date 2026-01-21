---
name: gqlify:add-i18n
description: Add internationalization (i18n) support to a module using nestjs-i18n. Creates language JSON files, updates service to use MessageService, and converts error messages to use translations.
argument-hint: <Module>
disable-model-invocation: true
---

You are a GQLify internationalization specialist. Your task is to add i18n support to the module specified in `$ARGUMENTS`.

## Task

Add internationalization (i18n) support to **$ARGUMENTS** module, enabling multi-language error messages and user-facing text using `nestjs-i18n` and the `MessageService` wrapper.

## Pre-requisites

Before starting, verify:
1. The module exists in `src/modules/<module-lower>/`
2. `nestjs-i18n` is installed and configured in the project
3. `MessageService` exists at `src/common/message/services/message.service.ts`
4. Language directory exists at `src/languages/en/`

## Execution Steps

### Step 1: Analyze Current Error Messages

Read the service file to identify all error messages:
- `src/modules/<module-lower>/services/<module>.service.ts`

Look for:
- `throw ErrorFactory.*()` calls with hardcoded messages
- User-facing text that should be translatable
- Validation error messages
- Business rule violation messages

### Step 2: Create Language File

Create `src/languages/en/<module>.json` with all message keys:

```json
{
  "NOT_FOUND": "The <module> was not found.",
  "IN_USED": "The <module> is currently in use and cannot be deleted.",
  "SLUG_INVALID": "The slug is already in use. Please choose a different one.",
  "NAME_REQUIRED": "The name field is required.",
  "INVALID_STATUS": "The status value is invalid.",
  "DUPLICATE_ENTRY": "A <module> with this information already exists.",
  "PERMISSION_DENIED": "You do not have permission to perform this action."
}
```

**Message Key Conventions:**
- Use SCREAMING_SNAKE_CASE for keys
- Be specific and descriptive
- Include context in the message
- Keep messages professional and user-friendly
- Use consistent terminology

**Real-world examples from boilerplate:**

```json
// user.json
{
  "REFERRAL_CODE_INVALID": "The referral code you entered is invalid.",
  "NOT_ALLOW": "You are not allowed to perform this action.",
  "USERNAME_IN_USED": "The username is already in use.",
  "EMAIL_IN_USED": "The email address is already in use",
  "NEW_PASS_SAME_CUR_PASS": "The new password cannot be the same as the current password.",
  "PASS_NOT_MATCH": "The password does not match."
}

// auth.json
{
  "UNAUTHORIZED": "You are not authorized to access this resource.",
  "TOKEN_INVALID": "The token provided is invalid.",
  "TOKEN_EXPIRED": "The token has expired.",
  "USER_NOT_FOUND": "The user was not found.",
  "ACCOUNT_INACTIVE": "The account is inactive.",
  "FORBIDDEN": "You do not have permission to access this resource."
}
```

### Step 3: Update Service Constructor

Modify the service to initialize `MessageService`:

```typescript
import { MessageService } from '@common/message/services/message.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class <Module>Service {
  private <module>Message: MessageService;

  constructor(
    private readonly repository: <Module>Repository,
    // ... other dependencies
    i18nService: I18nService,
  ) {
    this.<module>Message = new MessageService(i18nService, '<module>');
  }

  // ... methods
}
```

**Key points:**
- Declare private property: `private <module>Message: MessageService`
- Inject `I18nService` in constructor
- Initialize MessageService with module namespace: `new MessageService(i18nService, '<module>')`
- The namespace matches the JSON filename (e.g., 'user' for `user.json`)

**Real-world example from boilerplate:**

```typescript
// role.service.ts
@Injectable()
export class RoleService {
  private roleMessage: MessageService;

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    i18nService: I18nService,
  ) {
    this.roleMessage = new MessageService(i18nService, 'role');
  }
}
```

### Step 4: Update Error Messages

Replace hardcoded error messages with i18n lookups:

#### Pattern 1: Not Found Error

**Before:**
```typescript
throw ErrorFactory.notFound('<Module>', id);
```

**After:**
```typescript
const <module> = await this.repository.findOne({ where: { id } });
if (!<module>) {
  throw ErrorFactory.notFound('<Module>', id);
}
// Note: ErrorFactory.notFound() has a default message,
// but you can override if needed:
// throw ErrorFactory.notFound('<Module>', id, this.<module>Message.get('NOT_FOUND'));
```

#### Pattern 2: Business Rule Violation

**Before:**
```typescript
if (condition) {
  throw new Error('The <module> is in use');
}
```

**After:**
```typescript
if (condition) {
  throw ErrorFactory.business('IN_USED', this.<module>Message.get('IN_USED'));
}
```

#### Pattern 3: Duplicate Entry

**Before:**
```typescript
if (existing) {
  throw new Error('Slug already exists');
}
```

**After:**
```typescript
if (existing) {
  throw ErrorFactory.business(
    'SLUG_INVALID',
    this.<module>Message.get('SLUG_INVALID')
  );
}
```

#### Pattern 4: Validation Error

**Before:**
```typescript
if (!data.name) {
  throw new Error('Name is required');
}
```

**After:**
```typescript
if (!data.name) {
  throw ErrorFactory.validation(
    'NAME_REQUIRED',
    this.<module>Message.get('NAME_REQUIRED')
  );
}
```

#### Pattern 5: Permission Denied

**Before:**
```typescript
if (!hasPermission) {
  throw new Error('Not allowed');
}
```

**After:**
```typescript
if (!hasPermission) {
  throw ErrorFactory.forbidden(this.<module>Message.get('PERMISSION_DENIED'));
}
```

### Step 5: Complete Service Update

Update all error-throwing code in the service:

```typescript
@Injectable()
export class <Module>Service {
  private <module>Message: MessageService;

  constructor(
    private readonly repository: <Module>Repository,
    i18nService: I18nService,
  ) {
    this.<module>Message = new MessageService(i18nService, '<module>');
  }

  async create(input: Create<Module>Input): Promise<void> {
    // Check for duplicates
    await this._checkDuplicateSlug(input.slug);

    const <module> = this.repository.create(input);
    await this.repository.save(<module>);
  }

  async update(input: Update<Module>Input): Promise<void> {
    const <module> = await this.repository.findOne({ where: { id: input.id } });

    if (!<module>) {
      throw ErrorFactory.notFound('<Module>', input.id.toString());
    }

    await this._checkDuplicateSlug(input.slug, input.id);

    Object.assign(<module>, input);
    await this.repository.save(<module>);
  }

  async delete(id: string): Promise<void> {
    const <module> = await this.repository.findOne({
      where: { id },
      relations: ['relatedEntities'],
    });

    if (!<module>) {
      throw ErrorFactory.notFound('<Module>', id);
    }

    // Check if in use
    if (<module>.relatedEntities.length > 0) {
      throw ErrorFactory.business('IN_USED', this.<module>Message.get('IN_USED'));
    }

    await this.repository.softDelete(id);
  }

  private async _checkDuplicateSlug(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.repository.findOne({ where: { slug } });

    if (existing && (!excludeId || existing.id !== excludeId)) {
      throw ErrorFactory.business(
        'SLUG_INVALID',
        this.<module>Message.get('SLUG_INVALID')
      );
    }
  }
}
```

**Real-world example from boilerplate:**

```typescript
// role.service.ts
async delete(id: number): Promise<void> {
  const role = await this.roleRepository.findOne({
    where: { id },
    relations: ['users'],
  });

  if (!role) {
    throw ErrorFactory.notFound('Role', id.toString());
  }

  if (role.users.length) {
    throw ErrorFactory.business('IN_USED', this.roleMessage.get('IN_USED'));
  }

  await this.roleRepository.delete(id);
}

private async _checkDuplicateSlug(slug: string, id?: number): Promise<Role | null> {
  const role = await this.roleRepository.findOne({ where: { slug } });

  if (role && (!id || role.id !== id)) {
    throw ErrorFactory.business(
      'SLUG_INVALID',
      this.roleMessage.get('SLUG_INVALID')
    );
  }

  return role;
}
```

### Step 6: Add Additional Languages (Optional)

If supporting multiple languages, create additional JSON files:

```
src/languages/
├── en/
│   └── <module>.json
├── es/
│   └── <module>.json  (Spanish translations)
├── fr/
│   └── <module>.json  (French translations)
└── vi/
    └── <module>.json  (Vietnamese translations)
```

Example Spanish translation (`es/<module>.json`):
```json
{
  "NOT_FOUND": "No se encontró el <module>.",
  "IN_USED": "El <module> está actualmente en uso y no se puede eliminar.",
  "SLUG_INVALID": "El slug ya está en uso. Por favor, elija uno diferente."
}
```

### Step 7: Validation

After implementation, verify:

- [ ] Language JSON file created with all message keys
- [ ] Service constructor injects `I18nService`
- [ ] MessageService initialized with correct namespace
- [ ] All error messages use `this.<module>Message.get()`
- [ ] Message keys match JSON file keys exactly
- [ ] No hardcoded error messages remain
- [ ] No TypeScript errors
- [ ] Build succeeds: `pnpm run build`

### Step 8: Testing

Test i18n functionality:

#### Test 1: Trigger Business Error
```graphql
mutation {
  delete<Module>(id: "<id-in-use>")
}
```

Expected error response:
```json
{
  "errors": [
    {
      "message": "The <module> is currently in use and cannot be deleted.",
      "extensions": {
        "code": "IN_USED",
        "category": "BUSINESS"
      }
    }
  ]
}
```

#### Test 2: Trigger Duplicate Error
```graphql
mutation {
  create<Module>(input: {
    slug: "existing-slug"
  })
}
```

Expected error response:
```json
{
  "errors": [
    {
      "message": "The slug is already in use. Please choose a different one.",
      "extensions": {
        "code": "SLUG_INVALID",
        "category": "BUSINESS"
      }
    }
  ]
}
```

#### Test 3: Language Switching (if multi-language)

Set request header:
```
x-custom-lang: es
```

Expected: Error messages in Spanish

## MessageService API

The MessageService wrapper provides these methods:

```typescript
class MessageService {
  /**
   * Get message by key
   * @param key - Message key from JSON file
   * @param options - Optional interpolation values
   */
  get(key: string, options?: Record<string, any>): string;
}
```

### Message Interpolation

For dynamic values in messages:

```json
{
  "ITEMS_FOUND": "Found {count} {type} items"
}
```

```typescript
this.<module>Message.get('ITEMS_FOUND', { count: 5, type: 'active' })
// Returns: "Found 5 active items"
```

## Best Practices

### 1. Message Key Naming

**Good:**
- `EMAIL_IN_USED` - Clear and specific
- `SLUG_INVALID` - Describes the issue
- `PERMISSION_DENIED` - Actionable

**Bad:**
- `ERROR_1` - Not descriptive
- `bad_slug` - Inconsistent casing
- `Error` - Too generic

### 2. Message Content

**Good:**
- "The email address is already in use" - Specific and helpful
- "The slug is already in use. Please choose a different one." - Actionable
- "You do not have permission to perform this action." - Clear

**Bad:**
- "Error" - Not helpful
- "Bad request" - Too generic
- "Invalid" - No context

### 3. Consistency

- Use the same terminology across all modules
- Maintain consistent tone (professional, friendly)
- Keep message structure similar for similar errors

### 4. Error Categories

Match error category to ErrorFactory method:

| Category | ErrorFactory Method | Use Case |
|----------|-------------------|----------|
| BUSINESS | `ErrorFactory.business()` | Business rule violations |
| VALIDATION | `ErrorFactory.validation()` | Input validation errors |
| NOT_FOUND | `ErrorFactory.notFound()` | Resource not found |
| FORBIDDEN | `ErrorFactory.forbidden()` | Permission denied |
| AUTHENTICATION | `ErrorFactory.unauthorized()` | Auth required |

## Common Message Keys

Standard message keys to include in every module:

```json
{
  "NOT_FOUND": "The {entity} was not found.",
  "IN_USED": "The {entity} is currently in use and cannot be deleted.",
  "CREATE_SUCCESS": "The {entity} was created successfully.",
  "UPDATE_SUCCESS": "The {entity} was updated successfully.",
  "DELETE_SUCCESS": "The {entity} was deleted successfully.",
  "DUPLICATE_ENTRY": "A {entity} with this information already exists.",
  "INVALID_INPUT": "The input provided is invalid.",
  "PERMISSION_DENIED": "You do not have permission to perform this action."
}
```

## Output Format

After successful execution, report:

```
✅ i18n Support Added to <Module>

Created files:
  - src/languages/en/<module>.json (X message keys)

Modified files:
  - src/modules/<module>/services/<module>.service.ts

Changes:
  - Added MessageService initialization
  - Converted X hardcoded messages to i18n
  - All error messages now use translation keys

Message keys added:
  - NOT_FOUND
  - IN_USED
  - SLUG_INVALID
  - [... other keys]

Next steps:
  1. Test error messages in GraphQL playground
  2. Add translations for other languages (es, fr, vi)
  3. Verify all error scenarios use i18n
```

## Notes

- Always inject `I18nService` in constructor for i18n support
- Use consistent message key naming (SCREAMING_SNAKE_CASE)
- ErrorFactory methods accept both code and message parameters
- MessageService namespace must match JSON filename
- Keep messages user-friendly and actionable
- Consider adding context or suggestions in error messages
- For multi-language support, translate all JSON files
- Test error messages in different languages if applicable
