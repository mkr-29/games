## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

---

## UI Rendering & Anti-DOM-Thrashing Rule

### 🚫 STRICTLY FORBIDDEN:
- **No innerHTML Rebuilding on Ticks / Render Loops**: NEVER assign `container.innerHTML = ...` or rebuild active element trees inside animation frames, game ticks, or periodic render loops (`tick()`, `render()`, `setInterval`, `requestAnimationFrame`) for any component containing interactive buttons, inputs, sliders, cards, or tabs.
- **Why**: Rebuilding innerHTML on ticks destroys DOM nodes 10–60 times a second, causing violent button flickering and dropping user clicks because elements are detached mid-click.

### ✅ MANDATORY PATTERNS:
1. **Mount Once, Update In-Place**: Create DOM nodes once (`if (!card) { create... }`). On subsequent frames, update only changed text, attributes, or disabled states (`if (el && el.textContent !== newText) el.textContent = newText`).
2. **Event Delegation**: Attach click listeners once to the stable parent container via `e.target.closest(...)` instead of querying and re-binding listeners every tick.
3. **Controlled Rebuilds**: Only allow full innerHTML resets when an explicit `forceRebuild` flag is passed.
