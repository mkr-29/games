# Domain 04: Security, Logistics & Regime
## Feature Specification 03: Contraband Economy, Smuggling Vectors & Detection Networks

---

## 1. System Overview & The Contraband Black Market

Contraband circulation in *Prison Architect Web* is a fully realized physical and economic subsystem. Items are not spawned arbitrarily in inmate pockets; they **physically enter the prison through realistic supply channels**, are stashed in cell hiding spots, traded for cash or favors, and weaponized during escapes and uprisings.

```
                  ┌───────────────────────────────┐
                  │ 5 PRIMARY CONTRABAND VECTORS  │
                  └───────────────┬───────────────┘
                                  │
    ┌──────────────┬──────────────┼──────────────┬──────────────┐
    ▼              ▼              ▼              ▼              ▼
[ Delivery ]   [ Mail Room ]  [ Visitation ] [ 10m Fence ]  [ Room Theft ]
  Trucks to     Packages &      Family hand-   Throws from   Kitchen Knives,
  Kitchens       Letters          offs           Forest       Meds, Saws
    │              │              │              │              │
    └──────────────┴──────────────┼──────────────┴──────────────┘
                                  ▼
                 [ Inmate Pocket or Cell Stash ]
                                  │
                 [ Underground Black Market Trade ]
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
         [ Detection ]                     [ Utilization ]
       - Metal Detectors                 - Stabbing Rivals (Shiv)
       - K9 Drug Dogs                    - Tunneling (Spoon/Shovel)
       - Guard Searches                  - Overdose (Narcotics)
```

---

## 2. Contraband Classification & Profiles

Contraband falls into **4 functional categories**:

| Category | Typical Items | Threat Level | Primary Source | Concealment Location |
| :--- | :--- | :--- | :--- | :--- |
| **Weapons** | Shiv, Knife, Club, Shotgun, Gun | Lethal | Kitchen, Armory, Workshop | Behind Toilet, Under Pillow |
| **Tools** | Spoon, Shovel, Pickaxe, Screwdriver, Wirecutters | Escape Risk | Workshop, Utility Room | Inside Toilet Pipe |
| **Narcotics** | Medicine, Poison, Weed, Booze, Heroin | Health Risk | Infirmary, Mail, Visitors | Hollowed Book, Mattress |
| **Luxuries** | Cigarettes, Lighter, Mobile Phone | Black Market | Visitation, Throws | Locker, Air Vent |

```rust
#[derive(Debug, Clone)]
pub struct ContrabandItem {
    pub item_id: u16,
    pub name: &'static str,
    pub category: ContrabandCategory,
    pub is_metallic: bool,       // Triggers Metal Detectors
    pub has_narcotic_scent: bool,// Triggers K9 Dogs
    pub market_value_cents: u32,
    pub lethal_damage: u16,
    pub dig_speed: f32,
}

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ContrabandCategory {
    Weapon = 0,
    Tool = 1,
    Narcotic = 2,
    Luxury = 3,
}
```

---

## 3. The 5 Smuggling Ingress Vectors

### Vector 1: Delivery Trucks (Roadway Ingress)
* Every ingredient crate, steel sheet, or construction box arriving on the highway rolls an RNG check against the **Smuggling Influx Modifier**.
* Contraband travels inside crates directly to Kitchens, Workshops, and Storage.

### Vector 2: Mail Room & Delivery Parcels
* Incoming letters and packages can contain concealed drugs or razor blades.
* **Countermeasure:** Stationing a guard with a dog in the Mail Room sniffs packages before distribution.

### Vector 3: Visitation Room
* During scheduled visiting hours, relatives secretly pass mobile phones, narcotics, and cash across visitation tables.
* **Countermeasure:** Metal detectors placed at the entrance to the visitor wing, or installing glass partition booths (prevents physical touch, but reduces family morale bonus).

### Vector 4: Over-The-Wall Throws (Perimeter Physics)
* Outside accomplices in the forest throw contraband packages over exterior walls.
* **The 10-Tile Rule:** An accomplice can only throw an item **up to 10 tiles inward** from the outer edge of the property line.
* **Countermeasure:** Building a **double perimeter fence** separated by a 12-tile buffer zone prevents thrown packages from reaching inmate yards.

### Vector 5: Room Theft (Internal Diversion)
* Inmates working or attending programs steal items from unattended rooms:
  * **Kitchen:** Knives, cleavers, forks.
  * **Infirmary:** Syringes, morphine, prescription medicine.
  * **Workshop:** Saws, screwdrivers, hammers.
  * **Offices:** Lighters, scissors, mobile phones.

---

## 4. The Inmate Black Market Economy

Inmates possess dynamic personal balances of **Smuggled Cash ($)**:
1. Inmates earn cash by working jobs or receiving money from visitors.
2. Inmates purchase luxury goods (cigarettes, booze) to satisfy recreation and addiction needs.
3. Gangs run **Protection Rackets**, collecting a $10/day tax from non-gang inmates in exchange for safety.

---

## 5. Detection Networks & Countermeasures

```rust
pub fn check_detection_sensor(
    item: &ContrabandItem,
    sensor: &DetectionSensor,
) -> bool {
    match sensor {
        DetectionSensor::MetalDetector => {
            if item.is_metallic {
                rand::random::<f32>() < 0.95 // 95% detection rate
            } else {
                false // Wooden club or plastic shiv passes undetected
            }
        }
        DetectionSensor::K9SnifferDog => {
            if item.has_narcotic_scent {
                rand::random::<f32>() < 0.90 // 90% detection rate
            } else {
                false
            }
        }
        DetectionSensor::ManualGuardSearch => {
            // Guard searches roll against contraband concealment score
            rand::random::<f32>() < 0.75
        }
    }
}
```

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **False Positive Alarm Storm** | Metal detector trips repeatedly on legal metal baking trays carried by cooks. | Item Filter Logic: Detectors ignore official kitchen cookware carried by authorized cooks on duty. |
| **Guard Shakedown Retaliation** | Prison-wide shakedown wakes 1,000 sleeping inmates at 02:00; immediate riot. | Tactical Targeted Searches: Instead of full prison shakedowns, use Confidential Informants to search only targeted, suspect cells. |
| **Pill Overdose in Solitary** | Inmate in solitary overdoses on hidden morphine and dies unattended. | Doctor Rounds: Medical staff perform scheduled daily wellness checks on solitary confinement cells. |
