# Domain 04: Security, Logistics & Regime
## Feature Specification 01: Regime Scheduling, Master Timetables & Emergency Overrides

---

## 1. System Overview & The Master Clock

In *Prison Architect Web*, the daily routine of every inmate is strictly governed by the **Regime System**. The game world advances along an internal **24-hour master clock** (where 1 real-world second equals $\sim 1$ in-game minute at $1\times$ speed).

The Regime allows the Warden to dictate precisely what each security classification of prisoners should be doing at every hour of the day.

```
Hour: 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23
Min: [ SLEEP           ][SHW][EAT  ][ WORK/LOCKUP ][EAT  ][YARD][FREE ][LOCK]
Med: [ SLEEP           ][SHW][LOCK ][EAT  ][ WORK/LOCKUP ][EAT  ][FREE ][LOCK]
Max: [ SLEEP                ][SHW  ][LOCK ][EAT  ][LOCKUP ][EAT  ][LOCKDOWN  ]
Sup: [ LOCKDOWN - 23 HOURS                                    ][SOLITARY YARD]
```

---

## 2. Regime Activity Types & Behavioral Mandates

Each 1-hour block in the regime grid is assigned one of the following activity tags:

| Activity | Inmate Behavior Mandate | Inmate Permitted Zones | Needs Addressed |
| :--- | :--- | :--- | :--- |
| **Sleep** | Must return to designated cell bed; quiet hours | Assigned Cell | Sleep |
| **Lockdown** | Confined to assigned cell; cell doors locked shut | Assigned Cell | Bladder, Bowel (via in-cell toilet) |
| **Eat** | Inmates swarm the designated Canteen | Canteen | Food |
| **Shower** | Inmates move to communal Shower room or use cell shower | Shower, Cell | Hygiene |
| **Yard** | Inmates move to outdoor Yard | Yard | Exercise, Recreation |
| **Work / Lockup** | Inmates with jobs work (Kitchen, Laundry, Workshop); others locked in cells | Assigned Workplace OR Cell | Literacy (Library), Cash |
| **Work / Freetime** | Working inmates report to jobs; non-working inmates enjoy unrestricted free time | Any approved public zone | Family, Recreation, Freedom |
| **Free Time** | Complete autonomous freedom across prison | Any approved public zone | Any unmet need |

---

## 3. Staggered Scheduling & Anti-Collision Logistics

A critical strategy for avoiding riots and economizing infrastructure is **Staggered Scheduling**:

```
12:00 PM: Minimum Security eats in Canteen A
13:00 PM: Minimum Security leaves; Janitors clean trays
14:00 PM: Maximum Security enters Canteen A
```

### Benefits of Staggering:
1. **Halves Construction Costs:** A single 50-seat canteen can service 200 prisoners across 4 distinct eating shifts rather than requiring a massive 200-seat hall.
2. **Prevents Lethal Cross-Tier Clashes:** Maximum security violent offenders are never present in the corridors at the same time as fragile Minimum Security petty offenders or Protective Custody snitches.

---

## 4. Emergency Regime Overrides

At any moment, the Warden can activate global emergency overrides from the HUD:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GlobalEmergencyOverride {
    None,
    Bangup,     // Sends all willing prisoners immediately back to their cells
    Lockdown,   // Slams shut and locks every single door in the entire prison
    Shakedown,  // Orders guards to search every cell, toilet, and prisoner
    FreeFire,   // Authorizes armed guards to use lethal shotgun fire on sight
}
```

```
[ BANGUP TRIGGERED ]
         │
         ├──> Compliant Prisoners: Sprint directly to cells & close doors
         └──> Hostile / Volatile Prisoners: Refuse order; weapon draw check!

[ FULL LOCKDOWN TRIGGERED ]
         │
         └──> All servo motors & solenoid jail doors lock shut instantly.
              Halts riot spread, trapping mobs within isolated firewalls.
```

---

## 5. Regime Implementation & Data Schema

The entire 7-day, 24-hour regime table is stored as a compact byte array:

```rust
pub const HOURS_PER_DAY: usize = 24;
pub const SECURITY_CLASSES_COUNT: usize = 7;

#[derive(Clone)]
pub struct RegimeScheduleTable {
    // 7 tiers x 24 hours = 168 bytes total
    pub schedule: [[RegimeActivity; HOURS_PER_DAY]; SECURITY_CLASSES_COUNT],
}

#[repr(u8)]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum RegimeActivity {
    Lockdown = 0,
    Sleep = 1,
    Eat = 2,
    Yard = 3,
    Shower = 4,
    WorkLockup = 5,
    WorkFreeTime = 6,
    FreeTime = 7,
}

impl RegimeScheduleTable {
    pub fn get_current_activity(
        &self,
        sec_class: SecurityClass,
        hour_of_day: usize,
    ) -> RegimeActivity {
        self.schedule[sec_class as usize][hour_of_day % 24]
    }
}
```

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Perpetual Lockdown Riot** | Player forgets the prison is in `Lockdown` for 48 hours; all prisoners starve and riot. | Visual Emergency Banners: The UI flashes a pulsing yellow/red header: `EMERGENCY LOCKDOWN ACTIVE - INMATES CONFINED`. |
| **Shift Change Door Jam** | 300 inmates attempt to exit Canteen while 300 enter simultaneously at 13:00. | Dynamic Hysteresis Interval: 10-minute transition buffers where corridor doors stay held open automatically during scheduled regime shift changes. |
| **Solitary Inmates Breaking Regime** | Inmates in solitary attempt to pathfind to the Yard during Yard Time. | Status Check Precedence: Inmates flagged with `InSolitary` or `MedicalBedbound` ignore global regime broadcasts until their punishment timer expires. |
