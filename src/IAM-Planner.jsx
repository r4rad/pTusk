import { useState, useEffect, useCallback } from "react";

/* ─────────────────────────── GOOGLE FONTS ─────────────────────────── */
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

/* ─────────────────────────── THEME TOKENS ─────────────────────────── */
const THEMES = {
  light: {
    bg: "#F4EFE6",
    surface: "#EDE7DA",
    surfaceAlt: "#E4DCCF",
    border: "#C9BFA8",
    text: "#2A1F14",
    textSub: "#6B5840",
    textMuted: "#9C8670",
    accent: "#8B5E3C",
    accentSoft: "#C4956A",
    accentBg: "#F0E4D4",
    success: "#3D6B4F",
    successBg: "#D4EBD9",
    warn: "#7A5C1E",
    warnBg: "#F5E4BC",
    code: "#1A3A2A",
    codeBg: "#E2D9C8",
    pill: "#8B5E3C",
    pillBg: "#F0E4D4",
    scrollbar: "#C4A882",
    shadow: "rgba(80,50,20,0.12)",
  },
  dark: {
    bg: "#091728",
    surface: "#0D1F35",
    surfaceAlt: "#112640",
    border: "#1E3A56",
    text: "#D4E4F4",
    textSub: "#8AAABF",
    textMuted: "#4E7090",
    accent: "#4FA3D4",
    accentSoft: "#2E7BAD",
    accentBg: "#0D2A42",
    success: "#3DAA7A",
    successBg: "#0A2A1F",
    warn: "#CCA050",
    warnBg: "#1E2A0E",
    code: "#A8D8F0",
    codeBg: "#091520",
    pill: "#4FA3D4",
    pillBg: "#0D2A42",
    scrollbar: "#1E3A56",
    shadow: "rgba(0,10,25,0.4)",
  },
};

/* ─────────────────────────── UNIVERSAL PREAMBLE ─────────────────────────── */
const UNIVERSAL_PREAMBLE = `Project: AIT.Python.FastApi.IAMService
Base: ait.python.fastapi.boilerplate (already cloned and renamed)
Docs: docs/ARCHITECTURE_v2.0.md, docs/BACKLOG_v2.0.md
Stack: FastAPI, SQLAlchemy async, dependency-injector, structlog, Redis, Alembic, pytest-asyncio
Layout: flat N-tier — app/api, app/services, app/repositories, app/models, app/core
Pattern: command-handler for all mutations; Repository Protocols in repositories/interfaces/
Rules:
  - TDD: write the failing test FIRST, then the implementation
  - SOLID: single responsibility per class, inject all dependencies
  - No hardcoded values — all config via settings (app/core/config.py)
  - No comments in production code
  - Identity-only JWTs — HS256 signed via SECRET_KEY, no roles/permissions/claims in payload
  - JWT field: user_id (not sub), plus user_scope, type, and scope-specific fields per Architecture §7
  - schema_name is always derived inside ProvisionTenantHandler, never from request body
Workflow:
  1. State which files you will create or modify (paths only, no code yet)
  2. Write the failing test(s) — show the test file first
  3. Write the minimal implementation to make tests pass
  4. State the exact pytest command to verify
  5. Provide the commit message: type(wbs-X.Y): short description`;

