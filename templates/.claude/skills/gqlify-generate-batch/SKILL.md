---
name: gqlify:generate-batch
description: Generate batch loading methods in repository and service for DataLoader optimization. Prevents N+1 query problems when loading relations for multiple entities.
argument-hint: <Module> <Field> <RelatedEntity>
disable-model-invocation: true
---

You are a GQLify DataLoader optimization specialist. Your task is to generate batch loading methods for the module specified in `$ARGUMENTS`.

## Task

Create batch loading method for **$ARGUMENTS** that efficiently loads related entities for multiple parent entities at once, preventing N+1 query problems.

## Command Format

```
$ARGUMENTS = <Module> <Field> <RelatedEntity>
```

Example: `User role Role` (loads Role for multiple Users)

## Pre-requisites

Before starting, verify:
1. The parent module exists in `src/modules/<module-lower>/`
2. The related entity exists in `src/modules/<related-lower>/`
3. A DataLoader factory exists at `src/common/dataloader/dataloader.factory.ts`
4. The parent entity has a foreign key field (for many-to-one) or the related entity has a foreign key (for one-to-many)

## Execution Steps

### Step 1: Identify Relationship Type

Determine the relationship type by examining the entities:

**Many-to-One (BelongsTo):**
- Parent entity has `<field>Id` foreign key
- Example: User has `roleId`, loads single Role
- DataLoader key: foreign key value
- DataLoader returns: single entity or null

**One-to-Many (HasMany):**
- Related entity has `<parent>Id` foreign key
- Example: Product has many Reviews
- DataLoader key: parent entity ID
- DataLoader returns: array of entities

### Step 2: Add Batch Method to Repository (Many-to-One)

For many-to-one relationships, add to `<Module>Repository`:

```typescript
/**
 * Batch fetch <field> for multiple <module>s
 * Used by DataLoader to prevent N+1 query problems
 */
async get<Module><Field>Batch(<module>Ids: string[]): Promise<Map<string, <RelatedEntity> | null>> {
  const <modules> = await this.createQueryBuilder('<module>')
    .select(['<module>.id', '<module>.<field>Id'])
    .leftJoinAndSelect('<module>.<field>', '<field>')
    .where('<module>.id IN (:...<module>Ids)', { <module>Ids })
    .getMany();

  const result = new Map<string, <RelatedEntity> | null>();

  for (const <module> of <modules>) {
    result.set(<module>.id, <module>.<field> || null);
  }

  return result;
}
```

**Key points:**
- Method name: `get{Module}{Field}Batch`
- Parameter: array of parent IDs
- Returns: Map<ParentID, RelatedEntity | null>
- Uses `leftJoinAndSelect` to load relation
- Returns null if relation doesn't exist

### Step 3: Add Batch Method to Repository (One-to-Many)

For one-to-many relationships, add to related entity's repository or create in parent repository:

```typescript
/**
 * Batch fetch <related>s for multiple <module>s
 * Used by DataLoader to prevent N+1 query problems
 */
async get<Module><Related>sBatch(<module>Ids: string[]): Promise<Map<string, <RelatedEntity>[]>> {
  const <related>s = await this.<relatedRepository>.find({
    where: { <module>Id: In(<module>Ids) }
  });

  const result = new Map<string, <RelatedEntity>[]>();

  for (const <related> of <related>s) {
    const existing = result.get(<related>.<module>Id) || [];
    existing.push(<related>);
    result.set(<related>.<module>Id, existing);
  }

  // Ensure all requested IDs have an entry (even if empty array)
  for (const id of <module>Ids) {
    if (!result.has(id)) {
      result.set(id, []);
    }
  }

  return result;
}
```

**Key points:**
- Method name: `get{Module}{Related}sBatch` (plural for array)
- Uses `In()` operator for efficient batch query
- Returns: Map<ParentID, RelatedEntity[]>
- Always returns empty array if no relations found

### Step 4: Add Batch Method to Service

Add batch method to `<Module>Service` (if complex business logic is needed):

```typescript
/**
 * Batch load <field> for multiple <module>s
 * Called by DataLoader
 */
async get<Module><Field>Batch(<module>Ids: string[]): Promise<Map<string, <RelatedEntity> | null>> {
  return await this.repository.get<Module><Field>Batch(<module>Ids);
}
```

**Note:** Only add service method if you need to:
- Apply business logic before/after loading
- Transform data
- Handle permissions
- Otherwise, DataLoader can call repository directly

