# Testing Guide

This document covers unit testing, E2E testing, mocking patterns, and best practices for this NestJS GraphQL boilerplate.

---

## Table of Contents

1. [Test Structure](#test-structure)
2. [Running Tests](#running-tests)
3. [Helper Functions](#helper-functions)
4. [Service Tests](#service-tests)
5. [Resolver Tests](#resolver-tests)
6. [Repository Tests](#repository-tests)
7. [Common Mocking Patterns](#common-mocking-patterns)
8. [Testing Error Scenarios](#testing-error-scenarios)
9. [Best Practices](#best-practices)
10. [Coverage Goals](#coverage-goals)

---

## Test Structure

```
test/
├── unit/
│   ├── modules/
│   │   └── <module-name>/
│   │       ├── <module>.service.spec.ts      # Service tests
│   │       ├── <module>.resolver.spec.ts     # Resolver tests
│   │       └── <module>.repository.spec.ts   # Repository tests
│   ├── auth/
│   │   ├── auth.service.spec.ts              # Auth service tests
│   │   └── auth.*.guard.spec.ts              # Guard tests
│   ├── common/
│   │   └── <feature>/
│   │       └── <feature>.service.spec.ts     # Common service tests
│   └── helpers/
│       ├── index.ts                          # Export all helpers
│       ├── mock-dataloader.helper.ts         # DataLoader mocks
│       ├── mock-i18n.helper.ts               # I18nService mock
│       ├── mock-repository.helper.ts         # TypeORM repository mocks
│       └── mock-service.helper.ts            # Service mocks
```

---

## Running Tests

```bash
# Run all unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run specific module tests
pnpm run test -- --testPathPattern=your-module.service
pnpm run test -- --testPathPattern=your-module

# Run with coverage
pnpm run test:cov

# Debug tests
pnpm run test:debug

# Run E2E tests
pnpm run test:e2e
```

---

## Helper Functions

Import helpers from the shared helpers directory:

```typescript
import {
  createMockDataLoaders,
  createMockI18nService,
  createMockRepository,
  createMockQueryBuilder,
  MockRepository,
} from '../../helpers';
```

### Available Helpers

| Helper | Purpose | Usage |
|--------|---------|-------|
| `createMockRepository<T>()` | Mock for TypeORM Repository | `const repo = createMockRepository<User>()` |
| `createMockQueryBuilder<T>()` | Mock for SelectQueryBuilder | Complex query testing |
| `createMockI18nService()` | Mock for I18nService | Translation mocking |
| `createMockDataLoaders()` | Mock DataLoaders | Field resolver testing |

---

## Service Tests

### Basic Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';

import { YourService } from '@modules/your-module/services/your.service';
import { YourRepository } from '@modules/your-module/repository/repositories/your.repository';
import { YourEntity } from '@modules/your-module/repository/entities/your.entity';

import {
  createMockI18nService,
  createMockRepository,
  MockRepository,
} from '../../helpers';

// IMPORTANT: Mock ErrorFactory BEFORE imports that use it
jest.mock('@common/error/factories/error.factory', () => ({
  ErrorFactory: {
    notFound: jest.fn().mockImplementation((entity, id) => {
      const error = new Error(`${entity} not found: ${id}`);
      (error as any).code = 'NOT_FOUND';
      return error;
    }),
    duplicate: jest.fn().mockImplementation((entity, field, value) => {
      const error = new Error(`Duplicate ${entity} ${field}: ${value}`);
      (error as any).code = 'DUPLICATE';
      return error;
    }),
    business: jest.fn().mockImplementation((code, message) => {
      const error = new Error(message || code);
      (error as any).code = code;
      return error;
    }),
    forbidden: jest.fn().mockImplementation((message, code) => {
      const error = new Error(message);
      (error as any).code = code || 'FORBIDDEN';
      return error;
    }),
  },
}));

describe('YourService', () => {
  let service: YourService;
  let repository: MockRepository<YourEntity>;

  beforeEach(async () => {
    repository = createMockRepository<YourEntity>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        { provide: YourRepository, useValue: repository },
        { provide: I18nService, useValue: createMockI18nService() },
      ],
    }).compile();

    service = module.get<YourService>(YourService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  // Tests go here...
});
```

### Testing CRUD Operations

#### Create Operation

```typescript
describe('create', () => {
  const createInput = { name: 'Test Item', slug: 'test-item' };

  it('should successfully create an item', async () => {
    repository.findOne!.mockResolvedValue(null); // No duplicate
    repository.save!.mockResolvedValue({ id: 1, ...createInput });

    await service.create(createInput);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { slug: createInput.slug },
    });
    expect(repository.save).toHaveBeenCalledWith(createInput);
  });

  it('should throw DUPLICATE error when slug exists', async () => {
    repository.findOne!.mockResolvedValue({ id: 1, slug: 'test-item' });

    await expect(service.create(createInput)).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
```

#### Read/Get Operation

```typescript
describe('getById', () => {
  it('should return an item by ID', async () => {
    const item = { id: 1, name: 'Test Item' };
    repository.findOne!.mockResolvedValue(item);

    const result = await service.getById(1);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(item);
  });

  it('should throw NOT_FOUND error when item does not exist', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.getById(999)).rejects.toThrow();
  });
});
```

#### Update Operation

```typescript
describe('update', () => {
  const updateInput = { id: 1, name: 'Updated Item' };

  it('should successfully update an item', async () => {
    const existingItem = { id: 1, name: 'Old Name' };
    repository.findOne!.mockResolvedValue(existingItem);
    repository.save!.mockResolvedValue({ ...existingItem, ...updateInput });

    await service.update(updateInput);

    expect(repository.save).toHaveBeenCalled();
  });

  it('should throw NOT_FOUND error when item does not exist', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.update(updateInput)).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
```

#### Delete Operation

```typescript
describe('delete', () => {
  it('should successfully soft-delete an item', async () => {
    const item = { id: 1, name: 'Test Item' };
    repository.findOne!.mockResolvedValue(item);
    repository.softDelete!.mockResolvedValue({ affected: 1 });

    await service.delete(1);

    expect(repository.softDelete).toHaveBeenCalledWith(1);
  });

  it('should throw NOT_FOUND error when item does not exist', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.delete(999)).rejects.toThrow();
    expect(repository.softDelete).not.toHaveBeenCalled();
  });
});
```

#### List/Pagination Operation

```typescript
describe('getList', () => {
  it('should return paginated items', async () => {
    const params = { page: 1, limit: 10 };
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    (repository as any).getList = jest.fn().mockResolvedValue([items, 2]);

    const result = await service.getList(params);

    expect((repository as any).getList).toHaveBeenCalledWith(params);
    expect(result.data).toHaveLength(2);
    expect(result.totalRecords).toBe(2);
  });
});
```

---

## Resolver Tests

### Basic Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

import { YourResolver } from '@modules/your-module/resolvers/your.resolver';
import { YourService } from '@modules/your-module/services/your.service';
import { AuthJwtAccessGuard } from '@auth/guards/auth.jwt-access.guard';
import { OwnershipGuard } from '@auth/guards/auth.ownership.guard';
import { PermissionsGuard } from '@modules/permission/guards/permissions.guard';
import { PermissionRepository } from '@modules/permission/repository/repositories/permission.repository';

import {
  createMockDataLoaders,
  createMockI18nService,
  createMockRepository,
} from '../../helpers';

describe('YourResolver', () => {
  let resolver: YourResolver;

  const mockService = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getList: jest.fn(),
    getById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourResolver,
        { provide: YourService, useValue: mockService },
        { provide: PermissionRepository, useValue: createMockRepository() },
        { provide: I18nService, useValue: createMockI18nService() },
        {
          provide: Reflector,
          useValue: { get: jest.fn(), getAllAndOverride: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthJwtAccessGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(OwnershipGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    resolver = module.get<YourResolver>(YourResolver);

    jest.clearAllMocks();
  });

  // Tests go here...
});
```

### Testing Mutations

```typescript
describe('createItem', () => {
  it('should call service.create and return true', async () => {
    const input = { name: 'Test', slug: 'test' };
    mockService.create.mockResolvedValue({ id: 1, ...input });

    const result = await resolver.createItem(input);

    expect(mockService.create).toHaveBeenCalledWith(input);
    expect(result).toBe(true);
  });
});
```

### Testing Field Resolvers with DataLoaders

```typescript
describe('role (field resolver)', () => {
  it('should return role if already loaded', async () => {
    const user = {
      id: 'user-uuid',
      roleId: 1,
      role: { id: 1, name: 'Admin', slug: 'admin' },
    };
    const mockLoaders = createMockDataLoaders();
    const ctx = { loaders: mockLoaders };

    const result = await resolver.role(user as never, ctx as never);

    expect(mockLoaders.roles.load).not.toHaveBeenCalled();
    expect(result).toEqual(user.role);
  });

  it('should use DataLoader when role not loaded', async () => {
    const user = { id: 'user-uuid', roleId: 1 };
    const mockLoaders = createMockDataLoaders();
    const expectedRole = { id: 1, name: 'Admin', slug: 'admin' };
    mockLoaders.roles.load.mockResolvedValue(expectedRole);
    const ctx = { loaders: mockLoaders };

    const result = await resolver.role(user as never, ctx as never);

    expect(mockLoaders.roles.load).toHaveBeenCalledWith(user.roleId);
    expect(result).toEqual(expectedRole);
  });

  it('should return null when no roleId', async () => {
    const user = { id: 'user-uuid', roleId: undefined };
    const mockLoaders = createMockDataLoaders();
    const ctx = { loaders: mockLoaders };

    const result = await resolver.role(user as never, ctx as never);

    expect(mockLoaders.roles.load).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
```

---

## Repository Tests

### Basic Template

```typescript
import { YourEntity } from '@modules/your-module/repository/entities/your.entity';
import { YourRepository } from '@modules/your-module/repository/repositories/your.repository';
import { DataSource, SelectQueryBuilder } from 'typeorm';

import { createMockQueryBuilder } from '../../helpers';

// Mock query helpers
jest.mock('@common/database/helper/query.helper', () => ({
  applyQueryPaging: jest.fn(),
  applyQuerySorting: jest.fn(),
}));

import * as queryHelper from '@common/database/helper/query.helper';

describe('YourRepository', () => {
  let repository: YourRepository;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder<YourEntity>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    mockQueryBuilder = createMockQueryBuilder<YourEntity>();

    mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue({}),
    } as unknown as jest.Mocked<DataSource>;

    repository = new YourRepository(mockDataSource);

    jest
      .spyOn(repository, 'createQueryBuilder')
      .mockReturnValue(mockQueryBuilder as unknown as SelectQueryBuilder<YourEntity>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Tests go here...
});
```

### Testing getList with Filters

```typescript
describe('getList', () => {
  const mockItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ];

  beforeEach(() => {
    mockQueryBuilder.getManyAndCount!.mockResolvedValue([mockItems, 2]);
  });

  it('should return paginated items', async () => {
    const params = { page: 1, limit: 10 };

    const [items, count] = await repository.getList(params);

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('entity');
    expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
    expect(items).toEqual(mockItems);
    expect(count).toBe(2);
  });

  it('should apply filter when provided', async () => {
    const params = { page: 1, limit: 10, filter: 'test' };

    await repository.getList(params);

    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      expect.stringContaining('LIKE'),
      { filter: '%test%' },
    );
  });
});
```

---

## Common Mocking Patterns

### Mocking External Utilities

```typescript
// Mock at the top of the file, BEFORE imports
jest.mock('@common/utils/string.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  comparePassword: jest.fn().mockResolvedValue(true),
  generateCode: jest.fn().mockReturnValue('generated_code'),
}));

import * as stringUtil from '@common/utils/string.util';

// In tests
it('should hash password before saving', async () => {
  // ... test setup ...
  expect(stringUtil.hashPassword).toHaveBeenCalledWith('password123');
});
```

### Mocking ConfigService

```typescript
const configService = {
  get: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, any> = {
      'auth.defaultPassword': 'default_password',
      'app.name': 'TestApp',
    };
    return config[key];
  }),
};

// In providers
{ provide: ConfigService, useValue: configService }
```

### Mocking Cache Manager

```typescript
const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
};

// In providers
{ provide: CACHE_MANAGER, useValue: mockCacheManager }
```

---

## Testing Error Scenarios

### Verifying Error Types

```typescript
import { ErrorFactory } from '@common/error/factories/error.factory';

it('should throw NOT_FOUND error when item does not exist', async () => {
  repository.findOne!.mockResolvedValue(null);

  await expect(service.getById(999)).rejects.toThrow();

  expect(ErrorFactory.notFound).toHaveBeenCalledWith('Item', 999);
});

it('should throw DUPLICATE error when slug exists', async () => {
  repository.findOne!.mockResolvedValue({ id: 1, slug: 'existing' });

  await expect(service.create({ slug: 'existing' })).rejects.toThrow();

  expect(ErrorFactory.duplicate).toHaveBeenCalledWith('Item', 'slug', 'existing');
});
```

---

## Best Practices

### 1. Test Organization (AAA Pattern)

```typescript
it('should successfully create an item', async () => {
  // Arrange - set up test data and mocks
  const input = { name: 'Test' };
  repository.findOne!.mockResolvedValue(null);
  repository.save!.mockResolvedValue({ id: 1, ...input });

  // Act - execute the method under test
  const result = await service.create(input);

  // Assert - verify the results
  expect(repository.save).toHaveBeenCalledWith(input);
  expect(result.id).toBe(1);
});
```

### 2. Clear Mocks Between Tests

```typescript
beforeEach(async () => {
  // ... setup ...
  jest.clearAllMocks(); // ALWAYS at the end
});
```

### 3. Use Descriptive Test Names

```typescript
// Good
it('should throw DUPLICATE error when email already exists', async () => {});
it('should return null when no roleId is provided', async () => {});

// Bad
it('test create', async () => {});
it('error case', async () => {});
```

### 4. Test Both Success and Failure Cases

```typescript
describe('getById', () => {
  it('should return item when found', async () => { /* success */ });
  it('should throw NOT_FOUND when item does not exist', async () => { /* failure */ });
});
```

### 5. Verify Side Effects

```typescript
it('should revoke all tokens after password change', async () => {
  await service.changePassword(input, user);

  expect(userRepository.update).toHaveBeenCalled();
  expect(tokenRepository.delete).toHaveBeenCalledWith({ userId: user.id });
});
```

---

## Coverage Goals

| Layer | Target | Current |
|-------|--------|---------|
| Services | 95%+ | 98%+ |
| Resolvers | 75%+ | 77%+ |
| Repositories | 85%+ | 90%+ |
| Guards | 90%+ | 97%+ |
| **Overall Statements** | **85%+** | **89.56%** |
| **Overall Branches** | **65%+** | **69.1%** |
| **Overall Functions** | **80%+** | **85.56%** |
| **Overall Lines** | **90%+** | **94%** |

---

## E2E Tests

### Basic Template

```typescript
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

describe('ProductResolver (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { login(input: { email: "admin@test.com", password: "password" }) { accessToken } }`,
      });

    accessToken = loginResponse.body.data.login.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get paginated products', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: `
          query {
            products(params: { limit: 10, page: 1 }) {
              data { id name price }
              totalRecords
              totalPages
            }
          }
        `,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.products).toBeDefined();
        expect(res.body.data.products.data).toBeInstanceOf(Array);
      });
  });
});
```

---

## New Module Test Checklist

- [ ] Created `test/unit/modules/<name>/` directory
- [ ] Created `<name>.service.spec.ts`
- [ ] Created `<name>.resolver.spec.ts`
- [ ] Created `<name>.repository.spec.ts` (if custom repository)
- [ ] Mocked ErrorFactory at top of service test file
- [ ] Mocked query helpers for repository tests
- [ ] Mocked all repository methods used
- [ ] Mocked all external dependencies
- [ ] Tested all CRUD operations
- [ ] Tested error scenarios (NOT_FOUND, DUPLICATE, FORBIDDEN)
- [ ] Tested edge cases (null, undefined, falsy values)
- [ ] Verified side effects
- [ ] All tests pass: `pnpm run test`
- [ ] Coverage meets targets: `pnpm run test:cov`

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Module structure and patterns
- [CONVENTIONS.md](./CONVENTIONS.md) - Code generation rules
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