/* ─────────────────────────── SPRINT DATA ─────────────────────────── */
const SPRINT_DATA = {
  days: [
    { id: 1, date: "Tue 10 Mar", hours: 4.5, wbs: ["1.2", "1.3", "2.1"] },
    { id: 2, date: "Wed 11 Mar", hours: 4.5, wbs: ["2.2", "2.3", "2.4"] },
    { id: 3, date: "Thu 12 Mar", hours: 5.0, wbs: ["3.1", "3.2", "4.1"] },
    { id: 4, date: "Sun 15 Mar", hours: 5.0, wbs: ["4.2", "5.1", "5.2"] },
    { id: 5, date: "Mon 16 Mar", hours: 5.0, wbs: ["5.3", "5.4", "5.5"] },
    { id: 6, date: "Tue 24 Mar", hours: 5.0, wbs: ["3.3", "6.1", "6.2"] },
    { id: 7, date: "Wed 25 Mar", hours: 5.0, wbs: ["3.4", "7.1", "7.2", "8.1"] },
  ],
  wbs: {
    "1.1": {
      title: "Clone boilerplate and rename project",
      priority: "P0", hours: 1.0, day: null, done: true,
      story: "As a developer, I want the project scaffolded from the boilerplate so I start with working CI, Docker, and structure.",
      description: "Clone ait.python.fastapi.boilerplate, rename to AIT.Python.FastApi.IAMService, verify docker-compose starts cleanly.",
      acceptance: ["Repo renamed and pushed.", "docker-compose up -d starts postgres, redis, seq.", "No import errors on uvicorn startup."],
      commits: [],
    },
    "1.2": {
      title: "Config and environment alignment",
      priority: "P0", hours: 1.5, day: 1,
      story: "As a developer, I want all environment variables and settings fields defined so the app starts deterministically and fails fast on missing keys.",
      description: "Extend app/core/config.py with all IAM-specific settings (SECRET_KEY, JWT expiry, lockout thresholds, cache TTLs, rate limit, seed credentials). Update .env.development, .env.staging, .env.production templates.",
      acceptance: [
        "app/core/config.py has all keys listed in Architecture §15.",
        "Missing SECRET_KEY at startup raises a clear ValidationError with field name.",
        "docker-compose.yml starts postgres, redis, seq without errors.",
        ".env.development has all keys with safe development defaults.",
      ],
      commits: [
        {
          id: "1.2-A", model: "Haiku 4.5",
          title: "Extend Settings with IAM-specific fields",
          commitMsg: "feat(wbs-1.2): extend settings with IAM config fields",
          pytest: "pytest tests/unit/test_settings.py -v",
          prompt: `Task WBS 1.2-A: Extend app/core/config.py with IAM-specific settings.

Files to modify:
  - app/core/config.py
  - .env.development
  - .env.staging
  - .env.production

Add these fields to the existing Settings class (do NOT replace the class):
  SECRET_KEY: str  # min 32 chars — HS256 signing key
  JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
  JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
  TENANT_CACHE_TTL_SECONDS: int = 60
  PERMISSION_CACHE_TTL_SECONDS: int = 300
  LOGIN_LOCKOUT_SOFT_THRESHOLD: int = 5
  LOGIN_LOCKOUT_HARD_THRESHOLD: int = 10
  LOGIN_LOCKOUT_DURATION_MINUTES: int = 30
  RATE_LIMIT_DEFAULT_REQUESTS_PER_MINUTE: int = 60
  SEED_SUPER_ADMIN_EMAIL: str
  SEED_SUPER_ADMIN_PASSWORD: str
  SEED_APP_ADMIN_EMAIL: str
  SEED_APP_ADMIN_PASSWORD: str
  SEED_APPLICATION_CODE: str = "ait360"

Tests to write first in tests/unit/test_settings.py:
  - test_settings_missing_secret_key_raises: remove SECRET_KEY from env, assert ValidationError raised
  - test_settings_load_all_iam_fields: provide all required env vars, assert all fields load correctly
  - test_settings_defaults_applied: omit optional fields, assert default values used

Run: pytest tests/unit/test_settings.py -v
Commit message: feat(wbs-1.2): extend settings with IAM config fields`,
        },
        {
          id: "1.2-B", model: "Haiku 4.5",
          title: "Docker Compose verification",
          commitMsg: "chore(wbs-1.2): verify docker-compose has postgres, redis, seq",
          pytest: "docker compose ps",
          prompt: `Task WBS 1.2-B: Verify and update docker-compose.yml.

Requirements:
  - postgres service: image postgres:15, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD from env
  - redis service: image redis:7-alpine, port 6379
  - seq service: image datalust/seq:latest, port 5341 (UI) and 5341 (ingestion), ACCEPT_EULA=Y
  - All services have health checks
  - All services are in the same network

No tests needed for this commit. Manual check: docker compose up -d → all 3 services healthy.
Run: docker compose ps (all services should show "healthy" or "running")
Commit message: chore(wbs-1.2): verify docker-compose has postgres, redis, seq`,
        },
      ],
    },
    "1.3": {
      title: "Baseline health endpoint and test harness",
      priority: "P0", hours: 1.0, day: 1,
      story: "As a developer, I want the health endpoint confirmed working and pytest collecting correctly so I can develop safely from the first commit.",
      description: "Verify GET /api/v1/health returns 200. Confirm pytest runs with zero collection errors. Add tests/fakes/ directory with __init__.py. Add @pytest.mark.integration and @pytest.mark.api markers to pytest.ini.",
      acceptance: [
        "GET /api/v1/health → 200 {\"status\": \"healthy\", \"service\": \"ait-iam-service\", \"version\": \"...\"}.",
        "pytest tests/unit/ runs with zero errors.",
        "pytest --co shows no import errors across all test directories.",
        "tests/fakes/ directory exists with __init__.py.",
      ],
      commits: [
        {
          id: "1.3-A", model: "Haiku 4.5",
          title: "Confirm health endpoint and add test infrastructure",
          commitMsg: "chore(wbs-1.3): set up test infrastructure and confirm health endpoint",
          pytest: "pytest tests/api/test_health.py -v",
          prompt: `Task WBS 1.3-A: Confirm health endpoint works and set up test infrastructure.

Files to create/modify:
  - tests/fakes/__init__.py  (create — empty file)
  - tests/unit/__init__.py   (create if missing)
  - tests/integration/__init__.py (create if missing)
  - tests/api/__init__.py    (create if missing)
  - pytest.ini               (add markers: integration, api)
  - tests/api/test_health.py (write tests)

Add to pytest.ini:
  [pytest]
  markers =
      integration: mark test as requiring real database and Redis (docker-compose)
      api: mark test as requiring FastAPI TestClient with real DB
  asyncio_mode = auto

Write tests in tests/api/test_health.py:
  - test_health_returns_200: GET /api/v1/health, assert status_code == 200
  - test_health_response_has_status_field: assert response.json()["status"] == "healthy"
  - test_health_response_has_service_field: assert "service" in response.json()

Use the existing TestClient fixture from conftest.py.

Run: pytest tests/api/test_health.py -v
Commit message: chore(wbs-1.3): set up test infrastructure and confirm health endpoint`,
        },
      ],
    },
    "2.1": {
      title: "Platform ORM models",
      priority: "P0", hours: 2.0, day: 1,
      story: "As a developer, I want all platform ORM models so identity, tenancy, and token state are persisted with correct constraints.",
      description: "Create app/models/platform_models.py with all 8 PLATFORM_* SQLAlchemy ORM models. Add domain methods: PlatformUser.verify_password(), is_locked(), increment_failed_attempts(), clear_lockout(). Add PlatformRefreshTokenFamily.is_expired(), PlatformRefreshToken.is_used().",
      acceptance: [
        "All 8 models compile and import without circular errors.",
        "PLATFORM_USER.user_scope is a Python Enum enforced at ORM level.",
        "PLATFORM_TENANT has UniqueConstraint(\"application_id\", \"organisation_slug\").",
        "PLATFORM_USER.rbac_version defaults to 1.",
        "PLATFORM_REFRESH_TOKEN.token_hash is String(64) (SHA-256 hex).",
        "verify_password() uses bcrypt. is_locked() checks locked_out_until > datetime.utcnow().",
        "No imports from app.services, app.api, or app.core.middleware.",
      ],
      commits: [
        {
          id: "2.1-A", model: "Sonnet 4.6",
          title: "Write failing tests for platform model constraints",
          commitMsg: "test(wbs-2.1): add failing platform model constraint tests",
          pytest: "pytest tests/unit/test_platform_models.py -v  (expect ALL FAILURES)",
          prompt: `Task WBS 2.1-A: Write failing unit tests for platform ORM model constraints and domain methods.
These tests must FAIL now (models don't exist yet). Write tests only — no implementation.

Create tests/unit/test_platform_models.py with these tests:

from app.models.platform_models import (
    PlatformUser, PlatformTenant, PlatformApplication,
    PlatformRefreshTokenFamily, PlatformRefreshToken, UserScope
)

Tests:
  test_user_scope_enum_has_three_values:
    assert set(UserScope) == {UserScope.SUPER_ADMIN, UserScope.APP_ADMIN, UserScope.TENANT_USER}

  test_verify_password_returns_true_for_correct_password:
    user = PlatformUser(password_hash=bcrypt.hashpw(b"secret", bcrypt.gensalt()).decode())
    assert user.verify_password("secret") is True

  test_verify_password_returns_false_for_wrong_password:
    user = PlatformUser(password_hash=bcrypt.hashpw(b"secret", bcrypt.gensalt()).decode())
    assert user.verify_password("wrong") is False

  test_is_locked_when_locked_out_until_in_future:
    user = PlatformUser(locked_out_until=datetime.utcnow() + timedelta(hours=1))
    assert user.is_locked() is True

  test_is_locked_when_locked_out_until_is_none:
    user = PlatformUser(locked_out_until=None)
    assert user.is_locked() is False

  test_increment_failed_attempts_increments_count:
    user = PlatformUser(access_failed_count=2)
    user.increment_failed_attempts()
    assert user.access_failed_count == 3

  test_clear_lockout_resets_count_and_clears_timestamp:
    user = PlatformUser(access_failed_count=10, locked_out_until=datetime.utcnow())
    user.clear_lockout()
    assert user.access_failed_count == 0
    assert user.locked_out_until is None

Run: pytest tests/unit/test_platform_models.py -v (expect ALL FAILURES)
Commit message: test(wbs-2.1): add failing platform model constraint tests`,
        },
        {
          id: "2.1-B", model: "Sonnet 4.6",
          title: "Implement platform ORM models",
          commitMsg: "feat(wbs-2.1): implement platform ORM models with domain methods",
          pytest: "pytest tests/unit/test_platform_models.py -v",
          prompt: `Task WBS 2.1-B: Implement all platform ORM models to pass the tests from 2.1-A.

Create app/models/platform_models.py with these SQLAlchemy models.
Import base from app/models/base.py (AuditableEntity already there).

Models required (all inherit AuditableEntity which already has created_at, updated_at):

1. UserScope(str, Enum): SUPER_ADMIN, APP_ADMIN, TENANT_USER
2. ApplicationRole(str, Enum): OWNER, ADMIN, VIEWER
3. TenantStatus(str, Enum): ACTIVE, SUSPENDED, DEPROVISIONED

4. PlatformApplication(AuditableEntity, Base):
   id: UUID PK default uuid4 | name: String(255) NOT NULL | code: String(50) UNIQUE NOT NULL
   description: String(500) | management_mode: String(20) NOT NULL DEFAULT "AIT_MANAGED"
   api_key: String(36) UNIQUE | api_secret_hash: String(255) | key_issued_at: DateTime
   __tablename__ = "platform_application"

5. PlatformTenant(AuditableEntity, Base):
   id: UUID PK | application_id: UUID FK NOT NULL | organisation_name: String(255) NOT NULL
   organisation_slug: String(100) NOT NULL | schema_name: String(100) UNIQUE NOT NULL
   status: Enum(TenantStatus) DEFAULT ACTIVE | schema_version: String(50) DEFAULT "0"
   __table_args__ = (UniqueConstraint("application_id", "organisation_slug"),)

6. PlatformUser(AuditableEntity, Base):
   id: UUID PK | email: String(255) UNIQUE NOT NULL | password_hash: String(255)
   user_scope: Enum(UserScope) NOT NULL | rbac_version: Integer DEFAULT 1 NOT NULL
   is_active: Boolean DEFAULT False NOT NULL | email_confirmed: Boolean DEFAULT False NOT NULL
   access_failed_count: Integer DEFAULT 0 NOT NULL | locked_out_until: DateTime nullable

   Domain methods (no imports from app.services or app.api):
   def verify_password(self, raw: str) -> bool: return bcrypt.checkpw(raw.encode(), self.password_hash.encode())
   def is_locked(self) -> bool: return self.locked_out_until is not None and self.locked_out_until > datetime.utcnow()
   def increment_failed_attempts(self) -> None: self.access_failed_count += 1
   def clear_lockout(self) -> None: self.access_failed_count = 0; self.locked_out_until = None

7. PlatformUserApplication(Base): id UUID PK, user_id FK, application_id FK, application_role: Enum(ApplicationRole), created_at
   UniqueConstraint("user_id", "application_id")

8. PlatformUserTenant(Base): id UUID PK, user_id FK, tenant_id FK, is_default Boolean DEFAULT False, created_at
   UniqueConstraint("user_id", "tenant_id")

9. PlatformRefreshTokenFamily(AuditableEntity, Base):
   id UUID PK, user_id FK, family_id: UUID UNIQUE NOT NULL, rotation_count: Integer DEFAULT 0,
   is_revoked: Boolean DEFAULT False NOT NULL, revoked_at: DateTime nullable

10. PlatformRefreshToken(Base):
    id UUID PK, family_id FK, token_hash: String(64) UNIQUE NOT NULL,
    parent_token_hash: String(64) nullable, is_current: Boolean DEFAULT True,
    used_at: DateTime nullable, created_at: DateTime

11. PlatformAuditLog(Base):
    id UUID PK, user_id: UUID (no FK — nullable), action_type: String(50),
    entity_type: String(100), entity_id: UUID, changed_data: JSON,
    ip_address: String(45), created_at: DateTime DEFAULT utcnow

Run: pytest tests/unit/test_platform_models.py -v (expect ALL PASS)
Commit message: feat(wbs-2.1): implement platform ORM models with domain methods`,
        },
      ],
    },
    "2.2": {
      title: "Platform migration",
      priority: "P0", hours: 1.5, day: 2,
      story: "As a developer, I want a versioned Alembic migration for all platform tables so the database is reproducible.",
      description: "Create alembic/versions/001_platform_schema.py. All 8 PLATFORM_* tables with FK constraints, indexes on email, organisation_slug, token_hash. upgrade() and downgrade() both work cleanly.",
      acceptance: [
        "alembic upgrade head creates all 8 tables with correct columns and constraints.",
        "alembic downgrade base drops all tables cleanly.",
        "Re-running alembic upgrade head after downgrade base succeeds.",
        "Indexes: ix_platform_user_email (unique), ix_platform_tenant_slug, ix_refresh_token_hash (unique).",
      ],
      commits: [
        {
          id: "2.2-A", model: "Sonnet 4.6",
          title: "Write failing migration integration test",
          commitMsg: "test(wbs-2.2): add failing platform migration integration tests",
          pytest: "pytest tests/integration/test_platform_migration.py -v --run-integration  (expect FAIL)",
          prompt: `Task WBS 2.2-A: Write failing integration test for platform migration.

Create tests/integration/test_platform_migration.py:

@pytest.mark.integration
async def test_platform_migration_creates_all_tables(async_engine):
    from alembic.config import Config
    from alembic import command
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    async with async_engine.connect() as conn:
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        ))
        tables = {row[0] for row in result}
    expected = {
        "platform_application", "platform_tenant", "platform_user",
        "platform_user_application", "platform_user_tenant",
        "platform_refresh_token_family", "platform_refresh_token", "platform_audit_log"
    }
    assert expected.issubset(tables)

@pytest.mark.integration
async def test_platform_migration_downgrade_cleans_up(async_engine):
    from alembic.config import Config
    from alembic import command
    alembic_cfg = Config("alembic.ini")
    command.downgrade(alembic_cfg, "base")
    async with async_engine.connect() as conn:
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            " AND table_name LIKE 'platform_%'"
        ))
        tables = list(result)
    assert len(tables) == 0

The async_engine fixture should come from tests/conftest.py.
If it doesn't exist, add it: create an AsyncEngine from settings.DATABASE_URL.

Run: pytest tests/integration/test_platform_migration.py -v --run-integration (expect FAIL — migration doesn't exist yet)
Commit message: test(wbs-2.2): add failing platform migration integration tests`,
        },
        {
          id: "2.2-B", model: "Sonnet 4.6",
          title: "Create platform Alembic migration",
          commitMsg: "feat(wbs-2.2): add platform schema Alembic migration",
          pytest: "pytest tests/integration/test_platform_migration.py -v --run-integration",
          prompt: `Task WBS 2.2-B: Create the Alembic migration for all 8 platform tables.

Create alembic/versions/001_platform_schema.py

The migration must:
1. Create all 8 tables in dependency order (no FK errors):
   platform_application → platform_tenant, platform_user →
   platform_user_application, platform_user_tenant →
   platform_refresh_token_family → platform_refresh_token → platform_audit_log

2. For each table, create exactly the columns defined in app/models/platform_models.py.
   Use sa.Column, sa.ForeignKey, sa.UniqueConstraint, sa.Index.
   UUID columns: sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
   Enum columns: use sa.Enum with string values, not the Python Enum class.

3. Add these indexes:
   - ix_platform_user_email (unique) on platform_user.email
   - ix_platform_tenant_slug on platform_tenant.organisation_slug
   - ix_platform_application_code (unique) on platform_application.code
   - ix_refresh_token_hash (unique) on platform_refresh_token.token_hash

4. downgrade() drops all tables in reverse order.

Revision ID: revision = "001"
down_revision = None

Run: pytest tests/integration/test_platform_migration.py -v --run-integration (expect PASS)
Also manually verify: alembic downgrade base && alembic upgrade head (no errors)
Commit message: feat(wbs-2.2): add platform schema Alembic migration`,
        },
      ],
    },
    "2.3": {
      title: "Platform repositories",
      priority: "P0", hours: 1.5, day: 2,
      story: "As a developer, I want platform repository interfaces and implementations so handler tests can use fakes and integration tests can use real DB.",
      description: "Create Protocol interfaces in repositories/interfaces/: IUserRepository, ITenantRepository, IApplicationRepository, IRefreshTokenRepository. Create SQLAlchemy implementations. Create fake (dict-backed) implementations in tests/fakes/.",
      acceptance: [
        "Each interface has: get_by_id, get_by_email (user), get_by_slug (tenant), get_by_code (app), save, delete.",
        "IRefreshTokenRepository has: get_family_by_token_hash, save_family, revoke_family.",
        "Fake implementations are fully async and match Protocol signatures exactly.",
        "Container wires SQLAlchemy implementations for production.",
      ],
      commits: [
        {
          id: "2.3-A", model: "Sonnet 4.6",
          title: "Define repository interfaces and write contract tests",
          commitMsg: "feat(wbs-2.3): add repository interfaces and fake implementations",
          pytest: "pytest tests/unit/test_platform_repositories.py -v",
          prompt: `Task WBS 2.3-A: Define repository Protocol interfaces and write contract tests using fakes.

Step 1 — Create repository interfaces:

app/repositories/interfaces/user.py:
  class IUserRepository(Protocol):
      async def get_by_id(self, user_id: UUID) -> PlatformUser | None: ...
      async def get_by_email(self, email: str) -> PlatformUser | None: ...
      async def save(self, user: PlatformUser) -> PlatformUser: ...
      async def delete(self, user_id: UUID) -> None: ...

app/repositories/interfaces/tenant.py:
  class ITenantRepository(Protocol):
      async def get_by_id(self, tenant_id: UUID) -> PlatformTenant | None: ...
      async def get_by_slug(self, slug: str) -> PlatformTenant | None: ...
      async def get_all_by_application(self, application_id: UUID) -> list[PlatformTenant]: ...
      async def save(self, tenant: PlatformTenant) -> PlatformTenant: ...

app/repositories/interfaces/application.py:
  class IApplicationRepository(Protocol):
      async def get_by_id(self, app_id: UUID) -> PlatformApplication | None: ...
      async def get_by_code(self, code: str) -> PlatformApplication | None: ...
      async def save(self, app: PlatformApplication) -> PlatformApplication: ...

app/repositories/interfaces/refresh_token.py:
  class IRefreshTokenRepository(Protocol):
      async def get_family_by_token_hash(self, token_hash: str) -> PlatformRefreshTokenFamily | None: ...
      async def save_family(self, family: PlatformRefreshTokenFamily, tokens: list[PlatformRefreshToken]) -> None: ...
      async def revoke_family(self, family_id: UUID) -> None: ...

Step 2 — Create fake implementations in tests/fakes/:
  tests/fakes/fake_user_repo.py — dict-backed, stores {UUID: PlatformUser}
  tests/fakes/fake_tenant_repo.py — dict-backed
  tests/fakes/fake_app_repo.py — dict-backed
  tests/fakes/fake_refresh_token_repo.py — dict-backed

Step 3 — Write tests in tests/unit/test_platform_repositories.py:
  test_fake_user_repo_save_and_get_by_email
  test_fake_user_repo_returns_none_for_missing
  test_fake_tenant_repo_save_and_get_by_slug
  test_fake_app_repo_save_and_get_by_code

Run: pytest tests/unit/test_platform_repositories.py -v
Commit message: feat(wbs-2.3): add repository interfaces and fake implementations`,
        },
        {
          id: "2.3-B", model: "Sonnet 4.6",
          title: "Implement SQLAlchemy repositories",
          commitMsg: "feat(wbs-2.3): implement SQLAlchemy platform repositories",
          pytest: "pytest tests/unit/test_platform_repositories.py tests/integration/test_platform_repos.py -v",
          prompt: `Task WBS 2.3-B: Implement SQLAlchemy concrete repository classes.

Create:
  app/repositories/platform_user_repository.py — SqlAlchemyUserRepository(IUserRepository)
  app/repositories/platform_tenant_repository.py — SqlAlchemyTenantRepository(ITenantRepository)
  app/repositories/platform_app_repository.py — SqlAlchemyApplicationRepository(IApplicationRepository)
  app/repositories/refresh_token_repository.py — SqlAlchemyRefreshTokenRepository(IRefreshTokenRepository)

Each class:
  - Takes session: AsyncSession in __init__
  - Uses session.execute(select(...).where(...)) for reads
  - Uses session.merge(entity) + await session.flush() for writes
  - No session.commit() — commit handled by request lifecycle in DI container

Update app/core/container.py to wire all 4 repositories:
  user_repository = providers.Factory(SqlAlchemyUserRepository, session=db_session)
  tenant_repository = providers.Factory(SqlAlchemyTenantRepository, session=db_session)
  application_repository = providers.Factory(SqlAlchemyApplicationRepository, session=db_session)
  refresh_token_repository = providers.Factory(SqlAlchemyRefreshTokenRepository, session=db_session)

Add 1 integration test in tests/integration/test_platform_repos.py:
  @pytest.mark.integration
  test_sqlalchemy_user_repo_save_and_retrieve:
    create SqlAlchemyUserRepository with real async_session
    save a PlatformUser, query by email, assert email matches

Run: pytest tests/unit/test_platform_repositories.py tests/integration/test_platform_repos.py -v
Commit message: feat(wbs-2.3): implement SQLAlchemy platform repositories`,
        },
      ],
    },
    "2.4": {
      title: "Seed platform admin and baseline data",
      priority: "P1", hours: 1.5, day: 2,
      story: "As a developer, I want seed data so I can log in immediately after migration and run smoke tests.",
      description: "Create scripts/seed.py. Creates PLATFORM_APPLICATION, SUPER_ADMIN user, APP_ADMIN user, PLATFORM_USER_APPLICATION link. All values from .env (seed credentials). Idempotent.",
      acceptance: [
        "Running python scripts/seed.py twice does not create duplicate records.",
        "SUPER_ADMIN and APP_ADMIN users exist with correct user_scope.",
        "APP_ADMIN is linked to the default application with application_role=OWNER.",
        "PLATFORM_APPLICATION.api_key and api_secret printed to stdout once on first run only.",
      ],
      commits: [
        {
          id: "2.4-A", model: "Sonnet 4.6",
          title: "Create seed script with idempotency",
          commitMsg: "feat(wbs-2.4): add seed script for platform admin",
          pytest: "pytest tests/integration/test_seed.py -v --run-integration",
          prompt: `Task WBS 2.4-A: Create scripts/seed.py for baseline platform data.

The seed script must:
1. Create PlatformApplication (idempotent: skip if code already exists):
   code = settings.SEED_APPLICATION_CODE ("ait360"), management_mode = "AIT_MANAGED"
   Generate api_key = str(uuid4()), api_secret = str(uuid4())
   Store api_secret_hash = bcrypt.hashpw(api_secret.encode(), bcrypt.gensalt()).decode()
   Print api_key and api_secret to stdout (once, on creation only)

2. Create SUPER_ADMIN user (idempotent: skip if email exists):
   email = settings.SEED_SUPER_ADMIN_EMAIL
   password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
   user_scope = UserScope.SUPER_ADMIN, is_active = True, email_confirmed = True

3. Create APP_ADMIN user (idempotent: skip if email exists):
   email = settings.SEED_APP_ADMIN_EMAIL, user_scope = UserScope.APP_ADMIN
   is_active = True, email_confirmed = True

4. Create PlatformUserApplication link (APP_ADMIN → default application, OWNER role):
   idempotent: skip if link already exists

Write integration tests in tests/integration/test_seed.py:
  @pytest.mark.integration
  test_seed_idempotent:
    run seed twice, count PLATFORM_APPLICATION rows == 1, PLATFORM_USER rows == 2

  @pytest.mark.integration
  test_seed_creates_app_admin_link:
    run seed, assert PLATFORM_USER_APPLICATION row with application_role=OWNER

Run: pytest tests/integration/test_seed.py -v --run-integration
Commit message: feat(wbs-2.4): add seed script for platform admin`,
        },
      ],
    },
    "3.1": {
      title: "Tenant schema template (RBAC tables + seed)",
      priority: "P0", hours: 2.0, day: 3,
      story: "As a developer, I want a tenant schema template so every provisioned tenant starts with an identical RBAC structure and base data.",
      description: "Create alembic/tenant_template/env.py and alembic/tenant_template/versions/001_tenant_schema.py. Create app/services/tenancy/migration_runner.py with run_tenant_migration(schema_name, engine) and seed_tenant_schema(schema_name, session).",
      acceptance: [
        "Template creates all 8 TENANT_* tables in the specified schema.",
        "seed_tenant_schema() inserts 3 system roles: Admin, Member, Viewer (is_system_role=True).",
        "seed_tenant_schema() inserts base permissions: tenant.users.read/write, tenant.roles.read/write, tenant.groups.read/write.",
        "Re-running run_tenant_migration on same schema does not fail or duplicate.",
        "Works on PostgreSQL via SET search_path.",
      ],
      commits: [
        {
          id: "3.1-A", model: "Sonnet 4.6",
          title: "Write failing template integration tests",
          commitMsg: "test(wbs-3.1): add failing tenant template integration tests",
          pytest: "pytest tests/integration/test_tenant_template.py -v --run-integration  (expect FAIL)",
          prompt: `Task WBS 3.1-A: Write failing integration tests for the tenant schema template.
Tests must FAIL now — no template implementation exists yet.

Create tests/integration/test_tenant_template.py:

@pytest.mark.integration
async def test_tenant_template_creates_all_tables(async_engine):
    schema = "test_schema_template"
    await run_tenant_migration(schema, async_engine)
    async with async_engine.connect() as conn:
        await conn.execute(text(f"SET search_path TO {schema}"))
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = :schema"
        ), {"schema": schema})
        tables = {row[0] for row in result}
    expected = {
        "tenant_role", "tenant_group", "tenant_permission_def",
        "tenant_role_group", "tenant_group_permission", "tenant_user_role",
        "tenant_audit_log", "tenant_access_log"
    }
    assert expected == tables

@pytest.mark.integration
async def test_tenant_template_seeds_system_roles(async_session, async_engine):
    schema = "test_schema_seed"
    await run_tenant_migration(schema, async_engine)
    async with async_engine.connect() as conn:
        await conn.execute(text(f"SET search_path TO {schema}"))
        result = await conn.execute(text("SELECT name FROM tenant_role WHERE is_system_role = true"))
        roles = {row[0] for row in result}
    assert roles == {"Admin", "Member", "Viewer"}

@pytest.mark.integration
async def test_tenant_template_idempotent(async_engine):
    schema = "test_schema_idem"
    await run_tenant_migration(schema, async_engine)
    await run_tenant_migration(schema, async_engine)  # run twice
    async with async_engine.connect() as conn:
        await conn.execute(text(f"SET search_path TO {schema}"))
        result = await conn.execute(text("SELECT count(*) FROM tenant_role"))
        count = result.scalar()
    assert count == 3  # not 6

Import: from app.services.tenancy.migration_runner import run_tenant_migration

Run: pytest tests/integration/test_tenant_template.py -v --run-integration (expect FAIL)
Commit message: test(wbs-3.1): add failing tenant template integration tests`,
        },
        {
          id: "3.1-B", model: "Sonnet 4.6",
          title: "Implement tenant schema template and migration runner",
          commitMsg: "feat(wbs-3.1): implement tenant schema template and migration runner",
          pytest: "pytest tests/integration/test_tenant_template.py -v --run-integration",
          prompt: `Task WBS 3.1-B: Implement the tenant schema template and migration runner.

Step 1: Create app/models/tenant_models.py with 8 tenant ORM models:
  TenantRole: id UUID PK, name String(100) NOT NULL, normalized_name String(100) UNIQUE NOT NULL,
              description String(500), is_system_role Boolean DEFAULT False, created_at DateTime
  TenantGroup: id UUID PK, name String(100) NOT NULL, code String(100) UNIQUE NOT NULL,
               description String(500), is_system_group Boolean DEFAULT False, created_at DateTime
  TenantPermissionDef: id UUID PK, permission_code String(100) UNIQUE NOT NULL,
                       description String(500), is_system_permission Boolean DEFAULT False, created_at DateTime
  TenantRoleGroup: id UUID PK, role_id FK→tenant_role.id, group_id FK→tenant_group.id, created_at
                   UniqueConstraint("role_id", "group_id")
  TenantGroupPermission: id UUID PK, group_id FK, permission_id FK, created_at
                         UniqueConstraint("group_id", "permission_id")
  TenantUserRole: id UUID PK, platform_user_id UUID NOT NULL (no FK — cross-schema),
                  role_id FK→tenant_role.id, created_at
                  UniqueConstraint("platform_user_id", "role_id")
  TenantAuditLog: id UUID PK, platform_user_id UUID, action_type String(50),
                  entity_type String(100), entity_id UUID, changed_data JSON, ip_address String(45), created_at DateTime
  TenantAccessLog: id UUID PK, platform_user_id UUID, method String(10),
                   path String(500), status_code Integer, duration_ms Integer, created_at DateTime

Step 2: Create alembic/tenant_template/env.py and alembic/tenant_template/versions/001_tenant_schema.py
  Template migration creates all 8 tables using op.create_table() with schema parameter.

Step 3: Create app/services/tenancy/migration_runner.py:
  async def run_tenant_migration(schema_name: str, engine: AsyncEngine) -> None:
      # 1. CREATE SCHEMA IF NOT EXISTS schema_name
      # 2. Run alembic tenant template migrations against schema_name
      # 3. Call seed_tenant_schema(schema_name, engine)

  async def seed_tenant_schema(schema_name: str, engine: AsyncEngine) -> None:
      # INSERT system roles: Admin, Member, Viewer (is_system_role=True, idempotent)
      # INSERT base permissions (6 permission codes)
      # Use: INSERT ... ON CONFLICT DO NOTHING

Run: pytest tests/integration/test_tenant_template.py -v --run-integration (expect PASS)
Commit message: feat(wbs-3.1): implement tenant schema template and migration runner`,
        },
      ],
    },
    "3.2": {
      title: "Schema manager implementations",
      priority: "P0", hours: 1.5, day: 3,
      story: "As a developer, I want schema managers so all database queries within a request are automatically routed to the correct tenant schema.",
      description: "Create app/core/database/schema_manager.py with ISchemaManager Protocol, PostgreSQLSchemaManager, and MSSQLSchemaManager. Extend DatabaseFactory to expose create_schema_manager(db_provider). Integrate with TenantMiddleware.",
      acceptance: [
        "PostgreSQLSchemaManager.set_schema() executes SET search_path TO {schema_name}, public.",
        "MSSQLSchemaManager.set_schema() stores schema in session.info and uses before_cursor_execute event.",
        "Writing to tenant A's schema and reading from tenant B session does NOT return tenant A's data.",
        "DatabaseFactory.create_schema_manager(\"postgresql\") returns PostgreSQLSchemaManager.",
      ],
      commits: [
        {
          id: "3.2-A", model: "Sonnet 4.6",
          title: "Implement schema managers and tests",
          commitMsg: "feat(wbs-3.2): implement PostgreSQL and MSSQL schema managers",
          pytest: "pytest tests/unit/test_schema_manager.py tests/integration/test_schema_manager.py -v",
          prompt: `Task WBS 3.2-A: Implement PostgreSQL and MSSQL schema managers.

Create app/core/database/schema_manager.py:

  class ISchemaManager(Protocol):
      async def set_schema(self, session: AsyncSession, schema_name: str) -> None: ...

  class PostgreSQLSchemaManager:
      async def set_schema(self, session: AsyncSession, schema_name: str) -> None:
          if not re.match(r'^[a-z][a-z0-9_]{0,62}$', schema_name):
              raise ValueError(f"Invalid schema_name: {schema_name}")
          await session.execute(text(f"SET search_path TO {schema_name}, public"))

  class MSSQLSchemaManager:
      async def set_schema(self, session: AsyncSession, schema_name: str) -> None:
          if not re.match(r'^[a-z][a-z0-9_]{0,62}$', schema_name):
              raise ValueError(f"Invalid schema_name: {schema_name}")
          session.sync_session.info["schema_name"] = schema_name

Extend app/core/database/provider.py:
  DatabaseFactory.create_schema_manager(db_provider: str) -> ISchemaManager:
      if db_provider == "postgresql": return PostgreSQLSchemaManager()
      if db_provider == "mssql": return MSSQLSchemaManager()
      raise ValueError(f"Unsupported DB_PROVIDER: {db_provider}")

Write unit tests in tests/unit/test_schema_manager.py:
  test_create_schema_manager_postgresql_returns_correct_type
  test_create_schema_manager_mssql_returns_correct_type
  test_postgres_schema_manager_rejects_invalid_schema_name (assert ValueError for "bad name", "../exploit")
  test_postgres_schema_manager_accepts_valid_schema_name ("ait360_fakir_group")

Write integration test in tests/integration/test_schema_manager.py:
  @pytest.mark.integration
  test_postgres_schema_manager_routes_to_correct_schema:
    provision two schemas A and B, write to A, read from B session, assert not found

Run: pytest tests/unit/test_schema_manager.py tests/integration/test_schema_manager.py -v
Commit message: feat(wbs-3.2): implement PostgreSQL and MSSQL schema managers`,
        },
      ],
    },
    "3.3": {
      title: "Tenant provisioning: create, migrate, seed",
      priority: "P0", hours: 2.5, day: 6,
      story: "As an APP_ADMIN, I want to provision a new tenant in one request so their schema is created, migrated, seeded, and usable immediately.",
      description: "Create services/tenancy/commands.py (ProvisionTenantCommand) and handlers.py (ProvisionTenantHandler). Create POST /api/v1/tenancy/tenants endpoint. schema_name always derived inside handler, never from request body.",
      acceptance: [
        "schema_name always derived inside handler, never from request body.",
        "organisation_slug derived from organisation_name by handler using regex normalisation.",
        "Entire provisioning (INSERT + CREATE SCHEMA + migrate + seed) is a single atomic transaction.",
        "Duplicate (application_id, organisation_slug) returns 409 CONFLICT with code TENANT_ALREADY_EXISTS.",
        "Provisioning failure rolls back PLATFORM_TENANT insert.",
        "Route requires APP_ADMIN scope.",
      ],
      commits: [
        {
          id: "3.3-A", model: "Sonnet 4.6",
          title: "Write failing provisioning tests",
          commitMsg: "test(wbs-3.3): add failing tenant provisioning tests",
          pytest: "pytest tests/integration/test_tenant_provision.py tests/api/test_tenancy.py -v  (expect FAIL)",
          prompt: `Task WBS 3.3-A: Write failing integration and API tests for tenant provisioning.

Create tests/integration/test_tenant_provision.py:

  @pytest.mark.integration
  test_provision_creates_schema_and_seeds_roles:
    cmd = ProvisionTenantCommand(organisation_name="Fakir Group", application_id=..., initial_user_id=None)
    result = await handler.handle(cmd)
    assert result.schema_name == "ait360_fakir_group"
    # verify schema exists and has 3 system roles

  @pytest.mark.integration
  test_provision_duplicate_slug_raises_conflict:
    provision "Fakir Group" twice
    second call raises ConflictError with code="TENANT_ALREADY_EXISTS"

  @pytest.mark.integration
  test_provision_rollback_on_migration_failure:
    mock run_tenant_migration to raise RuntimeError
    call handler, assert no PLATFORM_TENANT row for that slug

Create tests/api/test_tenancy.py:
  @pytest.mark.api
  test_provision_tenant_api_returns_201:
    POST /api/v1/tenancy/tenants with body {"organisation_name": "Fakir Group"}
    APP_ADMIN JWT in Authorization header
    assert status == 201 and response.json()["schema_name"] == "ait360_fakir_group"

  @pytest.mark.api
  test_provision_tenant_requires_app_admin:
    same POST but with SUPER_ADMIN JWT
    assert status == 403

Run: pytest tests/integration/test_tenant_provision.py tests/api/test_tenancy.py -v (expect ALL FAIL)
Commit message: test(wbs-3.3): add failing tenant provisioning tests`,
        },
        {
          id: "3.3-B", model: "Sonnet 4.6",
          title: "Implement ProvisionTenantCommand and ProvisionTenantHandler",
          commitMsg: "feat(wbs-3.3): implement ProvisionTenantHandler and POST /tenancy/tenants",
          pytest: "pytest tests/integration/test_tenant_provision.py tests/api/test_tenancy.py -v",
          prompt: `Task WBS 3.3-B: Implement ProvisionTenantHandler to pass all provisioning tests.

Create app/services/tenancy/commands.py:
  @dataclass(frozen=True)
  class ProvisionTenantCommand:
      organisation_name: str
      application_id: UUID
      initial_user_id: UUID | None = None

Create app/services/tenancy/exceptions.py:
  class TenantAlreadyExistsError(Exception):
      def __init__(self, slug: str): self.slug = slug

Create app/services/tenancy/handlers.py:
  class ProvisionTenantHandler:
      async def handle(self, cmd: ProvisionTenantCommand) -> TenantResponse:
          # 1. Load application by id
          # 2. Derive organisation_slug: re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
          # 3. Check duplicate → TenantAlreadyExistsError if slug exists
          # 4. Derive schema_name: f"{app.code.lower()}_{slug.replace('-', '_')}"
          # 5. Atomic transaction:
          async with self._session.begin():
              # a. INSERT PLATFORM_TENANT (status=ACTIVE, schema_version="0")
              # b. CREATE SCHEMA IF NOT EXISTS schema_name
              # c. run_tenant_migration(schema_name, engine)
              # d. optional: map initial user to Admin role
          return TenantResponse(tenant_id=..., schema_name=..., organisation_slug=..., status="ACTIVE", ...)

Add POST /api/v1/tenancy/tenants to app/api/endpoints/v1/tenancy.py:
  @router.post("/tenants", response_model=TenantResponse, status_code=201)
  async def provision_tenant(
      body: ProvisionTenantRequest,
      auth: AuthContext = require_scope(UserScope.APP_ADMIN),
      handler: ProvisionTenantHandler = Depends(get_provision_handler),
  ):
      cmd = ProvisionTenantCommand(
          organisation_name=body.organisation_name,
          application_id=auth.application_id,
          initial_user_id=body.initial_user_id,
      )
      try:
          return await handler.handle(cmd)
      except TenantAlreadyExistsError:
          raise HTTPException(409, {"code": "TENANT_ALREADY_EXISTS"})

Wire ProvisionTenantHandler in container.py.

Run: pytest tests/integration/test_tenant_provision.py tests/api/test_tenancy.py -v (ALL PASS)
Commit message: feat(wbs-3.3): implement ProvisionTenantHandler and POST /tenancy/tenants`,
        },
      ],
    },
    "3.4": {
      title: "Tenant lifecycle endpoints",
      priority: "P1", hours: 1.5, day: 7,
      story: "As an APP_ADMIN, I want to list, get, suspend, and reactivate tenants so I can manage tenant access.",
      description: "Add list, get, suspend, reactivate endpoints to api/endpoints/v1/tenancy.py. List scoped to application_id from JWT. Suspension clears the tenant Redis cache entry.",
      acceptance: [
        "GET /api/v1/tenancy/tenants returns only tenants for the caller's application. SUPER_ADMIN sees all.",
        "PATCH /api/v1/tenancy/tenants/{tenant_id}/suspend sets status=SUSPENDED, DEL tenant:{slug} from Redis.",
        "POST /api/v1/tenancy/tenants/{tenant_id}/reactivate sets status=ACTIVE.",
        "Cannot suspend an already SUSPENDED tenant → 422.",
        "After suspension, request with tenant slug returns 403 within 60s (cache TTL).",
      ],
      commits: [{ id: "3.4-A", model: "Sonnet 4.6", title: "Implement lifecycle endpoints and tests", commitMsg: "feat(wbs-3.4): add tenant lifecycle endpoints", pytest: "pytest tests/api/test_tenancy.py -v", prompt: "See Backlog v2.0 WBS 3.4 for full acceptance criteria.\n\nImplement GET /tenancy/tenants, GET /tenancy/tenants/{id}, PATCH /{id}/suspend, POST /{id}/reactivate.\nSuspend clears Redis cache key tenant:{slug}.\nAll routes require APP_ADMIN scope (SUPER_ADMIN sees all tenants).\nWrite API tests covering scope isolation, cache invalidation, and lifecycle transitions." }],
    },
    "4.1": {
      title: "TenantMiddleware + Redis cache",
      priority: "P0", hours: 2.0, day: 3,
      story: "As the system, I want slug-based tenant routing so every request is automatically scoped to the correct schema.",
      description: "Create app/core/middleware/tenant.py with TenantMiddleware. Resolves X-Tenant-Slug header → (tenant_id, schema_name, application_id) via Redis cache (60s TTL) with DB fallback. Sets request.state.tenant_context.",
      acceptance: [
        "Cache hit: no DB query, request.state.tenant_context set in < 2ms.",
        "Cache miss: DB query, result cached for exactly 60s.",
        "Unknown slug → 400 {\"code\": \"UNKNOWN_TENANT_SLUG\"}.",
        "SUSPENDED tenant → 403 {\"code\": \"TENANT_SUSPENDED\"}.",
        "Missing header on protected route → 400 {\"code\": \"MISSING_TENANT_HEADER\"}.",
        "Health endpoint does NOT require X-Tenant-Slug.",
      ],
      commits: [
        {
          id: "4.1-A", model: "Sonnet 4.6",
          title: "Write failing middleware tests",
          commitMsg: "test(wbs-4.1): add failing tenant middleware tests",
          pytest: "pytest tests/unit/test_tenant_middleware.py -v  (expect ALL FAIL)",
          prompt: `Task WBS 4.1-A: Write failing unit tests for TenantMiddleware.

Create tests/unit/test_tenant_middleware.py.
Use fakeredis.FakeRedis() for Redis and FakeTenantRepository for tenant lookups.
Use FastAPI TestClient with a minimal test app that includes TenantMiddleware.

Tests:
  test_tenant_middleware_cache_hit_skips_db_call:
    prime Redis with tenant context for slug "my-org", make 2 requests with X-Tenant-Slug: my-org
    assert fake tenant repo get_by_slug called 0 times (cache hit both times)

  test_tenant_middleware_cache_miss_loads_from_db:
    empty Redis cache, make 1 request with X-Tenant-Slug: my-org
    assert fake tenant repo get_by_slug called 1 time

  test_tenant_middleware_unknown_slug_returns_400:
    empty cache, fake repo returns None for "unknown"
    GET / with X-Tenant-Slug: unknown
    assert status_code == 400 and response.json()["code"] == "UNKNOWN_TENANT_SLUG"

  test_tenant_middleware_suspended_tenant_returns_403:
    tenant status = SUSPENDED in fake repo
    GET / with X-Tenant-Slug: suspended-org
    assert status_code == 403 and response.json()["code"] == "TENANT_SUSPENDED"

  test_tenant_middleware_sets_request_state:
    valid tenant, inside handler read request.state.tenant_context.schema_name
    assert schema_name == expected derived value

  test_health_endpoint_does_not_require_slug:
    GET /api/v1/health with no X-Tenant-Slug header
    assert status_code == 200

Run: pytest tests/unit/test_tenant_middleware.py -v (expect ALL FAIL)
Commit message: test(wbs-4.1): add failing tenant middleware tests`,
        },
        {
          id: "4.1-B", model: "Sonnet 4.6",
          title: "Implement TenantMiddleware",
          commitMsg: "feat(wbs-4.1): implement TenantMiddleware with Redis cache",
          pytest: "pytest tests/unit/test_tenant_middleware.py -v",
          prompt: `Task WBS 4.1-B: Implement TenantMiddleware to pass all tests from 4.1-A.

Create app/core/middleware/tenant.py:

class TenantContext:
    tenant_id: UUID
    schema_name: str
    application_id: UUID
    organisation_slug: str
    status: str

class TenantMiddleware(BaseHTTPMiddleware):
    EXCLUDED_PATHS = {"/api/v1/health", "/api/v1/auth/login",
                      "/api/v1/auth/refresh", "/api/v1/auth/logout", "/docs", "/openapi.json"}

    def __init__(self, app, tenant_repo: ITenantRepository, redis: Redis,
                 cache_ttl: int = 60, schema_manager: ISchemaManager = None):
        super().__init__(app)
        # store deps

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        slug = request.headers.get("X-Tenant-Slug")
        if not slug:
            return JSONResponse({"code": "MISSING_TENANT_HEADER"}, status_code=400)

        # 1. Try Redis cache
        cache_key = f"tenant:{slug}"
        cached = await self._redis.get(cache_key)
        if cached:
            ctx = TenantContext(**json.loads(cached))
        else:
            # 2. DB fallback
            tenant = await self._tenant_repo.get_by_slug(slug)
            if tenant is None:
                return JSONResponse({"code": "UNKNOWN_TENANT_SLUG"}, status_code=400)
            ctx = TenantContext(tenant_id=tenant.id, schema_name=tenant.schema_name,
                                application_id=tenant.application_id,
                                organisation_slug=tenant.organisation_slug, status=tenant.status.value)
            await self._redis.setex(cache_key, self._cache_ttl, json.dumps(ctx.__dict__, default=str))

        # 3. Enforce suspension
        if ctx.status == "SUSPENDED":
            return JSONResponse({"code": "TENANT_SUSPENDED"}, status_code=403)

        request.state.tenant_context = ctx
        return await call_next(request)

Register middleware in app/main.py after existing middleware.
Wire TenantMiddleware in container.py — inject tenant_repo, redis, settings.TENANT_CACHE_TTL_SECONDS.

Run: pytest tests/unit/test_tenant_middleware.py -v (expect ALL PASS)
Commit message: feat(wbs-4.1): implement TenantMiddleware with Redis cache`,
        },
      ],
    },
    "4.2": {
      title: "Structlog tenant context binding",
      priority: "P1", hours: 1.0, day: 4,
      story: "As a developer, I want tenant context bound to all log lines so every log event is traceable to a tenant.",
      description: "Extend RequestLoggingMiddleware to call structlog.contextvars.bind_contextvars(tenant_id=..., schema_name=..., request_id=...) after slug resolution.",
      acceptance: [
        "Every log line after middleware includes tenant_id, schema_name, and request_id.",
        "Log lines before slug resolution do not include tenant fields.",
        "request_id is a UUID generated per request and returned as X-Request-ID response header.",
      ],
      commits: [{ id: "4.2-A", model: "Haiku 4.5", title: "Bind tenant context to structlog", commitMsg: "feat(wbs-4.2): bind tenant context to structlog per request", pytest: "pytest tests/unit/test_logging_middleware.py -v", prompt: "Task WBS 4.2-A: Bind tenant context to structlog.\n\nExtend RequestLoggingMiddleware (or TenantMiddleware dispatch) to call:\n  structlog.contextvars.bind_contextvars(\n      tenant_id=str(ctx.tenant_id),\n      schema_name=ctx.schema_name,\n      request_id=request_id,\n  )\n\nGenerate request_id = str(uuid4()) at the start of each request.\nReturn it as X-Request-ID response header.\n\nWrite unit tests in tests/unit/test_logging_middleware.py:\n  test_log_context_includes_tenant_id\n  test_request_id_in_response_header\n\nRun: pytest tests/unit/test_logging_middleware.py -v\nCommit message: feat(wbs-4.2): bind tenant context to structlog per request" }],
    },
    "5.1": {
      title: "JwtService (HS256)",
      priority: "P0", hours: 2.0, day: 4,
      story: "As the system, I want HS256 JWT signing and verification using SECRET_KEY so tokens are secure and consistent with the boilerplate's token_service.py pattern.",
      description: "Create app/core/security/jwt_service.py with JwtService. Implement sign_token(payload, expire_minutes), verify_token(token), build_access_payload(user, context), build_refresh_payload(user). Wire in container.",
      acceptance: [
        "sign_token() signs with HS256 using settings.SECRET_KEY.",
        "verify_token() verifies HS256 signature and exp; raises on failure.",
        "build_access_payload() returns scope-correct dict per Architecture §7.1.",
        "build_refresh_payload() returns {user_id, type:\"refresh\", iat, exp}.",
        "Expired token raises jwt.ExpiredSignatureError.",
        "Tampered token raises jwt.InvalidSignatureError.",
      ],
      commits: [
        {
          id: "5.1-A", model: "Sonnet 4.6",
          title: "Write failing JwtService tests (HS256)",
          commitMsg: "test(wbs-5.1): add failing JwtService HS256 tests",
          pytest: "pytest tests/unit/test_jwt_service.py -v  (expect ALL FAIL)",
          prompt: `Task WBS 5.1-A: Write failing unit tests for JwtService (HS256). Tests must FAIL — no implementation yet.

Create tests/unit/test_jwt_service.py.
Use a fixed test secret key in the fixture — no file paths needed.

conftest fixture (add to tests/conftest.py):
  @pytest.fixture(scope="session")
  def test_secret_key() -> str:
      return "test-secret-key-minimum-32-characters-long!"

Tests:
  test_sign_and_verify_roundtrip:
    service = JwtService(secret_key="test-secret-key-minimum-32-characters-long!")
    payload = {"user_id": str(uuid4()), "user_scope": "SUPER_ADMIN", "type": "access"}
    token = service.sign_token(payload, expire_minutes=15)
    decoded = service.verify_token(token)
    assert decoded["user_id"] == payload["user_id"]
    assert decoded["user_scope"] == "SUPER_ADMIN"

  test_expired_token_raises:
    token = service.sign_token(payload, expire_minutes=-1)
    with pytest.raises(jwt.ExpiredSignatureError): service.verify_token(token)

  test_tampered_token_raises:
    token = service.sign_token(payload, expire_minutes=15)
    bad_token = token[:-5] + "XXXXX"
    with pytest.raises(Exception): service.verify_token(bad_token)

  test_build_access_payload_super_admin_has_minimal_fields:
    user = PlatformUser(id=uuid4(), email="a@b.com", user_scope=UserScope.SUPER_ADMIN, rbac_version=1)
    payload = service.build_access_payload(user, application_id=None, tenant_id=None, application_role=None)
    assert payload["user_id"] == str(user.id) and payload["type"] == "access"
    assert "tenant_id" not in payload and "application_id" not in payload

  test_build_access_payload_tenant_user_has_all_fields:
    user = PlatformUser(user_scope=UserScope.TENANT_USER, rbac_version=3, ...)
    payload = service.build_access_payload(user, application_id=app_id, tenant_id=tenant_id, ...)
    assert payload["tenant_id"] == str(tenant_id) and payload["rbac_version"] == 3

  test_build_refresh_payload_has_type_refresh:
    payload = service.build_refresh_payload(user)
    assert payload["type"] == "refresh" and "user_scope" not in payload

Run: pytest tests/unit/test_jwt_service.py -v (expect ALL FAIL)
Commit message: test(wbs-5.1): add failing JwtService HS256 tests`,
        },
        {
          id: "5.1-B", model: "Sonnet 4.6",
          title: "Implement JwtService (HS256)",
          commitMsg: "feat(wbs-5.1): implement JwtService HS256 with scope-aware payload builders",
          pytest: "pytest tests/unit/test_jwt_service.py -v",
          prompt: `Task WBS 5.1-B: Implement JwtService (HS256) to pass all tests from 5.1-A.

Create app/core/security/jwt_service.py:

class JwtService:
    """HS256 JWT service. Extends boilerplate TokenService with multi-scope payload building."""

    def __init__(self, secret_key: str) -> None:
        if len(secret_key) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        self._secret_key = secret_key

    def sign_token(self, payload: dict, expire_minutes: int) -> str:
        now = datetime.utcnow()
        data = {**payload, "iat": now, "exp": now + timedelta(minutes=expire_minutes)}
        return jwt.encode(data, self._secret_key, algorithm="HS256")

    def verify_token(self, token: str) -> dict:
        return jwt.decode(token, self._secret_key, algorithms=["HS256"])

    def build_access_payload(self, user, application_id=None, tenant_id=None, application_role=None) -> dict:
        base = {"user_id": str(user.id), "email": user.email, "user_scope": user.user_scope.value, "type": "access"}
        if user.user_scope == UserScope.APP_ADMIN:
            base["application_id"] = str(application_id)
            base["application_role"] = application_role
        elif user.user_scope == UserScope.TENANT_USER:
            base["application_id"] = str(application_id)
            base["tenant_id"] = str(tenant_id)
            base["rbac_version"] = user.rbac_version
        return base

    def build_refresh_payload(self, user) -> dict:
        return {"user_id": str(user.id), "type": "refresh"}

Wire in container.py:
  jwt_service = providers.Singleton(JwtService, secret_key=config.SECRET_KEY)

Create app/api/endpoints/v1/auth.py (no JWKS endpoint — HS256 is symmetric):
  router = APIRouter(prefix="/auth", tags=["auth"])

Add auth router to app/api/endpoints/v1/__init__.py and register in main router.

Run: pytest tests/unit/test_jwt_service.py -v (ALL PASS)
Commit message: feat(wbs-5.1): implement JwtService HS256 with scope-aware payload builders`,
        },
      ],
    },
    "5.2": {
      title: "Login handler (three scopes)",
      priority: "P0", hours: 2.0, day: 4,
      story: "As a user, I want to log in and receive a JWT shaped correctly for my scope so I can access the right APIs.",
      description: "Create services/auth/commands.py (LoginCommand) and implement LoginHandler in services/auth/handlers.py. Create POST /api/v1/auth/login. Wire in container. Handler dispatches scope-aware JWT building.",
      acceptance: [
        "SUPER_ADMIN login: JWT payload contains only {user_id, user_scope, iat, exp}.",
        "APP_ADMIN login: JWT contains {user_id, user_scope, application_id, application_role, iat, exp}.",
        "TENANT_USER login: JWT contains {user_id, user_scope, application_id, tenant_id, rbac_version, iat, exp}.",
        "Wrong password → 401 {\"code\": \"INVALID_CREDENTIALS\"}. No field disclosure.",
        "Returns {access_token, refresh_token, token_type: \"Bearer\", expires_in}.",
      ],
      commits: [
        {
          id: "5.2-A", model: "Sonnet 4.6",
          title: "Write failing login handler tests",
          commitMsg: "test(wbs-5.2): add failing login handler unit tests",
          pytest: "pytest tests/unit/test_login_handler.py -v  (expect ALL FAIL)",
          prompt: `Task WBS 5.2-A: Write failing unit tests for LoginHandler. Tests FAIL — no handler yet.

Create tests/unit/test_login_handler.py.
Use FakeUserRepository, FakeTenantRepository, FakeApplicationRepository, fakeredis.
Helper: build a PlatformUser with bcrypt-hashed password and the given scope.

Tests:
  test_super_admin_login_jwt_has_only_minimal_claims:
    user = PlatformUser(user_scope=SUPER_ADMIN, is_active=True, email_confirmed=True, ...)
    cmd = LoginCommand(email=user.email, password="secret")
    result = await handler.handle(cmd)
    decoded = jwt_service.verify_token(result.access_token)
    assert "tenant_id" not in decoded and "application_id" not in decoded
    assert decoded["user_scope"] == "SUPER_ADMIN"

  test_app_admin_login_jwt_has_application_id_and_role:
    cmd = LoginCommand(email=..., password=..., application_code="ait360")
    decoded = jwt_service.verify_token(result.access_token)
    assert "application_id" in decoded and decoded["application_role"] == "OWNER"
    assert "tenant_id" not in decoded

  test_tenant_user_login_jwt_has_tenant_id_and_rbac_version:
    cmd = LoginCommand(email=..., password=..., application_code="ait360", tenant_slug="my-org")
    decoded = jwt_service.verify_token(result.access_token)
    assert decoded["tenant_id"] == str(tenant.id) and decoded["rbac_version"] == 3

  test_login_wrong_password_raises_invalid_credentials:
    cmd = LoginCommand(email=..., password="WRONG")
    with pytest.raises(InvalidCredentialsError): await handler.handle(cmd)

  test_login_inactive_user_raises_account_inactive:
    user = PlatformUser(is_active=False, ...)
    with pytest.raises(AccountInactiveError): await handler.handle(cmd)

  test_tenant_user_login_without_tenant_slug_raises:
    user = PlatformUser(user_scope=TENANT_USER, ...)
    cmd = LoginCommand(email=..., password=..., application_code="ait360", tenant_slug=None)
    with pytest.raises(ValueError): await handler.handle(cmd)

Run: pytest tests/unit/test_login_handler.py -v (expect ALL FAIL)
Commit message: test(wbs-5.2): add failing login handler unit tests`,
        },
        {
          id: "5.2-B", model: "Sonnet 4.6",
          title: "Implement LoginCommand, LoginHandler, and POST /auth/login",
          commitMsg: "feat(wbs-5.2): implement LoginHandler and POST /auth/login",
          pytest: "pytest tests/unit/test_login_handler.py tests/api/test_auth_login.py -v",
          prompt: `Task WBS 5.2-B: Implement LoginCommand, LoginHandler, and POST /api/v1/auth/login.

Create app/services/auth/commands.py:
  @dataclass(frozen=True)
  class LoginCommand:
      email: str
      password: str
      application_code: str | None = None
      tenant_slug: str | None = None

Create app/services/auth/exceptions.py:
  class InvalidCredentialsError(Exception): pass
  class AccountInactiveError(Exception): pass
  class AccountLockedError(Exception): pass
  class RateLimitedError(Exception):
      def __init__(self, retry_after_seconds: int): ...

Create app/services/auth/handlers.py (LoginHandler):
  async def handle(self, cmd: LoginCommand) -> TokenResponse:
      # 1. Load user by email → InvalidCredentialsError if None
      # 2. Check is_active → AccountInactiveError if False
      # 3. Check is_locked() → AccountLockedError if True
      # 4. Verify password → InvalidCredentialsError if fails (also increment_failed_attempts)
      # 5. Clear lockout on success
      # 6. Build JWT payload based on user_scope (dispatch to jwt_service.build_access_payload)
      # 7. sign_token(payload, expire=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
      # 8. Create refresh token family + first token (SHA-256 hash of uuid4())
      # 9. Save family + token via refresh_token_repo
      # 10. Return TokenResponse(access_token, refresh_token (raw uuid), token_type="Bearer", expires_in)

Add POST /auth/login to app/api/endpoints/v1/auth.py:
  @router.post("/login", response_model=TokenResponse)
  async def login(body: LoginRequest, handler=Depends(get_login_handler)):
      try: return await handler.handle(LoginCommand(**body.model_dump()))
      except InvalidCredentialsError: raise HTTPException(401, {"code": "INVALID_CREDENTIALS"})
      except AccountInactiveError: raise HTTPException(403, {"code": "ACCOUNT_INACTIVE"})
      except AccountLockedError: raise HTTPException(423, {"code": "ACCOUNT_LOCKED"})

Wire LoginHandler in container.py.

Run: pytest tests/unit/test_login_handler.py tests/api/test_auth_login.py -v (ALL PASS)
Commit message: feat(wbs-5.2): implement LoginHandler and POST /auth/login`,
        },
      ],
    },
    "5.3": {
      title: "JWTBearer middleware (tenant match + rbac_version)",
      priority: "P0", hours: 2.0, day: 5,
      story: "As the system, I want every authenticated request validated for token integrity, tenant match, and rbac_version freshness.",
      description: "Create app/api/dependencies/auth.py with JWTBearer, get_current_user, and require_scope(scope: UserScope). Implement the 5-step validation sequence from Architecture §8.3.",
      acceptance: [
        "Missing Authorization header → 401.",
        "Invalid HS256 signature → 401 {\"code\": \"INVALID_TOKEN\"}.",
        "Expired token → 401 {\"code\": \"TOKEN_EXPIRED\"}.",
        "TENANT_USER token with tenant_id ≠ request.state.tenant_context.tenant_id → 403 {\"code\": \"CROSS_TENANT_REPLAY\"}.",
        "TENANT_USER token with stale rbac_version → 401 {\"code\": \"RBAC_VERSION_MISMATCH\"}.",
        "require_scope(SUPER_ADMIN) rejects APP_ADMIN and TENANT_USER tokens → 403.",
      ],
      commits: [
        {
          id: "5.3-A", model: "Sonnet 4.6",
          title: "Write failing JWTBearer tests",
          commitMsg: "test(wbs-5.3): add failing JWTBearer tests",
          pytest: "pytest tests/api/test_jwt_bearer.py -v  (expect ALL FAIL)",
          prompt: `Task WBS 5.3-A: Write failing API tests for JWTBearer. Tests must FAIL — no bearer dep yet.

Create tests/api/test_jwt_bearer.py.
Add a protected test endpoint to the test app: GET /api/v1/test/protected → 200 {"ok": true}
Requires JWTBearer dependency.

Tests:
  test_missing_authorization_header_returns_401
  test_invalid_token_returns_401_invalid_token:
    Authorization: Bearer JUNK_TOKEN → assert status == 401, body["code"] == "INVALID_TOKEN"

  test_expired_token_returns_401_token_expired:
    sign token with exp = past → assert status == 401, body["code"] == "TOKEN_EXPIRED"

  test_cross_tenant_replay_returns_403:
    TENANT_USER JWT with tenant_id = "tenant-A", request X-Tenant-Slug resolves to "tenant-B"
    assert status == 403, body["code"] == "CROSS_TENANT_REPLAY"

  test_stale_rbac_version_returns_401_mismatch:
    JWT has rbac_version=1, PLATFORM_USER.rbac_version=2 in DB
    assert status == 401, body["code"] == "RBAC_VERSION_MISMATCH"

  test_valid_token_passes: valid current token, correct tenant → assert status == 200

  test_require_scope_wrong_scope_returns_403:
    endpoint protected by require_scope(SUPER_ADMIN), APP_ADMIN JWT → 403

Run: pytest tests/api/test_jwt_bearer.py -v (expect ALL FAIL)
Commit message: test(wbs-5.3): add failing JWTBearer tests`,
        },
        {
          id: "5.3-B", model: "Sonnet 4.6",
          title: "Implement JWTBearer and require_scope",
          commitMsg: "feat(wbs-5.3): implement JWTBearer dependency and require_scope",
          pytest: "pytest tests/api/test_jwt_bearer.py -v",
          prompt: `Task WBS 5.3-B: Implement JWTBearer dependency and require_scope factory.

Create app/api/dependencies/auth.py:

class AuthContext:
    user_id: UUID
    user_scope: UserScope
    application_id: UUID | None
    tenant_id: UUID | None
    rbac_version: int | None

class JWTBearer:
    async def __call__(self, request: Request) -> AuthContext:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(401, {"code": "MISSING_AUTH_HEADER"})
        token = auth_header.split(" ", 1)[1]

        # Step 1: verify HS256 signature + exp
        try:
            payload = self._jwt_service.verify_token(token)
        except jwt.ExpiredSignatureError:
            raise HTTPException(401, {"code": "TOKEN_EXPIRED"})
        except Exception:
            raise HTTPException(401, {"code": "INVALID_TOKEN"})

        user_scope = UserScope(payload["user_scope"])

        # Step 2: TENANT_USER — check tenant_id match
        if user_scope == UserScope.TENANT_USER:
            tenant_ctx = getattr(request.state, "tenant_context", None)
            if not tenant_ctx or str(payload.get("tenant_id", "")) != str(tenant_ctx.tenant_id):
                raise HTTPException(403, {"code": "CROSS_TENANT_REPLAY"})

        # Step 3: TENANT_USER — check rbac_version freshness
        if user_scope == UserScope.TENANT_USER:
            user = await self._user_repo.get_by_id(UUID(payload["user_id"]))
            if user and user.rbac_version != payload.get("rbac_version"):
                raise HTTPException(401, {"code": "RBAC_VERSION_MISMATCH"})

        request.state.auth_context = AuthContext(
            user_id=UUID(payload["user_id"]), user_scope=user_scope,
            application_id=UUID(payload["application_id"]) if "application_id" in payload else None,
            tenant_id=UUID(payload["tenant_id"]) if "tenant_id" in payload else None,
            rbac_version=payload.get("rbac_version"),
        )
        return request.state.auth_context

def require_scope(*scopes: UserScope):
    async def check_scope(auth: AuthContext = Depends(get_jwt_bearer)) -> AuthContext:
        if auth.user_scope not in scopes:
            raise HTTPException(403, {"code": "INSUFFICIENT_SCOPE"})
        return auth
    return Depends(check_scope)

Wire JWTBearer in container.py with jwt_service and user_repo.

Run: pytest tests/api/test_jwt_bearer.py -v (ALL PASS)
Commit message: feat(wbs-5.3): implement JWTBearer dependency and require_scope`,
        },
      ],
    },
    "5.4": {
      title: "Refresh token family + rotation",
      priority: "P1", hours: 2.0, day: 5,
      story: "As a user, I want token rotation so sessions are secure and token theft is detected immediately.",
      description: "Implement RefreshHandler and LogoutHandler in services/auth/handlers.py. Create POST /api/v1/auth/refresh and POST /api/v1/auth/logout.",
      acceptance: [
        "POST /auth/refresh with valid unused token → new {access_token, refresh_token}, old token marked used_at.",
        "POST /auth/refresh with already-used token → 401 {\"code\": \"TOKEN_THEFT_DETECTED\"}, entire family is_revoked=True.",
        "POST /auth/refresh with revoked family token → 401 {\"code\": \"TOKEN_FAMILY_REVOKED\"}.",
        "POST /auth/logout marks family is_revoked=True, returns 204.",
        "Refresh token stored as SHA-256(raw_uuid).hexdigest() — raw value never stored.",
      ],
      commits: [{ id: "5.4-A", model: "Sonnet 4.6", title: "Implement refresh token rotation", commitMsg: "feat(wbs-5.4): implement refresh token family rotation and logout", pytest: "pytest tests/unit/test_refresh_handler.py tests/api/test_auth_refresh.py -v", prompt: "Task WBS 5.4-A: Implement RefreshHandler and LogoutHandler.\n\nCreate/extend app/services/auth/handlers.py:\n\nclass RefreshHandler:\n  async def handle(self, raw_token: str) -> TokenResponse:\n      token_hash = hashlib.sha256(raw_token.encode()).hexdigest()\n      family = await self._refresh_repo.get_family_by_token_hash(token_hash)\n      # Guard: token not found → 401 INVALID_TOKEN\n      # Guard: family.is_revoked → 401 TOKEN_FAMILY_REVOKED\n      # Guard: token.used_at is not None → mark family revoked, 401 TOKEN_THEFT_DETECTED\n      # Success: mark old token used, generate new raw_uuid, hash it, create new token\n      # Return new access_token (re-sign with build_access_payload) + new refresh_token (raw)\n\nclass LogoutHandler:\n  async def handle(self, raw_token: str) -> None:\n      token_hash = hashlib.sha256(raw_token.encode()).hexdigest()\n      family = await self._refresh_repo.get_family_by_token_hash(token_hash)\n      if family: await self._refresh_repo.revoke_family(family.id)\n\nAdd routes to auth.py: POST /auth/refresh, POST /auth/logout (returns 204).\n\nWrite tests:\n  test_refresh_valid_token_returns_new_tokens\n  test_refresh_used_token_revokes_family\n  test_refresh_revoked_family_raises\n  test_logout_revokes_family\n\nRun: pytest tests/unit/test_refresh_handler.py tests/api/test_auth_refresh.py -v\nCommit message: feat(wbs-5.4): implement refresh token family rotation and logout" }],
    },
    "5.5": {
      title: "Progressive login lockout",
      priority: "P1", hours: 1.0, day: 5,
      story: "As the system, I want repeated login failures to trigger progressive lockout so brute-force attacks are blocked.",
      description: "Extend LoginHandler with Redis counter logic and DB hard lock. All threshold values read from settings.",
      acceptance: [
        "Attempts 1–4: 401, INCR login_failures:{email} in Redis with TTL=900s.",
        "Attempt 5: 429 {\"code\": \"RATE_LIMITED\"} with Retry-After header.",
        "Attempt 10: write PLATFORM_USER.locked_out_until, return 423 {\"code\": \"ACCOUNT_LOCKED\"}.",
        "Pre-locked user: 423 immediately, no password check, no Redis increment.",
        "Successful login: DEL login_failures:{email}, clear locked_out_until if set.",
      ],
      commits: [{ id: "5.5-A", model: "Sonnet 4.6", title: "Implement progressive login lockout", commitMsg: "feat(wbs-5.5): implement progressive login lockout with Redis counters", pytest: "pytest tests/unit/test_login_lockout.py -v", prompt: "Task WBS 5.5-A: Extend LoginHandler with Redis-backed progressive lockout.\n\nExtend handle() in LoginHandler:\n  BEFORE password check:\n    1. Check user.is_locked() → AccountLockedError (423) immediately, no password check\n    2. Get failure_count = int(await redis.get(f'login_failures:{cmd.email}') or 0)\n    3. If failure_count >= settings.LOGIN_LOCKOUT_HARD_THRESHOLD:\n       Set user.locked_out_until = utcnow() + timedelta(minutes=settings.LOGIN_LOCKOUT_DURATION_MINUTES)\n       await user_repo.save(user); raise AccountLockedError\n    4. If failure_count >= settings.LOGIN_LOCKOUT_SOFT_THRESHOLD:\n       raise RateLimitedError(retry_after_seconds=60)\n\n  ON password failure:\n    await redis.incr(f'login_failures:{cmd.email}')\n    await redis.expire(f'login_failures:{cmd.email}', 900)\n    raise InvalidCredentialsError\n\n  ON success:\n    await redis.delete(f'login_failures:{cmd.email}')\n    user.clear_lockout(); await user_repo.save(user)\n\nWrite unit tests in tests/unit/test_login_lockout.py:\n  test_5th_failure_returns_429_with_retry_after\n  test_10th_failure_sets_locked_out_until\n  test_pre_locked_user_returns_423_without_password_check\n  test_successful_login_clears_lockout_state\n\nRun: pytest tests/unit/test_login_lockout.py -v\nCommit message: feat(wbs-5.5): implement progressive login lockout with Redis counters" }],
    },
    "6.1": {
      title: "Permission resolver (role → group → permission)",
      priority: "P0", hours: 2.0, day: 6,
      story: "As the system, I want dynamic permission resolution so access control works without JWT claims.",
      description: "Create app/services/rbac/permission_resolver.py with PermissionResolver. Create IRbacRepository and SqlAlchemyRbacRepository. Cache key: permissions:{schema_name}:{user_id}, TTL=300s.",
      acceptance: [
        "resolve(schema_name, user_id) returns frozenset[str] of permission codes.",
        "Cache key: permissions:{schema_name}:{user_id}. TTL: 300s.",
        "Cache hit: no DB query. Verify via mock.",
        "Cache miss: JOIN TENANT_USER_ROLE → TENANT_ROLE_GROUP → TENANT_GROUP_PERMISSION → TENANT_PERMISSION_DEF.",
        "resolve() for user with no roles returns frozenset() (empty), not an error.",
        "Permission cache for schema_a is completely independent from schema_b.",
      ],
      commits: [
        {
          id: "6.1-A", model: "Sonnet 4.6",
          title: "Write failing permission resolver tests",
          commitMsg: "test(wbs-6.1): add failing permission resolver tests",
          pytest: "pytest tests/unit/test_permission_resolver.py -v  (expect ALL FAIL)",
          prompt: `Task WBS 6.1-A: Write failing unit tests for PermissionResolver.

Create tests/unit/test_permission_resolver.py.
Use FakeRbacRepository (dict-backed) and fakeredis.

FakeRbacRepository must implement:
  async def resolve_permissions(schema_name: str, user_id: UUID) -> set[str]:
      return self._data.get((schema_name, user_id), set())

Tests:
  test_resolve_returns_expected_permission_codes:
    fake_rbac.seed("schema_a", user_id, {"tenant.users.read", "tenant.roles.read"})
    result = await resolver.resolve("schema_a", user_id)
    assert result == frozenset({"tenant.users.read", "tenant.roles.read"})

  test_resolve_cache_hit_skips_db:
    await resolver.resolve("schema_a", user_id)  # cache miss → DB call
    await resolver.resolve("schema_a", user_id)  # cache hit → no DB call
    assert fake_rbac.call_count == 1  # called only once

  test_resolve_empty_set_for_user_with_no_roles:
    fake_rbac.seed("schema_a", user_id, set())
    result = await resolver.resolve("schema_a", user_id)
    assert result == frozenset()

  test_resolve_cross_tenant_isolation:
    fake_rbac.seed("schema_a", user_id, {"perm.a"})
    fake_rbac.seed("schema_b", user_id, {"perm.b"})
    result_a = await resolver.resolve("schema_a", user_id)
    result_b = await resolver.resolve("schema_b", user_id)
    assert result_a == frozenset({"perm.a"}) and result_b == frozenset({"perm.b"})
    assert result_a != result_b

Run: pytest tests/unit/test_permission_resolver.py -v (expect ALL FAIL)
Commit message: test(wbs-6.1): add failing permission resolver tests`,
        },
        {
          id: "6.1-B", model: "Sonnet 4.6",
          title: "Implement PermissionResolver and RbacRepository",
          commitMsg: "feat(wbs-6.1): implement PermissionResolver with Redis cache",
          pytest: "pytest tests/unit/test_permission_resolver.py -v",
          prompt: `Task WBS 6.1-B: Implement PermissionResolver with Redis cache and SqlAlchemyRbacRepository.

Create app/repositories/interfaces/rbac.py:
  class IRbacRepository(Protocol):
      async def resolve_permissions(self, schema_name: str, user_id: UUID) -> set[str]: ...

Create app/repositories/rbac_repository.py:
  class SqlAlchemyRbacRepository:
      async def resolve_permissions(self, schema_name: str, user_id: UUID) -> set[str]:
          sql = text(f"""
              SET search_path TO {schema_name};
              SELECT tpd.permission_code
              FROM tenant_user_role tur
              JOIN tenant_role_group trg ON trg.role_id = tur.role_id
              JOIN tenant_group_permission tgp ON tgp.group_id = trg.group_id
              JOIN tenant_permission_def tpd ON tpd.id = tgp.permission_id
              WHERE tur.platform_user_id = :user_id
          """)
          result = await self._session.execute(sql, {"user_id": str(user_id)})
          return {row[0] for row in result}

Create app/services/rbac/permission_resolver.py:
  class PermissionResolver:
      async def resolve(self, schema_name: str, user_id: UUID) -> frozenset[str]:
          cache_key = f"permissions:{schema_name}:{user_id}"
          cached = await self._redis.get(cache_key)
          if cached: return frozenset(json.loads(cached))
          permissions = await self._rbac_repo.resolve_permissions(schema_name, user_id)
          await self._redis.setex(cache_key, self._cache_ttl, json.dumps(list(permissions)))
          return frozenset(permissions)

Create tests/fakes/fake_rbac_repo.py with FakeRbacRepository.

Wire in container.py:
  rbac_repository = providers.Factory(SqlAlchemyRbacRepository, session=db_session)
  permission_resolver = providers.Singleton(PermissionResolver,
      rbac_repo=rbac_repository, redis=redis_provider,
      cache_ttl=config.PERMISSION_CACHE_TTL_SECONDS)

Run: pytest tests/unit/test_permission_resolver.py -v (ALL PASS)
Commit message: feat(wbs-6.1): implement PermissionResolver with Redis cache`,
        },
      ],
    },
    "6.2": {
      title: "RBAC guard dependency",
      priority: "P0", hours: 0.5, day: 6,
      story: "As a developer, I want a require_permission guard so any endpoint can declare its permission requirement in one line.",
      description: "Create app/api/dependencies/rbac.py with require_permission(code: str) as a FastAPI dependency factory. Returns a Depends that calls PermissionResolver.resolve() and checks membership. Wire PermissionResolver in container.",
      acceptance: [
        "require_permission(\"tenant.users.read\") on a route → 403 if user lacks the permission.",
        "require_permission(\"tenant.users.read\") → 200 if user has the permission.",
        "SUPER_ADMIN scope bypasses require_permission checks.",
      ],
      commits: [
        {
          id: "6.2-A", model: "Sonnet 4.6",
          title: "Implement require_permission and test it",
          commitMsg: "feat(wbs-6.2): implement require_permission RBAC guard",
          pytest: "pytest tests/api/test_rbac_guard.py -v",
          prompt: `Task WBS 6.2-A: Implement require_permission FastAPI dependency.

Create app/api/dependencies/rbac.py:

  def require_permission(permission_code: str):
      async def check(
          request: Request,
          auth: AuthContext = Depends(get_jwt_bearer),
          resolver: PermissionResolver = Depends(get_permission_resolver),
      ) -> AuthContext:
          # SUPER_ADMIN bypasses all permission checks
          if auth.user_scope == UserScope.SUPER_ADMIN:
              return auth
          schema_name = request.state.tenant_context.schema_name
          permissions = await resolver.resolve(schema_name, auth.user_id)
          if permission_code not in permissions:
              raise HTTPException(403, {"code": "PERMISSION_DENIED", "required": permission_code})
          return auth
      return Depends(check)

Write tests in tests/api/test_rbac_guard.py.
Add a protected test endpoint: GET /api/v1/test/guarded → requires require_permission("tenant.users.read")

Tests:
  test_user_with_permission_gets_200:
    resolve mock returns {"tenant.users.read"}, valid TENANT_USER JWT → assert 200

  test_user_without_permission_gets_403:
    resolve mock returns set(), valid TENANT_USER JWT → assert 403, body["code"] == "PERMISSION_DENIED"

  test_super_admin_bypasses_permission_check:
    SUPER_ADMIN JWT (no tenant context needed) → assert 200 even with no permissions in Redis

Run: pytest tests/api/test_rbac_guard.py -v (ALL PASS)
Commit message: feat(wbs-6.2): implement require_permission RBAC guard`,
        },
      ],
    },
    "7.1": {
      title: "DB audit log hooks",
      priority: "P1", hours: 1.5, day: 7,
      story: "As a security auditor, I want immutable DB audit log entries for every create, update, and delete on auditable platform entities.",
      description: "Extend app/models/base.py to add SQLAlchemy after_flush event hooks that write to PLATFORM_AUDIT_LOG or TENANT_AUDIT_LOG. Hook reads request.state.auth_context.user_id from context var for actor_id.",
      acceptance: [
        "INSERT on PLATFORM_USER creates a PLATFORM_AUDIT_LOG row with action_type=CREATE.",
        "UPDATE on PLATFORM_USER creates a row with action_type=UPDATE and changed_data JSONB with before/after diff.",
        "password_hash and api_secret_hash are NEVER included in changed_data.",
        "Audit write is in the same transaction as the entity write — rollback rolls back the audit row too.",
      ],
      commits: [{ id: "7.1-A", model: "Sonnet 4.6", title: "Implement DB audit log hooks", commitMsg: "feat(wbs-7.1): add SQLAlchemy audit log hooks for platform entities", pytest: "pytest tests/integration/test_audit_log.py -v --run-integration", prompt: "Task WBS 7.1-A: Add SQLAlchemy audit log hooks.\n\nExtend app/models/base.py to register after_flush event on the SQLAlchemy Session.\nFor each new/modified AuditableEntity in session.new and session.dirty:\n  - Determine action_type: CREATE or UPDATE\n  - Build changed_data dict (before/after for dirty objects)\n  - Exclude fields: password_hash, api_secret_hash (never logged)\n  - Get actor_id from structlog contextvars or request.state.auth_context.user_id\n  - Create PlatformAuditLog row and add to session (same transaction)\n\nWrite integration tests in tests/integration/test_audit_log.py:\n  test_platform_user_insert_creates_audit_row\n  test_platform_user_update_changed_data_excludes_password_hash\n  test_audit_row_rolls_back_with_parent_transaction\n\nRun: pytest tests/integration/test_audit_log.py -v --run-integration\nCommit message: feat(wbs-7.1): add SQLAlchemy audit log hooks for platform entities" }],
    },
    "7.2": {
      title: "Access logs to SEQ",
      priority: "P1", hours: 1.0, day: 7,
      story: "As an operator, I want structured access logs in SEQ for every request so incidents are queryable.",
      description: "Extend RequestLoggingMiddleware to emit a request_completed event via structlog. Ensure SEQ processor is in the structlog pipeline.",
      acceptance: [
        "Every request logs {event: \"request_completed\", method, path, status_code, duration_ms, request_id, tenant_id, user_id}.",
        "4xx logged at WARNING, 5xx at ERROR, 2xx at INFO.",
        "SEQ down → falls back to JSON stdout. Request is NOT blocked.",
        "GET /api/v1/health is logged at DEBUG to reduce noise.",
      ],
      commits: [{ id: "7.2-A", model: "Haiku 4.5", title: "Implement structured access logs to SEQ", commitMsg: "feat(wbs-7.2): emit structured request_completed events to SEQ", pytest: "pytest tests/unit/test_request_logging.py -v", prompt: "Task WBS 7.2-A: Extend RequestLoggingMiddleware for structured SEQ access logs.\n\nExtend app/core/middleware/ RequestLoggingMiddleware:\n  - Record request_start = time.monotonic() at start of request\n  - After response: duration_ms = int((time.monotonic() - request_start) * 1000)\n  - Emit via structlog:\n    log_level = \"debug\" if health endpoint, \"warning\" if 4xx, \"error\" if 5xx, else \"info\"\n    structlog.get_logger().log(log_level, \"request_completed\",\n        method=request.method, path=request.url.path,\n        status_code=response.status_code, duration_ms=duration_ms,\n        request_id=request_id, tenant_id=tenant_id, user_id=user_id)\n\nEnsure app/core/logging.py has SEQ sink with graceful fallback to stdout.\n\nWrite unit tests in tests/unit/test_request_logging.py:\n  test_request_completed_log_fields\n  test_5xx_logged_at_error_level\n\nRun: pytest tests/unit/test_request_logging.py -v\nCommit message: feat(wbs-7.2): emit structured request_completed events to SEQ" }],
    },
    "8.1": {
      title: "End-to-end smoke test",
      priority: "P1", hours: 1.5, day: 7,
      story: "As a developer, I want a single E2E test that covers login, tenant provisioning, and a permission-protected endpoint so the full pipeline is verified.",
      description: "Write one integration test that runs the complete flow against real docker-compose stack.",
      acceptance: [
        "Seed data loaded.",
        "POST /auth/login as APP_ADMIN → receives valid JWT.",
        "POST /tenancy/tenants with APP_ADMIN JWT → provisions tenant, returns schema_name.",
        "GET /api/v1/tenancy/tenants with APP_ADMIN JWT + X-Tenant-Slug → 200.",
        "Test passes in under 10 seconds.",
      ],
      commits: [
        {
          id: "8.1-A", model: "Sonnet 4.6",
          title: "Full E2E integration test",
          commitMsg: "test(wbs-8.1): add end-to-end smoke test covering full auth and tenant flow",
          pytest: "pytest tests/integration/test_e2e_smoke.py -v --run-integration",
          prompt: `Task WBS 8.1-A: Write and pass a single end-to-end integration test.

Create tests/integration/test_e2e_smoke.py:

@pytest.mark.integration
async def test_e2e_full_auth_and_tenant_flow(test_client, async_engine):
    # Step 1: Login as APP_ADMIN (seeded credentials from settings)
    r = test_client.post("/api/v1/auth/login", json={
        "email": settings.SEED_APP_ADMIN_EMAIL,
        "password": settings.SEED_APP_ADMIN_PASSWORD,
        "application_code": settings.SEED_APPLICATION_CODE,
    })
    assert r.status_code == 200, r.json()
    app_admin_token = r.json()["access_token"]

    # Step 2: Provision a new tenant
    r = test_client.post("/api/v1/tenancy/tenants",
        json={"organisation_name": "E2E Test Org"},
        headers={"Authorization": f"Bearer {app_admin_token}"}
    )
    assert r.status_code == 201, r.json()
    schema_name = r.json()["schema_name"]
    tenant_slug = r.json()["organisation_slug"]
    assert schema_name == f"{settings.SEED_APPLICATION_CODE}_e2e_test_org"

    # Step 3: Verify schema exists and has system roles
    async with async_engine.connect() as conn:
        await conn.execute(text(f"SET search_path TO {schema_name}"))
        result = await conn.execute(text("SELECT count(*) FROM tenant_role WHERE is_system_role = true"))
        assert result.scalar() == 3

    # Step 4: Verify tenant routing with APP_ADMIN JWT
    r = test_client.get("/api/v1/tenancy/tenants",
        headers={"Authorization": f"Bearer {app_admin_token}", "X-Tenant-Slug": tenant_slug}
    )
    assert r.status_code == 200

This test requires: seed ran, docker-compose up -d, all migrations applied.

Run: pytest tests/integration/test_e2e_smoke.py -v --run-integration
Commit message: test(wbs-8.1): add end-to-end smoke test covering full auth and tenant flow`,
        },
      ],
    },
  },
};

