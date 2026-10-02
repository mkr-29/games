# Domain 07: Platform, Persistence & Extensibility
## Feature Specification 02: Modding Architecture & Sandboxed WebAssembly Plugins

---

## 1. System Overview & The Web Modding Dilemma

Community modding was a primary pillar of *Prison Architect*'s longevity on Steam. However, bringing modding to a **web browser** poses severe security and performance hurdles:
* **The Security Hazard:** Allowing players to execute arbitrary third-party JavaScript creates immediate vulnerabilities (Cross-Site Scripting, stealing local tokens, browser cryptominers).
* **The Performance Hazard:** Unchecked scripts running on the main thread cause framerate hitches.

*Prison Architect Web* solves this with a **Dual Modding Engine**:
1. **Declarative JSON Manifests:** For adding custom furniture, rooms, prisoner traits, materials, and grants without writing code.
2. **Sandboxed WebAssembly Plugins (via Extism / Wasmtime):** Modders write logic in **Rust, TypeScript (AssemblyScript), or C**, compiling to pure `.wasm` binaries. Plugins execute inside a restricted memory sandbox with strict fuel/cycle limits and zero access to browser APIs or the internet.

```
┌────────────────────────────────────────────────────────┐
│                   COMMUNITY MOD ARCHIVE                │
│  - `manifest.json` (Custom Rooms, Items, Sprites)      │
│  - `plugin.wasm` (Compiled Game Logic Hooks)           │
└───────────────────────────┬────────────────────────────┘
                            │ Safe Validation
┌───────────────────────────┴────────────────────────────┐
│              SANDBOXED WASM PLUGIN RUNTIME             │
├────────────────────────────────────────────────────────┤
│ - Memory Sandbox: Capped at 16 MB Linear Memory        │
│ - Instruction Fuel Budget: Max 50,000 Wasm ops/hook    │
│ - Zero Network, Storage, or DOM Access                 │
├────────────────────────────────────────────────────────┤
│ EVENT DISPATCH BUS:                                    │
│  ├── `on_inmate_spawn(&mut InmateData)`                │
│  ├── `on_fight_start(AttackerId, DefenderId)`          │
│  └── `on_day_tick(DayNumber, &mut FinancialLedger)`    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Declarative Modding Schema (`manifest.json`)

Non-programmers can introduce new content purely through structured JSON:

```json
{
  "mod_id": "sci_fi_containment",
  "name": "Sci-Fi Cyberpunk Penitentiary",
  "version": "1.0.0",
  "author": "CyberArchitect",
  "custom_rooms": [
    {
      "id": 501,
      "name": "Cryo-Stasis Chamber",
      "min_area": 12,
      "must_be_indoors": true,
      "required_objects": [
        { "object_id": 901, "count": 2 }
      ],
      "security_tier_allowed": "SuperMaxOnly"
    }
  ],
  "custom_objects": [
    {
      "id": 901,
      "name": "Cryo-Pod",
      "width": 1,
      "height": 2,
      "wattage_draw": 1500,
      "sprite_atlas_pos": [4, 12],
      "cost_cents": 150000
    }
  ],
  "custom_traits": [
    {
      "id": 301,
      "name": "Cybernetic Augmentation",
      "description": "Takes 80% reduced physical damage; vulnerable to EMP shocks.",
      "combat_damage_multiplier": 2.0
    }
  ]
}
```

---

## 3. Sandboxed Plugin Event Hooks (Rust Example)

Modders implementing custom mechanics compile their logic against the standard **Plugin SDK**:

```rust
// Mod author code (compiled to plugin.wasm)
use prison_mod_sdk::*;

#[plugin_hook]
pub fn on_inmate_spawn(mut inmate: InmateHandle) {
    // 5% chance to give arriving prisoner the Cybernetic trait
    if rand_float() < 0.05 {
        inmate.add_trait(301); // Cybernetic Augmentation
        inmate.set_security_tier(SecurityTier::SuperMax);
    }
}

#[plugin_hook]
pub fn on_contraband_scanned(item: ContrabandHandle, sensor_type: SensorType) -> ScanDecision {
    if item.is_id(999) { // Custom EMP Grenade
        // Disables metal detector on trip!
        trigger_power_surge(item.get_tile_pos());
        return ScanDecision::AlarmTriggered;
    }
    ScanDecision::DefaultPass
}
```

---

## 4. Execution Sandbox & Fuel Metring

To guarantee that a buggy mod cannot freeze the game in an infinite loop:
* **Instruction Fuel:** Every plugin hook invocation is granted an execution budget (e.g. $50,000$ instructions).
* If a mod enters an infinite loop (`while true {}`), the Wasm runtime automatically traps, aborts execution, and unloads the offending plugin with an error log:
  ```
  [Mod Engine Error]: 'sci_fi_containment' exceeded fuel limit in on_day_tick. Plugin disabled.
  ```

---

## 5. Mod Distribution & Workshop Importer

Players can install community mods through multiple seamless web vectors:
1. **Drag-and-Drop ZIP:** Dragging a `.zip` file onto the browser window automatically unpacks sprites, validates the manifest, and compiles the Wasm module into OPFS.
2. **GitHub Repository URL:** Paste a raw GitHub repository link; the game fetches the tagged release archive directly via `fetch()`.
3. **One-Click Enable/Disable:** The in-game Mod Manager UI lets players toggle active mods without restarting the browser tab.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Object ID Collision** | Two installed mods both declare custom room ID `501`. | Namespacing & Dynamic Remapping: The engine prefixes mod asset IDs with a hash of the mod identifier (`sci_fi:501` vs `alien:501`), remapping indices at runtime. |
| **Out-of-Bounds Memory Exploit** | Malicious Wasm plugin attempts to write outside its linear memory boundary. | WebAssembly Linear Memory Isolation: All Wasm memory accesses are hardware-sandboxed; memory faults trigger an immediate trap without affecting host game memory. |
| **Corrupted Sprite Texture Atlas** | Mod includes a malformed PNG texture that crashes the WebGPU texture loader. | Pre-flight Image Decode: Textures are decoded via `createImageBitmap()` in a try-catch block; if decoding fails, a magenta missing-texture checkered placeholder is substituted. |
