---
trigger: always_on
description: Mandatory plan execution workflow for autonomous agents
---

# Plan Execution Protocol

When working on Prison Architect Web, you must strictly follow this execution protocol:

1. **Check Status First:**
   Always start by inspecting `PROJECT_STATE.json` or running `node scripts/check-progress.mjs` to identify the active task.

2. **One Task at a Time:**
   Do not batch tasks or attempt to implement multiple tasks in a single turn. Scope all code, edits, and tests strictly to the current task.

3. **Grounded Implementation:**
   Read the corresponding specification in `docs/` before implementing:
   - Domain 01: Core Architecture & Memory
   - Domain 02: World Grid, Construction & Utilities
   - Domain 03: Inmate Simulation & Agent AI
   - Domain 04: Security, Logistics & Regime
   - Domain 05: Economy, Management & Governance
   - Domain 06: Graphics, UI & Sound
   - Domain 07: Platform, Persistence & Extensibility

4. **Verify Before Checkoff:**
   Every task specification includes explicit "Verification & Test Criteria". You must run the tests and verify they pass before modifying the checklist.

5. **Advance State:**
   Once verified, run `node scripts/update-task.mjs <TASK_ID>` or manually update:
   - `docs/implementation-plan/0X-*.md`
   - `docs/implementation-plan/ROADMAP.md`
   - `PROJECT_STATE.json`
