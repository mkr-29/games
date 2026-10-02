# Domain 03: Inmate Simulation & Agent AI
## Feature Specification 03: Traits, Reputations, Legendary Inmates & Gangs

---

## 1. System Overview & The Reputation System

In *Prison Architect Web*, inmates are not generic identical pawns. When prisoners arrive at the Delivery Gate via bus, each entity rolls a set of **Inherent Traits & Reputations**. 

Some traits are visible immediately, while others remain **Hidden (indicated by `?` icons)** until uncovered through **Psychological Profiling, Phone Wiretaps, or Confidential Informants**.

A single "Legendary" prisoner with overlapping violent traits can single-handedly dismantle an entire cellblock if not quarantined in a high-security isolation wing.

```
                      [ Prisoner Arrival ]
                                │
                  Random Trait Assignment Roll
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  [ Common Traits ]      [ Vulnerable Traits ]    [ Legendary Traits ]
   - Strong / Tough        - Snitch (Marked)        - Extremely Deadly
   - Quick / Fast          - Ex-Guard / Ex-Cop      - Extremely Tough
   - Workaholic            - High Suicide Risk      - Instigator + Volatile
        │                       │                       │
        ▼                       ▼                       ▼
 Standard General Pop     Requires Immediate       Requires SuperMax
     Assignment          Protective Custody         Armored Containment
```

---

## 2. Inmate Reputation Taxonomy & Mechanics

### Physical & Combat Traits
* **Deadly / Extremely Deadly:** Attacks have a $30\%$ to $70\%$ chance of delivering an instant lethal critical hit, bypassing standard health pools.
* **Tough / Extremely Tough:** Takes $50\%$ to $80\%$ reduced damage from batons and fists. Shrugs off taser darts without dropping.
* **Fast / Extremely Fast:** Moves at $+40\%$ running speed, easily outrunning standard guards in corridors.
* **Stoic:** Immune to the psychological effects of solitary confinement (no suppression, no morale decay).

### Psychological & Behavioral Traits
* **Volatile:** Rolls a random violent outburst check every in-game hour, even if all 15 physiological needs are completely green (100% satisfied).
* **Instigator:** Emits a passive psychological aura. Whenever an Instigator starts a fight or breaks a bench, all neutral prisoners within an 8-tile radius join the brawl.
* **Cop Killer:** Guards harbor unconscious bias against them. If a Cop Killer causes misconduct, guards will continue beating them well past the point of unconsciousness unless restrained by a Sergeant or Warden.

---

## 3. The Vulnerability Paradox: Snitches & Ex-Law Enforcement

Certain inmates possess traits that make them **targets of lethal assassination contracts** by the general inmate population:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TargetPriority {
    None,
    Low,
    HighPriorityAssassination, // Snitch or Ex-Cop
}

pub fn check_assassination_target(profile: &PrisonerProfile) -> TargetPriority {
    if profile.has_trait(Trait::Snitch) || profile.has_trait(Trait::ExLawEnforcement) {
        TargetPriority::HighPriorityAssassination
    } else {
        TargetPriority::None
    }
}
```

### The Protective Custody Workflow
1. **Unmasking:** An inmate's `Snitch` trait is discovered via wiretap recording or confidential informant intel.
2. **Immediate Threat:** Other inmates within sight line who discover the snitch will immediately equip shanks and initiate an assassination hit.
3. **Player Action:** The player must reclassify the inmate from Medium/Max Sec to **Protective Custody (Yellow Uniform)**.
4. **Physical Isolation:** Protective Custody requires a physically segregated wing: private cells, separate canteen, and isolated yard times. If a Protective Custody prisoner crosses paths with general population inmates in a common corridor, guards must intervene before lethal strikes occur.

---

## 4. Gang Dynamics & Territorial Warfare

Inmates can spawn with gang affiliations (e.g., *The Latin Kings*, *Aryan Brotherhood*, *Biker Syndicate*).

```
[ Gang Members Arrive ]
          │
          ▼
Recruit Neutral Inmates (Loyalty > 75%)
          │
          ▼
Claim Common Room / Yard ("Territory Capture")
          │
    ┌─────┴─────────────────────────┐
    ▼                               ▼
Extort Non-Gang Inmates       Rival Gang Challenges
(Demand protection contraband) (MASSIVE CELLBLOCK GANG WAR)
```

### Gang Mechanics & Rules
* **No Prison Labor:** Gang members refuse to work in kitchens, workshops, or cleaning crews.
* **Territory Control:** Gangs congregate in Yards and Common Rooms. If gang members outnumber guards in that zone for 2 in-game hours, they plant gang graffiti and seize control.
* **Protection Extortion:** Non-gang members entering captured territory are shaken down for contraband or attacked.
* **Punishing Gang Leaders:** Placing a Gang Leader in Solitary triggers an immediate, prison-wide uprising across all affiliated lieutenants and soldiers.

---

## 5. Legendary Inmate Profile Example

Legendary inmates combine multiple extreme traits into a terrifying archetype:

```rust
pub struct LegendaryInmateDefinition {
    pub name: &'static str,
    pub traits: &'static [Trait],
    pub base_health: u16,
    pub unarmed_damage: u16,
}

pub static RAZOR_SULLIVAN: LegendaryInmateDefinition = LegendaryInmateDefinition {
    name: "Thomas 'Razor' Sullivan",
    traits: &[
        Trait::ExtremelyDeadly,
        Trait::ExtremelyTough,
        Trait::Volatile,
        Trait::Instigator,
        Trait::ExpertFighter, // Disarms guards and steals batons/tasers
    ],
    base_health: 800,       // Standard inmate = 100 HP
    unarmed_damage: 60,     // Standard fist hit = 10 HP
};
```

### Protocol for Containing Legendaries:
* Must be housed in a solitary-style **SuperMax Cell** surrounded by reinforced concrete walls.
* Cell door fitted with remote servo motors wired directly to the Security Station.
* Armed guard and K9 unit stationed outside cell door permanently.
* Solitary yard attached directly to the individual cell to prevent contact with general population.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Accidental Snitch in General Canteen** | Unclassified snitch enters general canteen; 40 inmates swarm and stab them in 2 seconds. | "Scared Stiff" AI: When targeted, snitches scream, drop to the fetal position, and emit an emergency audible alarm ping that causes all guards within 20 tiles to sprint to their defense. |
| **All-Gang Prison Deadlock** | $80\%$ of inmates join gangs; zero work is performed; prison economy collapses. | Gang Re-education & Separation Programs: Psychologist offices offer gang-tattoo removal and deradicalization therapy that breaks gang affiliation if safety needs are maintained above $90\%$. |
| **Legendary Inmate Kills 50 Guards** | A single super-inmate repeatedly wipes out entire guard squads. | Free Fire Authorization: Warden activates `Free Fire` command; armed guards switch from non-lethal taser protocol to lethal shotgun fire at long range. |
