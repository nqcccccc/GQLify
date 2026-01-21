# GQLify Command/Skill Development Analysis

## Executive Summary

Based on analysis of the actual NestJS GraphQL boilerplate at `/Users/cuongnq/Desktop/Learning.nosync/NESTJS/nestjs-graphql-boilerplate`, I've identified **critical gaps** between the existing templates and the real implementation. The project has several unique patterns and features that are not covered by the current GQLify templates.

## Current State

### Existing GQLify Commands (12 total)
Located in `templates/.claude/commands/gqlify/`:

**Audit Commands:**
- `audit-security.md` - Security scanning
- `audit-repo.md` - Full repository audit
- `validate.md` - Code validation with auto-fix
- `setup.md` - Project setup verification

**Generation Commands:**
- `generate-module.md` - Complete module scaffolding
- `generate-field.md` - DataLoader field resolvers
- `generate-query.md` - Query generation

**Modification Commands:**
- `add-field.md` - Add fields to entities
- `add-filter.md` - Add filtering capabilities
- `add-pagination.md` - Implement pagination
- `refactor.md` - Module refactoring

**Utility Commands:**
- `fix-error.md` - Error diagnosis and fixing

### Actual Boilerplate Features (Missing from Templates)

## CRITICAL GAPS - High Priority

### 1. **Export/Import Functionality** 🔴 CRITICAL

**What's Missing:**
The boilerplate has export/import capabilities that GQLify doesn't support:

**Evidence in Code:**
```typescript
// user.repository.ts:26
async getList(params: FilterUserInput, isExport = false): Promise<[User[], number]> {
  // Export mode returns raw data with joined relations
  if (isExport) {
    query.leftJoin('user.role', 'role');
    query.addSelect(['role.slug', 'role.name']);
    return [await query.getRawMany(), 0];
  }
}
```

**Common Pattern:**
- `isExport` parameter in repository methods
- Returns raw data instead of entities
- Joins relations for CSV/Excel export

**Required Command:**
```yaml
# add-export.md
name: gqlify:add-export
description: Add export functionality to a module (CSV/Excel)
argument-hint: <Module> [--format csv|excel]
```

**Implementation Needs:**
1. Add `isExport` parameter to repository `getList()` method
2. Modify query to select joined relation fields
3. Create export mutation in resolver
4. Add export DTO with format selection
5. Integrate with export utilities

---

### 2. **Batch Operations** 🔴 CRITICAL

**What's Missing:**
The boilerplate implements batch loading patterns beyond simple DataLoader:

**Evidence in Code:**
```typescript
// role.service.ts:128
async getRolePermissionsBatch(roleIds: number[]): Promise<Map<number, PermissionGroup[]>> {
  const roles = await this.roleRepository.find({
    where: { id: In(roleIds) },
    relations: ['rolePermissions', 'rolePermissions.permission'],
  });
  // Returns Map for DataLoader
}

// user.repository.ts:57
async getUserRolesBatch(userIds: string[]): Promise<Map<string, number>> {
  // Batch fetch for DataLoader optimization
}
```

**Required Command:**
```yaml
# generate-batch-method.md
name: gqlify:generate-batch
description: Generate batch loading methods for DataLoader optimization
argument-hint: <Module> <Field> <RelatedEntity>
```

**Implementation Needs:**
1. Create `get{Entity}{Field}Batch()` method in repository
2. Return `Map<ID, Result>` for DataLoader
3. Use `In()` operator for batch query
4. Handle nested relations properly

---

### 3. **Complex Filter Patterns** 🔴 CRITICAL

**What's Missing:**
The boilerplate uses sophisticated filtering beyond simple field matching:

**Evidence in Code:**
```typescript
// user.repository.ts:75
if (filter) {
  query.andWhere(
    '(user.email LIKE :filter OR user.username LIKE :filter)',
    { filter: `%${filter}%` }
  );
}

if (roles?.length) {
  query.andWhere('role.slug IN(:...roles)', { roles });
}
```

**Pattern:** Multi-field search with OR conditions + IN operators

**Required Enhancement:**
Update `add-filter.md` to support:
1. Multi-field OR search patterns
2. IN operator for array filters
3. Complex nested conditions
4. Join-based filtering

