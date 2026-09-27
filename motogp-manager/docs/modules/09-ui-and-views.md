# Module 09: UI Components, Views & Frontend Architecture

This module details the frontend architecture, flicker-free DOM rendering techniques, navigation tabs, bottom agenda drawer, race screen, and interactive simulation modals.

---

## 📁 File Structure

```
src/
└── ui/
    ├── Tabs.js               # Multi-tab navigation & pane visibility switching
    ├── Components.js         # Flicker-free DOM updater, dynamic list rendering, manual actions
    ├── CalendarView.js       # Season timeline, agenda drawer, day grouping, dev rewind
    ├── RaceView.js           # Live race control, stage progress, timing tower, lap history
    ├── TrackRadarView.js     # Live 2D SVG GPS radar, rider positioning, slipstream links
    ├── PreSeasonTestView.js  # Sepang testing modal, prototype cards, stint launch
    └── LongRunSimView.js     # 20-Lap simulation modal, telemetry charts, engineer report
```

---

## 🎨 1. Flicker-Free DOM Rendering Strategy (`UIComponents`)

In high-frequency simulations (10 ticks/second), naive `innerHTML` replacements cause high CPU usage, DOM thrashing, and UI flicker. `UIComponents` employs a **surgical in-place DOM update strategy**:

```mermaid
graph TD
    TICK[tickEngine Tick / Event] --> RENDER[UIComponents.render]
    RENDER --> TEXT[Selective Text Update<br/>el.textContent !== String(val)]
    RENDER --> BAR[Selective Width Update<br/>el.style.width !== widthStr]
    RENDER --> LISTS[In-Place Keyed List Comparison]
    LISTS --> PROD[renderProducers]
    LISTS --> TECH[renderTechTree]
    LISTS --> STAFF[renderCrew & renderRider]
    LISTS --> LOGS[renderLogs]
```

### Targeted Text & Style Helpers
```javascript
static updateText(id, val) {
    const el = document.getElementById(id);
    if (el && el.textContent !== String(val)) {
        el.textContent = val;
    }
}

static updateWidth(id, pct) {
    const el = document.getElementById(id);
    const widthStr = `${Math.min(100, Math.max(0, pct)).toFixed(1)}%`;
    if (el && el.style.width !== widthStr) {
        el.style.width = widthStr;
    }
}
```

---

## 📑 2. Tab Navigation (`TabsManager`)

Navigation tabs manage visibility across seven dedicated paddock panes:
- `pane-garage`: Team Machine, Bike Stats, Manual Pit Lane Work, Producers, Category Promotion Hub.
- `pane-rnd`: R&D Tech Tree with domain filters (`all`, `engine`, `aero`, `electronics`, `storage`).
- `pane-staff`: Lead Rider Skill Training, Pit Crew Hiring, Paddock Medical Ward.
- `pane-calendar`: Season Calendar Timeline, Week Cards, Agenda Drawer.
- `pane-race`: Grand Prix Weekend Live Control, Timing Tower, Live 2D Track Radar, Telemetry Log.
- `pane-heritage`: Legacy Rebirth Shrine, Heritage Tokens, Permanent Perks.
- `pane-settings`: Manual Save, Save String Export/Import, Hard Reset.

---

## 📅 3. Calendar View & Bottom Agenda Drawer (`CalendarView`)

### Header Timeline Pill & Drawer Toggle
- The persistent header displays the active week title and dates (`header-calendar-pill`).
- Clicking **"📅 Proceed to Next Week ⏩"** inspects `CalendarSystem.canProceedToNextWeek()`.
- If mandatory activities remain incomplete, the slide-up **Bottom Agenda Drawer** (`calendar-bottom-dock`) automatically opens, highlighting the exact day and session required.

### Drawer UI Features
- **Backdrop Blur**: `dock-backdrop` dims the background.
- **Day Card Columns**: Chronologically ordered day cards (`Monday` through `Sunday`).
- **Activity Status Badges**:
  - `REQUIRED` (Amber badge): Must be attended before advancing.
  - `OPTIONAL` (Gray badge): Can be attended or skipped.
  - `COMPLETED` (Green checkmark): Already executed.
  - `SKIPPED` (Strikethrough): Bypassed.
- **Sequential Day Locking**: Future days display a padlock icon (🔒) until prior days are resolved.

---

## 🏎️ 4. Race Weekend Screen (`RaceView`)

The race view coordinates live track sessions:
1. **Session Information Header**:
   - Grand Prix Title, Country Flag, Circuit Length, and Track Characteristic tag.
   - Live Weather badge (`☀️ Dry Track` / `🌧️ Wet Track`), Ambient Track Temp (°C), and Tire Compound Condition (%).
2. **Weekend Stage Stepper**:
   - Visual progress tabs: `FP1` $\rightarrow$ `PR` $\rightarrow$ `Q1/Q2` $\rightarrow$ `SPRINT` $\rightarrow$ `RACE`.
3. **In-Race Tactical Controls**:
   - **Engine Strategy**: `Push` (+5% pace, 1.25x wear), `Balanced` (1.0x baseline), `Conserve` (-5% pace, 0.75x wear).
   - **Tire Compound Selectors**: `Soft`, `Medium`, `Hard`, `Wet`.
4. **Live Race Radar & Progress Bar**:
   - Real-time circuit SVG canvas powered by `TrackRadarView`.
   - Track progress bar (0% to 100%) with 4 sector split checkpoints.
5. **Official FIM Timing Tower**:
   - Real-time positions (P1 through P22), rider names, team badges, lap times, gaps to leader (`LEADER`, `+0.412s`), and fastest lap purple indicators.
   - Crashed riders are shown with `DNF` badges and strikethroughs.
6. **Lap Telemetry History Table**:
   - Chronological table logging every completed lap: Lap Number, Lap Time, S1, S2, S3, S4, Top Speed, and Tire Health.

---

## 🔬 5. Interactive Simulation Modals

### A. Pre-Season Test Timing Screen (`PreSeasonTestView`)
- **Modal Container**: `#preseason-test-modal`
- **Prototype Comparison Cards**:
  - Side-by-side technical comparison of **Spec-A** vs **Spec-B**.
  - Highlights HP, Aero, Chassis Grip, ECU Intelligence, Top Speed, and Sector Specialization.
- **Stint Launcher Controls**:
  - Stint durations: **5 Mins**, **10 Mins**, **15 Mins**.
  - Tire selector: Soft, Medium, Hard.
  - Live session countdown clock (`60:00` $\rightarrow$ `00:00`).
- **Telemetry Debrief Log**:
  - Live rider quotes logged after every run.
- **Season Prototype Lock**:
  - Button to permanently confirm the chosen prototype for the season.

### B. 20-Lap Race Distance Simulation Dashboard (`LongRunSimView`)
- **Modal Container**: `#long-run-sim-modal`
- **Test Setup Controls**:
  - Compound selector (Soft, Medium, Hard).
  - Engine map selector (Push, Balanced, Conserve).
  - Launch button (`btn-start-20lap-sim`).
- **Real-Time Telemetry Feed**:
  - Lap-by-lap breakdown table showing degradation and fuel burn.
  - Pit wall radio communication terminal.
- **Chief Race Engineer Verdict**:
  - Displays Best Lap, Average Pace, Total Degradation %, Consistency Rating %, and the Chief Engineer's strategic Grand Prix recommendation.
- **Acceptance Button**: Awards $+80$ Telemetry, $+40$ RP, and $+15$ Hype, completing the calendar activity.
