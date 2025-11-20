<!--
Sync Impact Report - Constitution Update v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version Change: NEW → 1.0.0 (Initial constitution creation)
Bump Rationale: First version of constitution focused on code quality and Directus best practices

Principles Created:
- I. Type Safety First (NON-NEGOTIABLE)
- II. Directus SDK Best Practices
- III. Testing & Validation
- IV. Code Quality Standards
- V. Performance & Efficiency
- VI. Security & Data Protection

Added Sections:
- Development Workflow (code review, quality gates, documentation)
- Directus-Specific Guidelines (SDK usage, schema management, API patterns)
- Governance (amendment procedure, version policy, compliance)

Templates Status:
✅ .specify/templates/plan-template.md - Constitution Check section aligned
✅ .specify/templates/spec-template.md - Requirements aligned with principles
✅ .specify/templates/tasks-template.md - Task categorization reflects principle-driven tasks

Follow-up TODOs:
- None - all placeholders filled with concrete values
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

# DirectusUsage Constitution

## Core Principles

### I. Type Safety First (NON-NEGOTIABLE)

**All code MUST be written in TypeScript with strict mode enabled.** No implicit `any` types permitted. All function signatures, interfaces, and API contracts MUST be explicitly typed. Type definitions MUST be exported for reusability.

**Rationale**: Type safety prevents runtime errors, improves IDE support, enables refactoring confidence, and serves as living documentation. In data-intensive Directus applications, type safety is critical for schema consistency and API contract enforcement.

**Requirements**:
- `strict: true` in tsconfig.json
- No `@ts-ignore` without documented justification
- Explicit return types on all exported functions
- Interface definitions for all Directus collections and API responses
- Type guards for runtime validation of external data

### II. Directus SDK Best Practices

**All Directus interactions MUST use the official Directus SDK**. Direct REST API calls are prohibited except when SDK limitations are documented and justified. Collection schemas MUST be version-controlled and match production. All SDK queries MUST use TypeScript generics for type safety.

**Rationale**: The Directus SDK provides type-safe abstractions, handles authentication, manages connection pooling, and ensures compatibility across Directus versions. Direct API calls bypass these protections and create maintenance burden.

**Requirements**:
- Use `@directus/sdk` for all Directus operations
- Define TypeScript interfaces matching Directus collection schemas
- Use SDK's type system: `directus.items<CollectionType>('collection_name')`
- Store Directus URLs and tokens in environment variables (never hardcode)
- Handle SDK errors with specific error types, not generic catch-all
- Document any SDK workarounds with links to GitHub issues

### III. Testing & Validation

**Every feature MUST have contract tests validating external API interactions.** Integration tests required for Directus queries and data transformations. Unit tests for business logic. All tests MUST pass before code review.

**Rationale**: Directus applications depend heavily on external API contracts. Changes to Directus schemas or SDK behavior can silently break applications. Comprehensive testing catches breaking changes early and enables confident refactoring.

**Requirements**:
- Contract tests for all Directus SDK operations (create, read, update, delete)
- Integration tests for complex queries and data aggregations
- Unit tests for data transformation and business logic functions
- Test data fixtures mirroring production schema structure
- Minimum 80% code coverage for critical paths
- Mock Directus responses using realistic data structures

### IV. Code Quality Standards

**All code MUST pass ESLint with strict rules and Prettier formatting.** Functions limited to 50 lines, files to 300 lines. Cyclomatic complexity ≤10 per function. Clear, descriptive naming following TypeScript conventions. JSDoc comments required for all exported functions and types.

**Rationale**: Consistent code quality enables team collaboration, reduces cognitive load, and improves maintainability. Directus applications often involve complex data transformations that require clear, readable code.

**Requirements**:
- ESLint configured with TypeScript, Prettier, and recommended rules
- Pre-commit hooks enforcing linting and formatting
- Function length: max 50 lines (extract helpers if longer)
- File length: max 300 lines (split into modules if longer)
- Cyclomatic complexity: ≤10 per function
- JSDoc comments with `@param`, `@returns`, `@throws` for all public APIs
- Meaningful variable names (no single-letter except loop counters)
- Constants in UPPER_SNAKE_CASE, classes in PascalCase, functions in camelCase

### V. Performance & Efficiency

**Query optimization is mandatory.** Use field selection to minimize payload size. Implement pagination for collections >100 items. Cache frequently-accessed data with explicit TTL. Profile and document query performance for critical paths.

**Rationale**: Directus APIs can become slow with large datasets or inefficient queries. Performance issues compound as data grows. Proactive optimization prevents production incidents and improves user experience.

**Requirements**:
- Always specify `fields` parameter to retrieve only needed data
- Use `limit` and `offset` or `page` for pagination (default: 100 items/page)
- Implement caching layer for data that changes <1x/hour
- Document cache invalidation strategy
- Log query execution time for queries >1 second
- Use `filter` parameters to query server-side, not client-side filtering
- Avoid N+1 query patterns (use `deep` parameter for nested data)
- Profile critical data fetching paths and document baseline performance

### VI. Security & Data Protection