---

### 4. **Internationalization (i18n)** 🟡 HIGH

**What's Missing:**
The boilerplate heavily uses `nestjs-i18n` for messages:

**Evidence in Code:**
```typescript
// role.service.ts:23
private roleMessage: MessageService;

constructor(private readonly roleRepository: RoleRepository, i18nService: I18nService) {
  this.roleMessage = new MessageService(i18nService, 'role');
}

// Later usage:
throw ErrorFactory.business('IN_USED', this.roleMessage.get('IN_USED'));
```

**Pattern:**
- MessageService wrapper around i18nService
- Per-module message namespaces
- Error messages from JSON files (`src/languages/en/*.json`)

**Required Command:**
```yaml
# add-i18n.md
name: gqlify:add-i18n
description: Add internationalization support to a module
argument-hint: <Module>
```

**Implementation Needs:**
1. Create message files in `src/languages/en/<module>.json`
2. Add MessageService initialization in service constructor
3. Update all error messages to use i18n
4. Add validation message translations

---

### 5. **Ownership Check Decorator** 🟡 HIGH

**What's Missing:**
The boilerplate uses `@OwnershipCheck()` decorator for IDOR prevention:

**Evidence in Code:**
```typescript
// user.resolver.ts:68
@Mutation(() => Boolean)
@Auth({ permissions: 'user_manage_update' })
@OwnershipCheck({
  idArg: 'input.id',
  adminPermissions: ['user_manage_update'],
})
async updateUser(@Args('input') input: UpdateUserInput): Promise<boolean>
```

**Pattern:**
- Prevents users from modifying others' data
- Admins bypass the check with specific permissions
- Supports nested args (`input.id`)

**Required Enhancement:**
Update `generate-query.md` and `generate-module.md` to include:
1. `@OwnershipCheck()` decorator options
2. Proper `idArg` path configuration
3. Admin permission bypass logic

---

## MEDIUM PRIORITY GAPS

### 6. **Custom Validation Decorators** 🟠 MEDIUM

**What's Missing:**
The boilerplate has custom validators:

**Evidence:**
```typescript
// @IsEnumValue() - Custom enum validator
// @IsDateRange() - Date range validation
```

**Location:** `src/common/request/validations/`

**Required Command:**
```yaml
# add-custom-validator.md
name: gqlify:add-validator
description: Add custom validation decorator to common/request/validations
argument-hint: <ValidatorName> <Description>
```

---

### 7. **Helper Utilities** 🟠 MEDIUM

**What's Missing:**
The boilerplate has utility functions not mentioned in templates:

**Evidence:**
```typescript
// object.util.ts
wrapPagination<T>(data, count, params)

// date.util.ts
// Date manipulation helpers

// string.util.ts
// String transformation helpers

// transactionBuilder.util.ts
// Database transaction helpers
```

**Required Skill:**
```yaml
# add-utility.md
name: gqlify:add-utility
description: Add utility function to common/utils
argument-hint: <UtilityName> <Category: date|string|object|transaction>
```

---

### 8. **Background Jobs Integration** 🟠 MEDIUM

**What's Missing:**
The boilerplate uses BullMQ for background jobs:

**Evidence:**
- `src/common/jobs/` directory
- `src/common/mail/queues/send-mail.processor.ts`
- BullMQ integration in package.json

**Required Command:**
```yaml
# add-job.md
name: gqlify:add-job
description: Add background job processor using BullMQ
argument-hint: <JobName> <QueueName>
```

**Implementation Needs:**
1. Create job processor file
2. Register in jobs module
3. Add job interface/types
4. Create job producer helper

---

### 9. **Mail Templates** 🟠 MEDIUM

**What's Missing:**
The boilerplate has email template system:

**Evidence:**
```typescript
// src/common/mail/templates/verify-token-template.ts
// src/common/mail/templates/bank-template.ts
```

**Required Command:**
```yaml
# add-mail-template.md
name: gqlify:add-mail-template
description: Add email template with variables and styling
argument-hint: <TemplateName> <Purpose>
```

---