/* Derive all commit IDs for a day */
const getCommitsForDay = (dayId) => {
  const day = SPRINT_DATA.days.find((d) => d.id === dayId);
  if (!day) return [];
  return day.wbs.flatMap((wbsId) =>
    (SPRINT_DATA.wbs[wbsId]?.commits || []).map((c) => c.id)
  );
};

const getTotalCommits = () =>
  Object.values(SPRINT_DATA.wbs).reduce(
    (sum, w) => sum + (w.commits?.length || 0),
    0
  );

const PRIORITY_COLORS = (t, p) =>
  p === "P0"
    ? { bg: t.successBg, text: t.success }
    : p === "P1"
    ? { bg: t.accentBg, text: t.accent }
    : { bg: t.warnBg, text: t.warn };

/* ─────────────────────────── COPY BUTTON ─────────────────────────── */
function CopyBtn({ text, t }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(UNIVERSAL_PREAMBLE + "\n\n" + text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      style={{
        padding: "4px 10px", borderRadius: 5, fontSize: 11,
        border: `1px solid ${t.border}`, cursor: "pointer",
        background: copied ? t.successBg : t.surfaceAlt,
        color: copied ? t.success : t.textSub,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
        transition: "all 0.2s",
      }}
    >
      {copied ? "✓ Copied" : "Copy Prompt"}
    </button>
  );
}