**All API credentials MUST be stored in environment variables, never in code.** Input validation required for all external data. Sensitive data (PII, tokens) never logged. API rate limiting implemented. Security vulnerabilities addressed within 24 hours.

**Rationale**: Directus applications often handle sensitive business data. Credential exposure, injection attacks, or data leaks can have severe consequences. Security must be built-in, not bolted-on.

**Requirements**:
- Directus URL, token, and credentials in `.env` file (never committed)
- `.env.example` template with placeholder values
- Validate and sanitize all user input before Directus operations
- Use environment-specific API tokens (dev, staging, production)
- Never log API tokens, user passwords, or PII
- Implement retry logic with exponential backoff for API failures
- Use HTTPS for all Directus connections
- Document security assumptions and threat model
- Run `npm audit` regularly and fix high/critical vulnerabilities within 24h

## Development Workflow

### Code Review Requirements

**All code changes require peer review before merge.** Reviewer MUST verify:
- TypeScript strict mode compliance (no `any` types)
- Tests pass and cover new functionality
- ESLint/Prettier compliance
- JSDoc documentation for public APIs
- No hardcoded credentials or API URLs
- Performance considerations documented for data-heavy operations
- Security implications assessed for external data handling

### Quality Gates

**The following gates MUST pass before feature completion:**

1. **Build Gate**: `npm run build` succeeds with no TypeScript errors
2. **Lint Gate**: `npm run lint` passes with zero warnings or errors
3. **Test Gate**: All tests pass with ≥80% coverage for new code
4. **Type Gate**: `npm run typecheck` passes with no errors
5. **Security Gate**: `npm audit` shows no high/critical vulnerabilities
6. **Performance Gate**: Critical queries profiled and documented
7. **Documentation Gate**: README updated, JSDoc complete, CHANGELOG entry added

### Documentation Standards

**Every feature MUST include:**
- README section explaining purpose and usage
- JSDoc comments for all public functions and types
- Inline comments for complex logic or Directus-specific patterns
- CHANGELOG entry following Keep a Changelog format
- Environment variable documentation in `.env.example`
- Example usage with realistic Directus collection data

## Directus-Specific Guidelines

### Schema Management

**All Directus collection schemas MUST be defined as TypeScript interfaces** in a central `types/` directory. Schema changes in Directus MUST be reflected in code within same sprint. Version mismatches documented and tracked.

```typescript
// Example: types/directus-collections.ts
export interface ArticleCollection {
  id: number;
  status: 'draft' | 'published' | 'archived';
  title: string;
  content: string;
  author: number; // Reference to user ID
  created_at: string;
  updated_at: string;
}
```

### SDK Query Patterns

**Preferred query patterns for common operations:**

```typescript
// ✅ CORRECT: Type-safe query with field selection
const articles = await directus.items<ArticleCollection>('articles').readByQuery({
  fields: ['id', 'title', 'status', 'created_at'],
  filter: { status: { _eq: 'published' } },
  limit: 50,
  sort: ['-created_at']
});

// ❌ INCORRECT: No type safety, fetches all fields
const articles = await directus.items('articles').readMany();
```

### Error Handling

**All Directus SDK calls MUST be wrapped in try-catch** with specific error handling:

```typescript
try {
  const result = await directus.items<ArticleCollection>('articles').readOne(id);
  return result;
} catch (error) {
  if (error.response?.status === 404) {
    throw new NotFoundError(`Article ${id} not found`);
  }
  if (error.response?.status === 403) {
    throw new UnauthorizedError('Insufficient permissions');
  }
  // Log unexpected errors for debugging
  console.error('Directus API error:', error);
  throw new DirectusAPIError('Failed to fetch article', error);
}
```

### Caching Strategy

**Implement caching for:**
- Static configuration data (invalidate on deploy)
- Lookup tables that change <1x/day (TTL: 1 hour)
- Frequently-accessed content (TTL: 5 minutes)

**Do NOT cache:**
- User-specific data
- Real-time data requiring <5 second freshness
- Data with complex invalidation logic

## Governance

### Amendment Procedure

**Constitution changes require:**
1. **Proposal**: Document change rationale and impact assessment
2. **Review**: Team review period (minimum 48 hours)
3. **Approval**: Consensus or majority vote depending on scope
4. **Migration Plan**: Document code changes required and migration timeline
5. **Version Update**: Increment version following semantic versioning
6. **Template Sync**: Update dependent templates and documentation

### Versioning Policy

**Constitution versions follow semantic versioning:**
- **MAJOR**: Backward-incompatible governance changes (e.g., removing a principle)
- **MINOR**: New principles or materially expanded guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Reviews

**All feature implementations MUST pass constitution compliance check before plan approval.** Constitution violations require explicit justification documented in `plan.md` Complexity Tracking section. Technical debt from violations MUST be tracked and scheduled for remediation.

**Enforcement**: Pull requests not passing quality gates MUST NOT be merged. Constitution violations blocking releases require emergency review and mitigation plan.

---

**Version**: 1.0.0 | **Ratified**: 2025-01-20 | **Last Amended**: 2025-01-20
