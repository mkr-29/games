# Domain 05: Economy, Management & Governance
## Feature Specification 06: Death Row, Appeals Hearings & Execution Protocols

---

## 1. System Overview & The Capital Punishment Framework

The inclusion of **Death Row** and state-sanctioned capital punishment is one of *Prison Architect*'s most solemn and mechanically demanding features.

Unlocked exclusively through the **Corporate Lawyer** via the Bureaucracy Tree, Death Row introduces condemned inmates facing execution by **Electric Chair**. Housing Death Row inmates yields the highest daily housing stipend in the game ($\$1,000/\text{inmate/day}$), but carries severe legal and moral liabilities.

```
                      [ DEATH ROW ADMISSION ]
                      Daily Stipend: $1,000/day
                      Clemency Chance: ~50%
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
 [ DEATH ROW APPEALS ROOM ]                      [ TIME ELAPSES ]
  Held every 3 days by State Court                Inmate paces cell;
  Clemency changes:                               zero general contact
    ├── Appeal Granted: Transferred to Max-Sec    
    └── Appeal Rejected: Clemency drops (e.g. 50% -> 22% -> 4%)
                                │
                                ▼
                   [ CLEMENCY DROPS BELOW 5% ]
                     Execution Authorized
                                │
                                ▼
                   [ THE EXECUTION PROTOCOL ]
```

---

## 2. The Appeals Cycle & Clemency Calculus

Every Death Row prisoner arrives with a dynamic **Execution Clemency Percentage** (typically between $40\%$ and $75\%$):
* **Death Row Appeals Hearings:** Conducted in a dedicated *Appeals Room* by an outside Magistrate and Lawyer.
* Each hearing tests whether new evidence exonerates the inmate:
  * If the appeal passes: The inmate is downgraded to Maximum Security, or released if completely exonerated.
  * If the appeal fails: The Clemency Chance decreases by an average of $-15\%$.

```rust
#[derive(Component, Debug, Clone)]
pub struct DeathRowProfile {
    pub execution_clemency_chance: f32, // e.g. 0.35 (35%)
    pub appeals_exhausted: bool,
    pub appeal_count: u8,
}
```

### The Legal Threshold Rule
* The State legal threshold is **$5\%$ Clemency**.
* If you execute an inmate whose clemency chance is **$\le 5\%$**: The execution is deemed legally sound; the state awards a **$\$10,000$ Execution Bounty**.
* If you execute an inmate whose clemency chance is **$> 5\%$**: You risk executing an innocent citizen. If post-humous evidence later proves their innocence:
  1. The prison receives a **$-\$50,000$ State Liability Penalty**.
  2. The facility loses its Death Row authorization.
  3. If 2 wrongful executions occur: **Immediate Game Over (Criminal Indictment of Warden)**.

---

## 3. Physical Execution Infrastructure

An execution requires dedicated, secure facilities:
* **Death Row Cell:** High-security solitary cell with direct access to an internal corridor.
* **The Execution Chamber:** Fully enclosed room containing the **Electric Chair**.
  * The Electric Chair must be connected directly to an independent power circuit; during activation, it draws an instantaneous surge of **$5,000 \text{ Watts}$**.

---

## 4. The 5-Step Execution Protocol Walkthrough

Executing a prisoner is not an instant button click; it is an elaborate multi-stage ritual that halts normal prison operations:

```
[ STEP 1: EXECUTION AUTHORIZATION ]
  Warden clicks "Schedule Execution"
  Prison immediately enters Mandatory Facility Lockdown
          │
          ▼
[ STEP 2: ASSEMBLY OF WITNESSES ]
  The Execution Party assembles outside Death Row Cell:
  ├── The Warden (Official Overseer)
  ├── The Chief of Police (Security Escort)
  └── The Spiritual Leader / Priest (Final Rites)
          │
          ▼
[ STEP 3: THE FINAL MARCH ]
  Inmate handcuffed; escorted down the corridor in solemn procession.
  Witnesses (Victim's family & press) take seats in the viewing gallery.
          │
          ▼
[ STEP 4: THROWING THE SWITCH ]
  Inmate strapped into Electric Chair.
  Warden orders current; screen flashes blue-white; lights flicker.
  Power grid draws 5,000W surge; hum of electricity echoes.
          │
          ▼
[ STEP 5: MEDICAL PRONOUNCEMENT ]
  Doctor enters chamber; checks pulse with stethoscope.
  Officially pronounces time of death.
  Hearse arrives at gate to collect body; lockdown lifts.
```

---

## 5. WebGPU Visual & Acoustic Integration

During the execution sequence:
* **Lighting Occlusion:** The entire facility shifts into a desaturated, high-contrast monochrome color grade.
* **Electrical Hum:** The `AudioWorklet` synthesizes a sub-bass $60\text{ Hz}$ electrical transformer hum that intensifies as capacitors charge.
* **Screen Shake:** A sharp camera screen shake pulse triggers when the main switch is thrown.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Power Grid Failure Mid-Execution** | Power station overloads mid-execution; inmate left strapped to chair in dark. | Circuit Pre-Flight Check: The UI prevents initiating Step 4 unless the connected electrical circuit has $\ge 6,000\text{ W}$ of unallocated reserve capacity. |
| **Inmate Escapes En Route to Chair** | Inmate attacks escorting Chief during the hallway walk. | Triple Guard Escort: The condemned inmate is escorted in high-security leg irons, flanked by 2 Armed Guards with drawn tasers. |
| **Execution Blocked by Riot** | Prison rioters storm the execution wing and shatter the viewing window. | Abort Sequence: The Warden can abort the execution at any step prior to switch closure, returning the inmate to cell lockdown. |
