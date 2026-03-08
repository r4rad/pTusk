import { useState, useEffect, useCallback } from "react";

// ─── PERSISTENT STORAGE (works in Claude artifacts AND localStorage) ─────────
const Store = {
    async get(key) {
        try {
            if (typeof window !== "undefined" && window.storage) {
                const r = await window.storage.get(key);
                return r ? JSON.parse(r.value) : null;
            }
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : null;
        } catch { return null; }
    },
    async set(key, value) {
        try {
            const v = JSON.stringify(value);
            if (typeof window !== "undefined" && window.storage) {
                await window.storage.set(key, v);
            } else {
                localStorage.setItem(key, v);
            }
        } catch { }
    },
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const TODAY_DAY = 3;
const DAILY_HOURS = 5;

const WORK_DATES = [
    "Tue 3 Mar", "Wed 4 Mar", "Thu 5 Mar",
    "Sun 8 Mar", "Mon 9 Mar", "Tue 10 Mar", "Wed 11 Mar", "Thu 12 Mar",
    "Sun 15 Mar", "Mon 16 Mar",
    "Tue 24 Mar", "Wed 25 Mar",
    "Sun 29 Mar", "Mon 30 Mar", "Tue 31 Mar",
];

const EPIC_META = {
    E1: { color: "#1E40AF", bg: "#EFF6FF", label: "Foundation" },
    E2: { color: "#6B21A8", bg: "#F5F3FF", label: "Identity" },
    E3: { color: "#0F766E", bg: "#F0FDF4", label: "Tenancy" },
    E4: { color: "#92400E", bg: "#FFF7ED", label: "JWT" },
    E5: { color: "#991B1B", bg: "#FFF1F2", label: "Rate/M2M" },
    E6: { color: "#166534", bg: "#DCFCE7", label: "RBAC" },
    E7: { color: "#4338CA", bg: "#EEF2FF", label: "Security" },
    E8: { color: "#B45309", bg: "#FFFBEB", label: "Observability" },
    E9: { color: "#0E7490", bg: "#ECFEFF", label: "Platform" },
    ARCH: { color: "#D97706", bg: "#FFFBEB", label: "Migration" },
    QA: { color: "#7C3AED", bg: "#F5F3FF", label: "QA" },
};

const STATUS_CFG = {
    todo: { label: "To Do", bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" },
    wip: { label: "In Progress", bg: "#EFF6FF", text: "#1D4ED8", dot: "#60A5FA" },
    review: { label: "Review", bg: "#FFFBEB", text: "#B45309", dot: "#FCD34D" },
    done: { label: "Done ✓", bg: "#F0FDF4", text: "#15803D", dot: "#4ADE80" },
    blocked: { label: "Blocked", bg: "#FFF1F2", text: "#B91C1C", dot: "#F87171" },
    skipped: { label: "Skipped", bg: "#F8FAFC", text: "#94A3B8", dot: "#CBD5E1" },
};


// ─── BACKLOG STORIES ─────────────────────────────────────────────────────────
const BACKLOG = {
    "E1-S1": {
        title: "Project Scaffolding, Docker & pyproject.toml", points: 3, priority: "Critical", epic: "E1",
        story: "As a developer, I want a clean N-Tier project structure so each layer has a clear boundary and the team can start implementing features without structural ambiguity.",
        ac: ["app/api, app/core, app/models, app/repositories, app/services, app/schema with matching tests/unit/ sub-directories (migrated via ARCH-S1)", "Docker Compose starts PostgreSQL, Redis, and SEQ with docker compose up", "pyproject.toml defines core/dev/test/production dependency groups with pinned versions", "app/core/config.py uses pydantic-settings with env_file=f'.env.{ENV}' selection", "settings.API_VERSION drives all route prefixes via build_api_router() factory", "GET /api/{settings.API_VERSION}/health → 200 with service, version, status, db, cache", "pytest runs green with testpaths=['tests'], pythonpath=['.','app']"]
    },
    "E1-S2": {
        title: "Database Abstraction — DB_PROVIDER, DatabaseFactory", points: 5, priority: "Critical", epic: "E1",
        story: "As a developer, I want a DatabaseFactory and ITenantSchemaManager interface so all database provider differences between PostgreSQL and MSSQL are encapsulated behind a single abstraction with zero code changes when switching providers.",
        ac: ["DatabaseFactory builds correct async SQLAlchemy URL for DB_PROVIDER=postgresql using asyncpg driver", "DatabaseFactory builds correct async SQLAlchemy URL for DB_PROVIDER=mssql using aioodbc driver", "ITenantSchemaManager Protocol defined in app/core/database/schema.py", "PostgreSQLSchemaManager.set_schema() executes SET search_path TO schema_name, public", "MSSQLSchemaManager.set_schema() stores schema name in session.info for before_cursor_execute hook", "DB_PROVIDER env var validated at startup — unsupported value raises ConfigurationError", "alembic/env.py uses DatabaseFactory for correct connection string per provider"]
    },
    "E1-S3": {
        title: "All Bounded-Context Domain Objects — Entities, VOs, Aggregates", points: 8, priority: "Critical", epic: "E1",
        story: "As a developer, I want all five bounded contexts fully defined in pure Python so business rules are testable without any infrastructure and all repository interfaces are defined as Protocols before any concrete implementation.",
        ac: ["app/models/ has zero imports from sqlalchemy, fastapi, redis, passlib, or any external library", "Five bounded contexts: Platform, Identity, Tenancy, RBAC, Observability — domain methods on ORM models", "PlatformUser.verify_password(), assign_to_application(), increment_rbac_version() as domain methods", "RefreshTokenFamily.rotate() raises TokenTheftDetected when replayed token is presented", "Tenant schema_name derived as f'{app_code}_{org_slug.replace(\"-\",\"_\")}' — never accepted as user input", "All domain invariant tests pass in under 2 seconds with zero infrastructure", "Repository interfaces defined as Python Protocols in app/repositories/interfaces/"]
    },
    "E1-S4": {
        title: "Platform Schema Alembic Migration — All Eight Platform Tables", points: 5, priority: "Critical", epic: "E1",
        story: "As a developer, I want all platform schema tables created via a single Alembic migration so all eight tables exist with correct constraints.",
        ac: ["PLATFORM_USER has user_scope enum, email_address UNIQUE, rbac_version int default 1, account_locked_until, is_active", "PLATFORM_TENANT has UNIQUE(application_id, organisation_slug) at DB level", "PLATFORM_REFRESH_TOKEN_FAMILY has family_id PK, user_id FK, is_revoked bool", "PLATFORM_REFRESH_TOKEN has token_hash SHA-256, parent_token_hash, used_at nullable", "PLATFORM_AUDIT_LOG captures action_type, entity_type, entity_id, changed_data JSONB", "alembic downgrade base && alembic upgrade head runs cleanly on both PostgreSQL and MSSQL"]
    },
    "E1-S5": {
        title: "IoC Container and Application Bootstrapping", points: 3, priority: "Critical", epic: "E1",
        story: "As a developer, I want a dependency-injector IoC container so all handlers receive dependencies through constructor injection and tests can swap fakes by changing one line.",
        ac: ["dependency-injector container defined in app/core/container.py as the composition root", "All handlers receive repositories via constructor injection only", "Swapping SqlAlchemyUserRepository for FakeUserRepository requires changing one line in container.py", "FastAPI lifespan wires container on startup and tears it down on shutdown — no global state", "GET /api/{v}/health → 200 and GET /api/{v}/docs loads OpenAPI spec"]
    },
    "E2-S1": {
        title: "Three-Tier Actor Model — ORM Models and Repository Infrastructure", points: 3, priority: "Critical", epic: "E2",
        story: "As a developer, I want SQLAlchemy ORM models for PLATFORM_USER, PLATFORM_USER_APPLICATION, and PLATFORM_USER_TENANT plus both concrete and fake repository implementations so application-layer tests run without a database.",
        ac: ["ORM models for all three tables in app/models/platform_models.py with domain methods", "PlatformUser domain methods: verify_password(), increment_rbac_version(), is_locked()", "SqlAlchemyUserRepository implements IUserRepository", "FakeUserRepository is dict-backed, implements IUserRepository identically", "All FakeUserRepository tests pass with zero database calls"]
    },
    "ARCH-S1": {
        title: "Folder Structure Migration — Clean Architecture to N-Tier Alignment", points: 5, priority: "Critical", epic: "ARCH",
        story: "As a developer, I want the IAM service source tree refactored from src/ to app/ so the codebase is structurally consistent with the N-Tier DDD standard and every subsequent story is written in the aligned layout.",
        ac: ["src/ renamed to app/, all Python imports updated from src. to app.", "app/models/ — per-entity ORM files with domain methods: platform_models.py, tenant_models.py, rbac_models.py, token_family.py", "app/repositories/ + app/repositories/interfaces/ — Protocol-based interfaces", "app/core/database/ — provider.py (DatabaseFactory), session.py, schema.py (SchemaManager)", "app/core/config.py — env_file=f'.env.{ENV}' pattern + API_VERSION field", "app/core/container.py — full DI wiring for N-Tier layout", "app/api/endpoints/v1/ + routes.py — build_api_router() with dynamic /api/{settings.API_VERSION} prefix", "app/services/ handlers, app/schema/request/ + response/ Pydantic models", "tests/unit/api/, tests/unit/services/, tests/unit/repositories/ — zero test logic deleted", "alembic/env.py import paths updated. alembic upgrade head still creates all 8 platform tables", "GET /api/{settings.API_VERSION}/health → 200. Full test suite green."]
    },
    "E2-S2": {
        title: "Email Authentication Lifecycle — Signup, Confirmation, Password Reset", points: 5, priority: "High", epic: "E2",
        story: "As a new user, I want to register, confirm my email, and reset my password through secure email-verified flows.",
        ac: ["POST /api/{v}/auth/signup creates PLATFORM_USER with is_active=false and sends Jinja2 confirmation email", "Confirmation token stored as SHA-256 hash — never plaintext", "POST /api/{v}/auth/confirm-email sets is_active=true", "POST /api/{v}/auth/forgot-password always returns 200 (enumeration protection)", "POST /api/{v}/auth/reset-password writes new bcrypt (cost 12) password_hash and revokes all token families", "Expired tokens return 422 with clear error", "Password complexity: min 10 chars, ≥1 uppercase, ≥1 digit, ≥1 symbol"]
    },
    "E2-S3": {
        title: "LoginHandler — Three Scopes, Three JWT Shapes", points: 8, priority: "Critical", epic: "E2",
        story: "As a user, I want to authenticate and receive a JWT shaped correctly for my user_scope.",
        ac: ["SUPER_ADMIN login → JWT with {sub, user_scope, iat, exp} only", "APP_ADMIN login → JWT with {sub, user_scope, application_id, application_role, iat, exp}", "TENANT_USER login → JWT with {sub, user_scope, application_id, tenant_id, rbac_version, iat, exp}", "All signed with RS256 — verifiable with GET /api/{v}/auth/jwks public key", "GET /api/{v}/auth/jwks returns JWK Set with kid matching JWT header", "Failed login increments Redis counter login_failures:{email}"]
    },
    "E2-S4": {
        title: "Progressive Login Lockout — Redis Soft Lock and DB Hard Lock", points: 3, priority: "Critical", epic: "E2",
        story: "As the system, I want to progressively lock accounts under brute-force attack.",
        ac: ["5th consecutive failed login → 429 with Retry-After header", "10th failure → PLATFORM_USER.account_locked_until written", "Locked accounts return 423 with no password verification attempted", "Successful login resets Redis counter login_failures:{email}", "DELETE /api/{v}/platform/users/{id}/lock clears account_locked_until and Redis counter"]
    },
    "E3-S1": {
        title: "Alembic Tenant Template — All Tenant Schema Tables and System Seeding", points: 5, priority: "Critical", epic: "E3",
        story: "As a developer, I want the Alembic tenant template to create all required tenant tables and seed system data so every provisioned tenant has an identical, fully migrated schema.",
        ac: ["Template creates TENANT_ROLE, TENANT_GROUP, TENANT_PERMISSION_DEF, TENANT_ROLE_GROUP, TENANT_GROUP_PERMISSION, TENANT_USER_ROLE, TENANT_AUDIT_LOG, TENANT_ACCESS_LOG", "System roles Admin, Member, Viewer seeded with is_system_role=true — cannot be deleted", "run_tenant_migration(schema_name, engine) callable programmatically", "Template idempotent — running twice does not create duplicate rows"]
    },
    "E3-S2": {
        title: "ProvisionTenantHandler — Atomic Schema Creation and Migration", points: 8, priority: "Critical", epic: "E3",
        story: "As an APP_ADMIN, I want to provision a new tenant so a dedicated database schema is created atomically.",
        ac: ["POST /api/{v}/tenancy/tenants creates PLATFORM_TENANT row and physical schema in a single transaction", "schema_name derived as application_code_organisation_slug — never accepted as user input", "UNIQUE(application_id, organisation_slug) violation returns 409 Conflict", "Schema creation failure → PLATFORM_TENANT insert rolled back atomically", "TenantProvisioned domain event emitted after success", "Response includes tenant_id, schema_name, tenant_slug, status, created_at"]
    },
    "E3-S3": {
        title: "TenantMiddleware — Redis-Cached Schema Routing with 60s TTL", points: 5, priority: "Critical", epic: "E3",
        story: "As the system, I want every tenant-scoped request automatically routed to the correct database schema before any handler runs.",
        ac: ["X-Tenant-Slug header resolved to tenant_id, schema_name, application_id in request.state", "Redis cache hit returns tenant context in under 2ms", "Redis cache miss queries PLATFORM_TENANT — result cached for 60 seconds (NOT 3600)", "SUSPENDED tenant returns 403 TENANT_SUSPENDED within 60 seconds of suspension", "Missing X-Tenant-Slug on tenant-scoped routes → 400 MISSING_TENANT_HEADER"]
    },
    "E3-S4": {
        title: "TenantSchemaManager — PostgreSQL and MSSQL Implementations", points: 3, priority: "Critical", epic: "E3",
        story: "As a developer, I want the concrete PostgreSQLSchemaManager and MSSQLSchemaManager implementations so schema routing is correctly applied for both database providers.",
        ac: ["PostgreSQLSchemaManager.set_schema() executes SET search_path TO schema_name, public", "MSSQLSchemaManager.set_schema() stores schema name in session.info for before_cursor_execute hook", "Integration test: write to tenant A schema, verify NOT readable from tenant B session"]
    },
    "E3-S5": {
        title: "Application Management Modes and Tenant Lifecycle API", points: 3, priority: "High", epic: "E3",
        story: "As the system, I want SYSTEM_MANAGED and SELF_MANAGED modes enforced. As an APP_ADMIN, I want to list, suspend, and reactivate tenants.",
        ac: ["SYSTEM_MANAGED: POST /api/{v}/tenancy/app-admins → 403 even for OWNER role", "SELF_MANAGED: POST /api/{v}/tenancy/app-admins succeeds for OWNER role", "PATCH /api/{v}/tenancy/tenants/{id}/suspend → status=SUSPENDED + Redis cache cleared", "POST /api/{v}/tenancy/tenants/{id}/reactivate → status=ACTIVE", "Cannot suspend an already SUSPENDED tenant — returns 422"]
    },
    "E3-S6": {
        title: "Migration Rollout Strategies — Immediate, Maintenance Window, On-Access", points: 5, priority: "High", epic: "E3",
        story: "As a developer, I want three migration rollout strategies for deploying schema changes to existing tenants.",
        ac: ["alembic --tenant all upgrade head applies migration to all tenant schemas (Immediate)", "Maintenance window strategy schedules migration via APScheduler", "On-Access strategy: TenantMiddleware detects version mismatch and migrates before first request", "Migration failures are isolated — one tenant failure does not block others"]
    },
    "E4-S1": {
        title: "JwtService — RS256 Signing, Three Token Shapes, Key Management", points: 5, priority: "Critical", epic: "E4",
        story: "As the authentication system, I want a JwtService that signs and verifies tokens with RS256 asymmetric keys.",
        ac: ["sign_super_admin_token() → JWT with {sub, user_scope, iat, exp} only", "sign_app_admin_token() → JWT with {sub, user_scope, application_id, application_role, iat, exp}", "sign_tenant_user_token() → JWT with {sub, user_scope, application_id, tenant_id, rbac_version, iat, exp}", "JWT_PRIVATE_KEY_PATH and JWT_PUBLIC_KEY_PATH loaded from environment — no hardcoded keys", "GET /api/{v}/auth/jwks returns valid JWK Set with kid, kty=RSA, use=sig, n, e fields"]
    },
    "E4-S2": {
        title: "JWTBearer Middleware — Signature, Expiry, Cross-Tenant, rbac_version", points: 5, priority: "Critical", epic: "E4",
        story: "As the system, I want JWTBearer to validate every authenticated request for RS256 signature, expiry, cross-tenant replay, and rbac_version staleness.",
        ac: ["RS256 signature validation — tampered token → 401", "Expired token → 401", "TENANT_USER token where tenant_id ≠ request.state.tenant_id → 403 CROSS_TENANT_REPLAY", "TENANT_USER rbac_version in JWT < current PLATFORM_USER.rbac_version → 401 RBAC_VERSION_MISMATCH", "JWTBearer is a FastAPI dependency — injected per route, not global middleware"]
    },
    "E4-S3": {
        title: "RefreshTokenFamily Aggregate — SHA-256 Hashing, Rotation, Theft Detection", points: 5, priority: "Critical", epic: "E4",
        story: "As the system, I want the RefreshTokenFamily aggregate to enforce all token rotation invariants at the domain layer.",
        ac: ["rotate() returns new raw token and stores SHA-256 hash of previous in parent_token_hash", "rotate() raises TokenTheftDetected when presented token hash already has used_at set", "TokenTheftDetected → family.is_revoked=True atomically", "All rotation invariant tests pass without database (FakeRefreshTokenFamilyRepository)"]
    },
    "E4-S4": {
        title: "Refresh Token API — Rotation Endpoint and Logout", points: 5, priority: "Critical", epic: "E4",
        story: "As a user, I want POST /auth/refresh to rotate my token pair and POST /auth/logout to revoke my session.",
        ac: ["POST /api/{v}/auth/refresh with valid unused token → new access_token + new refresh_token", "POST /auth/refresh marks previous token used_at", "POST /auth/refresh with used token → 401 TOKEN_THEFT_DETECTED + family revoked", "POST /api/{v}/auth/logout with refresh_token → 204 No Content, family.is_revoked=True", "Access token remains valid until natural expiry after logout (stateless JWT)"]
    },
    "E4-S5": {
        title: "rbac_version Force-Reauth and Session Invalidation", points: 3, priority: "Critical", epic: "E4",
        story: "As a SUPER_ADMIN, I want to immediately invalidate all in-flight sessions for a specific user by incrementing rbac_version.",
        ac: ["POST /api/{v}/platform/users/{id}/force-reauth atomically increments PLATFORM_USER.rbac_version", "Redis cache entry permissions:{schema_name}:{user_id} deleted immediately", "Old JWT → 401 RBAC_VERSION_MISMATCH on next request", "PLATFORM_AUDIT_LOG entry written with acting SUPER_ADMIN's user_id"]
    },
    "E5-S1": {
        title: "Tenant Rate Limiter — Redis Sliding Window Middleware", points: 3, priority: "Critical", epic: "E5",
        story: "As the system, I want per-tenant per-user per-endpoint rate limiting via Redis sliding window.",
        ac: ["Redis key: rate:{tenant_id}:{user_id}:{endpoint} incremented on every request", "Rate limit from RATE_LIMIT_DEFAULT_REQUESTS_PER_MINUTE env var", "Exceeded limit → 429 with X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After", "Different tenants have completely independent counters", "GET /health never blocked"]
    },
    "E5-S2": {
        title: "M2M API Key Authentication — ApiKeyAuthenticator and Secret Rotation", points: 3, priority: "Critical", epic: "E5",
        story: "As a machine client, I want to authenticate using X-API-Key and X-API-Secret headers so automated services can operate with APP_ADMIN scope.",
        ac: ["ApiKeyAuthenticator extracts X-API-Key and X-API-Secret from request headers", "bcrypt.verify against PLATFORM_APPLICATION.api_secret_hash — timing-safe", "POST /api/{v}/auth/m2m/token → APP_ADMIN JWT with application_id", "SUSPENDED applications → 401 even with valid credentials", "PUT /api/{v}/tenancy/applications/{id}/rotate-secret: new key+secret, old atomically invalidated", "api_secret returned plaintext once only after creation or rotation"]
    },
    "E6-S1": {
        title: "RBAC ORM Models and Fake Repository Infrastructure", points: 5, priority: "Critical", epic: "E6",
        story: "As a developer, I want SQLAlchemy ORM models for all six tenant RBAC tables and both concrete and fake repository implementations.",
        ac: ["ORM models for TENANT_ROLE, TENANT_GROUP, TENANT_PERMISSION_DEF, TENANT_ROLE_GROUP, TENANT_GROUP_PERMISSION, TENANT_USER_ROLE in app/models/rbac_models.py", "SqlAlchemyRoleRepository and SqlAlchemyGroupRepository implement their Protocol interfaces", "FakeRoleRepository and FakeGroupRepository are dict-backed", "All fake repository contract tests pass with zero database calls"]
    },
    "E6-S2": {
        title: "PermissionResolver — Cache-First Resolution", points: 8, priority: "Critical", epic: "E6",
        story: "As the system, I want PermissionResolver to resolve user permissions cache-first so hits < 5ms and misses < 30ms.",
        ac: ["Cache key: permissions:{schema_name}:{user_id} — schema_name prefix prevents cross-tenant collision", "Cache hit: single Redis GET returning frozenset — < 5ms p95", "Cache miss: JOIN query across TENANT_USER_ROLE→TENANT_ROLE_GROUP→TENANT_GROUP_PERMISSION→TENANT_PERMISSION_DEF — < 30ms p95", "Cache result stored with 300-second TTL", "GET /api/{v}/{app_code}/rbac/users/{id}/permissions returns resolved_from: cache|db", "50K permission rows, 100 tenants — benchmark meets p95 targets"]
    },
    "E6-S3": {
        title: "Cache Invalidation via GroupPermissionRemoved Domain Event", points: 3, priority: "Critical", epic: "E6",
        story: "As the system, I want permission cache entries deleted synchronously when a group's permissions change.",
        ac: ["GroupPermissionRemoved event published when permission removed from TENANT_GROUP", "PermissionCacheInvalidator finds all roles that include the changed group", "DEL executed for permissions:{schema_name}:{user_id} for every affected user", "Synchronous within the same request — not a background job", "GroupPermissionAdded also triggers cache invalidation"]
    },
    "E6-S4": {
        title: "Permission Group CRUD API", points: 5, priority: "High", epic: "E6",
        story: "As a TENANT_USER with group management permission, I want to create, edit, delete, and manage permissions within groups.",
        ac: ["POST /api/{v}/{app_code}/rbac/groups → 201 with group_id", "PUT /api/{v}/{app_code}/rbac/groups/{id} updates name and description", "DELETE /api/{v}/{app_code}/rbac/groups/{id} → 409 if linked to any role", "POST /api/{v}/{app_code}/rbac/groups/{id}/permissions → adds permission + triggers cache invalidation", "DELETE /api/{v}/{app_code}/rbac/groups/{id}/permissions/{pid} → removes + invalidates cache", "GET /api/{v}/{app_code}/rbac/permissions lists TENANT_PERMISSION_DEF — paginated"]
    },
    "E6-S5": {
        title: "Role CRUD API and Role-Group Assignment", points: 5, priority: "High", epic: "E6",
        story: "As a TENANT_USER with role management permission, I want to create, edit, delete roles and assign or remove permission groups.",
        ac: ["POST /api/{v}/{app_code}/rbac/roles → 201", "PUT /api/{v}/{app_code}/rbac/roles/{id} updates name and description", "DELETE /api/{v}/{app_code}/rbac/roles/{id} → 409 if users assigned, 403 if system role", "POST /api/{v}/{app_code}/rbac/roles/{id}/groups → link group + cache invalidation for all users with this role", "DELETE /api/{v}/{app_code}/rbac/roles/{id}/groups/{gid} → unlink + invalidate"]
    },
    "E6-S6": {
        title: "User Role Assignment API and GET Permissions Endpoint", points: 3, priority: "High", epic: "E6",
        story: "As a TENANT_USER with user management permission, I want to assign and revoke roles and retrieve the current resolved permission set.",
        ac: ["POST /api/{v}/{app_code}/rbac/users/{id}/roles creates TENANT_USER_ROLE mapping", "DELETE /api/{v}/{app_code}/rbac/users/{id}/roles/{role_id} removes mapping + DELs permission cache", "GET /api/{v}/{app_code}/rbac/users/{id}/permissions returns resolved set via cache-first path", "GET /api/{v}/{app_code}/rbac/permissions lists all TENANT_PERMISSION_DEF including system"]
    },
    "E7-S1": {
        title: "ScopeGuard and RBACGuard FastAPI Dependencies", points: 5, priority: "Critical", epic: "E7",
        story: "As the system, I want ScopeGuard and RBACGuard FastAPI dependencies so every protected route declares its access requirements once.",
        ac: ["require_scope(SUPER_ADMIN) → 403 for APP_ADMIN and TENANT_USER", "require_scope(APP_ADMIN) → 403 for SUPER_ADMIN and TENANT_USER", "SYSTEM_MANAGED: APP_ADMIN on admin-management routes → 403 regardless of application_role", "SELF_MANAGED OWNER → 200", "require_permission uses PermissionResolver — cache-first, < 1ms overhead on hit"]
    },
    "E7-S2": {
        title: "Cross-Tenant Protection and Full Guard Chain Integration Test", points: 3, priority: "Critical", epic: "E7",
        story: "As the system, I want the full middleware pipeline TenantMiddleware → JWTBearer → ScopeGuard → RBACGuard integrated and tested end-to-end.",
        ac: ["TENANT_USER token for ait360_fakir_group on ait360_apex route → 403 CROSS_TENANT_REPLAY", "TenantMiddleware verified to run before JWTBearer", "Removed permission takes effect on next request end-to-end", "Full guard chain test: provision → create user → assign role → 200 → remove role → 403"]
    },
    "E7-S3": {
        title: "Security Adversarial Test Suite", points: 5, priority: "Critical", epic: "E7",
        story: "As the team, I want a dedicated adversarial test suite that verifies every known attack pattern is correctly detected.",
        ac: ["Cross-tenant replay: token for tenant A on tenant B route → 403", "Token family theft: replayed used refresh token → entire family revoked → 401 for both parties", "rbac_version revocation: force-reauth → old JWT → 401 immediately", "Scope escalation: TENANT_USER on SUPER_ADMIN route → 403", "SQL injection in X-Tenant-Slug → 404 (not 500)", "Rate limit burst: 110 requests in window → 429 with Retry-After", "grep -r PLATFORM_ORGANIZATION app/ → zero results (Phase 1 scope gate)"]
    },
    "E8-S1": {
        title: "AuditableEntity Mixin and Database Audit Logs", points: 3, priority: "Critical", epic: "E8",
        story: "As an auditor, I want every INSERT, UPDATE, and DELETE on auditable tables to produce an immutable audit log entry.",
        ac: ["AuditableEntity mixin fires after_insert, after_update, after_delete events on all auditable models", "Each event writes to PLATFORM_AUDIT_LOG or TENANT_AUDIT_LOG depending on schema", "Captures: platform_user_id, action_type, entity_type, entity_id, changed_data JSONB, ip_address", "password_hash and api_secret_hash excluded from changed_data — never logged", "Audit writes synchronous within same transaction — rollback rolls back audit row"]
    },
    "E8-S2": {
        title: "structlog Processor Chain and SEQ Integration", points: 3, priority: "Critical", epic: "E8",
        story: "As an operator, I want all structured log events routed to SEQ via structlog so permission checks, logins, and token events are queryable in real time.",
        ac: ["structlog configured with: add_log_level, add_timestamp, bind_contextvars, JSONRenderer", "seqlog processor routes to SEQ_SERVER_URL using SEQ_API_KEY", "Every PermissionResolver.resolve() emits permission_check event with outcome, cache_hit, duration_ms", "SEQ down → JSON stdout, request not blocked (non-blocking)", "tenant_id and schema_name bound to all log events via contextvars"]
    },
    "E8-S3": {
        title: "TENANT_ACCESS_LOG Integration with PermissionResolver", points: 2, priority: "High", epic: "E8",
        story: "As a security analyst, I want every permission check result written to TENANT_ACCESS_LOG.",
        ac: ["Every PermissionResolver.resolve() writes one row to TENANT_ACCESS_LOG", "Row includes: platform_user_id, permission_code, outcome (ALLOW|DENY), denial_reason, request_endpoint, source_ip_address, duration_ms, was_cache_hit, created_at", "Both ALLOW and DENY written — not just denials", "Write is async fire-and-forget — must not add latency to permission resolution"]
    },
    "E8-S4": {
        title: "RequestLoggingMiddleware and API Access Log Events", points: 2, priority: "High", epic: "E8",
        story: "As an operator, I want structured API access log events emitted to SEQ for every request.",
        ac: ["RequestLoggingMiddleware emits request_completed event after every request", "Event includes: request_id, method, path, status, duration_ms, user_id, tenant_id, schema_name, user_agent, source_ip", "401/403/429/500 logged at WARNING or ERROR — 2xx at INFO", "Every response has X-Request-ID header (UUID) — same ID in SEQ log"]
    },
    "E9-S1": {
        title: "Platform Management API — SUPER_ADMIN Routes", points: 5, priority: "High", epic: "E9",
        story: "As a SUPER_ADMIN, I want a complete platform management API so I can register applications, manage users, and perform administrative security actions.",
        ac: ["POST /api/{v}/platform/applications → 201 with api_key and api_secret (plaintext once only)", "GET /api/{v}/platform/applications → all applications paginated (SUPER_ADMIN only)", "PATCH /api/{v}/platform/applications/{id} → update status", "POST /api/{v}/platform/users → create SUPER_ADMIN or APP_ADMIN", "GET /api/{v}/platform/users → paginated, filterable by user_scope and is_active", "DELETE /api/{v}/platform/users/{id}/lock → clear account_locked_until + Redis counter", "POST /api/{v}/platform/users/{id}/force-reauth → rbac_version++ + cache DEL", "All routes return 403 for non-SUPER_ADMIN tokens"]
    },
    "E9-S2": {
        title: "SELF_MANAGED Admin Self-Service", points: 5, priority: "High", epic: "E9",
        story: "As a SELF_MANAGED application OWNER, I want to invite and remove application admins without external involvement.",
        ac: ["POST /api/{v}/tenancy/app-admins creates PLATFORM_USER + PLATFORM_USER_APPLICATION when caller has OWNER role on SELF_MANAGED app", "DELETE /api/{v}/tenancy/app-admins/{id} removes PLATFORM_USER_APPLICATION mapping", "GET /api/{v}/tenancy/app-admins → admins for caller's application only", "SYSTEM_MANAGED: all three endpoints → 403 SYSTEM_MANAGED_RESTRICTION"]
    },
    "E9-S3": {
        title: "Application Secret Rotation and M2M Lifecycle Management", points: 3, priority: "High", epic: "E9",
        story: "As an APP_ADMIN or SUPER_ADMIN, I want to rotate application API secrets so compromised secrets are invalidated immediately.",
        ac: ["PUT /api/{v}/tenancy/applications/{id}/rotate-secret → new api_key + api_secret (plaintext once only)", "Old secret invalidated atomically — no overlap window", "GET /api/{v}/tenancy/applications/{id}/api-key → api_key UUID only (secret never returned again)", "Rotation event written to PLATFORM_AUDIT_LOG at elevated severity"]
    },
    "QA-S1": {
        title: "Integration Test Suite — 80+ Tests Across All Critical User Journeys", points: 5, priority: "Critical", epic: "QA",
        story: "As the team, I want a full integration test suite covering all critical user journeys end-to-end against real database and Redis.",
        ac: ["All three login flows tested end-to-end: SUPER_ADMIN, APP_ADMIN, TENANT_USER — correct JWT shapes verified", "Token family rotation and theft detection tested with real PLATFORM_REFRESH_TOKEN records", "Tenant provisioning and suspension lifecycle tested end-to-end", "Cross-tenant data isolation verified at the database level", "RBAC pipeline: create role → assign group → assign user → resolve → remove role → 403", "Rate limiting tested with real Redis sliding window", "80+ tests green in clean docker-compose environment"]
    },
    "QA-S2": {
        title: "Performance Benchmarks and Coverage Gates — Release Criteria", points: 3, priority: "Critical", epic: "QA",
        story: "As the team, I want automated performance benchmarks and test coverage gates to pass as release criteria.",
        ac: ["PermissionResolver cache hit < 5ms p95 against 50K permission rows and 100 tenants", "PermissionResolver cache miss < 30ms p95", "TenantMiddleware Redis cache hit < 2ms p95", "Domain layer test coverage at 100%", "Application layer test coverage at 95%", "Security layer test coverage at 90%", "scripts/release_gate.sh exits 0 only when all benchmarks and coverage gates pass", "OpenAPI spec complete — all 43 endpoints documented"]
    },
};


// ─── COPILOT PROMPTS (per story, per commit) ──────────────────────────────
const PROMPTS = {
    "E1-S1": {
        model: "Haiku 4.5", expect: "Clean N-Tier skeleton with Docker Compose, dynamic API versioning, and passing health check.", commits: [
            { label: "chore(scaffold): init pyproject.toml + N-Tier directory tree", prompt: "Create pyproject.toml with Poetry groups: core (fastapi, sqlalchemy, pydantic-settings, dependency-injector, redis, passlib, python-jose, structlog), dev (uvicorn, alembic), test (pytest, pytest-asyncio, httpx, fakeredis). Create full N-Tier layout: app/api/endpoints/v1/, app/core/database/, app/core/middleware/, app/core/security/, app/models/, app/repositories/interfaces/, app/services/identity/, app/schema/request/, app/schema/response/, app/utils/, tests/unit/api/, tests/unit/services/, tests/unit/repositories/, tests/unit/models/, tests/integration/. Add __init__.py to every directory." },
            { label: "chore(scaffold): Docker Compose — PostgreSQL + Redis + SEQ", prompt: "Create docker-compose.yml: postgres:15, redis:7-alpine, datalust/seq:latest. Health checks on all. Create .env.development, .env.staging, .env.production with DB_PROVIDER=postgresql, API_VERSION=v1, APP_VERSION=1.0.0." },
            { label: "feat(config): pydantic-settings Settings with env-file selection + API_VERSION", prompt: "Create app/core/config.py. Settings(BaseSettings): API_VERSION: str = 'v1', APP_VERSION: str = '1.0.0', ENV: str = 'development', DATABASE_URL: str, REDIS_URL: str, SEQ_SERVER_URL: str, JWT_PRIVATE_KEY_PATH: str, JWT_PUBLIC_KEY_PATH: str, RATE_LIMIT_DEFAULT_REQUESTS_PER_MINUTE: int = 60. model_config = SettingsConfigDict(env_file=f'.env.{ENV}'). Expose settings = Settings()." },
            { label: "feat(api): build_api_router() factory + GET /health endpoint + test", prompt: "Create app/api/endpoints/routes.py: build_api_router() creates APIRouter with prefix=f'/api/{settings.API_VERSION}' and includes all sub-routers. Create app/api/endpoints/v1/health.py: GET /health returns {service, version, status, timestamp, db, cache}. Create app/main.py with lifespan and app.include_router(build_api_router()). Write tests/unit/api/test_health.py verifying 200 and all response fields. Test API_VERSION change: set v2 → route at /api/v2/health." },
        ], verify: "docker compose up -d && curl localhost:8000/api/v1/health → 200. pytest tests/unit/api/test_health.py → green. Change API_VERSION=v2 → curl /api/v2/health → 200 ✓"
    },
    "E1-S2": {
        model: "Sonnet 4.6", expect: "DatabaseFactory builds correct async URLs for PostgreSQL and MSSQL. ITenantSchemaManager Protocol defined. Alembic wired.", commits: [
            { label: "feat(core): ITenantSchemaManager Protocol + PostgreSQL/MSSQL implementations", prompt: "Create app/core/database/schema.py. ITenantSchemaManager(Protocol): set_schema(session, schema_name)->None. PostgreSQLSchemaManager: execute 'SET search_path TO {schema_name}, public'. MSSQLSchemaManager: store in session.info['schema_name'] for before_cursor_execute hook. No external imports beyond SQLAlchemy." },
            { label: "feat(core): DatabaseFactory + AsyncSession factory + get_session dependency", prompt: "Create app/core/database/provider.py: DatabaseFactory.create_engine(db_provider, url)->AsyncEngine (postgresql→asyncpg, mssql→aioodbc, else ConfigurationError). DatabaseFactory.create_schema_manager(db_provider)->ITenantSchemaManager. Create app/core/database/session.py: async_session_factory, async get_session()->AsyncGenerator[AsyncSession, None]. Commit on success, rollback on exception." },
            { label: "test(core): DatabaseFactory URL construction — both providers, no real DB", prompt: "Create tests/unit/models/test_database_factory.py. Test: postgresql → URL contains asyncpg. mssql → URL contains aioodbc. unknown → ConfigurationError. Zero real DB connections." },
        ], verify: "pytest tests/unit/models/test_database_factory.py → all pass. alembic current → shows base. Change DB_PROVIDER=mssql in .env → app starts, no code changes needed."
    },
    "E1-S3": {
        model: "Opus 4.6", expect: "All five bounded-context ORM models with domain methods. Repository Protocols. Domain test suite passing under 2 seconds, zero infrastructure.", commits: [
            { label: "feat(models): AuditableEntity mixin + enums + DomainError exceptions", prompt: "Create app/models/base.py: AuditableEntity mixin with created_at, updated_at timestamps. Create app/models/enums.py: UserScope(Enum)=SUPER_ADMIN|APP_ADMIN|TENANT_USER, ApplicationRole(Enum)=OWNER|ADMIN|VIEWER, TenantStatus(Enum)=ACTIVE|SUSPENDED|DEPROVISIONED. Create app/utils/exceptions.py: DomainError, TokenTheftDetected, TenantNotFound, ConfigurationError." },
            { label: "feat(models): PlatformUser + PlatformApplication with domain methods", prompt: "Create app/models/platform_models.py. PlatformUser(AuditableEntity, Base): id UUID PK, email_address UNIQUE, password_hash, user_scope Enum, rbac_version int default 1, is_active bool, account_locked_until nullable. Domain methods: verify_password(raw)->bool (bcrypt), increment_rbac_version() raises DomainError if not TENANT_USER, is_locked()->bool. PlatformApplication: id, application_code UNIQUE, management_mode, api_key, api_secret_hash, status. ZERO imports from app.services, app.api, app.core." },
            { label: "feat(models): RefreshTokenFamily aggregate — rotate() + TokenTheftDetected", prompt: "Create app/models/token_family.py. PlatformRefreshTokenFamily: family_id UUID PK, user_id FK, is_revoked bool, rotation_count int. PlatformRefreshToken: id UUID PK, family_id FK, token_hash VARCHAR(64) UNIQUE, parent_token_hash nullable, used_at nullable. Domain method rotate(presented_hash)->str: if token.used_at is set → self.is_revoked=True, raise TokenTheftDetected. Else: token.used_at=now(), create new token, return new raw UUID." },
            { label: "feat(models): Tenant + RBAC domain models", prompt: "Create app/models/tenant_models.py: PlatformTenant(id, application_id FK, organisation_name, organisation_slug, schema_name UNIQUE, tenant_slug UNIQUE, status Enum), PlatformUserApplication, PlatformUserTenant. Create app/models/rbac_models.py: TenantRole (id, name, normalized_name UNIQUE, is_system_role), TenantGroup, TenantPermissionDef (permission_code UNIQUE, feature_area), TenantRoleGroup, TenantGroupPermission, TenantUserRole." },
            { label: "feat(repositories): all interface Protocols in app/repositories/interfaces/", prompt: "Create base_interface.py, user_repository_interface.py (IUserRepository: find_by_email, find_by_id, save, list_paginated), tenant_repository_interface.py, rbac_repository_interface.py (IRoleRepository, IGroupRepository, IPermissionRepository, IUserRoleRepository), token_family_repository_interface.py (IRefreshTokenFamilyRepository: find_by_token_hash, save_family, revoke_family). All Protocol classes." },
            { label: "test(models): full domain suite — all invariants, zero infrastructure", prompt: "Create tests/unit/models/test_platform_models.py, test_token_family.py. Test: verify_password correct/wrong. increment_rbac_version on SUPER_ADMIN raises DomainError. rotate() returns new UUID string. rotate() on used token raises TokenTheftDetected + family.is_revoked=True. All tests run under 2 seconds total. Instantiate models directly — no SQLAlchemy session." },
        ], verify: "pytest tests/unit/models/ → all pass under 2 seconds. grep -r 'import sqlalchemy' app/models/ → zero results."
    },
    "E1-S4": {
        model: "Sonnet 4.6", expect: "All 8 PLATFORM_* tables with correct constraints. Alembic up/down cycle clean.", commits: [
            { label: "feat(migration): initial platform schema — all 8 PLATFORM tables", prompt: "Create alembic/versions/001_platform_schema.py. Create: PLATFORM_APPLICATION (id UUID PK, application_code UNIQUE, management_mode CHECK IN ('SYSTEM_MANAGED','SELF_MANAGED'), api_key UUID UNIQUE, api_secret_hash, status DEFAULT 'ACTIVE'). PLATFORM_USER (id UUID PK, email_address UNIQUE, password_hash, user_scope VARCHAR(20), rbac_version INT DEFAULT 1, is_active BOOL DEFAULT FALSE, account_locked_until TIMESTAMP nullable). PLATFORM_TENANT (id UUID PK, application_id FK, organisation_name, organisation_slug, schema_name UNIQUE, tenant_slug UNIQUE, status DEFAULT 'ACTIVE', UNIQUE(application_id, organisation_slug)). PLATFORM_USER_APPLICATION, PLATFORM_USER_TENANT, PLATFORM_REFRESH_TOKEN_FAMILY, PLATFORM_REFRESH_TOKEN, PLATFORM_AUDIT_LOG. Include all FK constraints and indexes." },
        ], verify: "alembic downgrade base && alembic upgrade head — zero errors. psql: \\dt lists all 8 PLATFORM_* tables with correct constraints."
    },
    "E1-S5": {
        model: "Sonnet 4.6", expect: "IoC container wiring all repositories. FastAPI app factory with lifespan. Server starts, health 200, OpenAPI loads.", commits: [
            { label: "feat(core): dependency-injector IoC container — app/core/container.py", prompt: "Create app/core/container.py using dependency-injector. ApplicationContainer(DeclarativeContainer): config=providers.Configuration(), db_engine=providers.Singleton(DatabaseFactory.create_engine,...), async_session_factory=providers.Singleton(...), schema_manager=providers.Singleton(DatabaseFactory.create_schema_manager,...), user_repository=providers.Factory(SqlAlchemyUserRepository, session=...). Singleton for infrastructure, Factory for repositories." },
            { label: "feat(app): FastAPI create_app() factory + lifespan", prompt: "Create app/main.py. lifespan(app): startup → container.wire(modules=[...]), log startup event. Shutdown → disconnect. create_app()->FastAPI: FastAPI(title='Python.FastApi.IAMService', version=settings.APP_VERSION, lifespan=lifespan). Include build_api_router(). Add CORSMiddleware. Export app = create_app()." },
        ], verify: "uvicorn app.main:app — starts. GET /api/v1/health → 200. GET /api/v1/docs → OpenAPI spec loads."
    },
    "E2-S1": {
        model: "Sonnet 4.6", expect: "SQLAlchemy and Fake user repositories. Contract tests pass with zero DB calls. Container updated.", commits: [
            { label: "feat(repositories): SqlAlchemyUserRepository + FakeUserRepository", prompt: "Create app/repositories/user_repository.py: SqlAlchemyUserRepository(IUserRepository): find_by_email (SELECT WHERE email_address=:email), find_by_id, save (session.merge + flush), list_paginated. Create app/repositories/fake_user_repository.py: dict-backed _store. Same async interface. Both import from app.repositories.interfaces.user_repository_interface." },
            { label: "test(repositories): IUserRepository contract tests against FakeUserRepository", prompt: "Create tests/unit/repositories/test_user_repository_contract.py. Tests: find_by_email returns None for missing. save then find_by_id returns user. list_paginated returns correct page. All async. Zero DB calls — FakeUserRepository only." },
            { label: "feat(core): container updated + integration test skeleton", prompt: "Update app/core/container.py to wire user_repository with SqlAlchemyUserRepository. Create tests/integration/test_user_repository.py @pytest.mark.integration — tests against real DB. Skipped in CI unless INTEGRATION_TESTS=1." },
        ], verify: "pytest tests/unit/repositories/ → all pass, zero DB calls. pytest tests/integration/ -m integration → passes against docker-compose DB."
    },
    "ARCH-S1": {
        model: "Sonnet 4.6", expect: "src/ fully renamed to app/. N-Tier structure in place. Dynamic API versioning live. Domain methods on ORM models. Full test suite green.", commits: [
            { label: "chore(arch): rename src/ to app/ + restructure N-Tier directories", prompt: "Execute migration:\n1. mv src app\n2. mkdir -p app/api/endpoints/v1 app/core/database app/core/middleware app/core/security app/core/logging app/core/rbac app/core/seeders\n3. Move: infrastructure/settings.py→core/config.py, containers.py→core/container.py, etc.\n4. Bulk sed: find app tests -name '*.py' -exec sed -i 's/from src\\./from app./g' {} +\n5. Fix sub-path imports: app.application→app.services, app.infrastructure→app.core\n6. Update alembic/env.py, pyproject.toml pythonpath=['.','app']" },
            { label: "feat(core): dynamic API versioning via settings.API_VERSION in build_api_router()", prompt: "Update app/api/endpoints/routes.py: build_api_router() uses prefix=f'/api/{settings.API_VERSION}'. Add API_VERSION field to app/core/config.py. Update all .env files. Write test: mock settings.API_VERSION='v2' → build_api_router() → GET /api/v2/health 200. GET /api/v1/health → 404." },
            { label: "refactor(models): domain entity logic merged into SQLAlchemy ORM models", prompt: "Move domain logic from domain/*.py into ORM model classes. PlatformUser: add verify_password(), increment_rbac_version(), is_locked(). RefreshTokenFamily: add rotate() with TokenTheftDetected. Models import only SQLAlchemy, Pydantic, stdlib. Write tests/unit/models/ for all domain methods — no DB." },
            { label: "refactor(repositories): migrate interfaces and implementations to N-Tier layout", prompt: "Create Protocol files in app/repositories/interfaces/. Move SqlAlchemy implementations to app/repositories/. Create Fake implementations alongside each. Update app/core/container.py import paths. All existing unit tests must pass after path changes." },
        ], verify: "pytest tests/ → ALL existing tests pass. grep -r 'from src.' app tests → zero. grep -r 'import src.' app tests → zero. GET /api/v1/health → 200 ✓"
    },
};

// Simplified prompts for remaining stories
const PROMPT_DEFAULTS = {
    "E2-S2": {
        model: "Sonnet 4.6", expect: "Signup, confirm-email, forgot-password, reset-password endpoints live. SHA-256 token hashing. Jinja2 emails. Enumeration protection.", commits: [
            { label: "feat(schema): SignupRequest + ConfirmEmailRequest + PasswordResetRequest Pydantic models", prompt: "Create app/schema/request/auth.py. SignupRequest: email_address EmailStr, password constr(min_length=10) with validator for uppercase+digit+symbol, application_code str, organisation_slug str. ConfirmEmailRequest(token str). ForgotPasswordRequest(email_address EmailStr). ResetPasswordRequest(token str, new_password constr(min_length=10))." },
            { label: "feat(services): SignupHandler + ConfirmEmailHandler + PasswordResetHandler", prompt: "Create app/services/identity/signup_handler.py: check email uniqueness (409), bcrypt hash (cost 12), generate UUID token, store SHA-256 hash, is_active=False, send confirmation email. Create password_reset_handler.py: ForgotPasswordHandler always returns success. ResetPasswordHandler: find by token hash, validate expiry, hash new password, revoke all token families for user." },
            { label: "feat(api): POST /auth/signup + /auth/confirm-email + /auth/forgot-password + /auth/reset-password", prompt: "Add to app/api/endpoints/v1/auth.py. All four endpoints. POST /forgot-password always returns 200 even for unknown email. Wire handlers in container.py." },
            { label: "feat(core): JinjaEmailService + FakeEmailService + email Jinja2 templates", prompt: "Create app/services/identity/email_service.py with IEmailService Protocol. JinjaEmailService renders app/templates/emails/confirmation.html and password_reset.html. FakeEmailService stores sent emails in list for testing. Wire FakeEmailService in test container." },
        ], verify: "POST /auth/signup → 201. POST /auth/forgot-password unknown email → 200 (not 404). POST /auth/confirm-email expired token → 422."
    },
    "E2-S3": {
        model: "Sonnet 4.6", expect: "POST /auth/login returns correct JWT shape for each of 3 scopes. GET /auth/jwks returns valid JWK Set.", commits: [
            { label: "feat(security): JwtService — RS256 sign/verify/JWKS", prompt: "Create app/core/security/jwt_handler.py. JwtService: load private/public key from JWT_PRIVATE_KEY_PATH/JWT_PUBLIC_KEY_PATH. sign_super_admin_token → {sub, user_scope, iat, exp} only. sign_app_admin_token → adds {application_id, application_role}. sign_tenant_user_token → adds {tenant_id, rbac_version}. All RS256 via python-jose. get_jwks() → JWK Set with kid, kty=RSA, use=sig, n, e." },
            { label: "feat(services): LoginHandler — scope-aware authentication + token pair creation", prompt: "Create app/services/identity/login_handler.py. Steps: 1) find by email (401 if not found), 2) verify_password() (401 + increment Redis lockout counter), 3) check lockout (429 at 5, 423 at 10), 4) verify application_code/tenant_slug, 5) sign_*_token() based on user_scope, 6) create RefreshTokenFamily + first token. Return access_token, refresh_token, token_type='Bearer', expires_in, user_scope." },
            { label: "feat(api): POST /auth/login + GET /auth/jwks", prompt: "Add to auth.py router. POST /login → LoginHandler → TokenResponse. GET /jwks → JwtService.get_jwks(). LoginRequest schema: email_address, password, application_code optional, tenant_slug optional. Wire LoginHandler in container." },
            { label: "test(services): LoginHandler — 3 scopes, wrong credentials, lockout", prompt: "tests/unit/services/test_login_handler.py using FakeUserRepository + FakeRedis. Test: SUPER_ADMIN → JWT has ONLY sub+user_scope. APP_ADMIN → has application_id+application_role. TENANT_USER → has tenant_id+rbac_version. Wrong password → error. 5th wrong → SoftLockError. 10th → HardLockError." },
        ], verify: "POST /auth/login → decode JWT, SUPER_ADMIN payload has ONLY {sub, user_scope, iat, exp}. GET /auth/jwks → kid matches JWT header kid."
    },
    "E2-S4": {
        model: "Sonnet 4.6", expect: "Progressive lockout working. 5th failure → 429. 10th → 423 + DB record. Unlock clears both.", commits: [
            { label: "feat(services): progressive lockout in LoginHandler", prompt: "Update LoginHandler. On failed password: INCR login_failures:{email} TTL 900s. Count=5 → SoftLockError (429+Retry-After). Count=10 → PLATFORM_USER.account_locked_until=now()+24h + PLATFORM_AUDIT_LOG. Successful login → DEL counter. Check account_locked_until before password verify." },
            { label: "test(services): lockout thresholds", prompt: "tests/unit/services/test_login_lockout.py using FakeRedis. 4 failures → 401. 5th → SoftLockError with retry_after. 10th → HardLockError, user.account_locked_until set. Success → counter deleted. Pre-locked user → 423 on first attempt." },
        ], verify: "11 wrong password attempts → 5th returns 429 with Retry-After, 11th returns 423. DB: account_locked_until set."
    },
    "E3-S1": {
        model: "Sonnet 4.6", expect: "Alembic tenant template creates all 8 tenant tables. System roles and permissions seeded. Idempotent.", commits: [
            { label: "feat(migration): Alembic tenant template — 8 tenant tables", prompt: "Create alembic/tenant_template/versions/001_tenant_schema.py. All tables in specified schema: TENANT_ROLE(id UUID PK, name, normalized_name UNIQUE, is_system_role BOOL DEFAULT FALSE), TENANT_GROUP, TENANT_PERMISSION_DEF(permission_code UNIQUE, feature_area, is_system_permission), TENANT_ROLE_GROUP(UNIQUE(role_id,group_id)), TENANT_GROUP_PERMISSION(UNIQUE(group_id,permission_id)), TENANT_USER_ROLE(UNIQUE(user_id,role_id)), TENANT_AUDIT_LOG, TENANT_ACCESS_LOG." },
            { label: "feat(core): system roles + base permission seeder + run_tenant_migration()", prompt: "Create app/core/seeders/tenant_seeder.py: seed_system_roles() inserts Admin/Member/Viewer with is_system_role=True. seed_base_permissions() inserts TENANT_PERMISSION_DEF for all rbac.*.read/write codes. Create app/core/database/migrate.py: run_tenant_migration(schema_name, engine) creates schema, applies template, calls seeders. Idempotent." },
        ], verify: "run_tenant_migration('test_tenant', engine) → all 8 tables in schema. SELECT TENANT_ROLE → 3 system roles. Run again → no duplicates."
    },
    "E3-S2": {
        model: "Sonnet 4.6", expect: "POST /tenancy/tenants atomically creates row and physical schema. Duplicate → 409. Failure → clean rollback.", commits: [
            { label: "feat(services): ProvisionTenantCommand + ProvisionTenantHandler", prompt: "Create app/services/tenancy/tenant_provisioner.py. ProvisionTenantHandler.handle(cmd): 1) check UNIQUE(application_id, org_slug) → 409, 2) derive schema_name=f'{app_code}_{org_slug.replace(\"-\",\"_\")}', 3) begin transaction, 4) INSERT PLATFORM_TENANT, 5) CREATE SCHEMA, 6) run_tenant_migration(), 7) emit TenantProvisioned event. On failure: rollback PLATFORM_TENANT insert." },
            { label: "feat(api): POST /api/{v}/tenancy/tenants", prompt: "Create app/api/endpoints/v1/tenancy.py router. POST /tenants: Depends(require_scope(APP_ADMIN)). Call ProvisionTenantHandler. Return 201 ProvisionTenantResponse(tenant_id, schema_name, tenant_slug, status, created_at). 409 on ConflictError." },
        ], verify: "POST /tenancy/tenants → 201. Second call same org_slug → 409. psql: schema exists with all 8 tables + 3 system roles."
    },
    "E3-S3": {
        model: "Sonnet 4.6", expect: "Every tenant request auto-routed. Redis warm cache. SUSPENDED tenant → 403 within 60s.", commits: [
            { label: "feat(middleware): TenantMiddleware — X-Tenant-Slug + Redis 60s TTL", prompt: "Create app/core/middleware/tenant_middleware.py. Check X-Tenant-Slug header → 400 if missing on tenant routes. Cache key tenant:{slug}, TTL 60s (NOT 3600). On miss: SELECT PLATFORM_TENANT. SUSPENDED → 403. Set request.state.tenant_context. Attach schema_manager.set_schema() to session." },
            { label: "feat(api): GET+PATCH+POST /tenancy/tenants — list, suspend, reactivate", prompt: "Add to tenancy.py: GET /tenants (paginated, APP_ADMIN sees own app, SUPER_ADMIN sees all). PATCH /tenants/{id}/suspend → status=SUSPENDED + DEL Redis cache. POST /tenants/{id}/reactivate → status=ACTIVE + DEL cache." },
            { label: "test(middleware): cache hit/miss, SUSPENDED, cross-tenant", prompt: "tests/unit/api/test_tenant_middleware.py using FakeRedis + FakeTenantRepository. Cache hit → repo NOT called. SUSPENDED → 403. Missing header → 400. TTL is 60 (not 3600)." },
        ], verify: "Suspend tenant → within 60s any request with that slug → 403. Redis: GET tenant:{slug} → null after suspension."
    },
};

// Merge all prompt data
const ALL_PROMPTS = { ...PROMPTS, ...PROMPT_DEFAULTS };

// Fill remaining stories with generated data
const REMAINING_STORIES = ["E3-S4", "E3-S5", "E3-S6", "E4-S1", "E4-S2", "E4-S3", "E4-S4", "E4-S5", "E5-S1", "E5-S2", "E6-S1", "E6-S2", "E6-S3", "E6-S4", "E6-S5", "E6-S6", "E7-S1", "E7-S2", "E7-S3", "E8-S1", "E8-S2", "E8-S3", "E8-S4", "E9-S1", "E9-S2", "E9-S3", "QA-S1", "QA-S2"];
const STORY_MODELS = { "E3-S4": "Sonnet 4.6", "E3-S5": "Sonnet 4.6", "E3-S6": "Sonnet 4.6", "E4-S1": "Sonnet 4.6", "E4-S2": "Sonnet 4.6", "E4-S3": "Sonnet 4.6", "E4-S4": "Sonnet 4.6", "E4-S5": "Sonnet 4.6", "E5-S1": "Sonnet 4.6", "E5-S2": "Sonnet 4.6", "E6-S1": "Sonnet 4.6", "E6-S2": "Sonnet 4.6", "E6-S3": "Sonnet 4.6", "E6-S4": "Sonnet 4.6", "E6-S5": "Sonnet 4.6", "E6-S6": "Sonnet 4.6", "E7-S1": "Sonnet 4.6", "E7-S2": "Sonnet 4.6", "E7-S3": "Sonnet 4.6", "E8-S1": "Sonnet 4.6", "E8-S2": "Sonnet 4.6", "E8-S3": "Sonnet 4.6", "E8-S4": "Sonnet 4.6", "E9-S1": "Sonnet 4.6", "E9-S2": "Sonnet 4.6", "E9-S3": "Sonnet 4.6", "QA-S1": "Sonnet 4.6", "QA-S2": "Sonnet 4.6" };
REMAINING_STORIES.forEach(key => {
    if (!ALL_PROMPTS[key] && BACKLOG[key]) {
        const bl = BACKLOG[key];
        ALL_PROMPTS[key] = {
            model: STORY_MODELS[key] || "Sonnet 4.6",
            expect: `${bl.title} fully implemented and tested. All ${bl.ac.length} ACs passing.`,
            commits: bl.ac.slice(0, 4).map((ac, i) => ({
                label: `feat: ${ac.substring(0, 70)}${ac.length > 70 ? '...' : ''}`,
                prompt: `Implement the following acceptance criterion for ${key} — ${bl.title}:\n\n${ac}\n\nFollow N-Tier DDD layout (app/models/, app/repositories/, app/services/, app/api/). Test-first: write failing test in tests/unit/ before implementation. No comments in code. SOLID principles throughout.`
            }))
        };
    }
});


// ─── 15-DAY WORK PLAN ────────────────────────────────────────────────────────
const DAY_PLANS = [
    {
        day: 1, date: "Tue 3 Mar", theme: "Foundation Kickoff — Scaffolding + DB Abstraction", milestone: "E1 Start", tasks: [
            {
                id: "D1-T1", storyKey: "E1-S1", epic: "E1", title: "Project Scaffolding, Docker & pyproject.toml", priority: 1, hours: 0, model: "Haiku 4.5", note: "✅ DONE — already merged", depends: [],
                commits: [{ id: "D1-T1-C1", label: "chore(scaffold): init pyproject.toml + N-Tier directory tree" }, { id: "D1-T1-C2", label: "chore(scaffold): Docker Compose — PostgreSQL + Redis + SEQ" }, { id: "D1-T1-C3", label: "feat(config): pydantic-settings Settings with API_VERSION" }, { id: "D1-T1-C4", label: "feat(api): build_api_router() factory + GET /health endpoint + test" }],
                verify: "docker compose up -d && curl localhost:8000/api/v1/health → 200"
            },
            {
                id: "D1-T2", storyKey: "E1-S2", epic: "E1", title: "Database Abstraction — DB_PROVIDER, DatabaseFactory", priority: 2, hours: 4, model: "Sonnet 4.6", note: "Critical path — unblocks all DB work", depends: [],
                commits: [{ id: "D1-T2-C1", label: "feat(core): ITenantSchemaManager Protocol + PG/MSSQL implementations" }, { id: "D1-T2-C2", label: "feat(core): DatabaseFactory + AsyncSession factory + get_session dependency" }, { id: "D1-T2-C3", label: "test(core): DatabaseFactory URL construction — both providers, no real DB" }],
                verify: "pytest tests/unit/models/test_database_factory.py → all pass. DB_PROVIDER=mssql → app starts."
            },
        ]
    },
    {
        day: 2, date: "Wed 4 Mar", theme: "Domain Objects + Platform Schema Migration", milestone: null, tasks: [
            {
                id: "D2-T1", storyKey: "E1-S3", epic: "E1", title: "All Domain Objects — Entities, VOs, Aggregates, Events", priority: 1, hours: 3, model: "Opus 4.6", note: "Highest-value story — use Opus. All business rules in pure Python.", depends: ["E1-S1", "E1-S2"],
                commits: [{ id: "D2-T1-C1", label: "feat(models): AuditableEntity mixin + enums + DomainError exceptions" }, { id: "D2-T1-C2", label: "feat(models): PlatformUser + PlatformApplication with domain methods" }, { id: "D2-T1-C3", label: "feat(models): RefreshTokenFamily aggregate — rotate() + TokenTheftDetected" }, { id: "D2-T1-C4", label: "feat(models): Tenant + RBAC domain models" }, { id: "D2-T1-C5", label: "feat(repositories): all interface Protocols in app/repositories/interfaces/" }, { id: "D2-T1-C6", label: "test(models): full domain suite — all invariants, zero infrastructure" }],
                verify: "pytest tests/unit/models/ → all pass <2s. grep -r 'import sqlalchemy' app/models/ → zero."
            },
            {
                id: "D2-T2", storyKey: "E1-S4", epic: "E1", title: "Platform Schema Alembic Migration — 8 Tables", priority: 2, hours: 2, model: "Sonnet 4.6", note: "All 8 PLATFORM_* tables with constraints", depends: ["E1-S1", "E1-S2"],
                commits: [{ id: "D2-T2-C1", label: "feat(migration): initial platform schema — all 8 PLATFORM tables" }],
                verify: "alembic downgrade base && alembic upgrade head → clean. psql: all 8 tables visible."
            },
        ]
    },
    {
        day: 3, date: "Thu 5 Mar", theme: "IoC + Actor Model + ARCH-S1 Migration 🔄", milestone: "ARCH-S1 ▶ DO FIRST", tasks: [
            {
                id: "D3-T1", storyKey: "E1-S5", epic: "E1", title: "IoC Container & Application Bootstrapping", priority: 1, hours: 1.5, model: "Sonnet 4.6", note: "Wire all repos. FastAPI app factory.", depends: ["E1-S3", "E1-S4"],
                commits: [{ id: "D3-T1-C1", label: "feat(core): dependency-injector IoC container — app/core/container.py" }, { id: "D3-T1-C2", label: "feat(app): FastAPI create_app() factory + lifespan" }],
                verify: "uvicorn app.main:app — starts. GET /api/v1/health 200. GET /api/v1/docs loads."
            },
            {
                id: "D3-T2", storyKey: "E2-S1", epic: "E2", title: "Three-Tier Actor Model — ORM Models & Fake Repos", priority: 2, hours: 1.5, model: "Sonnet 4.6", note: "Real + Fake repos. App tests must not touch DB.", depends: ["E1-S3", "E1-S4"],
                commits: [{ id: "D3-T2-C1", label: "feat(repositories): SqlAlchemyUserRepository + FakeUserRepository" }, { id: "D3-T2-C2", label: "test(repositories): IUserRepository contract tests against FakeUserRepository" }, { id: "D3-T2-C3", label: "feat(core): container updated + integration test skeleton" }],
                verify: "pytest tests/unit/repositories/ → all pass, zero DB calls."
            },
            {
                id: "D3-T3", storyKey: "ARCH-S1", epic: "ARCH", title: "🔄 Folder Structure Migration — N-Tier Alignment (DO NEXT)", priority: 3, hours: 2, model: "Sonnet 4.6", note: "▶ IMMEDIATE: Do before E2-S2. Renames src/→app/, dynamic versioning, domain methods on ORM.", depends: ["E2-S1"],
                commits: [{ id: "D3-T3-C1", label: "chore(arch): rename src/ to app/ + restructure N-Tier directories" }, { id: "D3-T3-C2", label: "feat(core): dynamic API versioning via settings.API_VERSION in build_api_router()" }, { id: "D3-T3-C3", label: "refactor(models): domain entity logic merged into SQLAlchemy ORM models" }, { id: "D3-T3-C4", label: "refactor(repositories): migrate interfaces and implementations to N-Tier layout" }],
                verify: "pytest tests/ → ALL existing tests pass. grep -r 'from src.' app tests → zero. GET /api/v1/health → 200."
            },
        ]
    },
    {
        day: 4, date: "Sun 8 Mar", theme: "Email Auth Lifecycle + LoginHandler Part 1", milestone: null, tasks: [
            {
                id: "D4-T1", storyKey: "E2-S2", epic: "E2", title: "Email Auth Lifecycle — Signup, Confirm, Reset", priority: 1, hours: 2.5, model: "Sonnet 4.6", note: "4 endpoints. SHA-256 tokens. Enumeration-safe forgot-password.", depends: ["ARCH-S1"],
                commits: [{ id: "D4-T1-C1", label: "feat(schema): SignupRequest + ConfirmEmailRequest + PasswordResetRequest Pydantic models" }, { id: "D4-T1-C2", label: "feat(services): SignupHandler + ConfirmEmailHandler + PasswordResetHandler" }, { id: "D4-T1-C3", label: "feat(api): POST /auth/signup + /auth/confirm-email + /auth/forgot-password + /auth/reset-password" }, { id: "D4-T1-C4", label: "feat(core): JinjaEmailService + FakeEmailService + email Jinja2 templates" }],
                verify: "POST /auth/signup → 201. POST /auth/forgot-password unknown email → 200 (not 404)."
            },
            {
                id: "D4-T2", storyKey: "E2-S3", epic: "E2", title: "LoginHandler — Three Scopes [Part 1: JwtService + Handler]", priority: 2, hours: 2.5, model: "Sonnet 4.6", note: "8 pts — spans Day 4–5. JwtService + handler logic today.", depends: ["ARCH-S1"],
                commits: [{ id: "D4-T2-C1", label: "feat(security): JwtService — RS256 sign/verify/JWKS" }, { id: "D4-T2-C2", label: "feat(services): LoginHandler — scope-aware authentication + token pair creation" }],
                verify: "pytest tests/unit/services/test_login_handler.py — 3 scopes, JWT payloads validated."
            },
        ]
    },
    {
        day: 5, date: "Mon 9 Mar", theme: "Login Endpoints + Lockout + Tenant Template", milestone: "Auth Core ✓", tasks: [
            {
                id: "D5-T1", storyKey: "E2-S3", epic: "E2", title: "LoginHandler [Part 2: POST /auth/login + /auth/jwks]", priority: 1, hours: 1.5, model: "Sonnet 4.6", note: "Complete E2-S3", depends: ["E2-S1"],
                commits: [{ id: "D5-T1-C1", label: "feat(api): POST /auth/login + GET /auth/jwks" }, { id: "D5-T1-C2", label: "test(services): LoginHandler — 3 scopes, wrong credentials, lockout" }],
                verify: "curl POST /auth/login all 3 scopes — decode JWT, verify payload differences."
            },
            {
                id: "D5-T2", storyKey: "E2-S4", epic: "E2", title: "Progressive Login Lockout — Redis Soft & DB Hard Lock", priority: 2, hours: 1.5, model: "Sonnet 4.6", note: "Soft lock @5, hard lock @10. fakeredis in tests.", depends: ["E2-S3"],
                commits: [{ id: "D5-T2-C1", label: "feat(services): progressive lockout in LoginHandler" }, { id: "D5-T2-C2", label: "test(services): lockout thresholds" }],
                verify: "5th wrong → 429 with Retry-After. 10th → 423. DB: account_locked_until set."
            },
            {
                id: "D5-T3", storyKey: "E3-S1", epic: "E3", title: "Alembic Tenant Template — All Tenant Tables & Seeding", priority: 3, hours: 2, model: "Sonnet 4.6", note: "⚠ CRITICAL — unblocks E6-S1 RBAC early delivery on Day 6", depends: ["E1-S4"],
                commits: [{ id: "D5-T3-C1", label: "feat(migration): Alembic tenant template — 8 tenant tables" }, { id: "D5-T3-C2", label: "feat(core): system roles + base permission seeder + run_tenant_migration()" }],
                verify: "run_tenant_migration('test_tenant', engine) → all 8 tables + 3 system roles. Idempotent."
            },
        ]
    },
    {
        day: 6, date: "Tue 10 Mar", theme: "Tenant Provisioning + RBAC ORM Early 🎯", milestone: "🎯 RBAC ORM Early", tasks: [
            {
                id: "D6-T1", storyKey: "E3-S2", epic: "E3", title: "ProvisionTenantHandler [Part 1: Handler + Command]", priority: 1, hours: 2, model: "Sonnet 4.6", note: "8 pts spans Day 6–7. Handler + command today.", depends: ["E3-S1", "E2-S3"],
                commits: [{ id: "D6-T1-C1", label: "feat(services): ProvisionTenantCommand + ProvisionTenantHandler" }, { id: "D6-T1-C2", label: "test(services): provision tenant — schema derivation, duplicate 409, compensation" }],
                verify: "pytest tests/unit/services/test_provision_tenant.py — schema_name 'ait360_fakir_group' confirmed."
            },
            {
                id: "D6-T2", storyKey: "E6-S1", epic: "E6", title: "RBAC ORM Models & Fake Repositories 🎯", priority: 2, hours: 3, model: "Sonnet 4.6", note: "⬆ EARLY (was Day 9). Only needs E3-S1 done.", depends: ["E3-S1"],
                commits: [{ id: "D6-T2-C1", label: "feat(models): RBAC ORM models in app/models/rbac_models.py" }, { id: "D6-T2-C2", label: "feat(repositories): SqlAlchemy + Fake RBAC repositories" }, { id: "D6-T2-C3", label: "test(repositories): RBAC contract tests — all fake repository methods" }],
                verify: "pytest tests/unit/repositories/test_rbac_repository_contract.py → all pass, zero DB."
            },
        ]
    },
    {
        day: 7, date: "Wed 11 Mar", theme: "Tenant Middleware + TenantSchemaManager + Rate Limiter", milestone: null, tasks: [
            {
                id: "D7-T1", storyKey: "E3-S2", epic: "E3", title: "ProvisionTenantHandler [Part 2: POST /tenancy/tenants]", priority: 1, hours: 1, model: "Sonnet 4.6", note: "Complete E3-S2: provision endpoint", depends: ["E3-S1", "E2-S3"],
                commits: [{ id: "D7-T1-C1", label: "feat(api): POST /api/{v}/tenancy/tenants" }],
                verify: "curl POST /tenancy/tenants with APP_ADMIN JWT → 201. Schema visible in psql."
            },
            {
                id: "D7-T2", storyKey: "E3-S3", epic: "E3", title: "TenantMiddleware — Redis-Cached Schema Routing (60s TTL)", priority: 2, hours: 2, model: "Sonnet 4.6", note: "TTL=60s critical. Unblocks E4-S2.", depends: ["E3-S2"],
                commits: [{ id: "D7-T2-C1", label: "feat(middleware): TenantMiddleware — X-Tenant-Slug + Redis 60s TTL" }, { id: "D7-T2-C2", label: "feat(api): GET+PATCH+POST /tenancy/tenants — list, suspend, reactivate" }, { id: "D7-T2-C3", label: "test(middleware): cache hit/miss, SUSPENDED, cross-tenant" }],
                verify: "Suspend tenant. Next request → 403 TENANT_SUSPENDED. Redis entry cleared."
            },
            {
                id: "D7-T3", storyKey: "E3-S4", epic: "E3", title: "TenantSchemaManager — Isolation Integration Test", priority: 3, hours: 0.5, model: "Sonnet 4.6", note: "Integration test: tenant A invisible from tenant B", depends: ["E3-S3"],
                commits: [{ id: "D7-T3-C1", label: "test(core): schema isolation — tenant A invisible from tenant B session" }],
                verify: "Write to tenant A. Read from tenant B session → NOT visible."
            },
            {
                id: "D7-T4", storyKey: "E5-S1", epic: "E5", title: "Tenant Rate Limiter — Redis Sliding Window", priority: 4, hours: 1.5, model: "Sonnet 4.6", note: "429 + Retry-After. Tenant isolation.", depends: ["E3-S3"],
                commits: [{ id: "D7-T4-C1", label: "feat(middleware): SlidingWindowLimiter + RateLimitMiddleware" }, { id: "D7-T4-C2", label: "test(middleware): rate limiter — 429 on N+1, tenant isolation" }],
                verify: "61 requests → 61st returns 429. Different tenant unaffected."
            },
        ]
    },
    {
        day: 8, date: "Thu 12 Mar", theme: "JWT Bearer + Refresh Tokens + PermissionResolver START 🎯", milestone: "🎯 Security Core", tasks: [
            {
                id: "D8-T1", storyKey: "E4-S1", epic: "E4", title: "JwtService — RS256 Injectable Service", priority: 1, hours: 1, model: "Sonnet 4.6", note: "Refactor into injectable IJwtService. Wire into IoC.", depends: ["E2-S3"],
                commits: [{ id: "D8-T1-C1", label: "feat(security): IJwtService Protocol + JwtService RS256 implementation" }, { id: "D8-T1-C2", label: "feat(api): GET /api/{v}/auth/jwks — JWK Set endpoint" }, { id: "D8-T1-C3", label: "test(security): JwtService — three token shapes, decode, JWKS" }],
                verify: "POST /auth/login → decode JWT with /auth/jwks public key → valid. kid matches."
            },
            {
                id: "D8-T2", storyKey: "E4-S2", epic: "E4", title: "JWTBearer — 5 Security Invariants", priority: 2, hours: 1.5, model: "Sonnet 4.6", note: "Cross-tenant replay + stale rbac_version = 401/403", depends: ["E4-S1", "E3-S3"],
                commits: [{ id: "D8-T2-C1", label: "feat(security): JWTBearer FastAPI dependency — 5 security checks" }, { id: "D8-T2-C2", label: "test(security): JWTBearer — 5 adversarial scenarios" }],
                verify: "Stale rbac_version → 401. Cross-tenant token → 403. Tampered sig → 401."
            },
            {
                id: "D8-T3", storyKey: "E4-S3", epic: "E4", title: "RefreshTokenFamily — SHA-256, Rotation, Theft Detection", priority: 3, hours: 1.5, model: "Sonnet 4.6", note: "Domain layer theft detection must be atomic.", depends: ["E1-S3"],
                commits: [{ id: "D8-T3-C1", label: "feat(models): RefreshTokenFamily.rotate() + TokenTheftDetected" }, { id: "D8-T3-C2", label: "feat(repositories): SqlAlchemyRefreshTokenFamilyRepository + Fake version" }, { id: "D8-T3-C3", label: "test(models): rotation invariants — all theft detection paths" }],
                verify: "pytest tests/unit/models/test_token_family.py → all pass under 1s. No DB."
            },
            {
                id: "D8-T4", storyKey: "E3-S5", epic: "E3", title: "SYSTEM_MANAGED vs SELF_MANAGED Enforcement", priority: 4, hours: 0.5, model: "Sonnet 4.6", note: "SYSTEM_MANAGED blocks self-service routes.", depends: ["E3-S3"],
                commits: [{ id: "D8-T4-C1", label: "feat(services): management mode enforcement guard" }],
                verify: "SYSTEM_MANAGED app → POST /tenancy/app-admins → 403."
            },
            {
                id: "D8-T5", storyKey: "E6-S2", epic: "E6", title: "PermissionResolver — Cache-First [START] 🎯", priority: 5, hours: 1, model: "Sonnet 4.6", note: "⬆ EARLY. Starts today, completes Day 9.", depends: ["E6-S1", "E4-S2"],
                commits: [{ id: "D8-T5-C1", label: "feat(services): PermissionResolver — cache-first, permissions:{schema}:{user_id}" }],
                verify: "Cache hit → repo NOT called (mock verified). Key includes schema_name."
            },
        ]
    },
    {
        day: 9, date: "Sun 15 Mar", theme: "🎯 RBAC Fully Live — Resolver + Cache Invalidation + Token API", milestone: "🎯 RBAC Functional", tasks: [
            {
                id: "D9-T1", storyKey: "E6-S2", epic: "E6", title: "PermissionResolver [COMPLETE + API endpoint] 🎯", priority: 1, hours: 1.5, model: "Sonnet 4.6", note: "Complete resolver. Expose endpoint.", depends: ["E6-S1", "E4-S2"],
                commits: [{ id: "D9-T1-C1", label: "feat(services): PermissionResolver — 6-table JOIN + Redis setex" }, { id: "D9-T1-C2", label: "feat(api): GET /api/{v}/{app_code}/rbac/users/{id}/permissions" }, { id: "D9-T1-C3", label: "test(services): resolver cache hit/miss/cross-tenant key isolation" }],
                verify: "Cache miss < 30ms p95. Cache hit < 5ms p95. Different schemas = different Redis keys."
            },
            {
                id: "D9-T2", storyKey: "E6-S3", epic: "E6", title: "Cache Invalidation via GroupPermissionRemoved Event 🎯", priority: 2, hours: 1, model: "Sonnet 4.6", note: "⬆ EARLY. Event → DEL affected user keys.", depends: ["E6-S2"],
                commits: [{ id: "D9-T2-C1", label: "feat(services): PermissionCacheInvalidator — GroupPermissionRemoved handler" }, { id: "D9-T2-C2", label: "feat(core): DomainEventPublisher — wire in container" }, { id: "D9-T2-C3", label: "test(services): cache invalidation — DEL called for all affected users" }],
                verify: "Remove permission → Redis DEL called for every affected user immediately."
            },
            {
                id: "D9-T3", storyKey: "E4-S4", epic: "E4", title: "Refresh Token API — Rotation + Logout", priority: 3, hours: 1.5, model: "Sonnet 4.6", note: "Spans Day 9–10.", depends: ["E4-S2", "E4-S3"],
                commits: [{ id: "D9-T3-C1", label: "feat(services): RefreshTokenHandler + LogoutHandler" }, { id: "D9-T3-C2", label: "feat(api): POST /api/{v}/auth/refresh + POST /api/{v}/auth/logout" }],
                verify: "Replay used refresh_token → 401 TOKEN_THEFT_DETECTED. Family.is_revoked=True in DB."
            },
            {
                id: "D9-T4", storyKey: "E5-S2", epic: "E5", title: "M2M API Key Authentication", priority: 4, hours: 0.5, model: "Sonnet 4.6", note: "bcrypt verify. APP_ADMIN scoped JWT.", depends: ["E2-S3"],
                commits: [{ id: "D9-T4-C1", label: "feat(security): ApiKeyAuthenticator + POST /auth/m2m/token" }, { id: "D9-T4-C2", label: "feat(api): PUT /tenancy/applications/{id}/rotate-secret + GET /api-key" }],
                verify: "POST /auth/m2m/token valid → APP_ADMIN JWT. Wrong secret → 401. Rotate → old → 401."
            },
            {
                id: "D9-T5", storyKey: "E3-S6", epic: "E3", title: "Migration Rollout Strategies", priority: 5, hours: 0.5, model: "Sonnet 4.6", note: "3 strategies: immediate, maintenance-window, on-access", depends: ["E3-S1"],
                commits: [{ id: "D9-T5-C1", label: "feat(core): MigrationRunner — 3 strategies" }],
                verify: "MIGRATION_STRATEGY=on_access → lazy migration fires on first tenant request."
            },
        ]
    },
    {
        day: 10, date: "Mon 16 Mar", theme: "Guards + RBAC CRUD APIs + Observability", milestone: "Security Guards ✓", tasks: [
            {
                id: "D10-T1", storyKey: "E4-S5", epic: "E4", title: "rbac_version Force-Reauth & Session Invalidation", priority: 1, hours: 0.5, model: "Sonnet 4.6", note: "increment_rbac_version + DEL permission cache", depends: ["E4-S2"],
                commits: [{ id: "D10-T1-C1", label: "feat(services): ForceReauthHandler — rbac_version++ + cache DEL" }, { id: "D10-T1-C2", label: "feat(api): POST /platform/users/{id}/force-reauth" }],
                verify: "Old JWT rbac_version=1 after increment → 401 RBAC_VERSION_MISMATCH."
            },
            {
                id: "D10-T2", storyKey: "E7-S1", epic: "E7", title: "ScopeGuard & RBACGuard FastAPI Dependencies", priority: 2, hours: 1, model: "Sonnet 4.6", note: "require_scope() + require_permission() composable deps", depends: ["E3-S3", "E4-S2", "E6-S2"],
                commits: [{ id: "D10-T2-C1", label: "feat(rbac): require_scope() + require_permission() dependencies" }, { id: "D10-T2-C2", label: "feat(rbac): AppPermissions constants in app/core/rbac/app_permissions.py" }],
                verify: "TENANT_USER on SUPER_ADMIN route → 403. User without perm on guarded route → 403."
            },
            {
                id: "D10-T3", storyKey: "E6-S4", epic: "E6", title: "Permission Group CRUD API 🎯", priority: 3, hours: 1.5, model: "Sonnet 4.6", note: "⬆ EARLY. Full Group CRUD + add/remove perms.", depends: ["E6-S3"],
                commits: [{ id: "D10-T3-C1", label: "feat(api): GET+POST /rbac/permissions + full CRUD /rbac/groups" }, { id: "D10-T3-C2", label: "feat(api): POST+DELETE /rbac/groups/{id}/permissions" }],
                verify: "POST /rbac/groups → 201. DELETE group permission → cache invalidation fires."
            },
            {
                id: "D10-T4", storyKey: "E6-S5", epic: "E6", title: "Role CRUD API & Role-Group Assignment 🎯", priority: 4, hours: 1, model: "Sonnet 4.6", note: "⬆ EARLY. System roles protected.", depends: ["E6-S3"],
                commits: [{ id: "D10-T4-C1", label: "feat(api): CRUD /rbac/roles + POST+DELETE /rbac/roles/{id}/groups" }],
                verify: "Assign group to role → user permissions include group permissions. Unlink → gone."
            },
            {
                id: "D10-T5", storyKey: "E8-S1", epic: "E8", title: "AuditableEntity Mixin & Database Audit Logs", priority: 5, hours: 0.5, model: "Sonnet 4.6", note: "SQLAlchemy after_flush hook. Sensitive fields excluded.", depends: ["E3-S1"],
                commits: [{ id: "D10-T5-C1", label: "feat(models): AuditableEntity mixin + audit log SQLAlchemy event hooks" }],
                verify: "UPDATE PLATFORM_USER password_hash → audit row exists, hash NOT in changed_data."
            },
            {
                id: "D10-T6", storyKey: "E8-S2", epic: "E8", title: "structlog Processor Chain & SEQ Integration", priority: 6, hours: 0.5, model: "Sonnet 4.6", note: "Non-blocking SEQ delivery. JSON stdout fallback.", depends: ["E1-S1"],
                commits: [{ id: "D10-T6-C1", label: "feat(core): structlog config + SEQ handler + context var binding" }],
                verify: "Log event in SEQ has tenant_id and user_id. SEQ down → JSON stdout."
            },
        ]
    },
    {
        day: 11, date: "Tue 24 Mar", theme: "User Role Assignment + Adversarial Tests + Platform API", milestone: "RBAC Complete ✓", tasks: [
            {
                id: "D11-T1", storyKey: "E6-S6", epic: "E6", title: "User Role Assignment API & GET Permissions 🎯", priority: 1, hours: 1, model: "Sonnet 4.6", note: "⬆ EARLY. Full RBAC pipeline live.", depends: ["E6-S4", "E6-S5"],
                commits: [{ id: "D11-T1-C1", label: "feat(api): POST+DELETE /rbac/users/{id}/roles" }, { id: "D11-T1-C2", label: "feat(api): GET /rbac/users/{id}/permissions with resolved_from field" }],
                verify: "Assign role → GET /permissions shows role permissions. Remove → permissions gone."
            },
            {
                id: "D11-T2", storyKey: "E7-S2", epic: "E7", title: "Cross-Tenant Protection & Full Guard Chain Integration", priority: 2, hours: 1, model: "Sonnet 4.6", note: "4 adversarial integration tests.", depends: ["E7-S1"],
                commits: [{ id: "D11-T2-C1", label: "test(security): cross-tenant replay, stale rbac, suspended tenant, deprovisioned" }],
                verify: "All 4 adversarial tests pass end-to-end against middleware chain."
            },
            {
                id: "D11-T3", storyKey: "E7-S3", epic: "E7", title: "Security Adversarial Test Suite [Part 1]", priority: 3, hours: 1.5, model: "Sonnet 4.6", note: "Spans Day 11–12. Auth + tenant isolation attacks.", depends: ["E7-S2"],
                commits: [{ id: "D11-T3-C1", label: "test(security): auth attacks — tampered JWT, expired, wrong key, missing header" }, { id: "D11-T3-C2", label: "test(security): tenant isolation — cross-tenant replay, SQL injection in slug" }, { id: "D11-T3-C3", label: "test(security): token theft — replay used refresh, verify family revoked" }],
                verify: "All auth+tenant adversarial tests pass. SQL injection in X-Tenant-Slug → 404."
            },
            {
                id: "D11-T4", storyKey: "E8-S3", epic: "E8", title: "TENANT_ACCESS_LOG Integration with PermissionResolver", priority: 4, hours: 0.5, model: "Sonnet 4.6", note: "Async fire-and-forget. Must not block resolution.", depends: ["E6-S2", "E8-S2"],
                commits: [{ id: "D11-T4-C1", label: "feat(services): TENANT_ACCESS_LOG async write on every resolve()" }],
                verify: "After permission check: TENANT_ACCESS_LOG row with outcome and cache_hit flag."
            },
            {
                id: "D11-T5", storyKey: "E9-S1", epic: "E9", title: "Platform Management API — SUPER_ADMIN Routes", priority: 5, hours: 1.5, model: "Sonnet 4.6", note: "⬆ EARLY. All guarded by SUPER_ADMIN.", depends: ["E2-S1", "E7-S1"],
                commits: [{ id: "D11-T5-C1", label: "feat(api): POST+GET+PATCH /platform/applications" }, { id: "D11-T5-C2", label: "feat(api): POST+GET+DELETE+lock+force-reauth /platform/users" }, { id: "D11-T5-C3", label: "test(api): all SUPER_ADMIN routes — non-SUPER_ADMIN gets 403" }],
                verify: "APP_ADMIN token on /platform/applications → 403. SUPER_ADMIN → 200/201."
            },
        ]
    },
    {
        day: 12, date: "Wed 25 Mar", theme: "Adversarial Suite Complete + Self-Service + Request Logging", milestone: null, tasks: [
            {
                id: "D12-T1", storyKey: "E7-S3", epic: "E7", title: "Security Adversarial Test Suite [Complete]", priority: 1, hours: 1.5, model: "Sonnet 4.6", note: "Complete E7-S3: RBAC bypass + rate limit + grep check.", depends: ["E7-S2"],
                commits: [{ id: "D12-T1-C1", label: "test(security): RBAC bypass — TENANT_USER on SUPER_ADMIN route, stale rbac_version" }, { id: "D12-T1-C2", label: "test(security): rate limit burst — 110 requests → 429 with Retry-After" }, { id: "D12-T1-C3", label: "chore: grep -r PLATFORM_ORGANIZATION app/ → empty (Phase 1 gate)" }],
                verify: "All adversarial tests pass. grep PLATFORM_ORGANIZATION app/ → 0 results."
            },
            {
                id: "D12-T2", storyKey: "E9-S2", epic: "E9", title: "SELF_MANAGED Admin Self-Service", priority: 2, hours: 1.5, model: "Sonnet 4.6", note: "SYSTEM_MANAGED blocks. SELF_MANAGED allows.", depends: ["E9-S1", "E3-S5"],
                commits: [{ id: "D12-T2-C1", label: "feat(api): GET+POST+DELETE /tenancy/app-admins (SELF_MANAGED only)" }, { id: "D12-T2-C2", label: "test(api): SYSTEM_MANAGED → 403. SELF_MANAGED → 200/201/204" }],
                verify: "SYSTEM_MANAGED: all self-service routes 403. SELF_MANAGED: add/remove app admins 200."
            },
            {
                id: "D12-T3", storyKey: "E8-S4", epic: "E8", title: "RequestLoggingMiddleware & API Access Log Events", priority: 3, hours: 1, model: "Sonnet 4.6", note: "X-Request-ID on every response.", depends: ["E8-S2"],
                commits: [{ id: "D12-T3-C1", label: "feat(middleware): RequestLoggingMiddleware — method/path/status/duration/X-Request-ID" }, { id: "D12-T3-C2", label: "test(middleware): every response has X-Request-ID header" }],
                verify: "Every response has X-Request-ID. SEQ shows method/path/status/duration."
            },
        ]
    },
    {
        day: 13, date: "Sun 29 Mar", theme: "M2M Secret Rotation + Integration Suite Start", milestone: "QA Start 🎯", tasks: [
            {
                id: "D13-T1", storyKey: "E9-S3", epic: "E9", title: "Application Secret Rotation & M2M Lifecycle", priority: 1, hours: 1, model: "Sonnet 4.6", note: "Atomic rotation. Old secret invalid immediately.", depends: ["E5-S2"],
                commits: [{ id: "D13-T1-C1", label: "feat(api): PUT /tenancy/applications/{id}/rotate-secret — atomic" }, { id: "D13-T1-C2", label: "test(api): rotate → old secret 401 immediately, new secret 200" }],
                verify: "Rotate → old secret → 401 immediately. New secret → 200."
            },
            {
                id: "D13-T2", storyKey: "QA-S1", epic: "QA", title: "Integration Test Suite [Part 1: Auth + Token + Tenant]", priority: 2, hours: 4, model: "Sonnet 4.6", note: "Spans Day 13–14. Real docker-compose.", depends: ["E7-S3", "E8-S1", "E9-S1"],
                commits: [{ id: "D13-T2-C1", label: "test(integration): auth flows — all 3 scopes, correct JWT shapes verified" }, { id: "D13-T2-C2", label: "test(integration): token security — rotation, theft detection, logout revocation" }, { id: "D13-T2-C3", label: "test(integration): tenant lifecycle — provision, suspend, reactivate, duplicate 409" }, { id: "D13-T2-C4", label: "test(integration): cross-tenant isolation — DB-level data leak verification" }],
                verify: "pytest tests/integration/ (auth+token+tenant) → all pass against real docker-compose stack."
            },
        ]
    },
    {
        day: 14, date: "Mon 30 Mar", theme: "Integration Suite Complete — RBAC + Rate + M2M", milestone: null, tasks: [
            {
                id: "D14-T1", storyKey: "QA-S1", epic: "QA", title: "Integration Test Suite [Complete: RBAC + Rate + M2M]", priority: 1, hours: 4, model: "Sonnet 4.6", note: "Complete QA-S1. Target: 80+ tests green.", depends: ["E7-S3", "E8-S1", "E9-S1"],
                commits: [{ id: "D14-T1-C1", label: "test(integration): RBAC pipeline — assign, resolve, remove, cache invalidation" }, { id: "D14-T1-C2", label: "test(integration): rate limiting — real Redis 100-req window, tenant independence" }, { id: "D14-T1-C3", label: "test(integration): M2M auth — key/secret JWT, rotation, revocation" }, { id: "D14-T1-C4", label: "test(integration): SELF_MANAGED vs SYSTEM_MANAGED flows end-to-end" }, { id: "D14-T1-C5", label: "test(integration): observability — TENANT_ACCESS_LOG rows, X-Request-ID present" }],
                verify: "pytest tests/integration/ -v → 80+ tests green in clean docker-compose environment."
            },
        ]
    },
    {
        day: 15, date: "Tue 31 Mar", theme: "🚀 Performance Benchmarks & Release Gate", milestone: "🚀 Release Gate", tasks: [
            {
                id: "D15-T1", storyKey: "QA-S2", epic: "QA", title: "Performance Benchmarks & Coverage Gates — Release Criteria", priority: 1, hours: 3, model: "Sonnet 4.6", note: "All gates must pass before deployment. Non-negotiable.", depends: ["QA-S1"],
                commits: [{ id: "D15-T1-C1", label: "test(perf): PermissionResolver cache hit < 5ms p95 — 50K rows, 100 tenants" }, { id: "D15-T1-C2", label: "test(perf): PermissionResolver cache miss < 30ms p95" }, { id: "D15-T1-C3", label: "test(perf): TenantMiddleware Redis hit < 2ms p95" }, { id: "D15-T1-C4", label: "ci: coverage gates — domain 100%, application 95%, security 90%" }, { id: "D15-T1-C5", label: "chore: scripts/release_gate.sh — all benchmarks + coverage, exit 0 only if all pass" }],
                verify: "./scripts/release_gate.sh → exit 0. All NFR gates cleared. OpenAPI docs complete."
            },
        ]
    },
];

const ALL_COMMIT_IDS = DAY_PLANS.flatMap(d => d.tasks.flatMap(t => t.commits.map(c => c.id)));
const ALL_TASK_IDS = DAY_PLANS.flatMap(d => d.tasks.map(t => t.id));
const ALL_STORY_KEYS = [...new Set(DAY_PLANS.flatMap(d => d.tasks.map(t => t.storyKey)))];


// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
    const [selectedDay, setSelectedDay] = useState(TODAY_DAY);
    const [activeTab, setActiveTab] = useState("day");
    const [openStory, setOpenStory] = useState(null); // storyKey or null
    const [storyTab, setStoryTab] = useState("backlog"); // "backlog" | "prompts"
    const [loaded, setLoaded] = useState(false);
    const [taskStatus, setTaskStatus] = useState({});
    const [commitsDone, setCommitsDone] = useState({});
    const [notes, setNotes] = useState({});
    const [dayNotes, setDayNotes] = useState({});

    useEffect(() => {
        (async () => {
            const ts = await Store.get("iam:taskStatus");
            const cd = await Store.get("iam:commitsDone");
            const n = await Store.get("iam:notes");
            const dn = await Store.get("iam:dayNotes");
            const defaultDone = {};
            DAY_PLANS[0].tasks[0].commits.forEach(c => { defaultDone[c.id] = true; });
            setTaskStatus(ts || { "D1-T1": "done" });
            setCommitsDone(cd || defaultDone);
            setNotes(n || {});
            setDayNotes(dn || {});
            setLoaded(true);
        })();
    }, []);

    useEffect(() => { if (loaded) Store.set("iam:taskStatus", taskStatus); }, [taskStatus, loaded]);
    useEffect(() => { if (loaded) Store.set("iam:commitsDone", commitsDone); }, [commitsDone, loaded]);
    useEffect(() => { if (loaded) Store.set("iam:notes", notes); }, [notes, loaded]);
    useEffect(() => { if (loaded) Store.set("iam:dayNotes", dayNotes); }, [dayNotes, loaded]);

    const toggleCommit = useCallback((cid) => setCommitsDone(p => ({ ...p, [cid]: !p[cid] })), []);
    const setTask = useCallback((tid, val) => setTaskStatus(p => ({ ...p, [tid]: val })), []);

    const doneCommits = ALL_COMMIT_IDS.filter(id => commitsDone[id]).length;
    const doneTasks = ALL_TASK_IDS.filter(id => taskStatus[id] === "done").length;
    const pct = Math.round((doneCommits / ALL_COMMIT_IDS.length) * 100);

    if (!loaded) return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", height: "100vh",
            fontFamily: "'IBM Plex Mono',monospace", color: "#64748B", fontSize: 13
        }}>
            Loading saved progress…
        </div>
    );

    const MAIN_TABS = [
        { id: "day", label: "📅 Day Planner" },
        { id: "week", label: "🗓 15-Day Grid" },
    ];

    return (
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", background: "#0D1117", minHeight: "100vh", fontSize: 12, color: "#C9D1D9" }}>
            {/* ── Header ── */}
            <div style={{ background: "#161B22", borderBottom: "1px solid #30363D", padding: "10px 16px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", letterSpacing: "-0.3px" }}>
                            IAMService <span style={{ color: "#388BFD" }}>·</span> Day Planner v2
                        </div>
                        <div style={{ fontSize: 10, color: "#8B949E", marginTop: 1 }}>
                            41 stories · 179 pts · N-Tier DDD · Architecture v10.4 · {WORK_DATES[TODAY_DAY - 1]} = TODAY
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {[
                            { v: `${doneCommits}/${ALL_COMMIT_IDS.length}`, l: "Commits", c: "#388BFD" },
                            { v: `${doneTasks}/${ALL_TASK_IDS.length}`, l: "Tasks", c: "#3FB950" },
                            { v: `${pct}%`, l: "Overall", c: "#D2A8FF" },
                        ].map(s => (
                            <div key={s.l} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 9, color: "#8B949E" }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 2, background: "#21262D", borderRadius: 1, marginBottom: 0 }}>
                    <div style={{ height: 2, borderRadius: 1, background: "linear-gradient(90deg,#1F6FEB,#388BFD)", width: `${pct}%`, transition: "width .5s" }} />
                </div>
                <div style={{ display: "flex", gap: 1, marginTop: 6 }}>
                    {MAIN_TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                            padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 11,
                            fontWeight: activeTab === t.id ? 700 : 400,
                            color: activeTab === t.id ? "#E6EDF3" : "#8B949E",
                            borderBottom: activeTab === t.id ? "2px solid #388BFD" : "2px solid transparent",
                            fontFamily: "inherit",
                        }}>{t.label}</button>
                    ))}
                </div>
            </div>

            {/* ── Main content ── */}
            <div style={{ padding: "14px 16px" }}>
                {activeTab === "day" && (
                    <DayView
                        selectedDay={selectedDay} setSelectedDay={setSelectedDay}
                        taskStatus={taskStatus} setTask={setTask}
                        commitsDone={commitsDone} toggleCommit={toggleCommit}
                        notes={notes} setNotes={setNotes}
                        dayNotes={dayNotes} setDayNotes={setDayNotes}
                        openStory={openStory} setOpenStory={setOpenStory}
                        storyTab={storyTab} setStoryTab={setStoryTab}
                    />
                )}
                {activeTab === "week" && (
                    <WeekGrid taskStatus={taskStatus} commitsDone={commitsDone}
                        setSelectedDay={d => { setSelectedDay(d); setActiveTab("day"); }} />
                )}
            </div>

            {/* ── Story Modal ── */}
            {openStory && (
                <StoryModal
                    storyKey={openStory}
                    storyTab={storyTab}
                    setStoryTab={setStoryTab}
                    onClose={() => setOpenStory(null)}
                />
            )}
        </div>
    );
}

