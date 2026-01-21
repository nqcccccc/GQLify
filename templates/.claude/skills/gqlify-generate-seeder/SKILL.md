---
name: gqlify:generate-seeder
description: Generate a database seeder script for populating initial data with transactions and relation handling
argument-hint: <ModuleName> [--standalone]
disable-model-invocation: false
---

# GQLify: Generate Database Seeder

You are a GQLify database seeding specialist. Your expertise is in creating seed scripts that populate initial data following the NestJS GraphQL boilerplate patterns.

## Task

Generate a database seeder for: $ARGUMENTS

This command creates seed scripts that populate database with initial/test data using TypeORM transactions.

## Pre-requisites Check

Before implementing, verify:

1. **Seed Infrastructure**:
   - `src/common/database/seeds/` directory exists
   - Main `seed.ts` file exists as reference
   - Package.json has seed script

2. **Dependencies**:
   - TypeORM installed and configured
   - Entities defined for the module
   - `.env` has database connection settings

3. **Utilities**:
   - `hashPassword()` utility exists (for user passwords)
   - Other relevant utilities available

## Implementation Steps

### Step 1: Determine Seeder Type

Parse `$ARGUMENTS`:
- If `--standalone`: Create separate seeder file
- Default: Add to existing `seed.ts`

Extract module name (convert to PascalCase for entity, kebab-case for files).

### Step 2: Create Standalone Seeder (if --standalone)

**Location**: `src/common/database/seeds/<module-name>.seed.ts`

**Pattern from**: `seed.ts`

**Template**:
```typescript
import '@dotenvx/dotenvx/config';

import { <Entity> } from '@modules/<module>/repository/entities/<entity>.entity';
// Import related entities if needed
// import { RelatedEntity } from '@modules/related/repository/entities/related.entity';

import { join } from 'path';
import { DataSource } from 'typeorm';

// Create DataSource for seeding
const seedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  logging: process.env.DATABASE_DEBUG === 'true' || false,
  entities: [
    join(__dirname, '../../../modules/**/*.entity{.ts,.js}'),
    join(__dirname, '../../../auth/**/*.entity{.ts,.js}'),
  ],
  migrations: [join(__dirname, '../migrations/', '*.{ts,js}')],
});

// Define seed data structure
interface <Module>Data {
  // Define fields matching entity
  // Example: name: string;
  // Example: slug: string;
}

const logger = console;

// Define seed data
const <MODULE>_DATA: <Module>Data[] = [
  {
    // Sample data 1
  },
  {
    // Sample data 2
  },
  // Add more data as needed
];

/**
 * Seed <Module> data
 */
async function seed() {
  let dataSource: DataSource | null = null;

  try {
    logger.info('🌱 Starting <Module> seeding...\\n');

    // Initialize data source
    dataSource = await seedDataSource.initialize();
    logger.info('✅ Database connection established\\n');

    // Start transaction
    await dataSource.transaction(async (manager) => {
      logger.info('📝 Seeding <module> data...');

      let createdCount = 0;
      let existingCount = 0;

      for (const data of <MODULE>_DATA) {
        // Check if already exists (use unique field, e.g., slug, email)
        let entity = await manager.findOne(<Entity>, {
          where: { <uniqueField>: data.<uniqueField> },
        });

        if (!entity) {
          // Create new entity
          entity = manager.create(<Entity>, data);
          await manager.save(entity);
          logger.info(`  ✓ Created: ${data.<displayField>}`);
          createdCount++;
        } else {
          logger.info(`  ⊙ Already exists: ${data.<displayField>}`);
          existingCount++;
        }
      }

      logger.info(`\\n✅ <Module> seeding completed!`);
      logger.info(`   Created: ${createdCount}`);
      logger.info(`   Existing: ${existingCount}`);
      logger.info(`   Total: ${<MODULE>_DATA.length}\\n`);
    });
  } catch (error) {
    logger.error('\\n❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      logger.info('✅ Database connection closed\\n');
    }
  }
}

// Run the seed
seed()
  .then(() => {
    logger.info('✨ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Fatal error:', error);
    process.exit(1);
  });
```

### Step 3: Add to Existing Seed.ts (Default)

**Location**: `src/common/database/seeds/seed.ts`

**Add import**:
```typescript
import { <Entity> } from '@modules/<module>/repository/entities/<entity>.entity';
```

**Add data definition**:
```typescript
interface <Module>Data {
  <field>: <type>;
  // ... other fields
}

const <MODULE>_DATA: <Module>Data[] = [
  // Data items
];
```

