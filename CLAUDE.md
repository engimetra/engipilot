# CLAUDE.md — EngiPilot Engineering Guide

> **EngiPilot** is an enterprise-grade, multi-tenant SaaS platform for the construction (BTP) sector, automating quantity takeoffs, cost estimation, bid analysis, AI-driven document processing, project scheduling, and intelligent supervision. This document is the single source of truth for all development decisions made in this codebase.

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Architecture Overview](#2-architecture-overview)
3. [Repository & Folder Structure](#3-repository--folder-structure)
4. [Naming Conventions](#4-naming-conventions)
5. [TypeScript Standards](#5-typescript-standards)
6. [Python Standards](#6-python-standards)
7. [SQL & Database Standards](#7-sql--database-standards)
8. [React Standards](#8-react-standards)
9. [Next.js Standards](#9-nextjs-standards)
10. [REST API Standards](#10-rest-api-standards)
11. [Error Handling](#11-error-handling)
12. [Validation](#12-validation)
13. [Authentication & Authorization](#13-authentication--authorization)
14. [Logging & Observability](#14-logging--observability)
15. [Performance](#15-performance)
16. [Security & OWASP](#16-security--owasp)
17. [Secrets & Environment Variables](#17-secrets--environment-variables)
18. [Docker & Infrastructure](#18-docker--infrastructure)
19. [CI/CD & GitHub Actions](#19-cicd--github-actions)
20. [Git & Branching Strategy](#20-git--branching-strategy)
21. [Testing Strategy](#21-testing-strategy)
22. [AI Engineering Standards](#22-ai-engineering-standards)
23. [OCR & Document Processing](#23-ocr--document-processing)
24. [BTP Domain Logic](#24-btp-domain-logic)
25. [File Management & Uploads](#25-file-management--uploads)
26. [Data Privacy & GDPR](#26-data-privacy--gdpr)
27. [Code Quality & Clean Code](#27-code-quality--clean-code)
28. [Documentation Standards](#28-documentation-standards)
29. [Commit & PR Checklists](#29-commit--pr-checklists)
30. [Technical Debt & Refactoring](#30-technical-debt--refactoring)

---

## 1. Project Vision

### 1.1 Mission Statement

EngiPilot automates the most time-consuming, error-prone tasks in construction project management: reading architectural plans, extracting quantities, computing costs, generating professional quotes, and supervising active construction sites with AI-powered anomaly detection.

### 1.2 Core Principles

- **Domain-first design**: Every technical decision must serve the BTP domain. Abstractions must map to real construction concepts (chantier, lot, ouvrage, métré, CCTP, DPGF, BIM model).
- **Multi-tenancy by default**: All data is tenant-scoped. There is no single-tenant code path.
- **AI as infrastructure**: LLM calls, vector search, and agent pipelines are treated as first-class infrastructure, not bolt-on features.
- **Auditability**: Every action that creates, modifies, or deletes construction data must produce an immutable audit trail.
- **Progressive disclosure**: The UI exposes complexity only when the user needs it. Default flows are simple; power flows are reachable.

### 1.3 Non-Negotiables

- Zero PII leakage between tenants.
- API response time P95 < 300ms for non-AI endpoints.
- AI endpoints must stream or return within 30s with a progress indicator.
- All file uploads are virus-scanned before processing.
- All financial calculations (cost estimates, devis) use `decimal`/`Decimal` types — never floating point.

---

## 2. Architecture Overview

### 2.1 System Topology

```
+-------------------------------------------------------------+
|                        Internet                             |
+---------------------------+---------------------------------+
                            | HTTPS
                     +------v------+
                     |   Nginx     |  (Dockerized reverse proxy)
                     |  + Certbot  |
                     +------+------+
           +-----------------+-----------------+
           |                 |                 |
    +------v------+   +------v------+   +------v------+
    |  Next.js 15 |   | Spring Boot |   |  FastAPI    |
    |  Frontend   |   |  Backend    |   |  AI Service |
    |  (App Router|   |  Java 21    |   |  Python     |
    +------+------+   +------+------+   +------+------+
           |                 |                 |
           +---------+-------+                 |
                     |                         |
            +--------v-------+    +------------v----------+
            |  PostgreSQL 15  |    |   Redis (Cache,       |
            |  + pgvector     |    |   Sessions, Queue)    |
            +-----------------+    +-----------------------+
                     |
            +--------v-------+
            |  Apache Kafka  |  (Event streaming)
            +----------------+
```

### 2.2 Service Responsibilities

| Service | Responsibility | Port |
|---|---|---|
| `frontend` | Next.js 15 App Router — all UI, SSR, edge middleware | 3000 |
| `backend` | Spring Boot — business logic, REST API, auth, multi-tenancy | 8080 |
| `ai-service` | FastAPI — LLM orchestration, OCR, PDF parsing, agents, embeddings | 8000 |
| `postgres` | Primary data store — all domain entities, vector embeddings | 5432 |
| `redis` | Cache, rate limiting, session store, task queue | 6379 |
| `kafka` | Async events — document processing, notifications, audit | 9092 |
| `nginx` | TLS termination, routing, static asset serving | 80/443 |

### 2.3 Data Flow for AI Document Processing

```
User uploads PDF plan
        |
        v
[frontend] -> POST /api/documents/upload
        |
        v
[backend] validates tenant, virus scan, stores metadata -> PostgreSQL
        |
        v
[backend] publishes DocumentUploadedEvent -> Kafka topic: documents.raw
        |
        v
[ai-service] consumes event -> runs OCR pipeline -> extracts quantities
        |
        v
[ai-service] stores results -> PostgreSQL (metrage table)
        |
        v
[ai-service] publishes DocumentProcessedEvent -> Kafka topic: documents.processed
        |
        v
[backend] consumes event -> notifies frontend via SSE
        |
        v
[frontend] updates UI with extracted data
```

### 2.4 Multi-Tenancy Model

Tenant isolation is implemented at the **Row Level Security (RLS)** layer in PostgreSQL. Every table that contains tenant-scoped data has a `tenant_id UUID NOT NULL` column with an RLS policy. The application sets `SET LOCAL app.current_tenant_id = '<uuid>'` at the start of every transaction.

**Never** query tenant-scoped tables without verifying the current tenant context.

---

## 3. Repository & Folder Structure

### 3.1 Monorepo Layout

```
engipilot/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd-staging.yml
│   │   └── cd-production.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
├── apps/
│   ├── frontend/                  # Next.js 15
│   │   ├── app/                   # App Router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── projects/
│   │   │   │   ├── documents/
│   │   │   │   ├── metrages/
│   │   │   │   ├── devis/
│   │   │   │   ├── chantiers/
│   │   │   │   └── settings/
│   │   │   ├── api/               # Next.js Route Handlers
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                # Shadcn/ui primitives
│   │   │   ├── forms/
│   │   │   ├── charts/
│   │   │   ├── btp/               # Domain-specific components
│   │   │   └── ai/                # AI chat, streaming components
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api/               # Axios client instances
│   │   │   ├── auth/
│   │   │   ├── validation/        # Zod schemas
│   │   │   └── utils/
│   │   ├── store/                 # Zustand stores
│   │   ├── types/
│   │   ├── middleware.ts
│   │   └── next.config.ts
│   ├── backend/                   # Spring Boot
│   │   └── src/main/java/ma/engipilot/
│   │       ├── config/
│   │       ├── domain/
│   │       │   ├── project/
│   │       │   ├── document/
│   │       │   ├── metrage/
│   │       │   ├── devis/
│   │       │   ├── chantier/
│   │       │   └── user/
│   │       ├── infrastructure/
│   │       │   ├── persistence/
│   │       │   ├── messaging/
│   │       │   └── security/
│   │       └── api/
│   │           ├── v1/
│   │           └── dto/
│   └── ai-service/                # FastAPI
│       ├── app/
│       │   ├── api/
│       │   │   └── v1/
│       │   │       ├── ocr.py
│       │   │       ├── metrage.py
│       │   │       ├── devis.py
│       │   │       ├── analysis.py
│       │   │       └── agents.py
│       │   ├── core/
│       │   │   ├── config.py
│       │   │   ├── security.py
│       │   │   └── database.py
│       │   ├── models/            # Pydantic models
│       │   ├── services/
│       │   │   ├── ocr/
│       │   │   ├── llm/
│       │   │   ├── embeddings/
│       │   │   └── agents/
│       │   └── main.py
│       ├── tests/
│       └── requirements.txt
├── packages/
│   ├── shared-types/              # TypeScript types shared FE/BE
│   └── btp-constants/             # BTP domain constants (CCTP codes, units)
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.prod.yml
│   │   └── Dockerfiles/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   └── scripts/
│       ├── backup.sh
│       ├── restore.sh
│       └── healthcheck.sh
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── runbooks/
│   └── adr/                       # Architecture Decision Records
└── CLAUDE.md
```

---

## 4. Naming Conventions

### 4.1 Universal Rules

- Use **English** for all code identifiers, comments, variable names, function names, and file names.
- Use **French** only in user-facing text (UI labels, error messages), BTP domain constants (e.g., `LOT_GROS_OEUVRE`), and inline documentation when explaining BTP-specific concepts.
- Prefer **explicit over abbreviated** names. `calculateQuantityTakeoff` not `calcQTO`.

### 4.2 TypeScript / JavaScript

| Construct | Convention | Example |
|---|---|---|
| Variables | `camelCase` | `totalCostEstimate` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE_MB` |
| Functions | `camelCase` | `parsePdfPlan()` |
| Classes | `PascalCase` | `QuantityTakeoffService` |
| Interfaces | `PascalCase` (no `I` prefix) | `QuantityItem` |
| Types | `PascalCase` | `TenantContext` |
| Enums | `PascalCase` values `SCREAMING_SNAKE` | `ProjectStatus.IN_PROGRESS` |
| Files (components) | `PascalCase.tsx` | `MetrageTable.tsx` |
| Files (utilities) | `kebab-case.ts` | `pdf-parser.ts` |
| Directories | `kebab-case` | `ai-service/` |
| React hooks | `use` prefix | `useMetrage()` |
| Zod schemas | `camelCase` + `Schema` suffix | `createDevisSchema` |

### 4.3 Python

| Construct | Convention | Example |
|---|---|---|
| Variables | `snake_case` | `total_surface_area` |
| Constants | `SCREAMING_SNAKE_CASE` | `OCR_CONFIDENCE_THRESHOLD` |
| Functions | `snake_case` | `extract_quantities_from_pdf()` |
| Classes | `PascalCase` | `OcrPipelineService` |
| Modules | `snake_case` | `pdf_parser.py` |
| Pydantic models | `PascalCase` | `MetrageRequest` |
| Private methods | `_single_underscore` | `_validate_pdf_header()` |

### 4.4 SQL / Database

| Construct | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural | `projects`, `quantity_items` |
| Columns | `snake_case` | `created_at`, `tenant_id` |
| Primary keys | `id` (UUID) | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Foreign keys | `<table_singular>_id` | `project_id`, `tenant_id` |
| Indexes | `idx_<table>_<columns>` | `idx_projects_tenant_id` |
| Constraints | `chk_<table>_<condition>` | `chk_quantity_items_quantity_positive` |

### 4.5 Docker / Infrastructure

| Construct | Convention | Example |
|---|---|---|
| Container names | `engipilot-<service>` | `engipilot-frontend` |
| Image names | `engipilot/<service>:<version>` | `engipilot/ai-service:1.4.2` |
| Networks | `engipilot-<purpose>` | `engipilot-internal` |
| Volumes | `engipilot-<service>-data` | `engipilot-postgres-data` |

---

## 5. TypeScript Standards

### 5.1 Configuration

Every TypeScript project uses strict mode. No exceptions.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 5.2 Type Safety Rules

**Never use `any`.** Use `unknown` for truly unknown values and narrow with type guards.

```typescript
// WRONG
function parseApiResponse(data: any) {
  return data.metrage;
}

// CORRECT
function parseApiResponse(data: unknown): MetrageResult {
  if (!isMetrageResult(data)) {
    throw new InvalidApiResponseError('Expected MetrageResult', { received: data });
  }
  return data;
}

function isMetrageResult(value: unknown): value is MetrageResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'totalQuantity' in value &&
    typeof (value as MetrageResult).totalQuantity === 'number'
  );
}
```

**Use discriminated unions for state machines.** BTP workflows have complex states.

```typescript
type DocumentProcessingState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number; fileName: string }
  | { status: 'processing'; documentId: string; estimatedSeconds: number }
  | { status: 'extracting_quantities'; documentId: string; pagesProcessed: number; totalPages: number }
  | { status: 'complete'; documentId: string; quantityItems: QuantityItem[] }
  | { status: 'error'; documentId?: string; error: ProcessingError; retryable: boolean };
```

**Financial values use Decimal.** Never use `number` for money or quantities that feed cost calculations.

```typescript
import Decimal from 'decimal.js';

// WRONG — floating point errors compound
const unitCost = 125.50;
const total = unitCost * quantity;

// CORRECT
const unitCost = new Decimal('125.50');
const total = unitCost.mul(quantity).toDecimalPlaces(2);
```

### 5.3 Module Imports

Use absolute imports via the `@/` alias. Relative imports are allowed only within the same feature module.

```typescript
// WRONG
import { DevisTable } from '../../../../components/btp/DevisTable';

// CORRECT
import { DevisTable } from '@/components/btp/DevisTable';
import { useDevis } from '@/hooks/useDevis';
import type { DevisItem } from '@/types/btp';
```

### 5.4 Result Pattern for Async Operations

All async operations that can fail use the Result pattern. Do not throw from service functions.

```typescript
type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

async function generateDevis(input: GenerateDevisInput): Promise<Result<Devis>> {
  const validation = createDevisSchema.safeParse(input);
  if (!validation.success) {
    return { ok: false, error: new ValidationError(validation.error) };
  }

  const quantityItems = await fetchQuantityItems(input.projectId);
  if (!quantityItems.ok) return quantityItems;

  const pricedItems = await applyUnitPrices(quantityItems.value, input.priceLibraryId);
  if (!pricedItems.ok) return pricedItems;

  return { ok: true, value: buildDevis(pricedItems.value) };
}
```

### 5.5 Zod Schema Colocation

Every API request/response shape has a corresponding Zod schema in `lib/validation/`.

```typescript
// lib/validation/devis.ts
import { z } from 'zod';

export const createDevisSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(3).max(200),
  lotIds: z.array(z.string().uuid()).min(1, 'At least one lot is required'),
  priceLibraryId: z.string().uuid().optional(),
  currency: z.enum(['MAD', 'EUR', 'USD']).default('MAD'),
  vatRate: z.number().min(0).max(1).default(0.20),
  validityDays: z.number().int().min(1).max(365).default(30),
  notes: z.string().max(5000).optional(),
});

export type CreateDevisInput = z.infer<typeof createDevisSchema>;
```

---

## 6. Python Standards

### 6.1 Configuration

All Python services use Python 3.12+. Dependency management via `uv`. Type checking via `mypy` strict.

```toml
[tool.mypy]
python_version = "3.12"
strict = true
disallow_untyped_defs = true
disallow_any_explicit = true
warn_return_any = true
warn_unused_ignores = true

[tool.ruff]
target-version = "py312"
line-length = 100
select = ["E", "W", "F", "I", "N", "UP", "ANN", "S", "B", "A", "C4", "DTZ", "T20", "RET", "SIM"]
```

### 6.2 Pydantic Models

All data contracts in the AI service are Pydantic v2 models. No raw dicts cross service boundaries.

```python
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

class QuantityItem(BaseModel):
    id: UUID
    tenant_id: UUID
    document_id: UUID
    designation: str = Field(min_length=1, max_length=500)
    unit: str = Field(pattern=r'^[A-Za-z\xc0-\xff\xb2\xb3/]+$')
    quantity: Decimal = Field(gt=Decimal('0'))
    unit_price: Decimal | None = Field(default=None, ge=Decimal('0'))
    lot_code: str | None = None
    page_reference: int | None = Field(default=None, ge=1)
    confidence_score: float = Field(ge=0.0, le=1.0)
    extracted_at: datetime

    @field_validator('quantity', mode='before')
    @classmethod
    def parse_quantity(cls, v: object) -> Decimal:
        if isinstance(v, str):
            return Decimal(v.replace(',', '.'))
        if isinstance(v, (int, float)):
            return Decimal(str(v))
        if isinstance(v, Decimal):
            return v
        raise ValueError(f'Cannot parse quantity from {type(v)}')
```

### 6.3 Async Patterns

FastAPI endpoints are always `async`. Long-running tasks are dispatched to background workers.

```python
from fastapi import APIRouter, BackgroundTasks, Depends, status
from app.models.document import OcrRequest, OcrJobResponse

router = APIRouter(prefix="/v1/ocr", tags=["ocr"])

@router.post("/process", response_model=OcrJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def process_document(
    request: OcrRequest,
    background_tasks: BackgroundTasks,
    tenant: TenantContext = Depends(get_current_tenant),
    ocr_service: OcrPipelineService = Depends(),
) -> OcrJobResponse:
    """
    Submit a PDF document for OCR processing.
    Returns a job ID for polling. Processing typically completes in 30-120 seconds.
    """
    job = await ocr_service.create_job(
        document_id=request.document_id,
        tenant_id=tenant.tenant_id,
    )
    background_tasks.add_task(
        ocr_service.process_async,
        job_id=job.id,
        document_id=request.document_id,
        tenant_id=tenant.tenant_id,
    )
    return OcrJobResponse(job_id=job.id, status="queued", estimated_seconds=60)
```

### 6.4 Decimal Arithmetic

**Never use `float` for quantities, areas, volumes, or costs.**

```python
from decimal import Decimal, ROUND_HALF_UP, getcontext

getcontext().prec = 28

def calculate_lot_total(items: list[QuantityItem]) -> Decimal:
    """Calculate total cost for a lot with proper decimal arithmetic."""
    total = Decimal('0')
    for item in items:
        if item.unit_price is None:
            continue
        total += item.quantity * item.unit_price
    return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def apply_vat(subtotal: Decimal, vat_rate: Decimal) -> Decimal:
    """Apply VAT with banker's rounding per Moroccan fiscal rules."""
    return (subtotal * vat_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
```

---

## 7. SQL & Database Standards

### 7.1 Schema Design Principles

- Every table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Every tenant-scoped table: `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- Every table: `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Soft deletes via `deleted_at TIMESTAMPTZ` — never `DELETE` business records
- All monetary amounts: `NUMERIC(15, 4)` — never `FLOAT` or `DOUBLE PRECISION`
- All quantities: `NUMERIC(18, 6)` for BTP measurement precision

### 7.2 Table Template

```sql
CREATE TABLE quantity_items (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID          NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    document_id    UUID          NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    project_id     UUID          NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    designation    TEXT          NOT NULL CHECK (char_length(designation) BETWEEN 1 AND 1000),
    unit           VARCHAR(20)   NOT NULL,
    quantity       NUMERIC(18,6) NOT NULL CHECK (quantity > 0),
    unit_price     NUMERIC(15,4) CHECK (unit_price >= 0),
    lot_code       VARCHAR(50),
    page_reference INTEGER       CHECK (page_reference > 0),
    confidence_score NUMERIC(4,3) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    source         VARCHAR(50)   NOT NULL DEFAULT 'ocr',
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ,
    created_by     UUID          NOT NULL REFERENCES users(id),
    version        INTEGER       NOT NULL DEFAULT 1,

    CONSTRAINT chk_quantity_items_source CHECK (source IN ('ocr', 'manual', 'import', 'bim'))
);

CREATE INDEX idx_quantity_items_tenant_id    ON quantity_items(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quantity_items_project_id   ON quantity_items(project_id, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quantity_items_document_id  ON quantity_items(document_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_quantity_items_updated_at
    BEFORE UPDATE ON quantity_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE quantity_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY quantity_items_tenant_isolation ON quantity_items
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 7.3 Migration Standards

All migrations are numbered sequentially and idempotent.

```sql
-- migrations/V002__add_bim_integration.sql
-- Description: Add BIM model reference to projects for IFC file linkage
-- Author: engineering@engipilot.ma
-- Date: 2025-11-01
-- Rollback: V002__add_bim_integration_rollback.sql

BEGIN;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS bim_model_id UUID REFERENCES bim_models(id),
    ADD COLUMN IF NOT EXISTS bim_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS bim_last_sync_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_bim_model_id
    ON projects(bim_model_id) WHERE bim_model_id IS NOT NULL;

COMMIT;
```

### 7.4 Query Patterns

**Always use parameterized queries.** SQL injection is never acceptable.

```python
# WRONG
query = f"SELECT * FROM projects WHERE tenant_id = '{tenant_id}'"

# CORRECT (SQLAlchemy)
stmt = (
    select(Project)
    .where(
        and_(
            Project.tenant_id == tenant_id,
            Project.deleted_at.is_(None),
        )
    )
    .order_by(Project.created_at.desc())
    .limit(50)
)
```

### 7.5 Connection Pooling (DigitalOcean 4GB target)

```python
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)
```

---

## 8. React Standards

### 8.1 Component Architecture

| Layer | Location | Purpose |
|---|---|---|
| **Page** | `app/(dashboard)/*/page.tsx` | Data fetching (RSC), layout composition |
| **Feature** | `components/btp/` | Domain-specific composed components |
| **UI Primitive** | `components/ui/` | Shadcn/ui wrappers, design system atoms |
| **AI** | `components/ai/` | Streaming, chat, agent UI components |

### 8.2 Server vs Client Components

Default to **Server Components**. Add `'use client'` only when the component uses React state, browser APIs, event handlers, or client-only third-party libraries.

```tsx
// CORRECT: Server Component fetches data
// app/(dashboard)/projects/[id]/metrages/page.tsx
import { MetrageTable } from '@/components/btp/MetrageTable';
import { getMetrageItems } from '@/lib/api/server/metrages';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MetragePage({ params }: Props) {
  const { id } = await params;
  const items = await getMetrageItems(id);
  if (!items) notFound();

  return (
    <div className="space-y-6">
      <MetrageHeader projectId={id} itemCount={items.length} />
      <MetrageTable items={items} projectId={id} />
    </div>
  );
}
```

```tsx
// CORRECT: Client Component for interactive table
'use client';
import { useState, useCallback } from 'react';
import type { QuantityItem } from '@/types/btp';

interface MetrageTableProps {
  items: QuantityItem[];
  projectId: string;
}

export function MetrageTable({ items, projectId }: MetrageTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // render table...
}
```

### 8.3 Data Fetching with React Query

```tsx
// hooks/useMetrage.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { QuantityItem, CreateQuantityItemInput } from '@/types/btp';

export const metrageKeys = {
  all: ['metrages'] as const,
  project: (projectId: string) => ['metrages', 'project', projectId] as const,
};

export function useMetrageItems(projectId: string) {
  return useQuery({
    queryKey: metrageKeys.project(projectId),
    queryFn: () => apiClient.get<QuantityItem[]>(`/projects/${projectId}/metrages`),
    staleTime: 30_000,
  });
}

export function useCreateMetrageItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateQuantityItemInput) =>
      apiClient.post<QuantityItem>(`/projects/${projectId}/metrages`, input),
    onSuccess: (newItem) => {
      queryClient.setQueryData(
        metrageKeys.project(projectId),
        (old: QuantityItem[] | undefined) => old ? [...old, newItem] : [newItem]
      );
    },
  });
}
```

### 8.4 Form Handling

All forms use **React Hook Form** + **Zod** resolver.

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDevisSchema, type CreateDevisInput } from '@/lib/validation/devis';
import { useCreateDevis } from '@/hooks/useDevis';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function CreateDevisForm({ projectId }: { projectId: string }) {
  const { mutate, isPending } = useCreateDevis(projectId);

  const form = useForm<CreateDevisInput>({
    resolver: zodResolver(createDevisSchema),
    defaultValues: { projectId, currency: 'MAD', vatRate: 0.20, validityDays: 30 },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(data => mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du devis</FormLabel>
              <FormControl>
                <Input placeholder="Devis TCE - Immeuble R+4 Casablanca" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Generation en cours...' : 'Generer le devis'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 9. Next.js Standards

### 9.1 App Router Conventions

- Route groups `(auth)` and `(dashboard)` organize layouts without affecting URLs.
- `loading.tsx` is required for every page that fetches data.
- `error.tsx` is required for every route segment with async data fetching.
- `not-found.tsx` is required at the `app/` root.

### 9.2 Edge Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtEdge } from '@/lib/auth/edge';

const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/_next', '/favicon.ico'];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('engipilot_auth_token')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyJwtEdge(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('engipilot_auth_token');
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', payload.tenantId);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/((?!auth).*)'],
};
```

### 9.3 Route Handlers

Route handlers are thin orchestration layers. Business logic lives in service modules.

```typescript
// app/api/v1/projects/[id]/metrages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { MetrageService } from '@/lib/services/MetrageService';
import { createQuantityItemSchema } from '@/lib/validation/metrage';

export const POST = withTenantContext(async (request: NextRequest, context) => {
  const body = await request.json();
  const parsed = createQuantityItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await MetrageService.create({
    ...parsed.data,
    tenantId: context.tenantId,
    createdBy: context.userId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.userMessage },
      { status: result.error.httpStatus }
    );
  }

  return NextResponse.json(result.value, { status: 201 });
});
```

### 9.4 Streaming AI Responses

```typescript
// app/api/v1/ai/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { withTenantContext } from '@/lib/api/middleware';

export const POST = withTenantContext(async (request, context) => {
  const { messages, projectId } = await request.json();
  const projectContext = await fetchProjectContext(projectId, context.tenantId);

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildConstructionSystemPrompt(projectContext),
    messages,
    maxTokens: 4096,
    onFinish: async ({ usage }) => {
      await logAiInteraction({
        tenantId: context.tenantId,
        userId: context.userId,
        projectId,
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
      });
    },
  });

  return result.toDataStreamResponse();
});
```

---

## 10. REST API Standards

### 10.1 URL Design

- Use **plural nouns** for resource collections: `/projects`, `/documents`
- Use **kebab-case** for multi-word resources: `/quantity-items`
- Nest resources at most **2 levels** deep
- Version all APIs: `/api/v1/`

```
GET    /api/v1/projects                          list projects
POST   /api/v1/projects                          create project
GET    /api/v1/projects/{id}                     get project
PATCH  /api/v1/projects/{id}                     partial update
DELETE /api/v1/projects/{id}                     soft delete
GET    /api/v1/projects/{id}/documents           list project documents
POST   /api/v1/projects/{id}/documents/upload    upload document
GET    /api/v1/projects/{id}/metrages            list quantity items
POST   /api/v1/projects/{id}/metrages/generate   trigger AI extraction
GET    /api/v1/projects/{id}/devis               list devis
POST   /api/v1/projects/{id}/devis/generate      generate devis
GET    /api/v1/documents/{id}/ocr-status         poll OCR job
```

### 10.2 Response Envelope

```typescript
// Success collection
{
  "data": [...],
  "pagination": { "total": 142, "page": 1, "pageSize": 25, "totalPages": 6 },
  "meta": { "requestId": "req_01HWXYZ...", "processingTimeMs": 43 }
}

// Success single
{
  "data": { "id": "...", "designation": "Beton C25/30", ... },
  "meta": { "requestId": "req_01HWXYZ..." }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La quantite doit etre superieure a zero",
    "details": { "field": "quantity", "received": -5, "constraint": "gt:0" },
    "requestId": "req_01HWXYZ..."
  }
}
```

### 10.3 HTTP Status Codes

| Scenario | Code |
|---|---|
| Successful read | 200 |
| Resource created | 201 |
| Async accepted | 202 |
| No content (DELETE) | 204 |
| Validation error | 400 |
| Unauthenticated | 401 |
| Insufficient permissions | 403 |
| Not found | 404 |
| Business rule violation | 422 |
| Rate limited | 429 |
| Internal error | 500 |
| AI service unavailable | 503 |

### 10.4 Cursor-Based Pagination

```typescript
// Query: GET /api/v1/projects?limit=25&cursor=<base64_cursor>
interface PaginationParams {
  limit?: number;    // Default 25, max 100
  cursor?: string;   // Base64-encoded { id, createdAt }
  sortBy?: 'created_at' | 'updated_at' | 'name';
  sortDir?: 'asc' | 'desc';
}
```

---

## 11. Error Handling

### 11.1 Error Taxonomy

```typescript
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly userMessage: string;
  readonly context?: Record<string, unknown>;

  constructor(message: string, options: {
    userMessage?: string;
    context?: Record<string, unknown>;
    cause?: Error;
  }) {
    super(message, { cause: options.cause });
    this.userMessage = options.userMessage ?? message;
    this.context = options.context;
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = 400;
}

export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly httpStatus = 401;
}

export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly httpStatus = 403;
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;
}

export class BusinessRuleError extends AppError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly httpStatus = 422;
}

export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly httpStatus = 503;
}

// BTP-specific errors
export class PdfProcessingError extends AppError {
  readonly code = 'PDF_PROCESSING_ERROR';
  readonly httpStatus = 422;
}

export class MetrageCalculationError extends AppError {
  readonly code = 'METRAGE_CALCULATION_ERROR';
  readonly httpStatus = 422;
}
```

### 11.2 Python Error Handling

```python
from fastapi import Request
from fastapi.responses import JSONResponse

class EngiPilotException(Exception):
    def __init__(
        self,
        message: str,
        code: str,
        http_status: int,
        user_message: str | None = None,
        context: dict | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.http_status = http_status
        self.user_message = user_message or message
        self.context = context or {}

class OcrExtractionError(EngiPilotException):
    def __init__(self, message: str, document_id: str, page: int | None = None) -> None:
        super().__init__(
            message=message,
            code="OCR_EXTRACTION_ERROR",
            http_status=422,
            user_message="L'extraction du document a echoue. Verifiez la qualite du PDF.",
            context={"document_id": document_id, "page": page},
        )

async def engipilot_exception_handler(
    request: Request,
    exc: EngiPilotException,
) -> JSONResponse:
    logger.error(
        "Application error",
        extra={
            "error_code": exc.code,
            "context": exc.context,
            "path": str(request.url),
        },
    )
    return JSONResponse(
        status_code=exc.http_status,
        content={"error": {"code": exc.code, "message": exc.user_message}},
    )
```

---

## 12. Validation

### 12.1 Validation Layers

Validation is applied at **three layers** — never skip any:

1. **Frontend** (Zod + React Hook Form): Immediate user feedback before API call.
2. **API Gateway** (Route Handler / FastAPI): Sanitize and validate all inputs.
3. **Domain** (Service layer): Business rule validation.

### 12.2 BTP-Specific Validation

```typescript
// lib/validation/btp.ts

// Surface: 0.01 to 50,000 m² (realistic for BTP)
export const surfaceAreaSchema = z
  .number()
  .positive('La surface doit etre positive')
  .max(50_000, 'Surface superieure a 50 000 m2 - verifiez la valeur');

// Unit price in MAD
export const unitPriceSchema = z
  .number()
  .min(0.01, 'Le prix unitaire doit etre superieur a 0')
  .max(500_000, 'Prix unitaire inhabituellement eleve - verifiez');

// BTP standard units
const BTP_UNITS = ['m2', 'm3', 'm', 'ml', 'kg', 't', 'u', 'ens', 'ff', 'h', 'jours'] as const;
export const btpUnitSchema = z.string().refine(
  (val) => BTP_UNITS.some(u => val.toLowerCase() === u),
  (val) => ({ message: `Unite "${val}" non reconnue. Unites valides: ${BTP_UNITS.join(', ')}` })
);
```

---

## 13. Authentication & Authorization

### 13.1 JWT Configuration

- Algorithm: **RS256** (asymmetric — private key signs, public key verifies)
- Access token TTL: **15 minutes**
- Refresh token TTL: **7 days** (httpOnly cookie, sliding window rotation)
- Token storage: `engipilot_auth_token` cookie (non-httpOnly for Edge middleware) + localStorage fallback
- Account lockout: 5 failed attempts → 15-minute lockout

### 13.2 Role-Based Access Control

```typescript
export enum UserRole {
  TENANT_OWNER    = 'TENANT_OWNER',     // Full access, billing, team management
  PROJECT_MANAGER = 'PROJECT_MANAGER',  // Create/edit projects, manage members
  ENGINEER        = 'ENGINEER',         // Create/edit metrages, devis, documents
  VIEWER          = 'VIEWER',           // Read-only access
  AI_ANALYST      = 'AI_ANALYST',       // Full AI feature access, export
}

export const ROLE_PERMISSIONS = {
  [UserRole.TENANT_OWNER]:    ['*'],
  [UserRole.PROJECT_MANAGER]: ['projects:*', 'documents:*', 'metrages:*', 'devis:*', 'ai:*'],
  [UserRole.ENGINEER]:        ['projects:read', 'documents:*', 'metrages:*', 'devis:create', 'ai:use'],
  [UserRole.VIEWER]:          ['projects:read', 'documents:read', 'metrages:read', 'devis:read'],
  [UserRole.AI_ANALYST]:      ['projects:read', 'documents:*', 'metrages:*', 'devis:*', 'ai:*', 'reports:*'],
} as const;
```

### 13.3 Permission Guard

```typescript
export function requirePermission(permission: string) {
  return function (_target: object, _key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const context = getCurrentTenantContext();
      if (!hasPermission(context.userRole, permission)) {
        throw new AuthorizationError(
          `Role ${context.userRole} lacks permission: ${permission}`,
          { userMessage: "Vous n'avez pas les droits pour effectuer cette action." }
        );
      }
      return original.apply(this, args);
    };
    return descriptor;
  };
}
```

---

## 14. Logging & Observability

### 14.1 Structured Logging — TypeScript

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'engipilot-frontend',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  redact: {
    paths: ['*.password', '*.token', '*.apiKey', 'req.headers.authorization'],
    censor: '[REDACTED]',
  },
});

// Usage example
logger.info(
  {
    tenantId: context.tenantId,
    userId: context.userId,
    projectId,
    operation: 'metrage_extraction_started',
    durationMs: Date.now() - startTime,
  },
  'OCR extraction started for document'
);
```

### 14.2 Structured Logging — Python

```python
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Usage example
logger.info(
    "ocr_extraction_complete",
    document_id=str(document_id),
    tenant_id=str(tenant_id),
    items_extracted=len(quantity_items),
    confidence_avg=round(avg_confidence, 3),
    duration_ms=duration_ms,
)
```

### 14.3 Request Tracing

Every HTTP request gets a `requestId` in the first middleware layer. This ID propagates through all service calls and appears in every log entry.

```typescript
apiClient.interceptors.request.use((config) => {
  config.headers['X-Request-Id'] = crypto.randomUUID();
  config.headers['X-Tenant-Id'] = getTenantId();
  return config;
});
```

### 14.4 Key Metrics

| Metric | Type | Alert Threshold |
|---|---|---|
| `api_request_duration_ms` | Histogram | P95 > 300ms |
| `ai_request_duration_ms` | Histogram | P95 > 25s |
| `ocr_extraction_success_rate` | Gauge | < 90% |
| `database_query_duration_ms` | Histogram | P95 > 100ms |
| `kafka_consumer_lag` | Gauge | > 1000 messages |
| `error_rate_5xx` | Counter | > 1% of requests |
| `jwt_validation_failures` | Counter | > 10/min (possible attack) |

---

## 15. Performance

### 15.1 Frontend Performance Budget

| Metric | Target | Hard Limit |
|---|---|---|
| LCP | < 2.0s | < 2.5s |
| INP | < 100ms | < 200ms |
| CLS | < 0.05 | < 0.1 |
| JS Bundle (initial) | < 100KB gzip | < 150KB gzip |
| Time to Interactive | < 3.0s | < 4.0s |

### 15.2 Caching Strategy

```typescript
// Redis cache keys: <service>:<entity>:<id>[:<subkey>]
export const CACHE_KEYS = {
  projectSummary:  (id: string) => `backend:project:${id}:summary`,
  metrageSummary:  (projectId: string) => `backend:project:${projectId}:metrage-summary`,
  pricingLibrary:  (id: string) => `ai:pricing-library:${id}`,
  tenantConfig:    (tenantId: string) => `backend:tenant:${tenantId}:config`,
} as const;

export const CACHE_TTL = {
  projectSummary: 5 * 60,    // 5 min — changes on edit
  metrageSummary: 2 * 60,    // 2 min — changes on OCR completion
  pricingLibrary: 60 * 60,   // 1 hour — rarely changes
  tenantConfig:   15 * 60,   // 15 min
} as const;
```

### 15.3 Database Query Optimization

```sql
-- Always use EXPLAIN ANALYZE before adding any index
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT qi.*, p.name AS project_name
FROM quantity_items qi
JOIN projects p ON p.id = qi.project_id
WHERE qi.tenant_id = $1
  AND qi.project_id = $2
  AND qi.deleted_at IS NULL
ORDER BY qi.created_at DESC
LIMIT 100;

-- All queries on quantity_items MUST use the tenant_id + project_id composite index
-- Never run unbounded queries in production — always LIMIT
```

---

## 16. Security & OWASP

### 16.1 OWASP Top 10 Mitigations

**A01 — Broken Access Control**
- RLS on all tenant-scoped tables (see §7.2)
- Permission checks before every service method (see §13.3)
- Never expose auto-increment integer IDs — use UUIDs exclusively

**A02 — Cryptographic Failures**
- Passwords hashed with bcrypt (cost factor 12 minimum)
- All traffic encrypted with TLS 1.3
- Database connections over SSL enforced
- Secrets never in code (see §17)

**A03 — Injection**
- Parameterized queries exclusively via SQLAlchemy ORM / JPA
- Zod/Pydantic validation on all inputs before any processing
- File uploads: content-type verified, not just extension checked

**A04 — Insecure Design**
- LLM prompt injection defense (see §16.3)
- Rate limiting on all AI endpoints: 20 req/min per tenant
- Audit logs for all financial data mutations

**A05 — Security Misconfiguration**
- Nginx security headers on all responses (see §16.2)
- Docker containers run as non-root user `engipilot` (uid 1001)
- PostgreSQL: application user has no SUPERUSER, no CREATE DATABASE rights

**A07 — Authentication Failures**
- JWT RS256 asymmetric signing — not HS256
- Refresh token rotation on every use
- Account lockout after 5 failed logins (15-minute window)
- MFA available for TENANT_OWNER and PROJECT_MANAGER roles

**A09 — Security Logging Failures**
- Log all authentication events with source IP
- Log all authorization failures with attempted resource
- Alert on >100 requests/min from single IP to auth endpoints

**A10 — SSRF**
- Whitelist allowed domains for any URL-based user input
- AI webhook callbacks validated against known sources only

### 16.2 Required HTTP Security Headers

```nginx
# nginx/conf.d/security-headers.conf
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.anthropic.com; frame-ancestors 'none';" always;
```

### 16.3 LLM Prompt Injection Prevention

```python
# ai-service/app/services/llm/prompt_safety.py
import re
from typing import Final

INJECTION_PATTERNS: Final[list[str]] = [
    r'ignore\s+previous\s+instructions',
    r'ignore\s+all\s+above',
    r'you\s+are\s+now\s+in\s+developer\s+mode',
    r'system\s+prompt',
    r'jailbreak',
    r'<\|im_start\|>',
    r'<\|system\|>',
]

def sanitize_user_input(text: str) -> str:
    """
    Defense-in-depth sanitization for user text included in LLM context.
    Primary protection is system prompt hardening — this is secondary.
    """
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            raise PromptInjectionError(
                "Potentially malicious input detected",
                user_message="Entree non valide detectee.",
            )
    # Truncate to prevent token exhaustion attacks
    return text[:10_000]
```

---

## 17. Secrets & Environment Variables

### 17.1 Secret Classification

| Level | Examples | Storage |
|---|---|---|
| **Critical** | DB passwords, JWT private key, API keys | DigitalOcean Secrets / `.env.production` (never git) |
| **Sensitive** | OAuth secrets, webhook signing keys | `.env.production` (never git) |
| **Configuration** | Feature flags, timeouts, URLs | `.env.*` (non-prod can be in git) |
| **Public** | Next.js `NEXT_PUBLIC_*` variables | `.env` (git-safe) |

### 17.2 Environment Variable Schema

```typescript
// lib/env.ts — crashes at startup if required vars are missing
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:             z.enum(['development', 'staging', 'production']),
  PORT:                 z.string().default('3000'),
  APP_VERSION:          z.string().default('0.0.0'),
  JWT_PUBLIC_KEY:       z.string().min(100, 'JWT public key required'),
  NEXTAUTH_SECRET:      z.string().min(32),
  NEXTAUTH_URL:         z.string().url(),
  BACKEND_API_URL:      z.string().url(),
  AI_SERVICE_URL:       z.string().url(),
  INTERNAL_API_SECRET:  z.string().min(32),
  ANTHROPIC_API_KEY:    z.string().startsWith('sk-ant-'),
  OPENAI_API_KEY:       z.string().startsWith('sk-').optional(),
  DO_SPACES_ENDPOINT:   z.string().url(),
  DO_SPACES_BUCKET:     z.string(),
  DO_SPACES_KEY:        z.string(),
  DO_SPACES_SECRET:     z.string(),
  LOG_LEVEL:            z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  NEXT_PUBLIC_APP_URL:  z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### 17.3 `.gitignore` Rules

```gitignore
# Secrets
.env.production
.env.staging
.env.local
*.env.local
*.pem
*.key
*.p12
*.pfx
secrets/
```

---

## 18. Docker & Infrastructure

### 18.1 Dockerfile Standards

Multi-stage builds, non-root users, health checks required on every service.

```dockerfile
# apps/ai-service/Dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

FROM base AS builder
RUN pip install uv
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

FROM base AS production
RUN groupadd --gid 1001 engipilot && \
    useradd --uid 1001 --gid engipilot --shell /bin/bash --create-home engipilot

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --chown=engipilot:engipilot ./app /app/app

USER engipilot:engipilot

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

### 18.2 Docker Compose Production

```yaml
# infrastructure/docker/docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:1.27-alpine
    container_name: engipilot-nginx
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - certbot-webroot:/var/www/certbot:ro
      - certbot-certs:/etc/letsencrypt:ro
    networks: [engipilot-public, engipilot-internal]
    restart: unless-stopped
    depends_on: [frontend, backend]

  frontend:
    image: engipilot/frontend:${APP_VERSION}
    container_name: engipilot-frontend
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - BACKEND_API_URL=http://backend:8080
      - AI_SERVICE_URL=http://ai-service:8000
    networks: [engipilot-internal]
    restart: unless-stopped
    deploy:
      resources:
        limits: { memory: 512M }
        reservations: { memory: 256M }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  backend:
    image: engipilot/backend:${APP_VERSION}
    container_name: engipilot-backend
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/${POSTGRES_DB}
    networks: [engipilot-internal]
    restart: unless-stopped
    deploy:
      resources:
        limits: { memory: 768M }
        reservations: { memory: 512M }
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }

  ai-service:
    image: engipilot/ai-service:${APP_VERSION}
    container_name: engipilot-ai-service
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    networks: [engipilot-internal]
    restart: unless-stopped
    deploy:
      resources:
        limits: { memory: 512M }
        reservations: { memory: 256M }

  postgres:
    image: pgvector/pgvector:pg15
    container_name: engipilot-postgres
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - engipilot-postgres-data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    networks: [engipilot-internal]
    restart: unless-stopped
    command: >
      postgres
        -c shared_buffers=128MB
        -c effective_cache_size=384MB
        -c work_mem=4MB
        -c maintenance_work_mem=32MB
        -c max_connections=50
        -c log_min_duration_statement=500
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.4-alpine
    container_name: engipilot-redis
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru --save ""
    volumes: [engipilot-redis-data:/data]
    networks: [engipilot-internal]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  engipilot-public: { driver: bridge }
  engipilot-internal: { driver: bridge, internal: true }

volumes:
  engipilot-postgres-data:
  engipilot-redis-data:
  certbot-webroot:
  certbot-certs:
```

### 18.3 Nginx Container Operations

All Nginx operations inside Docker use `docker exec`. **Never use `systemctl`** for containerized Nginx.

```bash
# Validate and reload config
docker exec engipilot-nginx nginx -t && docker exec engipilot-nginx nginx -s reload

# Test config without reloading
docker exec engipilot-nginx nginx -t

# Certbot post-renewal hook: /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
#!/bin/bash
docker exec engipilot-nginx nginx -s reload
```

### 18.4 Backup & Restore

```bash
# infrastructure/scripts/backup.sh
#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="engipilot_db_${TIMESTAMP}.sql.gz"

docker exec engipilot-postgres pg_dump \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --no-password \
    --format=plain \
    --no-acl \
    --no-owner \
  | gzip > "/backups/${BACKUP_FILE}"

# Upload to DO Spaces
s3cmd put "/backups/${BACKUP_FILE}" \
    "s3://engipilot-backups/postgres/${BACKUP_FILE}" \
    --server-side-encryption

echo "Backup complete: ${BACKUP_FILE}"
```

---

## 19. CI/CD & GitHub Actions

### 19.1 Branch Protection Rules

- `main`: requires 2 approvals, all CI checks pass, no direct pushes
- `develop`: requires 1 approval, CI must pass
- `release/*`: protected, only release manager can push

### 19.2 CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [develop, 'feature/**', 'fix/**', 'release/**']
  pull_request:
    branches: [develop, main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r run lint
      - run: pnpm -r run typecheck

  test-frontend:
    name: Frontend Tests
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter frontend run test:ci
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: frontend-coverage
          path: apps/frontend/coverage/

  test-ai-service:
    name: AI Service Tests
    runs-on: ubuntu-24.04
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_DB: engipilot_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install uv && uv pip install --system -r apps/ai-service/requirements-dev.txt
      - run: pytest apps/ai-service/tests/ -v --cov=app --cov-report=xml
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/engipilot_test
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY_TEST }}

  security-scan:
    name: Security Scan
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - name: Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
      - name: pip-audit
        run: pip install pip-audit && pip-audit -r apps/ai-service/requirements.txt

  build:
    name: Build Docker Images
    needs: [lint-typecheck, test-frontend, test-ai-service]
    runs-on: ubuntu-24.04
    if: github.ref == 'refs/heads/develop' || startsWith(github.ref, 'refs/heads/release/')
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: apps/frontend
          push: true
          tags: engipilot/frontend:${{ github.sha }},engipilot/frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 20. Git & Branching Strategy

### 20.1 Branch Naming

```
main                                       production
develop                                    integration branch
feature/<ticket-id>-<description>          e.g., feature/ENG-142-ocr-pdf-extraction
fix/<ticket-id>-<description>              e.g., fix/ENG-187-decimal-rounding-error
release/<semver>                           e.g., release/1.4.0
hotfix/<ticket-id>-<description>           e.g., hotfix/ENG-201-critical-auth-bypass
chore/<description>                        e.g., chore/upgrade-langchain-0-2
```

### 20.2 Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

**Scopes:** `frontend`, `backend`, `ai-service`, `postgres`, `docker`, `auth`, `ocr`, `metrage`, `devis`, `chantier`, `bim`

**Example:**
```
feat(ocr): add multi-page PDF support for plan extraction

Implements batch processing for PDFs with more than 50 pages.
Splits PDF into chunks of 10 pages, processes chunks in parallel
(max 3 concurrent), then merges results with deduplication.

Closes #ENG-142
BREAKING CHANGE: OcrRequest.pageLimit field removed
```

### 20.3 Pull Request Requirements

- Every PR references a ticket: `Closes #ENG-XXX`
- PRs touching AI prompts include before/after examples with evaluation results
- PRs touching database schema include rollback migration
- Maximum PR size: 400 lines changed (excluding generated files and test fixtures)
- PR description must cover: What changed, Why it changed, How to test it

---

## 21. Testing Strategy

### 21.1 Test Pyramid

```
         /\
        /  \  E2E (Playwright) -- ~20 tests, critical flows only
       /----\
      /      \  Integration -- ~100 tests, API contracts, DB, Kafka
     /--------\
    /          \  Unit -- ~500 tests, business logic, calculations
   /------------\
```

### 21.2 Unit Test Standards — TypeScript

```typescript
// apps/frontend/src/lib/services/__tests__/devis.test.ts
import { describe, it, expect } from 'vitest';
import { calculateLotTotal } from '../devis';
import Decimal from 'decimal.js';

describe('calculateLotTotal', () => {
  it('returns zero for empty item list', () => {
    expect(calculateLotTotal([])).toEqual(new Decimal('0.00'));
  });

  it('correctly sums line totals with decimal precision', () => {
    const items = [
      { quantity: new Decimal('12.500'), unitPrice: new Decimal('125.50') },
      { quantity: new Decimal('8.333'), unitPrice: new Decimal('89.99') },
    ];
    // 12.500 x 125.50 = 1568.75
    // 8.333 x 89.99 = 749.9917 -> rounded to 749.99
    expect(calculateLotTotal(items)).toEqual(new Decimal('2318.74'));
  });

  it('skips items with null unit price', () => {
    const items = [
      { quantity: new Decimal('10'), unitPrice: new Decimal('100') },
      { quantity: new Decimal('5'), unitPrice: null },
    ];
    expect(calculateLotTotal(items)).toEqual(new Decimal('1000.00'));
  });

  it('handles 6-decimal-place quantities (BTP precision for concrete volumes)', () => {
    // Volume: 3.141593 m3 x 1850 MAD/m3
    const items = [{ quantity: new Decimal('3.141593'), unitPrice: new Decimal('1850.00') }];
    expect(calculateLotTotal(items)).toEqual(new Decimal('5811.95'));
  });
});
```

### 21.3 Unit Test Standards — Python

```python
# ai-service/tests/services/test_ocr_extraction.py
import pytest
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

from app.services.ocr.extraction import OcrExtractionService

@pytest.fixture
def sample_pdf_path() -> Path:
    return Path(__file__).parent / 'fixtures' / 'plan_beton_arme_r4.pdf'

@pytest.mark.asyncio
async def test_extract_quantities_returns_valid_items(sample_pdf_path: Path) -> None:
    service = OcrExtractionService()
    items = await service.extract_from_pdf(sample_pdf_path, tenant_id=uuid4())

    assert len(items) > 0
    for item in items:
        assert item.quantity > Decimal('0')
        assert item.designation.strip() != ''
        assert 0.0 <= item.confidence_score <= 1.0

@pytest.mark.asyncio
async def test_extract_quantities_uses_decimal_not_float(sample_pdf_path: Path) -> None:
    service = OcrExtractionService()
    items = await service.extract_from_pdf(sample_pdf_path, tenant_id=uuid4())

    for item in items:
        assert isinstance(item.quantity, Decimal), (
            f"quantity for '{item.designation}' must be Decimal, got {type(item.quantity)}"
        )
```

### 21.4 Integration Test Standards

```typescript
// Testing API contract with real PostgreSQL test instance
describe('POST /api/v1/projects/:id/metrages', () => {
  it('returns 201 with created item when input is valid', async () => {
    const { project, token } = await createTestProject();

    const response = await request(app)
      .post(`/api/v1/projects/${project.id}/metrages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        designation: 'Beton de proprete C16/20',
        unit: 'm3',
        quantity: '12.500',
        lotCode: '02',
        pageReference: 14,
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      designation: 'Beton de proprete C16/20',
      unit: 'm3',
      source: 'manual',
    });
    expect(response.body.data.id).toMatch(UUID_REGEX);
  });

  it('returns 403 when user has VIEWER role', async () => {
    const { project, viewerToken } = await createTestProjectWithViewer();

    const response = await request(app)
      .post(`/api/v1/projects/${project.id}/metrages`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ designation: 'Test', unit: 'm2', quantity: '5' });

    expect(response.status).toBe(403);
  });
});
```

### 21.5 E2E Test Standards (Playwright)

```typescript
// tests/e2e/devis-generation.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, createProjectWithMetrages } from './helpers';

test.describe('Devis Generation Flow', () => {
  test('engineer can generate devis from extracted metrages', async ({ page }) => {
    const { project } = await createProjectWithMetrages();
    await loginAs(page, 'engineer');

    await page.goto(`/dashboard/projects/${project.id}/devis`);
    await page.getByRole('button', { name: 'Generer un devis' }).click();
    await page.getByLabel('Titre du devis').fill('Devis TCE - Phase 1');
    await page.getByLabel('Validite').fill('45');
    await page.getByRole('button', { name: 'Generer' }).click();

    await expect(page.getByText('Devis genere avec succes')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('link', { name: 'Devis TCE - Phase 1' })).toBeVisible();
  });
});
```

---

## 22. AI Engineering Standards

### 22.1 LLM Provider Configuration

```python
# ai-service/app/services/llm/providers.py
from anthropic import AsyncAnthropic
from app.core.config import settings

anthropic_client = AsyncAnthropic(
    api_key=settings.ANTHROPIC_API_KEY,
    max_retries=3,
    timeout=60.0,
)

# Model selection by task complexity and cost
LLM_MODELS = {
    'document_analysis':  'claude-sonnet-4-6',        # Complex extraction
    'metrage_extraction': 'claude-sonnet-4-6',        # Quantity table parsing
    'devis_generation':   'claude-sonnet-4-6',        # Text generation
    'chat':               'claude-sonnet-4-6',        # Conversational AI
    'classification':     'claude-haiku-4-5-20251001', # Fast categorization
}
```

### 22.2 System Prompt Architecture

System prompts are versioned files — not inline strings.

```
ai-service/app/prompts/
├── v1/
│   ├── metrage_extraction.md
│   ├── devis_generation.md
│   ├── document_analysis.md
│   ├── anomaly_detection.md
│   └── construction_chat.md
└── README.md
```

Example prompt (`metrage_extraction.md`):

```markdown
# System Prompt: Quantity Takeoff Extraction (v1.3.0)

You are an expert quantity surveyor (metreur) specializing in French BTP construction norms.
Your task is to extract precise quantity takeoff (metre) data from construction document text.

## Context
- Documents are PDF plans, CCTP, or DPGF files from Moroccan construction projects
- Quantities follow NM (Normes Marocaines) and DTU (Documents Techniques Unifies)
- Monetary values are in MAD (Moroccan Dirham) unless specified otherwise

## Extraction Rules
1. Extract ONLY explicitly stated quantities — never infer or calculate
2. Preserve the exact unit as written (m2, m3, ml, u, ens, ff)
3. Use the lot numbering from the CCTP (01 Terrassement, 02 Gros Oeuvre, etc.)
4. Flag quantities with confidence < 0.8 (ambiguous text, poor scan)
5. Never round quantities — preserve full precision

## Output Format
Return ONLY valid JSON matching QuantityExtractionResult schema.
No explanations, no markdown outside the JSON object.

## Critical Constraints
- quantity MUST be a string decimal (not a number type)
- unit MUST be one of: m2, m3, m, ml, kg, t, u, ens, ff, h, jours
- confidence MUST be float between 0.0 and 1.0
- Omit uncertain values rather than guessing
```

### 22.3 LangChain Agent Architecture

```python
# ai-service/app/services/agents/construction_agent.py
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_anthropic import ChatAnthropic

def create_construction_analysis_agent(tenant_id: str, project_id: str) -> AgentExecutor:
    """
    Construction project analysis agent with access to project data.
    Can query metrages, calculate costs, and generate reports.
    """
    llm = ChatAnthropic(
        model='claude-sonnet-4-6',
        temperature=0,   # Deterministic for financial calculations
        max_tokens=8192,
    )

    tools = [
        SearchQuantityItemsTool(tenant_id=tenant_id, project_id=project_id),
        CalculateLotTotalTool(tenant_id=tenant_id, project_id=project_id),
        GenerateDevisReportTool(tenant_id=tenant_id, project_id=project_id),
        SearchBtpNormsTool(),
        GetProjectDocumentsTool(tenant_id=tenant_id, project_id=project_id),
    ]

    agent = create_tool_calling_agent(llm, tools, CONSTRUCTION_AGENT_PROMPT)

    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=False,
        max_iterations=10,
        early_stopping_method='generate',
        handle_parsing_errors=True,
    )
```

### 22.4 Token Budget Management

```python
from typing import Final

DAILY_TOKEN_BUDGETS: Final[dict[str, int]] = {
    'starter':      500_000,
    'professional': 5_000_000,
    'enterprise':   50_000_000,
}

async def check_token_budget(tenant_id: str, plan: str, estimated_tokens: int) -> bool:
    """Returns True if tenant has remaining budget for the operation."""
    daily_budget = DAILY_TOKEN_BUDGETS.get(plan, DAILY_TOKEN_BUDGETS['starter'])
    used_today = await get_daily_token_usage(tenant_id)
    return (used_today + estimated_tokens) <= daily_budget
```

### 22.5 Vector Search with pgvector

```python
# ai-service/app/services/embeddings/vector_store.py
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Text, Index

class DocumentChunk(Base):
    __tablename__ = 'document_chunks'

    id          = Column(UUID, primary_key=True, default=uuid4)
    tenant_id   = Column(UUID, nullable=False)
    document_id = Column(UUID, ForeignKey('documents.id'), nullable=False)
    content     = Column(Text, nullable=False)
    embedding   = Column(Vector(1536), nullable=False)  # text-embedding-3-small
    chunk_index = Column(Integer, nullable=False)
    metadata    = Column(JSONB, nullable=False, default=dict)

    __table_args__ = (
        Index(
            'idx_document_chunks_embedding',
            embedding,
            postgresql_using='ivfflat',
            postgresql_with={'lists': 100},
            postgresql_ops={'embedding': 'vector_cosine_ops'},
        ),
    )

async def semantic_search(
    query: str,
    tenant_id: UUID,
    top_k: int = 5,
    similarity_threshold: float = 0.7,
) -> list[DocumentChunk]:
    """Search document chunks by semantic similarity within tenant scope."""
    query_embedding = await embed_text(query)

    return await db.execute(
        select(DocumentChunk)
        .where(
            DocumentChunk.tenant_id == tenant_id,
            DocumentChunk.embedding.cosine_distance(query_embedding) < (1 - similarity_threshold),
        )
        .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )
```

### 22.6 MCP Integration

EngiPilot exposes internal tools via the Model Context Protocol for agent-to-agent communication.

```python
# ai-service/app/mcp/server.py
from mcp import Server, Tool, TextContent
from app.services.metrage import MetrageService

mcp_server = Server("engipilot-construction")

@mcp_server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_project_metrages",
            description="Retrieve all quantity items for a construction project",
            inputSchema={
                "type": "object",
                "properties": {
                    "project_id": {"type": "string", "description": "UUID of the project"},
                    "lot_code": {"type": "string", "description": "Filter by BTP lot code (e.g. '02')"},
                },
                "required": ["project_id"],
            },
        ),
        Tool(
            name="calculate_lot_total",
            description="Calculate total estimated cost for a specific lot",
            inputSchema={
                "type": "object",
                "properties": {
                    "project_id": {"type": "string"},
                    "lot_code": {"type": "string"},
                },
                "required": ["project_id", "lot_code"],
            },
        ),
    ]
```

---

## 23. OCR & Document Processing

### 23.1 Supported Document Types

| Type | Format | Processing Method |
|---|---|---|
| Architectural plans | PDF (vector) | pdfminer + Claude Vision |
| Scanned plans | PDF (raster) | Tesseract + Claude Vision |
| CCTP | DOCX, PDF | Unstructured + LLM extraction |
| DPGF | XLSX, PDF | pandas + LLM extraction |
| Appels d'offres | PDF | Unstructured + LLM summarization |
| BIM/IFC | IFC | IfcOpenShell + structured extraction |

### 23.2 OCR Pipeline

```python
from enum import Enum
from pathlib import Path
import fitz  # PyMuPDF

class DocumentType(Enum):
    VECTOR_PDF = 'vector_pdf'
    RASTER_PDF = 'raster_pdf'
    MIXED_PDF  = 'mixed_pdf'

async def detect_document_type(pdf_path: Path) -> DocumentType:
    """
    Determines if PDF has extractable text or requires raster OCR.
    Checks text extraction quality per page.
    """
    doc = fitz.open(str(pdf_path))
    text_pages = raster_pages = 0

    for page in doc:
        text = page.get_text().strip()
        if len(text) > 50:
            text_pages += 1
        else:
            raster_pages += 1

    doc.close()

    if raster_pages == 0:  return DocumentType.VECTOR_PDF
    if text_pages == 0:    return DocumentType.RASTER_PDF
    return DocumentType.MIXED_PDF

async def run_ocr_pipeline(
    pdf_path: Path,
    document_id: UUID,
    tenant_id: UUID,
) -> list[QuantityItem]:
    """
    Routes to appropriate extraction method, then uses Claude Vision
    for quantity table detection (highest accuracy).
    """
    doc_type = await detect_document_type(pdf_path)

    if doc_type == DocumentType.VECTOR_PDF:
        raw_text = await extract_text_from_vector_pdf(pdf_path)
    else:
        raw_text = await extract_text_via_tesseract(pdf_path)

    quantity_items = await extract_quantities_with_llm(
        raw_text=raw_text,
        pdf_path=pdf_path,
        document_id=document_id,
        tenant_id=tenant_id,
    )

    return [item for item in quantity_items if item.confidence_score >= OCR_CONFIDENCE_THRESHOLD]
```

### 23.3 Claude Vision for Plan Analysis

```python
async def analyze_construction_plan_page(
    page_image: bytes,
    page_number: int,
    document_context: DocumentContext,
) -> list[QuantityItem]:
    """
    Uses Claude Vision to analyze architectural plan pages.
    Extracts quantity tables, dimension annotations, and material schedules.
    """
    response = await anthropic_client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=4096,
        system=load_prompt('v1/metrage_extraction.md'),
        messages=[
            {
                'role': 'user',
                'content': [
                    {
                        'type': 'image',
                        'source': {
                            'type': 'base64',
                            'media_type': 'image/png',
                            'data': base64.b64encode(page_image).decode(),
                        },
                    },
                    {
                        'type': 'text',
                        'text': (
                            f'Page {page_number} du document: {document_context.title}\n'
                            f'Projet: {document_context.project_name}\n'
                            f'Extrayez tous les metres presents dans cette page.'
                        ),
                    },
                ],
            }
        ],
    )

    return parse_extraction_response(response.content[0].text, page_number)
```

---

## 24. BTP Domain Logic

### 24.1 Core Domain Entities

```typescript
// packages/shared-types/src/btp.ts

interface Project {
  id: string;
  tenantId: string;
  reference: string;     // e.g., "PRJ-2025-042"
  name: string;
  type: 'residential' | 'commercial' | 'infrastructure' | 'industrial';
  phase: 'studies' | 'procurement' | 'execution' | 'reception' | 'warranty';
  surface: Decimal;      // m2 total floor area
  lots: Lot[];
  budget: ProjectBudget;
}

interface Lot {
  code: string;          // e.g., "02" for Gros Oeuvre
  name: string;          // e.g., "Gros Oeuvre"
  description: string;
  items: QuantityItem[];
  subtotal: Decimal;     // MAD, auto-calculated
}

enum LotCode {
  TERRASSEMENT           = '01',
  GROS_OEUVRE            = '02',
  CHARPENTE_COUVERTURE   = '03',
  ETANCHEITE             = '04',
  MENUISERIES_EXT        = '05',
  MENUISERIES_INT        = '06',
  REVETEMENTS            = '07',
  PEINTURE               = '08',
  PLOMBERIE_SANITAIRE    = '09',
  ELECTRICITE            = '10',
  CHAUFFAGE_CLIMATISATION = '11',
  VRD                    = '12',
}
```

### 24.2 Cost Estimation Rules

```python
# Moroccan BTP regional cost indices (updated Q1 2025)
# Reference: BNPPC (Bordereau National des Prix des Prestations de Construction)
REGIONAL_COST_INDICES = {
    'casablanca': Decimal('1.00'),   # Reference city
    'rabat':      Decimal('0.98'),
    'marrakech':  Decimal('0.95'),
    'fes':        Decimal('0.92'),
    'agadir':     Decimal('0.90'),
    'tangier':    Decimal('0.97'),
}

def apply_regional_index(base_cost: Decimal, city: str) -> Decimal:
    """Apply regional cost index. All prices reference Casablanca (1.00)."""
    index = REGIONAL_COST_INDICES.get(city.lower(), Decimal('0.93'))
    return (base_cost * index).quantize(Decimal('0.01'))

def calculate_dpgf_total(lots: list[LotSummary], vat_rate: Decimal) -> DpgfTotal:
    """
    Calculate DPGF (Decomposition du Prix Global et Forfaitaire) total.
    Follows Moroccan public procurement rules (Decret 2-12-349).
    """
    ht_total = sum(lot.subtotal for lot in lots)
    vat_amount = (ht_total * vat_rate).quantize(Decimal('0.01'))
    return DpgfTotal(
        montant_ht=ht_total,
        taux_tva=vat_rate,
        montant_tva=vat_amount,
        montant_ttc=ht_total + vat_amount,
    )
```

### 24.3 Devis PDF Generation

```python
async def generate_devis_document(
    project_id: UUID,
    tenant_id: UUID,
    config: DevisConfig,
) -> bytes:
    """
    Generates a professional PDF devis following Moroccan BTP standards.
    Output: DPGF-formatted document with lot breakdown and signature block.
    """
    quantity_items = await fetch_quantity_items(project_id, tenant_id)
    priced_items = await apply_price_library(quantity_items, config.price_library_id)
    lots = group_items_by_lot(priced_items)
    total = calculate_dpgf_total(lots, config.vat_rate)

    buffer = BytesIO()
    doc = DevisDocument(buffer, project=project, config=config)
    doc.build(
        title_page=TitlePage(project=project, config=config),
        lot_sections=[LotSection(lot) for lot in lots],
        summary_page=SummaryPage(total=total),
        signature_block=SignatureBlock(config=config),
    )
    return buffer.getvalue()
```

### 24.4 Anomaly Detection for Chantier Supervision

```python
async def detect_cost_anomalies(
    chantier_id: UUID,
    tenant_id: UUID,
    week_number: int,
) -> list[CostAnomaly]:
    """
    Isolation Forest anomaly detection on weekly cost reports.
    Alerts when actual spending deviates significantly from planned budget.
    Documented result: 45,000 MAD saved on chantier C3 via early detection.
    """
    historical_weeks = await fetch_weekly_cost_reports(chantier_id, tenant_id)
    features = extract_cost_features(historical_weeks)

    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(features)

    current_week_features = extract_cost_features([historical_weeks[-1]])
    is_anomaly = model.predict(current_week_features)[0] == -1

    if is_anomaly:
        return analyze_anomaly_root_cause(historical_weeks[-1], historical_weeks[:-1])
    return []
```

---

## 25. File Management & Uploads

### 25.1 Upload Security Validation

```typescript
export const ALLOWED_MIME_TYPES = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ifc:  'application/x-step',  // BIM/IFC files
  png:  'image/png',
  jpg:  'image/jpeg',
} as const;

export const MAX_FILE_SIZES_MB = {
  pdf:  100,    // Large architectural plans
  docx: 25,
  xlsx: 25,
  ifc:  500,   // BIM models can be very large
  png:  20,
  jpg:  20,
} as const;

export function validateFileUpload(file: File): Result<void> {
  const allowedTypes = Object.values(ALLOWED_MIME_TYPES);
  if (!allowedTypes.includes(file.type as never)) {
    return { ok: false, error: new ValidationError(`Type de fichier non autorise: ${file.type}`) };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() as keyof typeof MAX_FILE_SIZES_MB;
  const maxSize = MAX_FILE_SIZES_MB[ext] ?? 10;
  if (file.size > maxSize * 1024 * 1024) {
    return { ok: false, error: new ValidationError(`Fichier trop volumineux. Maximum: ${maxSize}MB`) };
  }

  // Verify MIME type matches extension — defense against type spoofing
  const expectedType = ALLOWED_MIME_TYPES[ext];
  if (expectedType && file.type !== expectedType) {
    return { ok: false, error: new ValidationError("Type de fichier incompatible avec l'extension") };
  }

  return { ok: true, value: undefined };
}
```

### 25.2 Storage — DigitalOcean Spaces

```python
# Storage key enforces tenant isolation at path level
def generate_upload_key(tenant_id: str, document_id: str, filename: str) -> str:
    safe_filename = re.sub(r'[^a-zA-Z0-9.\-_]', '_', filename)
    return f"tenants/{tenant_id}/documents/{document_id}/{safe_filename}"

def generate_presigned_url(key: str, expiry_seconds: int = 3600) -> str:
    """Time-limited presigned URL for direct browser upload."""
    return s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': settings.DO_SPACES_BUCKET,
            'Key': key,
            'ContentType': 'application/pdf',
            'ServerSideEncryption': 'AES256',
        },
        ExpiresIn=expiry_seconds,
    )
```

---

## 26. Data Privacy & GDPR

### 26.1 PII Classification

| Category | Classification | Retention | Encryption |
|---|---|---|---|
| User names, emails | PII | Account + 3 years | Required |
| Company documents | Confidential Business | Project + 5 years (fiscal) | Required |
| Financial estimates | Confidential Financial | Project + 10 years (CGA Morocco) | Required |
| Audit logs | Compliance | 7 years minimum | Required |
| AI conversations | PII + Business | 2 years | Required |
| Usage analytics | Anonymized | Indefinite | Optional |

### 26.2 Data Retention

```sql
-- Nightly purge job (runs at 02:00 UTC)
CREATE OR REPLACE FUNCTION purge_expired_records() RETURNS void AS $$
BEGIN
    DELETE FROM quantity_items
    WHERE deleted_at < now() - INTERVAL '30 days';

    DELETE FROM ai_messages
    WHERE created_at < now() - INTERVAL '2 years';

    UPDATE user_events
    SET user_id = NULL, ip_address = NULL, user_agent = NULL
    WHERE created_at < now() - INTERVAL '90 days'
      AND user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
```

### 26.3 Right to Erasure (GDPR Article 17)

```python
async def process_erasure_request(tenant_id: UUID, user_id: UUID) -> ErasureReport:
    """
    GDPR right-to-erasure. Anonymizes PII while preserving legally required records.
    Financial records are EXEMPT per Moroccan fiscal law (10-year obligation).
    """
    async with db.begin():
        await db.execute(
            update(User)
            .where(User.id == user_id, User.tenant_id == tenant_id)
            .values(
                email=f"deleted_{user_id}@erased.invalid",
                full_name="[Compte supprime]",
                phone=None,
                deleted_at=func.now(),
            )
        )
        await db.execute(delete(AiMessage).where(AiMessage.user_id == user_id))
        await db.execute(
            update(AuditLog)
            .where(AuditLog.user_id == user_id)
            .values(user_id=None, ip_address=None)
        )
        # Financial records retained per fiscal obligation — logged for compliance
        logger.info("erasure_financial_records_retained",
                    user_id=str(user_id), reason="fiscal_obligation_10y")

    return ErasureReport(
        user_id=user_id,
        completed_at=datetime.utcnow(),
        financial_records_retained=True,
    )
```

---

## 27. Code Quality & Clean Code

### 27.1 SOLID in Practice

**Single Responsibility** — each class has one reason to change:

```python
# WRONG: one class does too many things
class OcrService:
    def extract_text(self, pdf): ...
    def save_to_database(self, items): ...
    def send_notification(self, user_id): ...

# CORRECT: separated responsibilities
class OcrExtractionService:   # only: text extraction
    def extract_text(self, pdf): ...

class QuantityItemRepository: # only: database operations
    def save_items(self, items): ...

class NotificationService:    # only: notifications
    def notify_extraction_complete(self, user_id): ...
```

**Dependency Inversion** — depend on abstractions:

```python
from abc import ABC, abstractmethod

class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]: ...

class AnthropicEmbeddingProvider(EmbeddingProvider):
    async def embed(self, texts: list[str]) -> list[list[float]]: ...

class SemanticSearchService:
    def __init__(self, embedding_provider: EmbeddingProvider) -> None:
        self._embedder = embedding_provider  # injected, not hardcoded
```

### 27.2 Function Quality Rules

- Maximum function length: **30 lines** (excluding docstring and type annotations)
- Maximum cyclomatic complexity: **7** (measured by `radon cc`)
- Maximum parameters: **5** (use dataclass or Pydantic if more needed)
- Maximum nesting depth: **3** (use early returns and guard clauses)

```python
# WRONG: deep nesting, hard to follow
def process_document(doc):
    if doc:
        if doc.pages:
            for page in doc.pages:
                if page.has_tables:
                    for table in page.tables:
                        extract_quantities(table)

# CORRECT: guard clauses flatten the structure
def process_document(doc: Document) -> list[QuantityItem]:
    if not doc or not doc.pages:
        return []
    return [
        item
        for page in doc.pages
        if page.has_tables
        for table in page.tables
        for item in extract_quantities_from_table(table)
    ]
```

### 27.3 DRY, KISS, YAGNI

**DRY** — extract when the same logic appears 3+ times. Do not over-abstract for a single use case.

**KISS** — the simplest solution that correctly solves the problem is the right one. A plain `for` loop over a list of items is better than a custom iterator class when there is no reuse need.

**YAGNI** — do not implement BIM synchronization, IoT/MQTT, or digital twin WebSocket features until they are in the active sprint. Placeholder files and empty interfaces count as implemented code and add noise.

### 27.4 Comments Policy

- Comments explain **why**, not what the code does.
- Inline comments for non-obvious logic only.
- All public functions have docstrings in English.
- BTP domain explanations may use French for precision.

```python
def calculate_coefficient_aplomb(height: Decimal, tolerance_mm: int) -> Decimal:
    """
    Calculate the plumb coefficient for a wall segment.

    In DTU 20.1, walls must maintain vertical alignment within tolerance_mm
    per running meter. Used by inspectors during reception de chantier
    to validate structural quality.

    Returns 0 (perfect) to 1 (at tolerance limit). Values > 1 = non-conformance.
    """
    # Maximum absolute deviation allowed for this height
    max_deviation = Decimal(str(tolerance_mm)) * height / Decimal('1000')
    return current_deviation / max_deviation
```

---

## 28. Documentation Standards

### 28.1 Architecture Decision Records (ADRs)

Every significant architectural decision is documented in `docs/adr/`.

```markdown
# ADR-007: Decimal Arithmetic for BTP Financial Calculations

**Status:** Accepted
**Date:** 2025-03-15

## Context
BTP cost estimations multiply float quantities (12.333 m3) by unit prices (1850.50 MAD/m3).
IEEE 754 floating-point arithmetic introduces errors that compound across large devis,
producing final totals differing by several MAD from the correct value.

## Decision
All quantity, price, and financial values use Decimal (Python) / Decimal.js (TypeScript)
throughout. Database stores NUMERIC(18,6) for quantities and NUMERIC(15,4) for prices.

## Consequences
- Slightly higher CPU cost (negligible at BTP scale)
- Developers must import Decimal — float literals forbidden in financial code
- JSON serialization uses string representation to preserve precision
- All existing float-based financial code must be migrated before launch

## Alternatives Rejected
- Integer fixed-decimal: complex to maintain, error-prone at edge cases
- Rounding middleware: does not solve intermediate calculation drift
```

### 28.2 API Documentation

All API endpoints are documented with OpenAPI 3.1.

```python
@router.post(
    "/v1/metrages/extract",
    response_model=MetrageExtractionResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Extract quantity takeoff from PDF document",
    description=(
        "Initiates AI-powered quantity extraction from an uploaded PDF.\n\n"
        "Document must be uploaded to DO Spaces before calling this endpoint.\n\n"
        "Returns a job ID for polling via `GET /v1/jobs/{job_id}`.\n\n"
        "**Processing time:** 30-120 seconds depending on document size and quality."
    ),
    responses={
        202: {"description": "Extraction job created"},
        400: {"description": "Invalid document reference or unsupported format"},
        402: {"description": "Tenant AI token budget exceeded"},
        404: {"description": "Document not found"},
    },
)
```

### 28.3 Runbooks

Every operational concern has a runbook in `docs/runbooks/`. Minimum required runbooks:

- `runbooks/deploy-production.md` — deployment procedure with rollback steps
- `runbooks/database-migration.md` — how to run, verify, and roll back migrations
- `runbooks/ai-service-degraded.md` — response plan when Anthropic API is slow/down
- `runbooks/tenant-data-export.md` — procedure for GDPR data export requests
- `runbooks/security-incident.md` — steps for suspected data breach or intrusion

---

## 29. Commit & PR Checklists

### 29.1 Pre-Commit Checklist

- [ ] All linting passes: `pnpm lint` / `ruff check .`
- [ ] All type checks pass: `pnpm typecheck` / `mypy app/`
- [ ] No secrets or API keys in diff: `git diff --staged | grep -i 'sk-ant\|password\|secret'`
- [ ] No `console.log()` or `print()` debugging statements left in production code
- [ ] Financial calculations use `Decimal` — no `float` or `number` for monetary values
- [ ] No hardcoded tenant IDs, user IDs, or environment-specific values
- [ ] Commit message follows Conventional Commits format

### 29.2 Pre-Pull Request Checklist

- [ ] All unit tests pass with coverage >= 80% for changed files
- [ ] Integration tests pass for affected API endpoints
- [ ] No breaking changes to API contracts without version bump
- [ ] Database migrations have a rollback script in `migrations/rollback/`
- [ ] New environment variables are documented in `.env.example`
- [ ] No N+1 queries introduced (verified via query logging in dev)
- [ ] `pnpm audit` and `pip-audit` show no new CRITICAL/HIGH vulnerabilities
- [ ] Documentation updated: ADR if architectural change, API docs if endpoint changed
- [ ] PR description covers: What changed, Why it changed, How to test it
- [ ] Linked to GitHub issue: `Closes #ENG-XXX`

### 29.3 Pre-Merge Checklist (Reviewer)

- [ ] Code is readable without verbal explanation from the author
- [ ] Business logic is testable and has been tested
- [ ] All error paths are handled — no silent failures
- [ ] Multi-tenant isolation is maintained — no cross-tenant data access possible
- [ ] AI prompt changes include evaluation results showing measurable improvement
- [ ] No secrets or credentials introduced
- [ ] Logging added for observable operations (job start/end, key decisions)
- [ ] Performance impact assessed for database-heavy operations

### 29.4 Pre-Release Checklist

- [ ] All CI pipelines green on `release/*` branch
- [ ] Database migrations tested on staging with production-scale data
- [ ] `CHANGELOG.md` updated with all user-facing changes
- [ ] Version bumped: `package.json`, `pyproject.toml`, Docker image tags
- [ ] Staging smoke tests passed — verified manually:
  - [ ] User login/logout
  - [ ] PDF upload and OCR extraction
  - [ ] Metrage table display
  - [ ] Devis generation and PDF download
  - [ ] AI chat response
- [ ] Rollback plan documented: migration rollback SQL, previous image tags noted
- [ ] On-call engineer notified of deployment window
- [ ] Database backup verified: `docker exec engipilot-postgres pg_dump ... | gzip > backup_$(date +%Y%m%d).sql.gz`

---

## 30. Technical Debt & Refactoring

### 30.1 Debt Classification

All technical debt is tracked as GitHub issues with label `tech-debt` plus one severity label:

| Severity | Label | Definition | Max Age |
|---|---|---|---|
| **Critical** | `debt:critical` | Security risk or data integrity issue | 1 sprint |
| **High** | `debt:high` | Performance degradation or correctness concern | 1 quarter |
| **Medium** | `debt:medium` | Maintainability issue or code smell | 2 quarters |
| **Low** | `debt:low` | Cosmetic issue or minor optimization | Backlog |

### 30.2 Refactoring Rules

- Refactoring PRs must not mix feature changes. One PR = one concern.
- Before refactoring: add characterization tests that document current behavior.
- After refactoring: same tests must pass unchanged.
- Never refactor without a failing or passing test as a safety net.
- Measure before optimizing: profile the code, document the baseline, verify improvement.

### 30.3 Versioning Policy

EngiPilot follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking change to API contract or database schema incompatibility requiring migration
- **MINOR**: New feature, new API endpoint, backward-compatible addition
- **PATCH**: Bug fix, performance improvement, documentation update

API versioning: `/api/v1/` and `/api/v2/` coexist during transition. Old versions are deprecated for 6 months before removal. Deprecation is announced via `Deprecation` and `Sunset` HTTP response headers.

### 30.4 Migration Strategy

```sql
-- Migrations are always:
-- 1. Additive first (add column, add table) — never drop in the same release as the app change
-- 2. Backward-compatible — the old app version must work with the new schema
-- 3. Deployed before the app code that depends on them
-- 4. Accompanied by a rollback script

-- Example: safe column rename (three-release process)
-- Release N:   ADD COLUMN new_name (old_name still used by app)
-- Release N+1: App uses new_name, old_name still populated by trigger
-- Release N+2: DROP COLUMN old_name, DROP TRIGGER
```

---

*This document is the authoritative engineering guide for the EngiPilot platform. Updates require a pull request reviewed by at least one senior engineer and merged to `main`. Sections must never be left incomplete or contain placeholder text.*

*Document version: 2.0.0 | Maintained by: engineering@engipilot.ma*