// ─── DAY VIEW ─────────────────────────────────────────────────────────────────
function DayView({ selectedDay, setSelectedDay, taskStatus, setTask, commitsDone, toggleCommit, notes, setNotes, dayNotes, setDayNotes, openStory, setOpenStory, storyTab, setStoryTab }) {
    const plan = DAY_PLANS.find(d => d.day === selectedDay);
    const isToday = selectedDay === TODAY_DAY;
    const isPast = selectedDay < TODAY_DAY;
    const dayCommits = plan.tasks.flatMap(t => t.commits);
    const doneDayC = dayCommits.filter(c => commitsDone[c.id]).length;
    const hours = plan.tasks.reduce((a, t) => a + t.hours, 0);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 12 }}>
            {/* ── Sidebar day picker ── */}
            <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 6, overflow: "hidden", alignSelf: "start", position: "sticky", top: 14 }}>
                <div style={{ padding: "8px 10px", borderBottom: "1px solid #30363D", fontSize: 10, fontWeight: 700, color: "#8B949E", letterSpacing: 1 }}>
                    15 WORKING DAYS
                </div>
                {DAY_PLANS.map(d => {
                    const dc = d.tasks.flatMap(t => t.commits);
                    const done = dc.filter(c => commitsDone[c.id]).length;
                    const p = dc.length ? Math.round(done / dc.length * 100) : 0;
                    const isSel = d.day === selectedDay, isT = d.day === TODAY_DAY;
                    return (
                        <div key={d.day} onClick={() => setSelectedDay(d.day)} style={{
                            padding: "6px 10px", cursor: "pointer",
                            background: isSel ? "#1C2128" : isT ? "#1A1F26" : "transparent",
                            borderLeft: `2px solid ${isSel ? "#388BFD" : isT ? "#D2A8FF" : p === 100 ? "#3FB950" : "#21262D"}`,
                            borderBottom: "1px solid #21262D",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: isSel ? "#388BFD" : isT ? "#D2A8FF" : "#8B949E" }}>
                                    {isT ? "▶ " : ""}{d.date.replace(" Mar", "").replace("Tue ", "").replace("Wed ", "").replace("Thu ", "").replace("Sun ", "").replace("Mon ", "")} <span style={{ fontWeight: 400, color: "#6E7681", fontSize: 9 }}>{d.date.split(" ").slice(0, 2).join(" ")}</span>
                                </span>
                                <span style={{ fontSize: 9, color: p === 100 ? "#3FB950" : p > 0 ? "#388BFD" : "#484F58" }}>{done}/{dc.length}</span>
                            </div>
                            <div style={{ fontSize: 9, color: "#6E7681", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{d.theme}</div>
                            {d.milestone && <div style={{ fontSize: 8, marginTop: 2, color: "#3FB950", fontWeight: 700 }}>{d.milestone}</div>}
                            {dc.length > 0 && <div style={{ marginTop: 3, height: 1, background: "#21262D", borderRadius: 1 }}>
                                <div style={{ height: 1, borderRadius: 1, background: p === 100 ? "#3FB950" : "#388BFD", width: `${p}%`, transition: "width .3s" }} />
                            </div>}
                        </div>
                    );
                })}
            </div>

            {/* ── Main day detail ── */}
            <div>
                {/* Day banner */}
                <div style={{ background: isToday ? "#1C2128" : "#161B22", border: `1px solid ${isToday ? "#388BFD" : "#30363D"}`, borderRadius: 6, padding: "12px 14px", marginBottom: 12, borderLeft: `3px solid ${isToday ? "#388BFD" : isPast ? "#3FB950" : "#30363D"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#E6EDF3" }}>
                                Day {plan.day} — {plan.date}
                                {isToday && <span style={{ marginLeft: 8, fontSize: 9, padding: "2px 7px", borderRadius: 10, background: "#D2A8FF", color: "#0D1117", fontWeight: 700 }}>TODAY</span>}
                                {isPast && <span style={{ marginLeft: 8, fontSize: 9, padding: "2px 7px", borderRadius: 10, background: "#238636", color: "#fff", fontWeight: 700 }}>PAST</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "#8B949E", marginTop: 2 }}>{plan.theme}</div>
                            {plan.milestone && <div style={{ marginTop: 4, fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "#0D4429", color: "#3FB950", fontWeight: 700, display: "inline-block", border: "1px solid #238636" }}>{plan.milestone}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 14 }}>
                            {[{ v: `${hours}h`, l: "Planned" }, { v: `${DAILY_HOURS}h`, l: "Budget" }, { v: `${doneDayC}/${dayCommits.length}`, l: "Commits" }, { v: plan.tasks.length, l: "Tasks" }].map(s => (
                                <div key={s.l} style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: s.l === "Planned" && hours > DAILY_HOURS ? "#F85149" : "#E6EDF3" }}>{s.v}</div>
                                    <div style={{ fontSize: 9, color: "#8B949E" }}>{s.l}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <textarea value={dayNotes[plan.day] || ""} onChange={e => setDayNotes(p => ({ ...p, [plan.day]: e.target.value }))}
                        placeholder="Day notes / blockers / stand-up…"
                        style={{
                            marginTop: 8, width: "100%", height: 32, fontSize: 10, padding: "5px 8px", borderRadius: 4,
                            border: "1px solid #30363D", background: "#0D1117", color: "#C9D1D9", resize: "none",
                            boxSizing: "border-box", outline: "none", fontFamily: "inherit"
                        }} />
                </div>

                {/* Tasks */}
                {plan.tasks.map(task => {
                    const ep = EPIC_META[task.epic] || {};
                    const st = taskStatus[task.id] || "todo";
                    const scfg = STATUS_CFG[st];
                    const tDone = task.commits.filter(c => commitsDone[c.id]).length;
                    const tPct = task.commits.length ? Math.round(tDone / task.commits.length * 100) : 0;
                    const isArch = task.epic === "ARCH";

                    return (
                        <div key={task.id} style={{ background: "#161B22", border: `1px solid ${isArch ? "#D2A8FF33" : "#30363D"}`, borderRadius: 6, marginBottom: 10, borderLeft: `3px solid ${ep.color}` }}>
                            {/* Task header — click storyKey to open modal */}
                            <div style={{ padding: "10px 12px", borderBottom: "1px solid #21262D" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: "#0D1117", padding: "1px 6px", borderRadius: 3, background: ep.color }}>{task.storyKey}</span>
                                            {isArch && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#D2A8FF", color: "#0D1117", fontWeight: 700 }}>MIGRATION</span>}
                                            {task.note?.includes("EARLY") && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#1A7F37", color: "#fff", fontWeight: 700 }}>⬆ EARLY</span>}
                                            {/* Clickable story key button */}
                                            <button onClick={() => { setOpenStory(task.storyKey); setStoryTab("backlog"); }} style={{
                                                fontSize: 9, padding: "1px 7px", borderRadius: 3, background: "#1C2128", border: "1px solid #30363D",
                                                color: "#388BFD", cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                                            }}>📋 Story</button>
                                            <button onClick={() => { setOpenStory(task.storyKey); setStoryTab("prompts"); }} style={{
                                                fontSize: 9, padding: "1px 7px", borderRadius: 3, background: "#1C2128", border: "1px solid #30363D",
                                                color: "#D2A8FF", cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                                            }}>🤖 Prompts</button>
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#E6EDF3", marginBottom: 2 }}>{task.title}</div>
                                        {task.note && <div style={{ fontSize: 10, color: "#8B949E", fontStyle: "italic" }}>{task.note}</div>}
                                        {task.depends.length > 0 && <div style={{ display: "flex", gap: 3, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 9, color: "#6E7681" }}>needs:</span>
                                            {task.depends.map(d => <span key={d} style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, background: "#21262D", color: "#8B949E" }}>{d}</span>)}
                                        </div>}
                                    </div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: task.hours === 0 ? "#484F58" : "#E6EDF3" }}>{task.hours}h</div>
                                            <div style={{ fontSize: 8, color: "#6E7681" }}>est.</div>
                                        </div>
                                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: task.model === "Opus 4.6" ? "#1E1033" : "#0D2140", color: task.model === "Opus 4.6" ? "#D2A8FF" : "#388BFD", fontWeight: 700, border: `1px solid ${task.model === "Opus 4.6" ? "#D2A8FF44" : "#388BFD44"}` }}>{task.model}</span>
                                        <select value={st} onChange={e => setTask(task.id, e.target.value)} style={{
                                            fontSize: 9, padding: "3px 6px", borderRadius: 4, border: `1px solid ${scfg.dot}66`,
                                            background: "#21262D", color: scfg.text, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                                        }}>
                                            {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v} style={{ background: "#161B22" }}>{c.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ flex: 1, height: 3, background: "#21262D", borderRadius: 2 }}>
                                        <div style={{ height: 3, borderRadius: 2, background: tPct === 100 ? "#3FB950" : ep.color, width: `${tPct}%`, transition: "width .3s" }} />
                                    </div>
                                    <span style={{ fontSize: 9, color: "#6E7681", flexShrink: 0 }}>{tDone}/{task.commits.length}</span>
                                </div>
                            </div>

                            {/* Commits */}
                            <div style={{ padding: "8px 12px" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "#6E7681", letterSpacing: 1, marginBottom: 5 }}>COMMITS</div>
                                {task.commits.map((c, ci) => {
                                    const done = !!commitsDone[c.id];
                                    return (
                                        <div key={c.id} onClick={() => toggleCommit(c.id)} style={{
                                            display: "flex", alignItems: "flex-start", gap: 7, padding: "4px 7px", borderRadius: 4,
                                            cursor: "pointer", marginBottom: 2,
                                            background: done ? "#0D2818" : "#21262D",
                                            border: `1px solid ${done ? "#238636" : "#30363D"}`, transition: "all .15s",
                                        }}>
                                            <div style={{
                                                width: 12, height: 12, borderRadius: 2, border: `1.5px solid ${done ? "#3FB950" : "#484F58"}`,
                                                background: done ? "#238636" : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0, marginTop: 1
                                            }}>
                                                {done && <span style={{ color: "#fff", fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                                            </div>
                                            <span style={{
                                                flex: 1, fontSize: 10, color: done ? "#3FB950" : "#C9D1D9", fontWeight: done ? 500 : 400,
                                                textDecoration: done ? "line-through" : "none", lineHeight: 1.4
                                            }}>
                                                {c.label}
                                            </span>
                                            <span style={{ fontSize: 8, color: "#484F58", flexShrink: 0 }}>#{ci + 1}</span>
                                        </div>
                                    );
                                })}
                                {/* Verify */}
                                <div style={{ marginTop: 7, padding: "6px 9px", background: "#0D2818", borderRadius: 4, border: "1px solid #238636" }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: "#3FB950" }}>✔ VERIFY: </span>
                                    <span style={{ fontSize: 9, color: "#7EE787" }}>{task.verify}</span>
                                </div>
                                {/* Notes */}
                                <textarea value={notes[task.id] || ""} onChange={e => setNotes(p => ({ ...p, [task.id]: e.target.value }))}
                                    onClick={e => e.stopPropagation()}
                                    placeholder="Notes / blockers / decisions…"
                                    style={{
                                        marginTop: 5, width: "100%", height: 28, fontSize: 10, padding: "4px 7px", borderRadius: 4,
                                        border: "1px solid #30363D", background: "#0D1117", color: "#C9D1D9", resize: "none",
                                        boxSizing: "border-box", outline: "none", fontFamily: "inherit"
                                    }} />
                            </div>
                        </div>
                    );
                })}

                {/* Nav */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <button disabled={selectedDay <= 1} onClick={() => setSelectedDay(d => d - 1)} style={{ padding: "6px 16px", borderRadius: 5, border: "1px solid #30363D", background: "#21262D", color: selectedDay <= 1 ? "#484F58" : "#C9D1D9", cursor: selectedDay <= 1 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 11 }}>← Prev Day</button>
                    <button disabled={selectedDay >= 15} onClick={() => setSelectedDay(d => d + 1)} style={{ padding: "6px 16px", borderRadius: 5, border: "1px solid #30363D", background: "#21262D", color: selectedDay >= 15 ? "#484F58" : "#C9D1D9", cursor: selectedDay >= 15 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 11 }}>Next Day →</button>
                </div>
            </div>
        </div>
    );
}

// ─── WEEK GRID ────────────────────────────────────────────────────────────────
function WeekGrid({ taskStatus, commitsDone, setSelectedDay }) {
    const weeks = [[1, 2, 3], [4, 5, 6, 7, 8], [9, 10], [11, 12], [13, 14, 15]];
    const weekLabels = ["Week 1 (3–5 Mar)", "Week 2 (8–12 Mar)", "Week 3 (15–16 Mar)", "Week 4 (24–25 Mar)", "Week 5 (29–31 Mar)"];
    return (
        <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3", marginBottom: 12 }}>15-Day Sprint Overview — click any day</div>
            {weeks.map((wDays, wi) => (
                <div key={wi} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#8B949E", letterSpacing: 1, marginBottom: 6 }}>{weekLabels[wi]}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {wDays.map(dayNum => {
                            const plan = DAY_PLANS.find(d => d.day === dayNum);
                            const dc = plan.tasks.flatMap(t => t.commits);
                            const done = dc.filter(c => commitsDone[c.id]).length;
                            const p = dc.length ? Math.round(done / dc.length * 100) : 0;
                            const hours = plan.tasks.reduce((a, t) => a + t.hours, 0);
                            const isT = dayNum === TODAY_DAY;
                            const epics = [...new Set(plan.tasks.map(t => t.epic))];
                            return (
                                <div key={dayNum} onClick={() => setSelectedDay(dayNum)} style={{
                                    background: "#161B22", border: `1px solid ${isT ? "#388BFD" : p === 100 ? "#238636" : "#30363D"}`,
                                    borderRadius: 6, padding: "10px 12px", cursor: "pointer", minWidth: 150, flex: 1,
                                    boxShadow: isT ? "0 0 0 2px #388BFD33" : "none",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: isT ? "#388BFD" : p === 100 ? "#3FB950" : "#E6EDF3" }}>D{dayNum} {isT ? "◀ TODAY" : ""}</div>
                                            <div style={{ fontSize: 9, color: "#8B949E" }}>{plan.date}</div>
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: p === 100 ? "#3FB950" : p > 0 ? "#388BFD" : "#484F58" }}>{p}%</div>
                                    </div>
                                    <div style={{ fontSize: 9, color: "#8B949E", marginBottom: 6, lineHeight: 1.3 }}>{plan.theme}</div>
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                                        {epics.map(e => <span key={e} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: EPIC_META[e]?.color + "22", color: EPIC_META[e]?.color, border: `1px solid ${EPIC_META[e]?.color}44` }}>{e}</span>)}
                                    </div>
                                    <div style={{ height: 3, background: "#21262D", borderRadius: 2 }}>
                                        <div style={{ height: 3, borderRadius: 2, background: p === 100 ? "#3FB950" : "#388BFD", width: `${p}%`, transition: "width .3s" }} />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                                        <span style={{ fontSize: 9, color: "#6E7681" }}>{done}/{dc.length} commits</span>
                                        <span style={{ fontSize: 9, color: "#6E7681" }}>{hours}h</span>
                                    </div>
                                    {plan.milestone && <div style={{ marginTop: 4, fontSize: 8, color: "#3FB950", fontWeight: 700 }}>{plan.milestone}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── STORY MODAL ──────────────────────────────────────────────────────────────
function StoryModal({ storyKey, storyTab, setStoryTab, onClose }) {
    const story = BACKLOG[storyKey];
    const prompt = ALL_PROMPTS[storyKey];
    const ep = EPIC_META[story?.epic] || {};
    if (!story) return null;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px", overflowY: "auto" }}
            onClick={onClose}>
            <div style={{
                background: "#161B22", border: "1px solid #388BFD", borderRadius: 8, width: "100%", maxWidth: 780,
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
            }}
                onClick={e => e.stopPropagation()}>

                {/* Modal header */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #30363D", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#0D1117", padding: "2px 8px", borderRadius: 4, background: ep.color }}>{storyKey}</span>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#21262D", color: "#8B949E", border: "1px solid #30363D" }}>{story.points} pts</span>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#21262D", color: story.priority === "Critical" ? "#F85149" : "#D2A8FF", border: "1px solid #30363D" }}>{story.priority}</span>
                            {prompt && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#0D2140", color: "#388BFD", border: "1px solid #388BFD44" }}>{prompt.model}</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3" }}>{story.title}</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#8B949E", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px", fontFamily: "inherit" }}>×</button>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid #30363D", background: "#0D1117" }}>
                    {[{ id: "backlog", label: "📋 Backlog Story" }, { id: "prompts", label: "🤖 Copilot Prompts" }].map(t => (
                        <button key={t.id} onClick={() => setStoryTab(t.id)} style={{
                            padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 11, fontWeight: storyTab === t.id ? 700 : 400,
                            color: storyTab === t.id ? "#E6EDF3" : "#8B949E",
                            borderBottom: storyTab === t.id ? "2px solid #388BFD" : "2px solid transparent",
                            fontFamily: "inherit",
                        }}>{t.label}</button>
                    ))}
                </div>

                {/* Backlog tab */}
                {storyTab === "backlog" && (
                    <div style={{ padding: "16px", maxHeight: "70vh", overflowY: "auto" }}>
                        {/* User story */}
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#8B949E", letterSpacing: 1, marginBottom: 6 }}>USER STORY</div>
                            <div style={{ background: "#0D1117", border: "1px solid #30363D", borderRadius: 5, padding: "10px 12px", borderLeft: "3px solid " + ep.color }}>
                                <div style={{ fontSize: 11, color: "#C9D1D9", lineHeight: 1.6, fontStyle: "italic" }}>"{story.story}"</div>
                            </div>
                        </div>

                        {/* Acceptance criteria */}
                        <div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#8B949E", letterSpacing: 1, marginBottom: 6 }}>ACCEPTANCE CRITERIA</div>
                            {story.ac.map((ac, i) => (
                                <div key={i} style={{
                                    display: "flex", gap: 8, padding: "7px 10px", marginBottom: 3,
                                    background: "#0D1117", border: "1px solid #21262D", borderRadius: 4, alignItems: "flex-start"
                                }}>
                                    <span style={{ fontSize: 10, color: "#3FB950", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>AC{i + 1}</span>
                                    <span style={{ fontSize: 10, color: "#C9D1D9", lineHeight: 1.5 }}>{ac}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Prompts tab */}
                {storyTab === "prompts" && (
                    <div style={{ padding: "16px", maxHeight: "70vh", overflowY: "auto" }}>
                        {!prompt ? (
                            <div style={{ color: "#8B949E", fontSize: 11, padding: "20px", textAlign: "center" }}>Prompts not yet defined for this story. Add them to the PROMPTS data object.</div>
                        ) : (
                            <>
                                {/* Expected outcome */}
                                <div style={{ marginBottom: 14, padding: "10px 12px", background: "#0D2818", border: "1px solid #238636", borderRadius: 5 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: "#3FB950", letterSpacing: 1, marginBottom: 4 }}>EXPECTED OUTCOME AFTER COMPLETING THIS STORY</div>
                                    <div style={{ fontSize: 11, color: "#7EE787", lineHeight: 1.5 }}>{prompt.expect}</div>
                                </div>

                                {/* Atomic commits */}
                                <div style={{ fontSize: 9, fontWeight: 700, color: "#8B949E", letterSpacing: 1, marginBottom: 8 }}>ATOMIC COMMITS — copy each prompt into Copilot chat</div>
                                {prompt.commits.map((c, i) => (
                                    <div key={i} style={{ marginBottom: 10, background: "#0D1117", border: "1px solid #30363D", borderRadius: 5, overflow: "hidden" }}>
                                        <div style={{ padding: "8px 12px", background: "#21262D", borderBottom: "1px solid #30363D", display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: "#388BFD", flexShrink: 0 }}>#{i + 1}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: "#E6EDF3", fontFamily: "monospace" }}>{c.label}</span>
                                        </div>
                                        <div style={{ padding: "10px 12px" }}>
                                            <div style={{ fontSize: 9, fontWeight: 700, color: "#6E7681", letterSpacing: 1, marginBottom: 5 }}>PROMPT</div>
                                            <div style={{
                                                fontSize: 10, color: "#C9D1D9", lineHeight: 1.6, fontFamily: "monospace", whiteSpace: "pre-wrap",
                                                background: "#0D1117", padding: "8px", borderRadius: 3, border: "1px solid #21262D"
                                            }}>
                                                {c.prompt}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Verify */}
                                <div style={{ marginTop: 4, padding: "10px 12px", background: "#0D2818", border: "1px solid #238636", borderRadius: 5 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: "#3FB950", letterSpacing: 1, marginBottom: 4 }}>VERIFY (done when this passes)</div>
                                    <div style={{ fontSize: 10, color: "#7EE787", fontFamily: "monospace" }}>{prompt.verify}</div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}