### Step 5: Update DataLoader Factory

Modify `src/common/dataloader/dataloader.factory.ts`:

#### 5.1: Update DataLoaders Interface

```typescript
export interface DataLoaders {
  // ... existing loaders
  <module><Field>: DataLoader<string, <RelatedEntity> | null>;
  // Or for one-to-many:
  // <module><Related>s: DataLoader<string, <RelatedEntity>[]>;
}
```

#### 5.2: Inject Repository in Constructor

```typescript
constructor(
  // ... existing dependencies
  private readonly <module>Repository: <Module>Repository,
  // Or if using related repository:
  // private readonly <related>Repository: <RelatedEntity>Repository,
) {}
```

#### 5.3: Create Loader Method (Many-to-One)

```typescript
private create<Module><Field>Loader(): DataLoader<string, <RelatedEntity> | null> {
  return new DataLoader<string, <RelatedEntity> | null>(
    async (<module>Ids: readonly string[]) => {
      const map = await this.<module>Repository.get<Module><Field>Batch(
        Array.from(<module>Ids)
      );

      // Return results in same order as input IDs
      return <module>Ids.map((id) => map.get(id) || null);
    },
    {
      cache: true,
      batch: true,
    },
  );
}
```

#### 5.4: Create Loader Method (One-to-Many)

```typescript
private create<Module><Related>sLoader(): DataLoader<string, <RelatedEntity>[]> {
  return new DataLoader<string, <RelatedEntity>[]>(
    async (<module>Ids: readonly string[]) => {
      const map = await this.<module>Repository.get<Module><Related>sBatch(
        Array.from(<module>Ids)
      );

      // Return results in same order as input IDs
      return <module>Ids.map((id) => map.get(id) || []);
    },
    {
      cache: true,
      batch: true,
    },
  );
}
```

#### 5.5: Add to createLoaders()

```typescript
createLoaders(): DataLoaders {
  return {
    // ... existing loaders
    <module><Field>: this.create<Module><Field>Loader(),
    // Or for one-to-many:
    // <module><Related>s: this.create<Module><Related>sLoader(),
  };
}
```

### Step 6: Update DataLoader Module Imports

If you injected a new repository, update `src/common/dataloader/dataloader.module.ts`:

```typescript
import { <Module>RepositoryModule } from '@modules/<module>/repository/<module>.repository.module';

@Module({
  imports: [
    // ... existing imports
    <Module>RepositoryModule,
  ],
  // ...
})
export class DataLoaderModule {}
```

### Step 7: Update Field Resolver (If Needed)

If the field resolver doesn't exist yet, add to `<Module>Resolver`:

```typescript
import { DataLoaders } from '@common/dataloader/dataloader.factory';

@ResolveField(() => <RelatedEntity>, { nullable: true })
async <field>(
  @Parent() <module>: <Module>,
  @Context() ctx: { loaders: DataLoaders },
): Promise<<RelatedEntity> | null> {
  // If already loaded, return it
  if (<module>.<field>) {
    return <module>.<field>;
  }

  // Use DataLoader to batch fetch
  if (!<module>.<field>Id) {
    return null;
  }

  return ctx.loaders.<module><Field>.load(<module>.<field>Id);
}
```

For one-to-many:

```typescript
@ResolveField(() => [<RelatedEntity>])
async <related>s(
  @Parent() <module>: <Module>,
  @Context() ctx: { loaders: DataLoaders },
): Promise<<RelatedEntity>[]> {
  // If already loaded, return them
  if (<module>.<related>s) {
    return <module>.<related>s;
  }

  // Use DataLoader to batch fetch
  return ctx.loaders.<module><Related>s.load(<module>.id);
}
```

### Step 8: Validation

After implementation, verify:

- [ ] Batch method added to repository
- [ ] Batch method returns Map with correct types
- [ ] DataLoader interface updated
- [ ] DataLoader factory method created
- [ ] DataLoader added to createLoaders()
- [ ] Required repository imported in DataLoaderModule
- [ ] Field resolver uses DataLoader from context
- [ ] No TypeScript errors
- [ ] Build succeeds: `pnpm run build`

### Step 9: Testing

Test the batch loading to verify N+1 prevention:

