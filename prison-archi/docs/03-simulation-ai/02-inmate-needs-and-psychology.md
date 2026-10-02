# Domain 03: Inmate Simulation & Agent AI
## Feature Specification 02: Inmate Needs Hierarchy, Psychology Engine & Danger Calculus

---

## 1. System Overview & The Psychological Loop

Every prisoner in *Prison Architect Web* is driven by a complex, dynamic psychological model. The simulation tracks **15 distinct needs** that decay continuously over time. 

If needs are met, prisoners remain compliant, attend reform programs, and work in industrial workshops. If critical needs are ignored, an inmate's individual **Anger / Volatility Score** escalates. When enough inmates reach critical frustration, the **Global Prison Danger Gauge** spikes, paving the way for riots and coordinated violent misconduct.

```
                      [ Time Passes ]
                             │
            Continuous Need Decay (15 Attributes)
                             │
        ┌────────────────────┴────────────────────┐
        ▼                                         ▼
 [ Needs Satisfied ]                     [ Needs Ignored (>80%) ]
  - Attends Classroom                     - Volatility Score Rises
  - Works in Workshop                     - Fights Guards / Inmates
  - Recidivism Drops                      - Destroys Furniture
  - Parole Subsidies Earned               - Digs Escape Tunnels
                                                  │
                                                  ▼
                                       [ High Global Danger Bar ]
                                                  │
                                                  ▼
                                       💥 FULL PRISON RIOT 💥
```

---

## 2. The 15 Needs: Categories, Decay Rates & Satisfaction Sources

| Need | Category | Decay Rate (per in-game hr) | Critical Trigger | Primary Satisfaction Source |
| :--- | :--- | :--- | :--- | :--- |
| **Food** | Physiological | $+8.3\%$ (Starving at 12 hrs) | Hunger strike, cafeteria brawl | Eating meal in Canteen |
| **Bladder** | Physiological | $+12.5\%$ (Full at 8 hrs) | Urinates on floor (Hygiene penalty) | Using Toilet |
| **Bowel** | Physiological | $+6.2\%$ (Full at 16 hrs) | Soiled clothes, extreme anger | Using Toilet |
| **Sleep** | Physiological | $+4.1\%$ (Exhausted at 24 hrs)| Passes out on ground | Sleeping in Bed |
| **Hygiene** | Physiological | $+5.0\%$ | Bad odor, social irritation | Showering with warm water |
| **Exercise** | Physical | $+4.0\%$ | Restless pacing, gym brawling | Running in Yard, Weight Benches |
| **Safety** | Psychological | Dynamic (drops near brawls) | Fleeing, weapon hoarding | Guard presence, separation from rivals |
| **Privacy** | Psychological | $+6.0\%$ in Dormitories | Resents roommates, attacks beds | Private individual cell, solitary |
| **Freedom** | Psychological | $+5.0\%$ during Lockdown | Bashing cell doors | Free Time, Yard access |
| **Comfort** | Environmental | $+3.0\%$ | Muscle soreness, frustration | Soft beds, chairs, benches |
| **Environment**| Environmental| Proportional to floor grime | Complaints, disgust | Clean floors (Janitors cleaning dirt/trash)|
| **Family** | Social | $+2.0\%$ | Depression, withdrawal | Phone Booths, Visitation Room |
| **Recreation** | Mental | $+5.0\%$ | Boredom, agitation | Televisions, Pool Tables, Radios |
| **Spirituality**| Spiritual | $+2.5\%$ | Melancholy, unrest | Attending Chapel service, prayer mat |
| **Literacy** | Mental | $+2.0\%$ | Restlessness | Reading books in Library |

---

## 3. Mathematical Decay Curves & Differential Equations

Rather than basic linear subtraction, psychological needs decay according to an **accelerating polynomial curve**:

$$\text{Need}(t + \Delta t) = \text{Need}(t) + R_{\text{base}} \times \left( 1.0 + \left( \frac{\text{Need}(t)}{100} \right)^2 \right) \times \Delta t$$

* When a need is low ($< 30\%$), it increases slowly.
* When a need crosses the **Danger Threshold ($> 70\%$)**, the rate of decay doubles, creating an urgent sense of physiological desperation.

