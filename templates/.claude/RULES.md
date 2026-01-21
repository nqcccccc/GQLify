# ⛑ AI Context Rules

> **Summary for AI**: This project follows a strict strict domain-driven architecture.
> **Source of Truth**: Refer to `CONVENTIONS.md` for detailed rules.

## high-Priority Constraints

1.  **Repository Pattern**: ALWAYS use custom repositories in `repository/repositories/`. NEVER access `this.repository` directly in Services for business logic if it's not the custom one.
2.  **Explicit Column Names**: ALWAYS specify `name` in `@Column({ name: '...' })` and `@JoinColumn({ name: '...' })`.
3.  **Pagination**: Use `PaginatedResponse`. Do NOT use Relay connections.
4.  **Error Handling**: ALWAYS use `ErrorFactory`. NEVER throw raw `Error` or NestJS exceptions.
5.  **GraphQL Inputs**: ALWAYS use `@InputType()`. NEVER use `@ObjectType()` for inputs.
6.  **Field Resolvers**: ALWAYS use `DataLoader` for relations to avoid N+1.
7.  **Auth**: ALL resolvers must have `@Auth()`.

## Directory Structure
```
modules/<feature>/
├── dtos/                <-- Input Types
├── repository/
│   ├── entities/        <-- TypeORM Entities
│   ├── repositories/    <-- Custom Repositories
│   └── *.repository.module.ts
├── resolvers/           <-- GraphQL Interface
└── services/            <-- Business Logic
```
