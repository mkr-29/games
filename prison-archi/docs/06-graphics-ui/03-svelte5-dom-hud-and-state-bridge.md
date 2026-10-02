# Domain 06: Graphics, UI & Sound
## Feature Specification 03: Svelte 5 DOM HUD, Reactive Runes & Zero-Copy State Bridge

---

## 1. System Overview & The DOM vs. Canvas Philosophy

In management and tycoon simulations, **user interface quality directly governs player engagement**. A prison architect must frequently inspect deep data tables, schedule 24-hour regimes, balance accounting ledgers, and read inmate rap sheets.

Instead of rendering clunky, inaccessible UI buttons on the WebGPU canvas (using immediate-mode libraries like `egui` or `Dear ImGui`), *Prison Architect Web* uses a **Dual-Layer Architecture**:
* **Background Canvas (WebGPU):** Renders the simulated game world at 120 FPS.
* **Foreground DOM Overlay (Svelte 5 + Tailwind CSS):** Renders crisp, accessible, hardware-accelerated management windows with sub-pixel typography, tooltips, and animations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FOREGROUND DOM OVERLAY (Svelte 5)                    │
│  - Top Bar: Cash, Danger Gauge, Clock, Speed Controls                  │
│  - Bottom Toolbar: Construction, Zoning, Objects, Reports              │
│  - Modals: Inmate Rap Sheet, Bureaucracy DAG, Regime Timetable         │
│  - Planning Mode: Non-Destructive Ghost Blueprint Overlays             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pointer Events Passing
┌───────────────────────────────────┴────────────────────────────────────┐
│                    BACKGROUND CANVAS (WebGPU / WGSL)                   │
│  - Renders Tiles, Inmates, Shadows, Vision, Water & Power Grids       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Zero-Copy SharedArrayBuffer Telemetry Bridge

To feed live simulation statistics into the Svelte HUD without causing JSON serialization overhead or garbage collection spikes, telemetry is read directly from fixed offsets in the `SharedArrayBuffer`:

```typescript
// Svelte 5 Telemetry Store (telemetry.svelte.ts)
export class TelemetryBridge {
  private view: Int32Array;

  // Svelte 5 Runes for reactive state
  bankBalance = $state(0);
  dangerLevel = $state(0);
  prisonerCount = $state(0);
  inmateCapacity = $state(0);
  gameHour = $state(0);
  gameMinute = $state(0);

  constructor(sharedBuffer: SharedArrayBuffer) {
    // Offset 0x010400 matches Domain 01 Memory Layout
    this.view = new Int32Array(sharedBuffer, 0x010400, 16);
  }

  // Polled via requestAnimationFrame on Main Thread
  poll() {
    this.bankBalance = Atomics.load(this.view, 0) / 100; // Cents to Dollars
    this.dangerLevel = Atomics.load(this.view, 1) / 1000;
    this.prisonerCount = Atomics.load(this.view, 2);
    this.inmateCapacity = Atomics.load(this.view, 3);
    this.gameHour = Atomics.load(this.view, 4);
    this.gameMinute = Atomics.load(this.view, 5);
  }
}
```

---

## 3. Core HUD Components

### 3.1 The Top Bar (Global Status)
* **Cash Display:** Displays balance in green (positive) or red (debt). Includes rolling counter micro-animations.
* **Danger Gauge (Thermometer):** Displays total institutional tension:
  * $0–30\%$: Cool Blue (Peaceful)
  * $31–70\%$: Amber Orange (Agitated)
  * $71–100\%$: Pulsing Warning Red (Riot Imminent)
* **Master Clock & Speed Controls:** Buttons for `Pause (Space)`, `1x Speed (1)`, `2x Speed (2)`, and `5x Speed (3)`.

