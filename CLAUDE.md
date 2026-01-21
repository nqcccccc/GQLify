# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GQLify** is a CLI tool that bootstraps NestJS + GraphQL workflows with comprehensive Claude Code integration. It generates a complete `.claude/` workflow directory containing:

- Architecture documentation and coding conventions
- Custom slash commands for code generation and validation
- Security audit guides and testing patterns
- Interactive prompts for common development tasks

The tool itself is a TypeScript-based CLI that copies template files from `templates/.claude/` to target projects.

## Commands

### Build & Development

```bash
npm run build              # Compile TypeScript to dist/
npm test                   # Run tests (placeholder)
```

### Using the CLI

```bash
# After building
node dist/bin/gqlify.js init    # Initialize .claude/ in current directory
# Or if installed globally/linked
gqlify init
```

The CLI binary is defined in `package.json` as `./dist/bin/gqlify.js`.

## Architecture

### Project Structure

```
GQLify/
├── bin/
│   └── gqlify.ts           # CLI entry point (Commander.js)
├── src/
│   └── commands/
│       └── init.ts         # Init command implementation
├── templates/
│   └── .claude/            # Template workflow files (copied to projects)
│       ├── skills/         # 20 executable skills for code generation
│       ├── ARCHITECTURE.md
│       ├── CONVENTIONS.md
│       ├── DEVELOPMENT.md
│       ├── RULES.md
│       ├── TESTING.md
│       └── SECURITY_AUDIT_GUIDE.md
├── dist/                   # Compiled output
└── package.json
```

### Key Components

**CLI Entry Point** (`bin/gqlify.ts`):
- Uses Commander.js for CLI interface
- Single command: `init`
- Shebang for direct execution: `#!/usr/bin/env node`

**Init Command** (`src/commands/init.ts`):
- Copies `templates/.claude/` to target project's `.claude/` directory
- Uses `fs-extra` for file operations
- Resolves template path relative to compiled location: `__dirname/../../../templates/.claude`
- Skips if `.claude/` already exists (with warning)

**Template Files** (`templates/.claude/`):
- Complete NestJS + GraphQL workflow documentation
- 20 production-ready skills in `skills/` directory
- Follows Claude Code best practices (YAML frontmatter, `$ARGUMENTS` substitution)
- Removed legacy `commands/` and `prompts/` directories (functionality migrated to skills)

## Skills Architecture (Claude Code Convention)

**IMPORTANT**: Claude Code now uses **Skills** instead of commands. Skills are located in `.claude/skills/<skill-name>/SKILL.md` format.

All skills in `templates/.claude/skills/` follow Claude Code's standardized structure:

### YAML Frontmatter Structure

```yaml
---
name: gqlify:command-name
description: Clear description for auto-invocation
argument-hint: <Module> <Field> <Type>  # For autocomplete
disable-model-invocation: true           # For commands with side effects
---
```

### Skill Categories

**Phase 1 Skills** (Critical - Implemented):
- `gqlify:add-export` - CSV/Excel export functionality for list queries
- `gqlify:generate-batch` - Batch loading methods for DataLoader optimization
- `gqlify:add-filter` - Advanced filtering (multi-field OR, IN operator, joins)
- `gqlify:add-i18n` - Internationalization support with nestjs-i18n

**Phase 2 Skills** (Completed):
- `gqlify:add-job` - BullMQ background job processors
- `gqlify:add-mail-template` - Email templates with variable interpolation
- `gqlify:add-utility` - Utility functions with TypeScript types
- `gqlify:add-validator` - Custom class-validator decorators
- `gqlify:generate-seeder` - Database seeder scripts

**Phase 3 Skills** (Completed):
- `gqlify:generate-module` - Complete module scaffolding
- `gqlify:generate-field` - DataLoader field resolvers
- `gqlify:generate-query` - Query generation
- `gqlify:add-field` - Add fields to entities
- `gqlify:add-pagination` - Implement pagination
- `gqlify:validate` - Code validation with auto-fix
- `gqlify:setup` - Project setup verification
- `gqlify:audit-security` - Security vulnerability scanning
- `gqlify:audit-repo` - Comprehensive repository audit
- `gqlify:fix-error` - Error diagnosis and fixing
- `gqlify:refactor` - Module refactoring

### Skill Best Practices (Claude Code Convention)

1. **Directory Structure**: Each skill must be in `.claude/skills/<skill-name>/SKILL.md`
2. **YAML Frontmatter**: All fields are optional, but recommended:
   - `name`: The slash command name (e.g., `gqlify:add-export`)
   - `description`: Used by Claude to auto-trigger (be specific)
   - `argument-hint`: Shown in autocomplete (e.g., `<Module> [--format csv|excel]`)
   - `disable-model-invocation`: Set `true` for side-effect commands (default: `false`)
   - `user-invocable`: Set `false` to hide from menu (default: `true`)
   - `allowed-tools`: Limit tools Claude can use (optional)
   - `context`: Use `fork` to run in isolated subagent (optional)

