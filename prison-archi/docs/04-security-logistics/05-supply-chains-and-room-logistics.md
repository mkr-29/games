# Domain 04: Security, Logistics & Regime
## Feature Specification 05: Room Supply Chains, Kitchen Logistics & Laundry Networks

---

## 1. System Overview & The Industrial Supply Engine

A prison functions as a massive, continuous factory. Beyond human containment, the engine must simulate hundreds of material items flowing through closed-loop logistics cycles:
* **The Food Supply Loop:** Raw ingredients $\to$ Cooked meals $\to$ Inmate consumption $\to$ Dirty food trays $\to$ Dishwashing.
* **The Laundry Loop:** Dirty prisoner uniforms $\to$ Washing machines $\to$ Ironing $\to$ Distribution to cell beds.
* **The Mail Pipeline:** Postal deliveries $\to$ Sorting tables $\to$ Satchel distribution $\to$ Inmate literacy/family boost.
* **The Waste Pipeline:** Food scraps and demolished debris $\to$ Garbage bins $\to$ City waste truck pickup.

```
       [ FOOD SUPPLY CHAIN ]                   [ LAUNDRY SUPPLY CHAIN ]
      Delivery Truck Arrives                    Dirty Prison Uniforms
                │                                         │
        [ Delivery Zone ]                         [ Laundry Baskets ]
                │                                         │
    Workmen carry to Kitchen                              ▼
                │                               [ Washing Machines ]
        [ Refrigerators ]                                 │
                │                                         ▼
        [ Cooker Stoves ]                               [ Ironing Boards ]
        (Chefs prep food)                                 │
                │                                         ▼
      [ Serving Counters ]                      [ Clean Uniforms ]
                │                                         │
      Inmates Eat (Food Need 0)                           ▼
                │                               Workmen deliver to Cell Beds
        [ Dirty Food Trays ]                     (Hygiene & Comfort Boost)
                │
         [ Kitchen Sinks ]
      (Washed & Restacked)
```

---

## 2. Food Service Logistics & Kitchen-to-Canteen Math

A single Kitchen can supply multiple Canteens, or one Canteen can draw from multiple Kitchens. The logistics engine manages supply and demand based on registered headcount:

### Headcount Equation
$$\text{Meals Required} = N_{\text{inmates assigned to canteen}}$$

### Equipment Ratios
To reliably feed prisoners within a 2-hour eating window:
* **1 Cooker Stove** prepares meals for **20 prisoners**.
* **1 Refrigerator** stores ingredients for **20 prisoners**.
* **1 Serving Table** holds **80 hot meals**.
* **1 Cook** can operate **2 Cookers** and wash dishes at **1 Sink**.

```rust
pub struct KitchenLogisticsSystem;

impl KitchenLogisticsSystem {
    pub fn calculate_food_order(
        inmate_count: usize,
        meal_policy_quantity: MealQuantity, // Low, Medium, High
        meal_policy_variation: MealVariety,  // Low, Medium, High
    ) -> GroceryOrder {
        let base_ingredients_per_inmate = match meal_policy_quantity {
            MealQuantity::Low => 1.0,
            MealQuantity::Medium => 2.0,
            MealQuantity::High => 3.5,
        };

        let total_boxes = ((inmate_count as f32) * base_ingredients_per_inmate / 10.0).ceil() as u32;
        let cost_per_inmate = match (meal_policy_quantity, meal_policy_variation) {
            (MealQuantity::Low, MealVariety::Low) => 1.00,    // $1/day gruel
            (MealQuantity::Medium, MealVariety::Medium) => 5.00, // $5/day standard
            (MealQuantity::High, MealVariety::High) => 12.00,  // $12/day gourmet
        };

        GroceryOrder {
            ingredient_boxes_needed: total_boxes,
            daily_cost_cents: (cost_per_inmate * 100.0) as u32 * inmate_count as u32,
        }
    }
}
```

---

## 3. Laundry Operations & Clean Uniform Cycle

Dirty clothing accumulates whenever prisoners sleep, exercise, or work:

1. **Collection:** Inmates strip off dirty uniforms during the `Shower` or `Sleep` regime; uniforms are placed in **Laundry Baskets**.
2. **Transport:** Janitors or working inmates push baskets along corridors to the assigned **Laundry Room**.
3. **Washing:** Up to 16 uniforms are loaded into an electrical, plumbed **Washing Machine** (Cycle time: 30 seconds).
4. **Ironing:** Clean, wet clothes are ironed on **Ironing Boards**, giving them a crisp appearance that grants inmates a $+15\%$ Comfort and Hygiene bonus.
5. **Bed Delivery:** Ironed uniforms are stacked onto beds in assigned cells. If an inmate goes 3 days without a clean uniform, their `Hygiene` need stays capped at $50\%$, and complaints escalate.

---

## 4. Mail Sorting & Parcel Screening

1. Mail bags arrive on the morning delivery truck.
2. In the **Mail Room**, prisoners or guards sit at **Sorting Desks**, unpacking letters and parcels into satchels.
3. Guards walk through cellblocks, slipping mail into cells under doors.
4. **Contraband Risk:** Parcels have a $15\%$ chance of containing hidden drugs or weapons; placing a dog handler inside the Mail Room allows K9 units to sniff mailbags before sorting begins.

---

## 5. Logistics Flow Maps & Room Connections

In the **Logistics Screen**, the player manually configures or inspects algorithmic supply links:

```
[ Kitchen A ] ──────(Supply Link)──────► [ Canteen 1: Min Sec ]
      │
      └─────────────(Supply Link)──────► [ Canteen 2: Med Sec ]

[ Laundry Block North ] ───────────────► [ Cell Blocks 1, 2, 3 ]
[ Laundry Block South ] ───────────────► [ Cell Blocks 4, 5, 6 ]
```

* **Automated Supply Routing:** If unassigned, the engine runs a minimum-cost bipartite matching algorithm, connecting each room to its closest supplier based on door traversal distances.

---

## 6. Edge Cases & Resilience

| Edge Case | Failure Mode | Mitigation Strategy |
| :--- | :--- | :--- |
| **Dirty Food Tray Congestion** | Inmates eat meals, but no sinks are plumbed; dirty trays pile on tables, blocking new meals. | Canteen Stacking Limits: When dirty trays fill tables, inmates will eat standing up (receiving a minor annoyance debuff) while generating an urgent Svelte alert: `Kitchen lacks active sinks`. |
| **Laundry Baskets Stolen for Contraband** | Inmates use laundry baskets to transport weapons across cell blocks. | Basket Search Checkpoints: Guards stationed at security gates inspect the contents of wheeled laundry carts passing between sectors. |
| **Delivery Highway Gridlock** | Food truck stuck in roadway traffic behind 20 material supply trucks; kitchen starves. | Priority Traffic Lane: Food and emergency vehicles can bypass idling supply flatbeds on the roadway shoulder. |