/* ─────────────────────────── COMMIT ROW ─────────────────────────── */
function CommitRow({ commit, done, onToggle, t }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        marginBottom: 8, borderRadius: 8,
        border: `1px solid ${done ? t.success + "50" : t.border}`,
        background: done ? t.successBg + "50" : t.surface,
        overflow: "hidden", transition: "all 0.2s",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 12px", cursor: "pointer",
        }}
        onClick={() => onToggle(commit.id)}
      >
        {/* Checkbox */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(commit.id); }}
          style={{
            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
            marginTop: 2,
            border: `2px solid ${done ? t.success : t.border}`,
            background: done ? t.success : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: t.accent, fontWeight: 500,
            }}>
              {commit.id}
            </span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: done ? t.textMuted : t.text, fontWeight: 500,
              textDecoration: done ? "line-through" : "none",
            }}>
              {commit.title}
            </span>
            <span style={{
              fontSize: 10, padding: "1px 6px", borderRadius: 10,
              background: t.accentBg, color: t.accentSoft,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {commit.model}
            </span>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5,
            color: t.textMuted, marginTop: 3,
          }}>
            {commit.commitMsg}
          </div>
        </div>

        <div style={{
          fontSize: 12, color: t.textMuted, flexShrink: 0,
          transform: expanded ? "rotate(180deg)" : "none",
          transition: "transform 0.2s", paddingTop: 2,
        }}>▾</div>
      </div>

      {expanded && (
        <div style={{
          borderTop: `1px solid ${t.border}`,
          padding: "0 12px 12px",
        }}>
          <div style={{
            background: t.codeBg, borderRadius: 6, padding: "10px 12px",
            marginTop: 10, position: "relative",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 6,
            }}>
              <span style={{
                fontSize: 10, color: t.textMuted,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Copilot Prompt — includes Universal Preamble when copied
              </span>
              <CopyBtn text={commit.prompt} t={t} />
            </div>
            <pre style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11.5, lineHeight: 1.65,
              color: t.code, whiteSpace: "pre-wrap",
              wordBreak: "break-word", margin: 0, maxHeight: 320,
              overflowY: "auto",
            }}>
              {commit.prompt}
            </pre>
          </div>
          <div style={{
            marginTop: 8, padding: "6px 10px",
            background: t.warnBg, borderRadius: 5,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: t.warn,
          }}>
            $ {commit.pytest}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── WBS ITEM ─────────────────────────── */
function WbsItem({ wbsId, progress, onToggleCommit, t }) {
  const [expanded, setExpanded] = useState(false);
  const wbs = SPRINT_DATA.wbs[wbsId];
  if (!wbs) return null;

  const totalCommits = wbs.commits?.length || 0;
  const doneCommits = (wbs.commits || []).filter((c) => progress.has(c.id)).length;
  const isAllDone = wbs.done || (totalCommits > 0 && doneCommits === totalCommits);
  const pc = PRIORITY_COLORS(t, wbs.priority);

  return (
    <div style={{
      marginBottom: 10, borderRadius: 10,
      border: `1px solid ${isAllDone ? t.success + "40" : t.border}`,
      background: t.surface,
      boxShadow: `0 2px 8px ${t.shadow}`,
      overflow: "hidden", transition: "all 0.2s",
    }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 14px", cursor: "pointer",
          background: isAllDone ? t.successBg + "30" : "transparent",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 7, marginBottom: 4 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
              color: t.accentSoft, fontWeight: 500,
            }}>WBS {wbsId}</span>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 15.5,
              color: t.text, fontWeight: 600,
            }}>
              {wbs.title}
              {wbs.done && <span style={{ marginLeft: 6, fontSize: 13, color: t.success }}>✓ Done</span>}
            </span>
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: 10,
              background: pc.bg, color: pc.text,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            }}>{wbs.priority}</span>
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: 10,
              background: t.accentBg, color: t.accent,
              fontFamily: "'DM Sans', sans-serif",
            }}>{wbs.hours}h</span>
          </div>

          {/* Story — the exact user story */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12.5,
            color: t.textSub, margin: "0 0 4px", lineHeight: 1.5,
            fontStyle: "italic",
          }}>
            "{wbs.story}"
          </p>

          {totalCommits > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <div style={{
                flex: 1, height: 4, borderRadius: 2, background: t.border, maxWidth: 120,
              }}>
                <div style={{
                  height: "100%", borderRadius: 2, background: t.success,
                  width: `${(doneCommits / totalCommits) * 100}%`, transition: "width 0.3s",
                }} />
              </div>
              <span style={{
                fontSize: 11, color: t.textMuted,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {doneCommits}/{totalCommits} commits
              </span>
            </div>
          )}
        </div>
        <div style={{
          fontSize: 12, color: t.textMuted, flexShrink: 0,
          transform: expanded ? "rotate(180deg)" : "none",
          transition: "transform 0.2s", paddingTop: 2,
        }}>▾</div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${t.border}` }}>
          {/* Description */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            color: t.textSub, margin: "12px 0 10px", lineHeight: 1.6,
          }}>
            {wbs.description}
          </p>

          {/* Acceptance Criteria */}
          {wbs.acceptance?.length > 0 && (
            <div style={{
              background: t.accentBg, borderRadius: 7,
              padding: "8px 12px", marginBottom: 12,
              border: `1px solid ${t.border}`,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: t.accent,
                fontFamily: "'DM Sans', sans-serif", marginBottom: 5,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>Acceptance Criteria</div>
              {wbs.acceptance.map((ac, i) => (
                <div key={i} style={{
                  display: "flex", gap: 7, marginBottom: 3,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12.5,
                  color: t.text, lineHeight: 1.5,
                }}>
                  <span style={{ color: t.accent, flexShrink: 0 }}>—</span>
                  <span>{ac}</span>
                </div>
              ))}
            </div>
          )}

          {/* Commits */}
          {wbs.commits?.length > 0 && (
            <div>
              <div style={{
                fontSize: 11, fontWeight: 600, color: t.textMuted,
                fontFamily: "'DM Sans', sans-serif", marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>Atomic Commits</div>
              {wbs.commits.map((c) => (
                <CommitRow
                  key={c.id}
                  commit={c}
                  done={progress.has(c.id)}
                  onToggle={onToggleCommit}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── DAY TAB ─────────────────────────── */
function DayTab({ day, selected, progress, onClick, t }) {
  const commitIds = getCommitsForDay(day.id);
  const doneCount = commitIds.filter((id) => progress.has(id)).length;
  const total = commitIds.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const isToday = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .replace(",", "") === day.date;

  return (
    <button
      onClick={() => onClick(day.id)}
      style={{
        width: "100%", textAlign: "left", padding: "10px 12px",
        borderRadius: 8, border: `1px solid ${selected ? t.accent : t.border}`,
        background: selected ? t.accentBg : t.surface,
        cursor: "pointer", marginBottom: 6,
        transition: "all 0.15s",
        boxShadow: selected ? `0 0 0 1px ${t.accent}` : "none",
      }}
    >
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            color: selected ? t.accent : t.textMuted, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>Day {day.id}</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 14,
            color: selected ? t.text : t.textSub, fontWeight: 600,
          }}>{day.date}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 11, color: pct === 100 ? t.success : t.textMuted,
            fontFamily: "'DM Sans', sans-serif",
          }}>{pct}%</div>
          <div style={{
            fontSize: 10, color: t.textMuted,
            fontFamily: "'DM Sans', sans-serif",
          }}>{day.hours}h</div>
        </div>
      </div>
      <div style={{
        marginTop: 5, height: 3, borderRadius: 2,
        background: t.border, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: pct === 100 ? t.success : t.accent,
          width: `${pct}%`, transition: "width 0.3s",
        }} />
      </div>
    </button>
  );
}

/* ─────────────────────────── MAIN APP ─────────────────────────── */
export default function App() {
  const [theme, setTheme] = useState("dark");
  const [selectedDay, setSelectedDay] = useState(1);
  const [progress, setProgress] = useState(new Set()); // Set of completed commit IDs
  const [storageReady, setStorageReady] = useState(false);

  const t = THEMES[theme];
  const STORAGE_KEY = "iam-checker-progress-v2";

  // Load from persistent storage
  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result?.value) {
          const data = JSON.parse(result.value);
          setProgress(new Set(data.completed || []));
          if (data.theme) setTheme(data.theme);
          if (data.selectedDay) setSelectedDay(data.selectedDay);
        }
      } catch (_) {}
      setStorageReady(true);
    };
    if (window.storage) load();
    else setStorageReady(true);
  }, []);

  // Save to persistent storage
  const save = useCallback(async (newProgress, newTheme, newDay) => {
    try {
      if (window.storage) {
        await window.storage.set(STORAGE_KEY, JSON.stringify({
          completed: [...newProgress],
          theme: newTheme,
          selectedDay: newDay,
        }));
      }
    } catch (_) {}
  }, []);

  const toggleCommit = useCallback((commitId) => {
    setProgress((prev) => {
      const next = new Set(prev);
      if (next.has(commitId)) next.delete(commitId);
      else next.add(commitId);
      save(next, theme, selectedDay);
      return next;
    });
  }, [theme, selectedDay, save]);

  const handleTheme = (th) => {
    setTheme(th);
    save(progress, th, selectedDay);
  };

  const handleDay = (d) => {
    setSelectedDay(d);
    save(progress, theme, d);
  };

  const totalDone = progress.size;
  const totalAll = getTotalCommits();
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  const currentDay = SPRINT_DATA.days.find((d) => d.id === selectedDay);

  return (
    <div style={{
      minHeight: "100vh", background: t.bg,
      fontFamily: "'DM Sans', sans-serif",
      color: t.text, transition: "background 0.25s, color 0.25s",
    }}>
      <FontLoader />

      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${t.border}`,
        padding: "14px 20px",
        background: t.surface,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 10,
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: `0 2px 12px ${t.shadow}`,
      }}>
        <div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18, fontWeight: 700, color: t.text, lineHeight: 1.1,
          }}>
            AIT IAM Service
          </div>
          <div style={{
            fontSize: 11, color: t.textMuted,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Ramadan Sprint · 7 Days · 35h · v2.0
          </div>
        </div>

        {/* Overall progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 22, fontWeight: 700, color: t.accent,
              fontFamily: "'Cormorant Garamond', serif",
            }}>
              {overallPct}%
            </div>
            <div style={{ fontSize: 10, color: t.textMuted }}>
              {totalDone}/{totalAll} commits
            </div>
          </div>
          <div style={{ width: 90, height: 6, borderRadius: 3, background: t.border }}>
            <div style={{
              height: "100%", borderRadius: 3,
              background: overallPct === 100 ? t.success : t.accent,
              width: `${overallPct}%`, transition: "width 0.3s",
            }} />
          </div>

          {/* Theme toggle */}
          <div style={{
            display: "flex", borderRadius: 8, overflow: "hidden",
            border: `1px solid ${t.border}`,
          }}>
            {["light", "dark"].map((th) => (
              <button
                key={th}
                onClick={() => handleTheme(th)}
                style={{
                  padding: "5px 12px", fontSize: 11, cursor: "pointer",
                  border: "none", fontFamily: "'DM Sans', sans-serif",
                  background: theme === th ? t.accent : t.surfaceAlt,
                  color: theme === th ? "#fff" : t.textMuted,
                  transition: "all 0.15s",
                }}
              >
                {th === "light" ? "☀ Day" : "🌙 Night"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Layout ── */}
      <div style={{
        display: "flex", maxWidth: 1200, margin: "0 auto",
        padding: "16px", gap: 16,
        flexDirection: "row",
        flexWrap: "wrap",
      }}>
        {/* Sidebar */}
        <div style={{
          width: 210, flexShrink: 0,
          "@media (max-width: 640px)": { width: "100%" },
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: t.textMuted,
            letterSpacing: "0.1em", textTransform: "uppercase",
            marginBottom: 8,
          }}>Sprint Days</div>
          {SPRINT_DATA.days.map((day) => (
            <DayTab
              key={day.id}
              day={day}
              selected={selectedDay === day.id}
              progress={progress}
              onClick={handleDay}
              t={t}
            />
          ))}

          {/* Legend */}
          <div style={{
            marginTop: 14, padding: "10px 12px",
            background: t.surface, borderRadius: 8,
            border: `1px solid ${t.border}`,
          }}>
            <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 6,
              textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Priority
            </div>
            {["P0", "P1", "P2"].map((p) => {
              const pc = PRIORITY_COLORS(t, p);
              const labels = { P0: "Mandatory", P1: "Important", P2: "Stretch" };
              return (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, padding: "1px 6px", borderRadius: 8,
                    background: pc.bg, color: pc.text, fontWeight: 600,
                  }}>{p}</span>
                  <span style={{ fontSize: 11, color: t.textMuted }}>{labels[p]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentDay && (
            <div>
              {/* Day header */}
              <div style={{
                padding: "14px 16px", borderRadius: 10,
                background: t.surface, border: `1px solid ${t.border}`,
                marginBottom: 14,
                boxShadow: `0 2px 10px ${t.shadow}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 22, fontWeight: 700, color: t.text,
                    }}>
                      Day {currentDay.id} — {currentDay.date}
                    </div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                      {currentDay.hours}h budget · WBS {currentDay.wbs.join(", ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {currentDay.wbs.map((wbsId) => {
                      const wbs = SPRINT_DATA.wbs[wbsId];
                      const pc = PRIORITY_COLORS(t, wbs?.priority);
                      return (
                        <div key={wbsId} style={{
                          padding: "4px 10px", borderRadius: 6,
                          background: pc.bg, color: pc.text,
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                        }}>
                          {wbsId} · {wbs?.hours}h
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* WBS items */}
              {currentDay.wbs.map((wbsId) => (
                <WbsItem
                  key={wbsId}
                  wbsId={wbsId}
                  progress={progress}
                  onToggleCommit={toggleCommit}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
