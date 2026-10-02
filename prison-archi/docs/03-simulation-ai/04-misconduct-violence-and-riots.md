# Domain 03: Inmate Simulation & Agent AI
## Feature Specification 04: Misconduct, Combat Systems & Full-Scale Prison Riots

---

## 1. System Overview & The Misconduct Escalation Tree

Misconduct in *Prison Architect Web* is not a binary toggle; it is an **escalating behavioral ladder** governed by unmet needs, gang orders, and ambient tension:

```
[ Tier 0: Normal Compliance ]
              │
    Unmet Needs > 60%
              ▼
[ Tier 1: Passive Resistance & Minor Infractions ]
  - Shouting, banging cups on tables, loitering
  - Theft of low-level contraband (spoons, cigarettes)
              │
    Unmet Needs > 80% OR Volatile Outburst
              ▼
[ Tier 2: Active Property Destruction & Brawling ]
  - Smashing toilets, shattering TVs, breaking cell doors
  - Fist-fights between inmates in showers and yards
              │
    Death of an Inmate OR High Institutional Danger
              ▼
[ Tier 3: Lethal Assaults & Staff Attacks ]
  - Stabbing guards with shivs, ambushing isolated patrolmen
  - Seizing keys from unconscious guards
              │
    Danger Bar > 80% & Multiple Simultaneous Outbreaks
              ▼
[ Tier 4: FULL INSTITUTIONAL RIOT ]
  - Cellblocks captured by rioting mobs
  - Staff taken hostage; Armory raided for shotguns
  - Arson attacks (setting beds and offices on fire)
```

---

## 2. Riot Physics & Sector Capture Mechanics

A Riot begins when a critical mass of inmates (typically $\ge 10$ prisoners in the same room) coordinate a violent uprising.

```
       [ Sector Falls to Rioters ]
                    │
         Fog of War Turns RED
  Guards Refuse to Enter without Weapons
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
  [ Break Armory ]      [ Seize Hostages ]
   Loot Shotguns         Tie up Doctors & Cooks
   Equip Body Armor      Demand Demands / Concessions
         │                     │
         └──────────┬──────────┘
                    ▼
       [ National Guard Mobilization ]
         (If uncontained for 24 hours)
```

### The Red Zone Sector Rules:
1. **Loss of Control:** Any room where rioters outnumber surviving guards becomes a **Contested Sector (Red Zone)**.
2. **Fog of War Blindness:** Cameras in red zones are smashed; CCTV feeds cut out into static.
3. **Staff Panic:** Unarmed staff (Janitors, Doctors, Cooks, Workmen) automatically flee the red zone toward the exterior gates. Standard guards refuse to enter unless escorted by Armed Guards or Riot Police.

---

## 3. Combat Mechanics, Damage Formulas & Armory Raids

Combat operates on real-time tick calculations with dynamic hitboxes and armor mitigation:

```rust
pub struct CombatSystem;

impl CombatSystem {
    pub fn resolve_attack(
        attacker: &Entity,
        defender: &Entity,
        weapon: Option<&WeaponDefinition>,
        attacker_traits: &[Trait],
        defender_armor: Option<&ArmorDefinition>,
    ) -> CombatResult {
        let base_dmg = weapon.map(|w| w.damage).unwrap_or(10); // 10 = Bare Fist
        let mut total_dmg = base_dmg as f32;

        // Apply Trait Multipliers
        if attacker_traits.contains(&Trait::Strong) { total_dmg *= 1.5; }
        if attacker_traits.contains(&Trait::ExtremelyDeadly) {
            if rand::random::<f32>() < 0.40 {
                return CombatResult::InstantKill;
            }
        }

        // Apply Defensive Armor Mitigation
        if let Some(armor) = defender_armor {
            let reduction = (armor.protection_rating as f32) / 100.0;
            total_dmg *= 1.0 - reduction;
        }

        CombatResult::DamageDealt(total_dmg.round() as u16)
    }
}
```

### The Armory Breach Crisis
If rioters penetrate the **Armory**:
1. Rioters bash through the reinforced metal door.
2. Inmates loot **Pump-Action Shotguns, Rifles, and Kevlar Vests**.
3. Inmate combat classification upgrades from *Unarmed/Melee* to *Militarized Armed Insurgent*.
4. Casualty rates among prison staff skyrocket by $+800\%$.

---

## 4. Emergency Response Units & Tactical Deployment

When a prison loses control, standard guards cannot restore order. The player must call in **Emergency Response Services**:

```
                       [ Emergency Callout ]
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
[ Riot Police Squad ]   [ Paramedic Squad ]       [ Firefighter Engine ]
 - 6-Man Armored Team    - 4 Combat Medics         - Extinguishes Arson
 - Heavy Riot Shields    - Revives Bleeding Staff   - Clears Smoke / Rubble
 - Non-Lethal Batons     - Stretcher Evacuation
```

### The National Guard (Failure Condition)
If a riot remains active for **24 continuous in-game hours**, or if more than **$30\%$ of the inmate population is armed with stolen firearms**, the Governor declares a State of Emergency:
* **The National Guard is deployed automatically.**
* Soldiers enter the prison with assault rifles and shoot rioters on sight with lethal intent.
* **Game Over Penalty:** You are fired by the Department of Corrections for criminal negligence and loss of state property.

---

## 5. Surrender Mechanics & Riot Suppression

Rioters can be pacified through force or intimidation:
* **Suppression Shockwave:** When an armed guard fires a shotgun into the air or kills a rioting gang leader, nearby rioters roll a **Morale Check**:

$$\text{Surrender Probability} = \frac{\text{Fear} + \text{Suppression}}{\text{Anger} + \text{GangLoyalty}}$$

* **Surrender Pose:** Inmates who surrender drop their weapons, drop to their knees with hands behind their heads, and enter the `Surrendered` state awaiting handcuffs and transport to Solitary.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Doctor / Staff Hostage Shield** | Inmates hold the prison doctor hostage in the infirmary. | Snipers placed on exterior windows or rooftop towers can take high-precision headshots through glass to neutralize hostage takers without hitting staff. |
| **All Entrances Blocked by Fire** | Inmates set wooden doors on fire, cutting off Riot Police entry. | Firefighters must lead the assault, laying down pressurized water hoses to clear smoke and flames before combat units breach. |
| **Infinite Riot Stalemate** | 10 rioters barricade themselves in a tiny closet with shotguns. | Tear Gas Cannisters: Riot police can deploy tear gas grenades through ventilation vents or windows, incapacitating rioters with heavy coughing and forced surrender. |
