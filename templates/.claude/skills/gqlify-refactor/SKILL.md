---
name: Refactor Module
description: A skill to systematically refactor a NestJS module.
---

# Skill: Refactor Module

## Description
This skill guides you through refactoring a NestJS module to align with our hexagonal architecture and best practices.

## Steps

1.  **Analyze the Module**:
    - Identify the Module, Service, Resolver/Controller, DTOs, and Entities.
    - Check for violations from `RULES.md`.
    - **Folder Structure**: Ensure files are in `dtos/`, `repository/`, `services/`, `resolvers/`.
    - **Repository Abstraction**: Ensure `TypeORM Repository` is NOT used in Service. Create a custom Repository class.
    - **Return Types**: Ensure Mutations return `Promise<boolean>`.

2.  **Separate Concerns**:
    - Move business logic from Resolver to Service.
    - Ensure Resolver only handles `@Args` and calls Service.

3.  **Standardize DTOs**:
    - Ensure `Create...Input` and `Update...Input` exist.
    - Ensure `FilterInput` exists if list queries are present.
    - Ensure `...Connection` object exists for pagination.

4.  **Refactor Pagination**:
    - If returning `Array`, change to `Connection`.
    - Implement `cursor` based pagination logic in Service.

5.  **Clean Up**:
    - Remove unused imports.
    - Ensure stricter types (no `any`).