### 10. **Database Seeders** 🟠 MEDIUM

**What's Missing:**
The boilerplate has seeding infrastructure:

**Evidence:**
- `src/common/database/seeds/seed.ts`
- Command: `pnpm run seed`

**Required Command:**
```yaml
# generate-seeder.md
name: gqlify:generate-seeder
description: Generate database seeder for a module
argument-hint: <Module>
```

---

## LOW PRIORITY / NICE TO HAVE

### 11. **Health Checks** 🟢 LOW

**Evidence:**
- Uses `@nestjs/terminus`
- Health check endpoints

**Required:** Document in DEVELOPMENT.md

---

### 12. **GraphQL Plugins** 🟢 LOW

**Evidence:**
- `src/common/logger/plugins/graphql-logger.plugin.ts`
- Custom GraphQL plugins for logging

**Required:** Add to audit commands

---

## COMMAND STRUCTURE ISSUES

### Issue 1: Inconsistent Command Naming

**Current State:**
- Templates use: `gqlify:generate-module`
- Documentation refers to: `/generate-module`
- Some use namespace, some don't

**Required Fix:**
Standardize all commands to use `gqlify:` prefix consistently.

---

### Issue 2: Missing Real-World Patterns

**Current Templates Use:**
- Simple field types
- Basic validation
- Standard relationships

**Actual Boilerplate Uses:**
- Complex multi-table queries
- Custom decorators
- Service-level business logic
- Transaction management
- Soft delete cascades

**Required:** Update all templates with real patterns from boilerplate.

---

## RECOMMENDED IMPLEMENTATION PRIORITY

### Phase 1: Critical (Immediate)
1. ✅ Add `gqlify:add-export` command
2. ✅ Add `gqlify:generate-batch` command
3. ✅ Update `gqlify:add-filter` for complex patterns
4. ✅ Add `gqlify:add-i18n` command
5. ✅ Update all commands to include `@OwnershipCheck` patterns

### Phase 2: High Priority (This Week)
6. ✅ Add `gqlify:add-job` command
7. ✅ Add `gqlify:add-mail-template` command
8. ✅ Add `gqlify:add-utility` command
9. ✅ Add `gqlify:add-validator` command

### Phase 3: Medium Priority (This Month)
10. ✅ Add `gqlify:generate-seeder` command
11. ✅ Update documentation with i18n patterns
12. ✅ Add transaction management examples

### Phase 4: Optimization
13. ✅ Audit all existing commands against boilerplate
14. ✅ Update DEVELOPMENT.md templates with real code
15. ✅ Add integration tests for commands

---

## KEY FINDINGS

### 1. **Template-Reality Gap**
The current GQLify templates are **simplified versions** that don't reflect the complexity of the actual boilerplate:

**Missing:**
- Export/import functionality
- Batch operations for DataLoader
- Complex filtering (OR conditions, IN operators, joins)
- Internationalization integration
- Ownership checks
- Background jobs
- Mail templates
- Custom validators
- Utility helpers

### 2. **Service Layer Complexity**
The actual boilerplate has much richer service layer:

**Real Pattern:**
```typescript
class RoleService {
  private roleMessage: MessageService;  // i18n

  constructor(
    private roleRepo: RoleRepository,
    private permRepo: PermissionRepository, // Multiple repos
    i18nService: I18nService
  ) {
    this.roleMessage = new MessageService(i18nService, 'role');
  }

  async create(input) {
    await this._checkDuplicateSlug();  // Private validation
    await this._checkPermissionExist(); // Cross-entity validation
    // Complex business logic
  }
}
```

**Current Template Pattern:**
```typescript
class RoleService {
  constructor(private roleRepo: RoleRepository) {}

  async create(input) {
    return await this.roleRepo.save(input);
  }
}
```

### 3. **Missing Patterns**

**Repository Patterns:**
- ✅ Basic CRUD - Covered
- ❌ Export mode - **MISSING**
- ❌ Batch operations - **MISSING**
- ✅ Filtering - **Partially covered** (needs enhancement)
- ❌ Complex joins - **MISSING**

