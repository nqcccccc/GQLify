# GQLify

> **Production-ready NestJS + GraphQL workflow automation for Claude Code**

GQLify is a CLI tool that bootstraps comprehensive Claude Code workflows for NestJS + GraphQL projects. It provides 20 production-ready skills for code generation, validation, security auditing, and more.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Claude Code](https://img.shields.io/badge/Claude-Code-purple)](https://claude.ai/code)

---

## 🚀 Features

- **20 Executable Skills** - Complete workflow automation for GraphQL development
- **Architecture Documentation** - Comprehensive guides for domain-driven design
- **Code Generation** - Scaffold modules, resolvers, services, repositories, and DTOs
- **Quality Assurance** - Built-in validation, security auditing, and testing patterns
- **Best Practices** - Follows NestJS + GraphQL production patterns
- **Claude Code Integration** - Native slash command support

---

## 📦 Installation

```bash
npm install -g gqlify
```

Or use locally in your project:

```bash
npm install --save-dev gqlify
```

---

## 🎯 Quick Start

### 1. Initialize GQLify in your NestJS project

```bash
cd your-nestjs-project
gqlify init
```

This creates a `.claude/` directory with:
- 20 executable skills
- Architecture & conventions documentation
- Security audit guides
- Testing patterns & templates

### 2. Start using skills with Claude Code

```bash
# Generate a complete module
/gqlify:generate-module Product

# Add advanced filtering
/gqlify:add-filter Product

# Validate code against patterns
/gqlify:validate --fix

# Run security audit
/gqlify:audit-security
```

---

## 🛠️ Available Skills (20 Total)

### Core Module Generation
| Skill | Description |
|-------|-------------|
| `gqlify:generate-module` | Scaffold complete module with entity, repository, DTOs, service, resolver |
| `gqlify:generate-field` | Add DataLoader field resolvers to prevent N+1 queries |
| `gqlify:generate-query` | Generate custom queries with authentication |
| `gqlify:add-field` | Add properties to existing entities |
| `gqlify:add-pagination` | Convert list queries to PaginatedResponse pattern |

### Advanced Features
| Skill | Description |
|-------|-------------|
| `gqlify:add-export` | Add CSV/Excel export functionality to list queries |
| `gqlify:add-filter` | Implement advanced filtering (OR, IN operators, joins) |
| `gqlify:add-i18n` | Add internationalization support with nestjs-i18n |
| `gqlify:generate-batch` | Create batch loading methods for DataLoader optimization |

### Backend Infrastructure
| Skill | Description |
|-------|-------------|
| `gqlify:add-job` | Create BullMQ background job processors |
| `gqlify:add-mail-template` | Generate email templates with variable interpolation |
| `gqlify:add-utility` | Add utility functions with TypeScript types |
| `gqlify:add-validator` | Create custom class-validator decorators |
| `gqlify:generate-seeder` | Generate database seeder scripts |

### Code Quality & Validation
| Skill | Description |
|-------|-------------|
| `gqlify:validate` | Validate code against DEVELOPMENT.md patterns (with auto-fix) |
| `gqlify:setup` | Verify project setup and configuration |
| `gqlify:audit-security` | Comprehensive security vulnerability scanning |
| `gqlify:audit-repo` | Full repository audit for best practices |

### Maintenance
| Skill | Description |
|-------|-------------|
| `gqlify:fix-error` | Diagnose and fix errors with contextual suggestions |
| `gqlify:refactor` | Refactor modules following architectural patterns |

---

## 📖 Documentation

After running `gqlify init`, you'll have access to comprehensive documentation:

| File | Purpose |
|------|---------|
| **[RULES.md](templates/.claude/RULES.md)** | High-priority constraints and quick reference |
| **[ARCHITECTURE.md](templates/.claude/ARCHITECTURE.md)** | Module structure, patterns, and infrastructure (494 lines) |
| **[CONVENTIONS.md](templates/.claude/CONVENTIONS.md)** | Coding standards, naming, anti-patterns (464 lines) |
| **[DEVELOPMENT.md](templates/.claude/DEVELOPMENT.md)** | Code templates, workflows, commands (601 lines) |
| **[TESTING.md](templates/.claude/TESTING.md)** | Testing strategies and patterns (743 lines) |
| **[SECURITY_AUDIT_GUIDE.md](templates/.claude/SECURITY_AUDIT_GUIDE.md)** | Security checklist and vulnerability guide (575 lines) |

---

## 🏗️ Architecture Patterns

GQLify enforces a strict domain-driven architecture:

```
modules/<feature>/
├── repository/
│   ├── entities/<feature>.entity.ts
│   ├── repositories/<feature>.repository.ts
│   └── <feature>.repository.module.ts
├── services/<feature>.service.ts
├── resolvers/<feature>.resolver.ts
├── dtos/
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   └── filter-<feature>.dto.ts
├── types/<feature>.type.ts
└── <feature>.module.ts
```

### Key Patterns
- ✅ **Repository Pattern** - Custom repositories extending TypeORM
- ✅ **DataLoader Pattern** - Prevent N+1 query problems
- ✅ **Error Factory** - Centralized error handling with Sentry integration
- ✅ **Input Validation** - class-validator decorators on all DTOs
- ✅ **Authentication** - @Auth() decorators on all resolvers
- ✅ **Pagination** - PaginatedResponse for all list queries

---

## 💡 Usage Examples

### Generate a Complete Module

```bash
/gqlify:generate-module Product
```

This creates:
- Entity with BaseUUIDEntity
- Custom repository with getList/getById/getByIds
- Create/Update/Filter DTOs with validation
- Service with CRUD operations
- GraphQL resolver with queries/mutations
- Proper module registration

### Add DataLoader Field Resolver

```bash
/gqlify:generate-field Product category Category
```

Prevents N+1 queries by:
- Creating batch loader in DataLoader factory
- Adding field resolver to use context.loaders
- Implementing efficient batching and caching

### Validate and Auto-Fix Code

```bash
/gqlify:validate --fix
```

Checks for:
- Missing @Field() decorators
- Missing @MaxLength() on strings
- ErrorFactory usage (not raw errors)
- DataLoader usage in field resolvers
- @Auth() decorators on resolvers
- And 20+ other pattern validations

---

## 🔒 Security Features

GQLify includes comprehensive security patterns:

- **Input Validation** - All DTOs have proper class-validator decorators
- **Authentication** - @Auth() guards on all resolvers
- **SQL Injection Prevention** - Parameterized queries only
- **Query Depth Limiting** - Protection against deep query attacks
- **Rate Limiting** - Configuration for sensitive operations
- **CORS Configuration** - Explicit origin whitelisting
- **Error Sanitization** - No sensitive data in error messages

Run security audit:
```bash
/gqlify:audit-security
```

---

## 🧪 Testing

GQLify provides testing patterns for:
- Unit tests (services, resolvers, repositories)
- E2E tests (GraphQL queries/mutations)
- Mocking patterns (repositories, external services)
- Coverage goals and best practices

See `.claude/TESTING.md` for comprehensive guide.

---

## 🔧 Development

### Building GQLify

```bash
# Clone the repository
git clone <your-repo-url>
cd gqlify

# Install dependencies
npm install

# Build TypeScript
npm run build

# Test locally
npm link
gqlify init
```

### Project Structure

```
GQLify/
├── bin/
│   └── gqlify.ts              # CLI entry point
├── src/
│   └── commands/
│       └── init.ts            # Init command implementation
├── templates/
│   └── .claude/               # Template files copied to projects
│       ├── skills/            # 20 executable skills
│       ├── ARCHITECTURE.md
│       ├── CONVENTIONS.md
│       ├── DEVELOPMENT.md
│       ├── RULES.md
│       ├── TESTING.md
│       └── SECURITY_AUDIT_GUIDE.md
├── dist/                      # Compiled output
└── package.json
```

---

## 📊 Skill Categories Breakdown

| Category | Skills | Purpose |
|----------|--------|---------|
| **Phase 1** | 4 | Critical features (Export, Batch, Filter, i18n) |
| **Phase 2** | 5 | Extended features (Job, Mail, Utility, Validator, Seeder) |
| **Phase 3** | 11 | Complete workflow (Module generation, validation, auditing) |
| **Total** | **20** | Production-ready development toolkit |

---

## 🤝 Integration with Claude Code

GQLify is designed for seamless Claude Code integration:

1. **Auto-Discovery** - Skills are automatically detected via YAML frontmatter
2. **Slash Commands** - All skills invocable via `/gqlify:skill-name` syntax
3. **Argument Hints** - Autocomplete support for skill parameters
4. **Context Awareness** - Skills reference architecture documentation
5. **Error Handling** - Side-effect warnings via `disable-model-invocation`

---

## 📝 Skill Format

All GQLify skills follow Claude Code's standardized format:

```yaml
---
name: gqlify:skill-name
description: Clear description for auto-invocation
argument-hint: <Module> <Field> <Type>
disable-model-invocation: true  # For side-effect commands
---

You are a GQLify skill for [purpose]...

## Task
[Task description with $ARGUMENTS substitution]

## Arguments
[Parameter details]

## Execution Steps
[Numbered implementation steps]

## Usage Examples
[Real-world usage patterns]
```

---

## 🎓 Learning Resources

### For New Users
1. Run `gqlify init` in your project
2. Read `.claude/README.md` for overview
3. Review `.claude/RULES.md` for key constraints
4. Try `/gqlify:generate-module Product`

### For Advanced Users
- Study `.claude/ARCHITECTURE.md` for deep patterns
- Review `.claude/CONVENTIONS.md` for anti-patterns
- Use `.claude/DEVELOPMENT.md` as template reference
- Run `/gqlify:audit-repo` for code quality insights

---

## 🚧 Roadmap

### Future Enhancements
- [ ] Supporting files (examples, templates) for each skill
- [ ] Composite skills for multi-step workflows
- [ ] Visual architecture diagrams
- [ ] AI-powered code review integration
- [ ] Performance metrics and analytics
- [ ] Automated skill validation framework

---

## 📄 License

ISC License

---

## 👥 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Follow existing skill patterns
4. Test with `npm run build && gqlify init`
5. Submit a pull request

---

## 📞 Support

- **Documentation**: Check `.claude/` files after running `gqlify init`
- **Issues**: Report bugs via GitHub Issues
- **Questions**: Refer to inline documentation in skills

---

## 🙏 Acknowledgments

- Built for [Claude Code](https://claude.ai/code) by Anthropic
- Follows [NestJS](https://nestjs.com/) best practices
- Integrates [GraphQL](https://graphql.org/) patterns
- Inspired by production boilerplate patterns

---

<div align="center">

**Built with ❤️ for the NestJS + GraphQL community**

[Documentation](templates/.claude/README.md) • [Skills](templates/.claude/skills/) • [Architecture](templates/.claude/ARCHITECTURE.md)

</div>