3. **Use `$ARGUMENTS`** for parameter substitution (appended at end if omitted)
4. **Keep under 500 lines** - Move large content to supporting files
5. **Consistent structure**:
   - Role definition
   - Task description using `$ARGUMENTS`
   - Pre-requisites checks
   - Numbered execution steps with validation
   - Real-world patterns from boilerplate
   - Output format specification
   - Notes and best practices
6. **Single responsibility** - One skill does one thing well

## Template System Architecture

The templates define a **strict domain-driven architecture** for NestJS + GraphQL projects:

### Module Structure Pattern

Every domain module follows this exact structure:

```
modules/<name>/
├── repository/
│   ├── entities/<name>.entity.ts
│   ├── repositories/<name>.repository.ts
│   └── <name>.repository.module.ts
├── services/<name>.service.ts
├── resolvers/<name>.resolver.ts
├── dtos/
│   ├── create-<name>.dto.ts
│   ├── update-<name>.dto.ts
│   └── filter-<name>.dto.ts
├── types/<name>.type.ts
└── <name>.module.ts
```

### Key Architectural Patterns

**Repository Pattern**:
- Custom repositories extending TypeORM's `Repository`
- All data access goes through custom repositories
- Never inject `@InjectRepository()` directly in services

**DataLoader Pattern**:
- Prevents N+1 query problems in GraphQL
- Factory pattern in `dataloader.factory.ts`
- Field resolvers access loaders via context

**Error Handling**:
- Centralized `ErrorFactory` for all errors
- Never throw raw `Error`, `NotFoundException`, or `HttpException`
- Sentry integration with smart filtering

**GraphQL Conventions**:
- `@InputType()` for all inputs (never `@ObjectType()`)
- `@Field()` on all GraphQL properties
- Combine with `class-validator` decorators
- `PaginatedResponse` factory for list queries

### Critical Rules from Templates

These rules are enforced across all generated code:

1. **Explicit Column Names**: Always specify `name` in `@Column()` and `@JoinColumn()` (snake_case)
2. **Soft Deletes**: Always use `softDelete()`, never `delete()`
3. **Authentication**: All resolvers must have `@Auth()` decorator
4. **String Validation**: All strings must have `@MaxLength(255)` unless specified
5. **Custom Enum Validation**: Use `@IsEnumValue()`, not `@IsEnum()`
6. **Pagination Required**: Use `PaginatedResponse`, not raw arrays

## Development Workflow

### Adding New Skills

When adding new skills to `templates/.claude/skills/`:

1. Create directory: `templates/.claude/skills/<skill-name>/`
2. Create `SKILL.md` file with proper YAML frontmatter
3. Follow the structure of existing skills (all 20 skills completed):
   - Phase 1 (4 skills): Export, Batch, Filter, i18n
   - Phase 2 (5 skills): Job, Mail, Utility, Validator, Seeder
   - Phase 3 (11 skills): Module, Field, Query, Add-Field, Pagination, Validate, Setup, Security Audit, Repo Audit, Fix Error, Refactor
4. Test in a target project after running `gqlify init`
5. Update this CLAUDE.md with the new skill

### Making Changes to Templates

When modifying templates in `templates/.claude/`:

1. Edit the template files directly
2. Test by running `npm run build` and `gqlify init` in a test project
3. Verify the copied files are correct
4. Update this CLAUDE.md if architecture changes

**Note**: All legacy commands have been migrated to skills format in Phase 3. The `templates/.claude/commands/` directory has been removed.

### Path Resolution in Init Command

The init command resolves the template directory as:
```typescript
path.resolve(__dirname, '../../../templates/.claude')
```

This works because:
- Source: `src/commands/init.ts`
- Compiled: `dist/src/commands/init.js`
- Resolve from `dist/src/commands/` up 3 levels to root, then `templates/.claude`

## TypeScript Configuration

**Important**: The `tsconfig.json` excludes `templates/` from compilation:

```json
{
  "include": ["bin", "src"],
  "exclude": ["node_modules", "templates"]
}
```

This prevents TypeScript from trying to compile the NestJS template code, which would fail without the NestJS dependencies.

## Testing Generated Workflows

To test changes to the templates:

1. Build the CLI: `npm run build`
2. Create a test directory: `mkdir test-project && cd test-project`
3. Run init: `node /path/to/gqlify/dist/bin/gqlify.js init`
4. Verify `.claude/` directory structure
5. Test slash commands in Claude Code

## Integration with Target Projects

When `gqlify init` is run in a target NestJS project:

1. The `.claude/` directory is created
2. All template files are copied verbatim
3. Target project can now use:
   - Slash commands like `/gqlify:generate-module Product`
   - Architecture documentation for context
   - Code generation templates
   - Validation and audit commands

The target project should be a NestJS + GraphQL project following the patterns defined in the templates.

## Phase 1 Implementation (Completed)

Based on analysis of the actual NestJS GraphQL boilerplate, Phase 1 critical skills have been implemented:

### 1. Export Functionality (`gqlify:add-export`)
- Adds CSV/Excel export to module list queries
- Updates repository `getList()` with `isExport` parameter
- Creates export DTOs and mutations
- Pattern from: `user.repository.ts` export mode

