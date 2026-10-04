# UI Rendering & Anti-DOM-Thrashing Rule

## Critical Principle: Never Re-Create DOM Elements on Every Tick or Render Loop
In real-time web applications, idle games, and manager simulations (where `tick()`, `render()`, or `requestAnimationFrame()` runs 10–60 times per second):

### 🚫 STRICTLY FORBIDDEN:
- **No Unconditional innerHTML Rebuilding on Every Tick**: NEVER assign `container.innerHTML = ...` or rebuild element trees inside animation frames, game ticks, or periodic render loops for any component containing interactive elements (buttons, inputs, sliders, clickable cards, tabs, or tooltips).
- **Why this is critical**: Unconditional `innerHTML` overwriting destroys active DOM nodes 10–60 times a second. This causes:
  1. **Button Flickering**: Continuous destruction and recreation of elements causes severe visual stutter.
  2. **Dropped & Cancelled Clicks**: When a user clicks, the target element is detached from the DOM between `mousedown` and `mouseup`, silently swallowing user interaction and making buttons unclickable.
  3. **Loss of Focus & Hover**: Native hover states and input focus are immediately lost.
  4. **Performance & Memory Leaks**: Heavy garbage collection pressure from re-parsing HTML and binding redundant listeners.

### ✅ MANDATORY IMPLEMENTATION PATTERNS:
1. **Mount Once, Update In-Place**:
   - Check if the card, row, or component exists (`container.querySelector(...)`). If missing, create the element structure once and append it.
   - On subsequent ticks, surgically update only the specific fields that changed:
     ```js
     if (el && el.textContent !== newText) el.textContent = newText;
     if (bar && bar.style.width !== newWidth) bar.style.width = newWidth;
     if (btn && btn.disabled !== shouldDisable) btn.disabled = shouldDisable;
     ```
2. **Event Delegation on Stable Parent Containers**:
   - Attach click listeners once to the stable parent container using event delegation (`e.target.closest(...)`) instead of querying and re-attaching listeners every frame:
     ```js
     container?.addEventListener('click', (e) => {
         const btn = e.target.closest('.btn-train-skill');
         if (!btn || btn.disabled) return;
         // handle action
     });
     ```
3. **Controlled Rebuilds via Flags**:
   - Only allow full `innerHTML = ''` resets when an explicit `forceRebuild` flag is true (e.g., changing category filters, tier promotion, or prestige reset).