**Before (N+1 queries):**
```
Query: 10 users with roles
1. SELECT * FROM users LIMIT 10
2. SELECT * FROM roles WHERE id = 1
3. SELECT * FROM roles WHERE id = 2
4. SELECT * FROM roles WHERE id = 1  (duplicate!)
5. SELECT * FROM roles WHERE id = 3
...
Total: 1 + N queries (11 queries)
```

**After (with DataLoader):**
```
Query: 10 users with roles
1. SELECT * FROM users LIMIT 10
2. SELECT * FROM roles WHERE id IN (1, 2, 3, ...)
Total: 2 queries
```

Enable query logging to verify:
```typescript
// In database config
logging: true
```

## Real-World Patterns from Boilerplate

### Pattern 1: Many-to-One (User -> Role)

```typescript
// user.repository.ts
async getUserRolesBatch(userIds: string[]): Promise<Map<string, number>> {
  const users = await this.createQueryBuilder('user')
    .select(['user.id', 'user.roleId'])
    .where('user.id IN (:...userIds)', { userIds })
    .getMany();

  const result = new Map<string, number>();
  for (const user of users) {
    result.set(user.id, user.roleId);
  }
  return result;
}
```

### Pattern 2: One-to-Many (Role -> Permissions)

```typescript
// role.service.ts
async getRolePermissionsBatch(roleIds: number[]): Promise<Map<number, PermissionGroup[]>> {
  const roles = await this.roleRepository.find({
    where: { id: In(roleIds) },
    relations: ['rolePermissions', 'rolePermissions.permission'],
  });

  const result = new Map<number, PermissionGroup[]>();

  for (const role of roles) {
    const permissions = role.rolePermissions.map((rp) => rp.permission);
    const groupedPermissions = this._groupPermissions(permissions);

    const permissionGroups = Object.entries(groupedPermissions).map(
      ([module, perms]) => ({ module, permissions: perms }),
    );

    result.set(role.id, permissionGroups);
  }

  return result;
}
```

### Pattern 3: DataLoader Factory

```typescript
// dataloader.factory.ts
export interface DataLoaders {
  rolePermissions: DataLoader<number, PermissionGroup[]>;
  roles: DataLoader<number, Role | null>;
}

@Injectable()
export class DataLoaderFactory {
  constructor(
    private readonly roleService: RoleService,
    private readonly roleRepository: RoleRepository,
  ) {}

  createLoaders(): DataLoaders {
    return {
      rolePermissions: this.createRolePermissionsLoader(),
      roles: this.createRolesLoader(),
    };
  }

  private createRolePermissionsLoader(): DataLoader<number, PermissionGroup[]> {
    return new DataLoader<number, PermissionGroup[]>(
      async (roleIds: readonly number[]) => {
        const permissionsByRole = await this.roleService.getRolePermissionsBatch(
          Array.from(roleIds)
        );
        return roleIds.map((roleId) => permissionsByRole.get(roleId) || []);
      },
      { cache: true, batch: true },
    );
  }

  private createRolesLoader(): DataLoader<number, Role | null> {
    return new DataLoader<number, Role | null>(
      async (roleIds: readonly number[]) => {
        const roles = await this.roleRepository.find({
          where: { id: In(Array.from(roleIds)) },
        });

        const rolesMap = new Map<number, Role>();
        for (const role of roles) {
          rolesMap.set(role.id, role);
        }

        return roleIds.map((roleId) => rolesMap.get(roleId) || null);
      },
      { cache: true, batch: true },
    );
  }
}
```

## Output Format

After successful execution, report:

```
✅ Batch Loading Added for <Module>.<field>

Modified files:
  - src/modules/<module>/repository/repositories/<module>.repository.ts
  - src/common/dataloader/dataloader.factory.ts
  - src/common/dataloader/dataloader.module.ts (if needed)

Added methods:
  - Repository: get<Module><Field>Batch()
  - Factory: create<Module><Field>Loader()
  - Interface: DataLoaders.<module><Field>

Performance impact:
  - Prevents N+1 queries when loading <field> for multiple <module>s
  - Reduces database queries from O(N) to O(1)
  - Batches and caches requests per GraphQL request

Next steps:
  1. Test field resolver in GraphQL playground
  2. Enable query logging to verify batching
  3. Monitor query performance improvements
```

## Notes

- DataLoader instances are created per-request for proper batching
- The `cache: true` option caches within a single request only
- Always return results in the same order as input IDs
- Handle null cases gracefully (missing relations)
- For complex transformations, use service layer between repository and DataLoader
- Consider using existing DataLoader for nested relations