### 2. Batch Loading (`gqlify:generate-batch`)
- Generates batch methods for DataLoader optimization
- Prevents N+1 queries in GraphQL field resolvers
- Supports many-to-one and one-to-many relationships
- Pattern from: `role.service.ts getRolePermissionsBatch()`

### 3. Advanced Filtering (`gqlify:add-filter`)
- Multi-field OR searches
- Array IN operators with joins
- Complex filter combinations
- Pattern from: `user.repository.ts` multi-field search

### 4. Internationalization (`gqlify:add-i18n`)
- Integration with nestjs-i18n
- MessageService wrapper pattern
- Language JSON file generation
- Pattern from: `role.service.ts` MessageService usage

All skills include:
- Real-world patterns from actual boilerplate
- Step-by-step implementation guides
- Validation checklists
- Testing procedures
- Best practices and notes

## Key Files Reference

- **`ANALYSIS.md`**: Gap analysis between templates and actual boilerplate
- **`AGENT.md`**: Original specification for the workflow system
- **`SLASH_COMMAND_AGENT.md`**: Specification for slash command optimization (legacy)
- **`templates/.claude/skills/`**: Phase 1 & 2 skills (Claude Code convention)
  - Phase 1 (4 skills): Export, Batch, Filter, i18n
  - Phase 2 (5 skills): Job, Mail, Utility, Validator, Seeder
- **`templates/.claude/commands/`**: Legacy commands (to be migrated in Phase 3)
- **`templates/.claude/README.md`**: Overview of the workflow for target projects
- **`templates/.claude/ARCHITECTURE.md`**: Deep dive into module structure and patterns
- **`templates/.claude/CONVENTIONS.md`**: Coding standards and anti-patterns
- **`templates/.claude/DEVELOPMENT.md`**: Complete code generation templates and commands
- **`templates/.claude/RULES.md`**: High-priority constraints for AI assistance

## Phase 2 Implementation (Completed)

Based on the boilerplate patterns, Phase 2 skills have been implemented:

### 1. Background Jobs (`gqlify:add-job`)
- Creates BullMQ queue processors for async task processing
- Supports both queue-based and cron-based jobs
- Queue integration with retry logic and rate limiting
- Pattern from: `send-mail.processor.ts`, `sample.job.service.ts`

### 2. Email Templates (`gqlify:add-mail-template`)
- Creates email templates with variable interpolation
- Token-based templates for verification/reset flows
- Blank templates for custom content
- Pattern from: `verify-token-template.ts`, `bank-template.ts`

### 3. Utility Functions (`gqlify:add-utility`)
- Adds utility functions to common/utils
- Categorized by type (date, string, object, transaction)
- TypeScript types and JSDoc documentation
- Pattern from: `date.util.ts`, `string.util.ts`, `object.util.ts`, `transactionBuilder.util.ts`

### 4. Custom Validators (`gqlify:add-validator`)
- Creates class-validator decorators for DTO validation
- Supports both sync and async validators
- Custom error messages and constraint handling
- Pattern from: `request.enum-value.validation.ts`, `request.date-range.validation.ts`

### 5. Database Seeders (`gqlify:generate-seeder`)
- Generates database seed scripts for initial/test data
- Transaction-based with idempotency checks
- Handles relations and foreign keys
- Pattern from: `seed.ts`

All Phase 2 skills include:
- Real-world patterns from actual boilerplate
- Comprehensive implementation guides
- Validation checklists and testing procedures
- Troubleshooting sections
- Best practices and examples

## Phase 3 Implementation (Completed)

All legacy commands have been successfully migrated to skills format:

### Core Module Generation
- `gqlify:generate-module` - Complete module scaffolding with entity, repository, DTOs, service, resolver
- `gqlify:generate-field` - DataLoader field resolvers for N+1 prevention
- `gqlify:generate-query` - Custom query generation with authentication
- `gqlify:add-field` - Add properties to existing entities
- `gqlify:add-pagination` - Convert list queries to PaginatedResponse

### Code Quality & Validation
- `gqlify:validate` - Code validation against DEVELOPMENT.md patterns with auto-fix
- `gqlify:setup` - Project setup verification and environment checks

### Security & Auditing
- `gqlify:audit-security` - Comprehensive security vulnerability scanning
- `gqlify:audit-repo` - Full repository audit for best practices

### Maintenance & Troubleshooting
- `gqlify:fix-error` - Error diagnosis and fixing with contextual suggestions
- `gqlify:refactor` - Module refactoring and restructuring

**Migration Summary**:
- ✅ 11 legacy commands migrated to skills format
- ✅ All skills follow Claude Code SKILL.md convention
- ✅ Removed `templates/.claude/commands/` directory
- ✅ Total of 20 skills available (4 Phase 1 + 5 Phase 2 + 11 Phase 3)

## Future Enhancements

Potential improvements for future phases:
- Add supporting files (examples, templates) to existing skills
- Enhance skills with more real-world examples from production code
- Create composite skills for common workflows (e.g., full CRUD generation)
- Add visual diagrams and architecture decision records
- Integrate with AI-powered code review and suggestions
