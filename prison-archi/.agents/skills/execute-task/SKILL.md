---
name: execute-task
description: Guides the agent to pick up, implement, verify, and complete the next task from the Prison Architect implementation roadmap.
---

# Execute Task Skill

Use this skill whenever you are instructed to work on the project, continue implementation, or execute a task.

## Workflow Instructions

### 1. Identify the Active Task
Execute:
```bash
node scripts/check-progress.mjs
```
Note the:
- Active Phase
- Active Task ID (e.g. `TASK-1.1`)
- Task Specification File (`docs/implementation-plan/0X-*.md`)

### 2. Read the Task Details
Open the corresponding phase file in `docs/implementation-plan/` and inspect:
- **Objective**
- **Context & Specifications** (Open and view the linked files in `docs/`)
- **Deliverables** (Exact files to create or modify)
- **Verification & Test Criteria**

### 3. Implementation
- Create or edit the files required for the task.
- Follow the coding standards in `.agents/rules/code-standards.md`.
- Keep modifications surgical and minimal.

### 4. Verification
Execute the tests specified in the task description:
```bash
# Rust unit tests
cargo test --manifest-path crates/simulation/Cargo.toml

# Frontend build & typecheck
npm run check
npm run test
```
Do NOT proceed if any test fails. Debug and resolve the issue first.

### 5. Mark Complete
Run the update script:
```bash
node scripts/update-task.mjs <TASK_ID>
```
Or manually check off `[x]` in:
1. `docs/implementation-plan/0X-*.md`
2. `docs/implementation-plan/ROADMAP.md`
3. `PROJECT_STATE.json`

Report what was accomplished, proof of verification, and the next recommended task to the user.
