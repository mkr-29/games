---
name: audit-phase
description: Guides the agent to perform an end-to-end integration test and audit on an entire completed phase before advancing to the next phase.
---

# Audit Phase Skill

Use this skill when all tasks in a phase have been marked as complete, and you need to perform an architectural review and integration audit.

## Workflow Instructions

1. **Verify All Tasks in Phase:**
   Read the target phase file `docs/implementation-plan/0X-*.md` and verify that every single task item is marked `[x]`.

2. **Run Full Test Suite:**
   ```bash
   # Test simulation crate
   cargo test --manifest-path crates/simulation/Cargo.toml --all-targets

   # Test frontend & build
   npm run build:wasm
   npm run build
   ```

3. **Check Architectural Invariants:**
   - Confirm no simulation code leaked into the main thread.
   - Confirm memory allocations in ECS systems are pre-allocated or zero-copy.
   - Confirm TypeScript and Rust shared memory struct alignments match bit-for-bit.

4. **Update Phase Status:**
   Update the phase status in `docs/implementation-plan/ROADMAP.md` from `[ ] In Progress` to `[x] Completed`.
   Update `PROJECT_STATE.json` to advance `current_phase` to the next phase number.
