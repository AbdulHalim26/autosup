# AUTOSUP

AUTOSUP is an AI-powered supply chain platform for `distributors` and `suppliers`. Its core goal is to help medium-scale businesses manage inventory, build more trusted supplier relationships, speed up restocking, and structure order flows from a single operational workspace.

This project combines:
- a frontend operational dashboard
- a backend API for data, auth, and AI orchestration
- a blockchain-based trust layer for partnerships and reputation

The current focus of this repo is building a clear, role-aware Core MVP foundation that is ready to grow into full backend integration and on-chain workflows.

## Why AUTOSUP

Problems we're solving:
- inventory monitoring is still manual
- restocking is slow and reactive
- supplier management is unstructured
- order tracking lacks transparency
- operational decisions are made without data-driven insights

Core value of AUTOSUP:
- one place for inventory, suppliers, orders, and AI insights
- a fast, scannable, and easy-to-use operational experience
- a trust layer for partnerships, escrow, and reputation — without exposing users to direct crypto flows

## Core MVP

Current MVP scope:
- authentication and role-based access
- monitoring dashboard
- inventory management
- suppliers and partnerships
- orders and tracking
- AI restock recommendations

Primary roles:
- `distributor`
- `supplier`

Key statuses established as contracts:
- inventory: `in_stock`, `low_stock`, `out_of_stock`
- orders: `pending`, `processing`, `shipping`, `delivered`, `cancelled`

## Repository Structure

```text
autosup/
  backend/
  contracts/
  docs/
  frontend/
  api-contract.md
  readme.md
```

Overview:
- `frontend/`: AUTOSUP dashboard application built on Next.js App Router
- `backend/`: area for backend services and API integrations
- `contracts/`: area for smart contracts / blockchain layer
- `docs/`: additional project documentation
- `api-contract.md`: primary source of truth for endpoints, roles, enums, and response shapes across teams

Current repo status:
- `frontend/` is the most active and most advanced in implementation
- `backend/`, `contracts/`, and `docs/` are still minimal or not yet populated

## Architecture Overview

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn/UI / Radix UI
- Zustand
- React Query

The frontend serves as the operational dashboard for distributors and suppliers, following a mock-first approach before the backend is fully connected.

### Backend and Data
- FastAPI
- Python 3.10+
- PostgreSQL via Supabase
- Supabase Auth (JWT)

The backend will serve as the orchestration layer for auth, CRUD, AI integration, and trust layer outputs surfaced to the frontend.

### AI Layer
- Google Gemini API

Core use cases:
- restock recommendations
- demand forecasting
- credit risk analysis

### Web3 Layer
- Solana Devnet
- Rust
- Anchor

Core use cases:
- Partnership NFT / Soulbound Token
- on-chain supplier reputation

## Source of Truth

Before changing any implementation, read these documents:

1. `api-contract.md`
   - source of truth for endpoints, request/response shapes, role naming, and status enums
2. `frontend/PRD.md`
   - source of truth for Core MVP scope, product behavior, and acceptance criteria
3. `frontend/AGENTS.md`
   - agent workflows, boundaries, stop conditions, and handoff rules
4. `frontend/CLAUDE.md`
   - coding conventions, tech stack rules, and UI/data guardrails
5. `frontend/autosup-complete.md`
   - product vision, pain points, design prompts per role (3 roles: supplier, distributor, retailer), and visual/UX direction
6. `frontend/README.md`
   - frontend-specific developer guide

Decision priority:
- `api-contract.md` wins for data contracts
- `frontend/PRD.md` wins for scope and product behavior
- `frontend/AGENTS.md` and `frontend/CLAUDE.md` govern how the frontend is implemented

## Current Frontend Status

The frontend already has an initial foundation for:
- root redirect to `/auth/login`
- login page
- supplier dashboard foundation
- inventory page
- suppliers page
- orders page

Current implementation is still:
- mock-first
- not yet fully connected to a live API
- not yet using real auth
- not yet using direct blockchain flows

However, the UI structure, reusable components, and dashboard shell are taking shape as the base for further development.

## Getting Started

For now, the most practical way to run the project is from the frontend:

```bash
cd frontend
npm install
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

Key commands:

```bash
npm run lint
npm run build
```

Notes:
- the frontend uses reCAPTCHA v3 in the login flow by contract, so a `.env.local` file will be needed
- the current development base API reference:

```text
http://localhost:8000/api/v1
```

See [`frontend/README.md`](frontend/README.md) for a more detailed frontend guide.

## Product Direction

AUTOSUP is more than an inventory dashboard. The product direction is to become:
- a control center for operational supply chains
- a sourcing hub for supplier partnerships
- an execution layer for restocking and order flows
- an intelligence layer for AI-driven recommendations
- a trust layer for partnerships and reputation

In later phases, surfaces like `Partnerships`, `AI Agents`, and `Payments` are expected to become key product differentiators.

## Development Principles

Principles applied in this repo:
- role-aware UX for `distributor` and `supplier`
- dashboard-first UI, not marketing-first
- mock data must always follow `api-contract.md`
- no `alert()` for error handling
- loading, empty, error, and happy path states must be considered from the start
- the trust layer is surfaced as a backend-driven result, not a browser-side crypto flow

## Roadmap Snapshot

After the core UI foundation:
- polish navigation and shared dashboard behavior
- connect mock-first pages to cleaner hooks and store patterns
- continue to pages like `Partnerships`, `AI Agents`, and `Payments`
- begin gradual integration with the backend API
- begin syncing the trust layer with backend and smart contract workflows

## Notes

- This repo is still moving fast; some areas are still skeletal
- Documentation is currently more mature than the overall codebase implementation
- If there is a conflict between UI intuition and data contracts, prioritize the source of truth documents

If you're new to this repo, start with:
- `readme.md`
- `frontend/README.md`
- `api-contract.md`
- `frontend/PRD.md`