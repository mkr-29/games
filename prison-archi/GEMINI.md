# GEMINI.md — Antigravity & Gemini Agent Context

This repository is governed by the protocols defined in [AGENTS.md](file:///Users/mkr-27/Desktop/MY/MKR/games/prison-archi/AGENTS.md).

### Core Responsibilities
- Strictly execute tasks sequentially from `docs/implementation-plan/`.
- Refer to `docs/` for all architectural and mathematical specifications.
- Never run simulations on the main JavaScript thread; use Rust WebAssembly in the Web Worker.
- Ensure all tests pass before checking off task items `[x]`.