### Addiction Withdrawal Sub-System
Inmates with the `Drug Addict` or `Alcoholic` traits experience a dedicated withdrawal curve:

$$\text{Withdrawal}(t) = \min\left(100.0, \, \text{Withdrawal}(t) + R_{\text{addict}} \times \Delta t \right)$$

* At $\text{Withdrawal} > 60\%$: The inmate will steal medicine from the Infirmary or buy moonshine from the black market.
* At $\text{Withdrawal} > 90\%$: The inmate experiences physical tremors, potential fatal overdose, or violent psychosis.
* **Cure:** Completing a 10-day *Pharmacological Drug Treatment* program resets the addiction permanent flag.

---

## 4. The Global Danger Gauge & Prison Temperature Calculus

The overarching prison tension is represented by the **Danger Bar** at the top of the HUD:

$$\text{Danger}_{\text{raw}} = \sum_{i=1}^{N_{\text{inmates}}} w_i \cdot \text{Frustration}(i) + \text{RecentIncidents} - \text{SuppressionAura}$$

```rust
pub fn calculate_prison_danger_system(
    inmates: Query<(&InmateNeeds, &SecurityClass, &AgentBehavior)>,
    incidents: Res<RecentIncidentsTracker>,
    guards: Query<&ArmedGuardComponent>,
) -> f32 {
    let mut danger_sum = 0.0f32;

    for (needs, sec_class, behavior) in inmates.iter() {
        let mut individual_score = 0.0f32;

        // Cumulative unmet needs above 80%
        if needs.food > 80.0 { individual_score += (needs.food - 80.0) * 1.5; }
        if needs.sleep > 80.0 { individual_score += (needs.sleep - 80.0) * 1.2; }
        if needs.freedom > 80.0 { individual_score += (needs.freedom - 80.0) * 1.0; }
        if needs.safety < 20.0 { individual_score += (20.0 - needs.safety) * 2.0; }

        let multiplier = match sec_class {
            SecurityClass::MinimumSecurity => 0.5,
            SecurityClass::MediumSecurity => 1.0,
            SecurityClass::MaximumSecurity => 2.0,
            SecurityClass::SuperMax => 3.5,
            _ => 1.0,
        };

        danger_sum += individual_score * multiplier;
    }

    // Add recent trauma (deaths, fights, strip searches within last 2 hours)
    danger_sum += incidents.unrest_points;

    // Armed guard suppression acts as a dampener (suppresses display, but builds underground resentment)
    let suppression_discount = (guards.iter().count() as f32) * 12.0;
    
    (danger_sum - suppression_discount).clamp(0.0, 1000.0)
}
```

---

## 5. Suppression Aura & Armed Guard Psychology

When an **Armed Guard** patrols near an inmate:
1. The inmate receives the `Suppressed` status effect.
2. Walking speed is reduced by $30\%$ (head down, hands in pockets).
3. Anger decay is temporarily frozen; the inmate will not initiate fights while directly in the line of sight of a shotgun.
4. **The Trade-Off (Suppression Poison):** Suppressed inmates cannot pass rehabilitation programs (classroom concentration drops to zero). Prolonged suppression creates simmering resentment that erupts violently the second armed guards leave the room.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Starvation Death Cascade** | Kitchen staff stuck; 500 inmates starve and die within 24 hours. | Automated Emergency Rations: If average prison hunger $> 90\%$ for 6 hours, emergency boxed meal deliveries arrive by truck automatically (incurring a $20/box penalty against bank balance). |
| **Shower Room Death Matches** | 100 naked inmates congregate in one communal shower; simultaneous fights break out. | Partitioned Showering / Staggered Regimes: AI includes a crowding avoidance penalty; inmates will wait outside shower stalls if density exceeds 2 inmates/tile. |
| **Solitary Psychosis Breakdown** | Inmate left in solitary for 100+ hours with zero stimulation. | Inmate develops permanent psychiatric trauma trait (`Psychotic` or `Depressed`), lowering work productivity to zero and raising recidivism risk to $100\%$. |