**Add seeding logic in transaction**:
```typescript
await dataSource.transaction(async (manager) => {
  // ... existing seed logic

  // Add new section
  logger.info('📝 Seeding <module> data...');

  for (const data of <MODULE>_DATA) {
    let entity = await manager.findOne(<Entity>, {
      where: { <uniqueField>: data.<uniqueField> },
    });

    if (!entity) {
      entity = manager.create(<Entity>, data);
      await manager.save(entity);
      logger.info(`  ✓ Created <module>: ${data.<displayField>}`);
    } else {
      logger.info(`  ⊙ <Module> already exists: ${data.<displayField>}`);
    }
  }

  logger.info(`✅ <Module> data seeded\\n`);
});
```

### Step 4: Real-World Patterns

#### Pattern 1: Simple Entity Seeding

**Use case**: Seed independent entities (categories, statuses, etc.)

```typescript
const CATEGORY_DATA = [
  { name: 'Electronics', slug: 'electronics', position: 1 },
  { name: 'Books', slug: 'books', position: 2 },
  { name: 'Clothing', slug: 'clothing', position: 3 },
];

for (const data of CATEGORY_DATA) {
  let category = await manager.findOne(Category, {
    where: { slug: data.slug },
  });

  if (!category) {
    category = manager.create(Category, data);
    await manager.save(category);
    logger.info(`  ✓ Created category: ${data.slug}`);
  }
}
```

#### Pattern 2: Entities with Relations

**Use case**: Seed with foreign keys (user with role)

**Pattern from**: `seed.ts:260-278`

```typescript
// First, seed the parent (Role)
let adminRole = await manager.findOne(Role, {
  where: { slug: 'admin' },
});

if (!adminRole) {
  adminRole = manager.create(Role, {
    name: 'Administrator',
    slug: 'admin',
  });
  await manager.save(adminRole);
}

// Then seed the child with relation (User)
const adminEmail = 'admin@example.com';
let adminUser = await manager.findOne(User, {
  where: { email: adminEmail },
});

if (!adminUser) {
  const hashedPassword = await hashPassword('Admin@123');
  adminUser = manager.create(User, {
    email: adminEmail,
    username: 'admin',
    password: hashedPassword,
    status: 1,
    roleId: adminRole.id, // Foreign key
  });
  await manager.save(adminUser);
  logger.info('  ✓ Created admin user');
}
```

#### Pattern 3: Many-to-Many Relations

**Use case**: Assign permissions to roles

**Pattern from**: `seed.ts:206-228`

```typescript
// Seed permissions first
const permissions: Permission[] = [];
for (const permData of PERMISSION_DATA) {
  let permission = await manager.findOne(Permission, {
    where: { slug: permData.slug },
  });

  if (!permission) {
    permission = manager.create(Permission, permData);
    await manager.save(permission);
  }

  permissions.push(permission);
}

// Then create junction table entries
for (const permission of permissions) {
  const existing = await manager.findOne(PermissionRole, {
    where: {
      roleId: adminRole.id,
      permissionId: permission.id,
    },
  });

  if (!existing) {
    const permissionRole = manager.create(PermissionRole, {
      roleId: adminRole.id,
      permissionId: permission.id,
    });
    await manager.save(permissionRole);
  }
}
```

#### Pattern 4: Idempotent Seeding

**Use case**: Safe to run multiple times

```typescript
// Always check existence before creating
let entity = await manager.findOne(Entity, {
  where: { uniqueField: value },
});

if (!entity) {
  // Create only if doesn't exist
  entity = manager.create(Entity, data);
  await manager.save(entity);
  logger.info('  ✓ Created');
} else {
  // Optional: Update existing
  // Object.assign(entity, data);
  // await manager.save(entity);
  logger.info('  ⊙ Already exists');
}
```

### Step 5: Add Seed Script to Package.json

**Location**: `package.json`

**Add script**:
```json
{
  "scripts": {
    "seed": "ts-node -r tsconfig-paths/register src/common/database/seeds/seed.ts",
    "seed:<module>": "ts-node -r tsconfig-paths/register src/common/database/seeds/<module-name>.seed.ts"
  }
}
```

### Step 6: Validation Checklist

- [ ] Seeder file created (standalone or integrated)
- [ ] Imports include all required entities
- [ ] DataSource configured correctly
- [ ] Seed data defined with correct types
- [ ] Transaction used for all operations
- [ ] Idempotency checks (findOne before create)
- [ ] Relations handled in correct order (parent before child)
- [ ] Logging for created/existing records
- [ ] Error handling with try-catch
- [ ] DataSource properly destroyed in finally block
- [ ] Package.json script added
- [ ] TypeScript path resolution configured (`-r tsconfig-paths/register`)