**Service Patterns:**
- ✅ Basic business logic - Covered
- ❌ Cross-entity validation - **MISSING**
- ❌ i18n message integration - **MISSING**
- ❌ Private helper methods - **MISSING**
- ❌ Transaction management - **MISSING**

**Resolver Patterns:**
- ✅ Basic queries/mutations - Covered
- ❌ Ownership checks - **MISSING**
- ✅ DataLoader field resolvers - Covered
- ❌ Export endpoints - **MISSING**

---

## COMMAND SPECIFICATIONS

### New Command: `gqlify:add-export`

```markdown
---
name: gqlify:add-export
description: Add CSV/Excel export functionality to an existing module's list query
argument-hint: <Module> [--format csv|excel]
disable-model-invocation: true
---

You are a GQLify export specialist. Add export functionality to $ARGUMENTS.

## Task

Add export capability to the {Module} module that allows downloading the list query results as CSV or Excel.

## Execution Steps

1. **Update Repository:**
   - Modify `getList()` method to accept `isExport` parameter
   - Add export mode logic that joins relations and returns raw data

2. **Create Export Mutation:**
   - Add `export{Module}s` mutation to resolver
   - Use same filter params as list query
   - Return file URL or Base64 data

3. **Add Export DTO:**
   - Create `Export{Module}Input` extending filter params
   - Add format field (CSV/EXCEL enum)

4. **Update Service:**
   - Add `export()` method
   - Call repository with `isExport=true`
   - Format data based on requested type

## Pattern from Boilerplate

```typescript
// Repository
async getList(params: FilterInput, isExport = false): Promise<[Entity[], number]> {
  const query = this.createQueryBuilder('entity');

  // Apply filters...

  if (isExport) {
    // Join relations for export
    if (!params.someFilter) {
      query.leftJoin('entity.relation', 'relation');
    }
    query.addSelect(['relation.field1', 'relation.field2']);
    return [await query.getRawMany(), 0];
  }

  return await query.getManyAndCount();
}
```
```

---

### New Command: `gqlify:generate-batch`

```markdown
---
name: gqlify:generate-batch
description: Generate batch loading methods for DataLoader optimization
argument-hint: <Module> <Field> <RelatedEntity>
disable-model-invocation: true
---

You are a GQLify DataLoader specialist. Generate batch loading method for $ARGUMENTS.

## Task

Create a batch loading method in {Module}Repository that efficiently loads {Field} ({RelatedEntity}) for multiple entities at once.

## Pattern from Boilerplate

```typescript
// In repository
async get{Entity}{Field}Batch(ids: string[]): Promise<Map<string, RelatedEntity>> {
  const results = await this.createQueryBuilder('entity')
    .leftJoinAndSelect('entity.{field}', '{field}')
    .where('entity.id IN (:...ids)', { ids })
    .getMany();

  const map = new Map<string, RelatedEntity>();
  for (const result of results) {
    map.set(result.id, result.{field});
  }
  return map;
}
```

## For One-to-Many Relations

```typescript
async get{Entity}{Field}Batch(parentIds: string[]): Promise<Map<string, RelatedEntity[]>> {
  const items = await this.relatedRepository.find({
    where: { {parentIdField}: In(parentIds) }
  });

  const map = new Map<string, RelatedEntity[]>();
  items.forEach(item => {
    const existing = map.get(item.{parentIdField}) || [];
    existing.push(item);
    map.set(item.{parentIdField}, existing);
  });

  return parentIds.map(id => map.get(id) || []);
}
```
```

---

## CONCLUSION

The GQLify project needs **10 new commands** and **updates to 5 existing commands** to fully support the patterns used in the actual NestJS GraphQL boilerplate.

### Immediate Actions Required:

1. **Create 5 critical commands** (export, batch, i18n, job, mail-template)
2. **Update 3 existing commands** (add-filter, generate-module, generate-query)
3. **Enhance DEVELOPMENT.md** with real boilerplate patterns
4. **Test against actual project** to ensure compatibility

### Success Metrics:

- ✅ Can generate modules matching actual boilerplate 100%
- ✅ All audit commands validate against real patterns
- ✅ Commands handle complex cases (i18n, ownership, exports)
- ✅ Zero manual fixes needed after generation
