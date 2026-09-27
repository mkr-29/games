# Issue 08: Promotion Hub 10Hz DOM Re-rendering Thrash & Event Listener Re-creation

- **Status**: Identified / Medium Priority Performance Defect
- **Severity**: Medium
- **Component**: [`src/ui/Components.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/Components.js)

---

## 📌 Problem Description

The paddock UI renders at 10Hz (`Components.update(state, forceRebuild)`). While sub-components such as `renderProducers`, `renderTechTree`, and `renderStaff` receive and honor the `forceRebuild` parameter to avoid unneeded DOM repaints, `renderPromotionHub` ignores `forceRebuild` entirely.

Every 100 milliseconds, `renderPromotionHub(state)` executes `container.innerHTML = ...` and attaches a new `click` event listener to `#btn-promote-category`.

This causes constant DOM layout recalculation, garbage collection spikes, and dropped click/touch events when the player attempts to interact with the promotion modal.

---

## 🔬 Root Cause Analysis (RCA)

In [`src/ui/Components.js:L98-L103`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/Components.js#L98-L103):

```javascript
// src/ui/Components.js
// 3. Dynamic Lists (In-Place DOM update)
this.renderProducers(state, forceRebuild);
this.renderPromotionHub(state); // ❌ Does not pass or check forceRebuild!
this.renderTechTree(state, forceRebuild);
this.renderStaff(state, forceRebuild);
this.renderHeritage(state, forceRebuild);
```

Then in [`src/ui/Components.js:L547-L640`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/Components.js#L547-L640):

```javascript
static renderPromotionHub(state) {
    const container = document.getElementById('promotion-hub-content');
    if (!container) return;

    // ... computes status ...

    // ❌ Destroys and recreates DOM elements 10 times every second:
    container.innerHTML = `
        <div class="promotion-hub-layout">
            ...
            <button class="btn-promote-category" id="btn-promote-category" ${btnDisabled ? 'disabled' : ''}>
                ${btnText}
            </button>
        </div>
    `;

    // ❌ Binds a new event listener every 100ms:
    document.getElementById('btn-promote-category')?.addEventListener('click', (e) => {
        // ...
    });
}
```

---

## 💥 Failure Scenarios & Impact

1. **Dropped Clicks**: When clicking or tapping `#btn-promote-category`, if the 100ms tick fires between `mousedown` and `mouseup`, the button element is destroyed and replaced in the DOM. The browser cancels the synthetic `click` event, leaving the player feeling the button is unresponsive.
2. **CPU & Battery Drain on Mobile**: Repeatedly serializing and parsing HTML via `innerHTML` 10 times per second causes high layout thrashing (Reflow / Layout / Recalculate Styles) and creates thousands of ephemeral DOM node allocations per minute.
3. **Accessibility Focus Loss**: If a user tabs to the promotion button using a keyboard or screen reader, focus is lost every 100ms because the focused DOM element is continually destroyed.

---

## 🛠️ Recommended Remediation

1. **Pass `forceRebuild` to `renderPromotionHub`**:
```diff
  // src/ui/Components.js line 99
  this.renderProducers(state, forceRebuild);
- this.renderPromotionHub(state);
+ this.renderPromotionHub(state, forceRebuild);
  this.renderTechTree(state, forceRebuild);
```

2. **Cache state or update elements in-place**:
Only rebuild `innerHTML` when `forceRebuild` is true, or check if the promotion status/tier changed. Update dynamic text fields (such as cash/hype values) via targeted DOM selectors instead of wholesale HTML replacement:

```diff
  static renderPromotionHub(state, forceRebuild = false) {
      const container = document.getElementById('promotion-hub-content');
      if (!container) return;

+     // Only do full rebuild on tier change or forceRebuild
+     const status = PromotionSystem.getPromotionStatus(state);
+     if (!forceRebuild && container.dataset.tier === String(state.tier)) {
+         // Update only dynamic values in-place without rebuilding
+         this.updatePromotionValues(state, status);
+         return;
+     }
+     container.dataset.tier = String(state.tier);
      // ... render HTML and attach listener once ...
  }
```

---

## ✅ Verification & Test Plan

1. Open DevTools Performance panel and profile 5 seconds on the Paddock tab.
2. Verify that DOM node count and Layout / Garbage Collection spikes drop significantly.
3. Rapidly click or tap `#btn-promote-category` when promotion requirements are met; verify the confirm dialog opens immediately on the first click without dropped input.
