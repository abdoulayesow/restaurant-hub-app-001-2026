# Session Summary: Production Data Cleanup Scripts

**Date:** 2026-02-15 (Session 3)
**Session Focus:** Investigate and clean stale production data in Bliss Miniere, create reusable per-restaurant diagnosis and cleanup scripts

---

## Overview

Bliss Miniere had a stale 3,000,000 GNF sale on January 30 in production (both restaurants should have zero financial data). Investigated the issue, created two new reusable production scripts (`diagnose-restaurant.ts` and `cleanup-restaurant.ts`), and cleaned the stale data. Bliss Tahouyah was already clean.

---

## Completed Work

### Production Database Investigation
- Diagnosed Bliss Miniere: found 1 orphaned sale (Jan 30, 3M GNF, status: `Deleted`)
- Confirmed Bliss Tahouyah was clean (zero transactions)
- Identified the sale had no linked bank transactions, sale items, or other dependencies

### New Production Scripts
- Created `scripts/prod/diagnose-restaurant.ts` — read-only diagnostic showing all transactional data for a specific restaurant
- Created `scripts/prod/cleanup-restaurant.ts` — per-restaurant cleanup with dry-run safety and FK-safe deletion (17 entity types)

### Data Cleanup
- Executed cleanup on Bliss Miniere: deleted the 1 stale sale record
- Verified both restaurants now have zero transactional data in production

---

## Key Files Modified

| File | Changes |
|------|---------|
| `scripts/prod/diagnose-restaurant.ts` | **NEW** — Read-only per-restaurant diagnostic with counts + record details |
| `scripts/prod/cleanup-restaurant.ts` | **NEW** — Per-restaurant transactional cleanup, dry-run by default, `--execute` flag |

---

## Design Patterns Used

- **Dry-run by default**: Matches `scripts/prod/cleanup.ts` pattern — requires `--execute` flag
- **FK-safe deletion order**: 17-step deletion sequence respecting all foreign key constraints (expanded from `cleanup-test.ts` 14-step pattern to cover newer models)
- **Reusable `getTransactionCounts()` helper**: DRY pattern — called before and after deletion for verification
- **Hardcoded prod DB URL**: Consistent with all other `scripts/prod/` scripts

---

## Current Plan Progress

| Task | Status | Notes |
|------|--------|-------|
| Create diagnose-restaurant.ts | **COMPLETED** | Read-only, defaults to bliss-miniere |
| Create cleanup-restaurant.ts | **COMPLETED** | Dry-run default, 17-step FK-safe deletion |
| Diagnose Miniere + Tahouyah | **COMPLETED** | Miniere had 1 sale, Tahouyah clean |
| Clean Miniere stale data | **COMPLETED** | 1 sale deleted |
| Verify both restaurants clean | **COMPLETED** | Both at zero transactions |

---

## Remaining Tasks / Next Steps

| Task | Priority | Notes |
|------|----------|-------|
| Commit the 2 new scripts | High | Unstaged: `scripts/prod/diagnose-restaurant.ts`, `scripts/prod/cleanup-restaurant.ts` |
| Unstaged projection changes | Medium | Modified: `app/api/projections/route.ts`, `components/projection/DemandForecastCard.tsx`, `DemandForecastChart.tsx` — unrelated to this session |
| Continue sales + production features | Medium | Branch `feature/phase-sales-production` |

### Notes
- `initialCapital` for both restaurants is still 50,000,000 GNF — may need resetting depending on requirements
- Products count for Miniere is 0 (may need seeding via `scripts/prod/seed.ts`)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `scripts/prod/diagnose-restaurant.ts` | Per-restaurant data diagnostic |
| `scripts/prod/cleanup-restaurant.ts` | Per-restaurant transactional cleanup |
| `scripts/prod/cleanup-test.ts` | Pattern source for FK-safe per-restaurant deletion |
| `scripts/prod/cleanup.ts` | Pattern source for dry-run/execute flag |
| `scripts/prod/seed.ts` | Production seed (creates clean setup, NO financial data) |

---

## Session Retrospective

### Token Usage Analysis

**Estimated Total Tokens:** ~120,000 tokens
**Efficiency Score:** 82/100