### 3.2 The Bottom Management Toolbar
Categorized pop-up menus for all architectural tools:
1. **Foundations:** Brick, Concrete, Demolish.
2. **Rooms / Zoning:** Cell, Canteen, Kitchen, Solitary, Yard, etc.
3. **Objects:** Beds, Toilets, Sinks, Saws, Metal Detectors, Doors.
4. **Staff:** Guards, Armed Guards, Cooks, Doctors, Administrators.
5. **Deployment:** Guard stationing, patrol routes, sector clearance colors.
6. **Logistics:** Food distribution links, laundry loops.
7. **Intelligence:** Confidential Informants, contraband heatmaps.
8. **Reports:** Inmate roster, admissions queue, financial ledger, parole requests.

---

## 4. Inmate Rap Sheet Inspector Modal

Clicking on any prisoner in the world opens their detailed dossier:

```svelte
<!-- InmateRapSheet.svelte -->
<script lang="ts">
  import type { InmateData } from './types';
  let { inmate, onClose }: { inmate: InmateData; onClose: () => void } = $props();
</script>

<div class="fixed right-6 top-20 w-96 rounded-xl bg-slate-900/95 p-6 text-white shadow-2xl backdrop-blur-md border border-slate-700">
  <div class="flex items-center justify-between border-b border-slate-800 pb-4">
    <div>
      <h2 class="text-xl font-bold">{inmate.fullName}</h2>
      <p class="text-xs uppercase tracking-wider text-slate-400">{inmate.securityTier} Inmate</p>
    </div>
    <button onclick={onClose} class="text-slate-400 hover:text-white">✕</button>
  </div>

  <!-- Needs Gauge Bars -->
  <div class="mt-4 space-y-2">
    <h3 class="text-xs font-semibold uppercase text-slate-400">Critical Needs</h3>
    {#each inmate.needs as need}
      <div class="flex items-center justify-between text-xs">
        <span class="w-20">{need.name}</span>
        <div class="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden mx-2">
          <div 
            class="h-full transition-all duration-300 {need.value > 80 ? 'bg-red-500' : need.value > 50 ? 'bg-amber-500' : 'bg-emerald-500'}"
            style="width: {need.value}%"
          ></div>
        </div>
        <span class="w-8 text-right font-mono">{need.value}%</span>
      </div>
    {/each}
  </div>

  <!-- Criminal Record -->
  <div class="mt-6">
    <h3 class="text-xs font-semibold uppercase text-slate-400">Convictions</h3>
    <ul class="mt-2 space-y-1 text-xs text-slate-300">
      {#each inmate.convictions as crime}
        <li class="flex justify-between">
          <span>{crime.title}</span>
          <span class="text-slate-500">{crime.sentenceYears} years</span>
        </li>
      {/each}
    </ul>
  </div>
</div>
```

---

## 5. Non-Destructive Planning Tool & Undo/Redo (`Ctrl+Z`)

A major frustration in the original desktop title was accidentally paying for walls that had to be manually demolished.

*Prison Architect Web* introduces a **Non-Destructive Blueprint Mode**:
* Players draw walls, doors, and objects as **translucent yellow holographic sketches**.
* Zero cash is spent until the player clicks `Execute Construction Plan`.
* Full **Undo / Redo Stack (`Ctrl+Z` / `Ctrl+Y`)** enables instant reversions of complex architectural sketches.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Pointer Events Click-Through** | Clicking a button in the Svelte modal accidentally commands a wall placement on the canvas behind it. | CSS `pointer-events: auto` on interactive UI frames, with global event propagation interception (`stopPropagation()`). |
| **Mobile / Small Screen Responsive Scaling** | 1080p desktop HUD overlaps and covers the entire screen on iPad or small laptop displays. | Responsive Rem Scaling: Svelte HUD automatically scales down UI density using Tailwind container queries and collapsible navigation sidebars. |
| **Rapid Entity Deselection** | Inspecting an inmate who gets murdered or executed causes a null-pointer error in the UI. | Optional Chaining & Reactive Unmount: Svelte safely unmounts the modal if the target entity ID is deregistered from the active entity table. |