### Step 7: Running Seeds

**Development**:
```bash
# Run main seed file
npm run seed

# Run specific seed
npm run seed:<module>
```

**Production considerations**:
```bash
# Build first
npm run build

# Run compiled seed
node dist/common/database/seeds/seed.js
```

## Output Format

```
✅ Database Seeder Generated: <Module>

📁 Files Created/Modified:
  - src/common/database/seeds/<module-name>.seed.ts (NEW) [standalone]
  OR
  - src/common/database/seeds/seed.ts (MODIFIED) [integrated]

📝 Package.json:
  Added script: "seed:<module>"

🔧 Seed Details:
  Module: <Module>
  Records: <count> sample records
  Relations: <list of relations>
  Idempotent: Yes

📝 Next Steps:
  1. Customize seed data in <MODULE>_DATA array
  2. Add more sample records as needed
  3. Configure relation handling if needed
  4. Test with: npm run seed:<module>
  5. Verify data in database

💡 Usage:
  ```bash
  # Run seed
  npm run seed:<module>

  # Check database
  psql -d <database> -c "SELECT * FROM <table>;"
  ```
```

## Notes and Best Practices

### Seed Data Design

1. **Minimal Required Data**:
   - Seed only what's necessary for app to run
   - Don't seed thousands of test records
   - Keep seed data production-ready

2. **Idempotency**:
   - Always check existence before creating
   - Use unique fields for checks (slug, email, code)
   - Safe to run multiple times without duplicates

3. **Order Matters**:
   - Seed parent entities before children
   - Seed entities before junction tables
   - Handle foreign key constraints

4. **Sample vs Initial Data**:
   - Initial data: Required for app (permissions, roles)
   - Sample data: For development/testing only
   - Keep separate or use environment flags

### Transaction Management

1. **Use Transactions**:
   - Wrap all operations in transaction
   - Ensures atomicity (all or nothing)
   - Rollback on error

2. **Transaction Scope**:
   - Use manager, not repository
   - `manager.create()`, not `new Entity()`
   - `manager.save()`, not `repository.save()`

3. **Error Handling**:
   - Try-catch around transaction
   - Log errors with context
   - Exit with error code on failure

### Relations

1. **Foreign Keys**:
   - Seed parent first, get ID
   - Use ID in child entity
   - Example: Create role, then user with roleId

2. **Many-to-Many**:
   - Seed both sides first
   - Then seed junction table
   - Check existence in junction table

3. **Circular Dependencies**:
   - Seed in phases if needed
   - Use nullable foreign keys initially
   - Update after all entities created

### Data Quality

1. **Realistic Data**:
   - Use production-like values
   - Valid emails, phones, etc.
   - Proper data types and formats

2. **Security**:
   - Hash passwords (use hashPassword utility)
   - Don't commit real credentials
   - Use env variables for sensitive data

3. **Consistency**:
   - Follow naming conventions (slugs, codes)
   - Maintain referential integrity
   - Use same patterns across seeds

### Performance

1. **Batch Operations**:
   - Use bulk insert for many records
   - `manager.save([array])` for batch
   - Don't loop with individual saves unnecessarily

2. **Queries**:
   - Minimize findOne calls
   - Cache parent entities when possible
   - Use in-memory maps for lookups

3. **Logging**:
   - Don't log every record for large datasets
   - Use counters and summary logs
   - Add progress indicators for long seeds

## Troubleshooting

### Duplicate Key Errors

**Symptoms**: "duplicate key value violates unique constraint"

**Solution**:
- Add existence checks before creating
- Use correct unique field in where clause
- Clear database before re-seeding if needed

### Foreign Key Violations

**Symptoms**: "violates foreign key constraint"

**Solution**:
- Seed parent entities first
- Verify parent entity exists before creating child
- Check cascade settings on relations

### TypeScript Path Resolution

**Symptoms**: Cannot find module '@modules/...'

**Solution**:
- Use `-r tsconfig-paths/register` in script
- Verify tsconfig.json has path mappings
- Check entity paths in DataSource config

### Connection Errors

**Symptoms**: Cannot connect to database

**Solution**:
- Verify .env has correct DB credentials
- Check PostgreSQL is running
- Test connection with psql

---

**End of Skill: gqlify:generate-seeder**

This skill creates production-ready database seeders following the NestJS GraphQL boilerplate patterns. All examples are based on actual implementation from the boilerplate at `/Users/cuongnq/Desktop/Learning.nosync/NESTJS/nestjs-graphql-boilerplate`.