#### Token Breakdown:
| Category | Tokens | Percentage |
|----------|--------|------------|
| File Operations (reads) | 35,000 | 29% |
| Exploration (3 agents) | 40,000 | 33% |
| Code Generation | 20,000 | 17% |
| Planning (agent + plan file) | 15,000 | 13% |
| Script Execution | 10,000 | 8% |

#### Optimization Opportunities:

1. ⚠️ **Parallel Explore agents read overlapping files**: All 3 explore agents read schema.prisma independently
   - Current approach: 3 agents each reading schema + sales API
   - Better approach: 1 focused agent for schema/seeds, 1 for API/frontend
   - Potential savings: ~8,000 tokens

2. ⚠️ **Plan agent duplicated exploration**: Plan agent re-analyzed FK relationships already covered by Explore agents
   - Current approach: Passed context but agent still re-verified
   - Better approach: Include specific FK chain in prompt to skip re-analysis
   - Potential savings: ~5,000 tokens

#### Good Practices:

1. ✅ **Parallel script execution**: Ran diagnose on both restaurants simultaneously
2. ✅ **Dry-run before execute**: Verified cleanup would only delete 1 record before executing
3. ✅ **Targeted reads**: Used Grep to verify model existence before reading schema sections

### Command Accuracy Analysis

**Total Commands:** 8 (bash) + 12 (read/glob/grep)
**Success Rate:** 100%
**Failed Commands:** 0

#### Improvements from Previous Sessions:

1. ✅ **Clean script execution**: All `npx tsx` commands ran without errors
2. ✅ **FK order correctness**: Deletion order was correct on first attempt (no constraint violations)

---

## Lessons Learned

### What Worked Well
- Using `cleanup-test.ts` as the pattern source for FK-safe deletion — extended it cleanly to 17 steps
- Dry-run by default prevents accidental data loss
- Diagnose script found the issue immediately (status: `Deleted` sale still in DB)

### What Could Be Improved
- Could consolidate explore agents (2 instead of 3 would have been sufficient)
- The `getTransactionCounts` helper could be extracted to a shared utility if more scripts need it

### Action Items for Next Session
- [ ] Commit the 2 new scripts
- [ ] Review the unstaged projection changes (DemandForecastCard/Chart)
- [ ] Consider resetting `initialCapital` from 50M to 1M GNF if needed

---

## Resume Prompt

```
Resume from prod data cleanup session on feature/phase-sales-production.

IMPORTANT: Follow guidelines from `.claude/skills/summary-generator/guidelines/`:
- **token-optimization.md**: Use Grep before Read, Explore agent for multi-file searches, reference summaries
- **command-accuracy.md**: Verify paths with Glob, check import patterns, read types before implementing
- **build-verification.md**: Run lint/typecheck/build before committing, fix warnings not just errors
- **refactoring-safety.md**: Zero behavioral changes, preserve exports, verify after each step
- **code-organization.md**: Use barrel exports, extract config, split large components

## Context
Session summary: `.claude/summaries/2026-02-15_prod-data-cleanup-scripts.md`

Previous session completed:
- Created `scripts/prod/diagnose-restaurant.ts` (per-restaurant data diagnostic)
- Created `scripts/prod/cleanup-restaurant.ts` (per-restaurant cleanup, dry-run default)
- Cleaned stale Jan 30 sale from Bliss Miniere in production
- Both restaurants now have zero transactional data

## Current Status
- Branch: feature/phase-sales-production
- 2 new scripts unstaged (diagnose-restaurant.ts, cleanup-restaurant.ts)
- 3 modified files unstaged (projections API + DemandForecast components — from earlier session)
- Typecheck + build status: unknown (not verified this session)

## Key Files
- New scripts: scripts/prod/diagnose-restaurant.ts, scripts/prod/cleanup-restaurant.ts
- Auth pattern: lib/auth.ts (authorizeRestaurantAccess)
- Permissions: lib/roles.ts

## Next Steps
1. Commit new prod scripts
2. Review/commit unstaged projection changes
3. Continue with feature/phase-sales-production work (sales + production features)

## Important Notes
- Production DB: both restaurants confirmed clean (zero transactions)
- initialCapital still at 50M GNF for both restaurants — may need reset to 1M
- Products count for Miniere is 0 in prod (Tahouyah also likely 0)
```
