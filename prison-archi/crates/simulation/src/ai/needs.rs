use bevy_ecs::prelude::*;

/// Security classification for prisoners
#[repr(u8)]
#[derive(Component, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SecurityClass {
    MinimumSecurity = 0,
    MediumSecurity = 1,
    MaximumSecurity = 2,
    SuperMax = 3,
    DeathRow = 4,
    Insane = 5,
}

impl Default for SecurityClass {
    fn default() -> Self {
        Self::MediumSecurity
    }
}

/// Baseline hourly decay rates (% per in-game hour)
pub struct BaseDecayRates;
impl BaseDecayRates {
    pub const FOOD: f32 = 8.333;        // Starving at 12 hours
    pub const BLADDER: f32 = 12.5;      // Full at 8 hours
    pub const BOWEL: f32 = 6.25;        // Full at 16 hours
    pub const SLEEP: f32 = 4.167;       // Exhausted at 24 hours
    pub const HYGIENE: f32 = 5.0;       // Needs shower
    pub const EXERCISE: f32 = 4.0;      // Needs yard/gym
    pub const PRIVACY: f32 = 6.0;       // Needs single cell
    pub const FREEDOM: f32 = 5.0;       // Needs free time
    pub const COMFORT: f32 = 3.0;       // Needs soft bed/chair
    pub const FAMILY: f32 = 2.0;        // Needs phone/visitation
    pub const RECREATION: f32 = 5.0;    // Needs TV/radio/pool
    pub const SPIRITUALITY: f32 = 2.5;  // Needs chapel
    pub const LITERACY: f32 = 2.0;      // Needs books/library
    pub const WITHDRAWAL: f32 = 5.0;    // Addiction withdrawal
}

/// The 15 distinct physiological, physical, psychological, and mental needs of an inmate.
/// Values range from 0.0 (fully satisfied) to 100.0 (critically deprived/desperate).
/// (Except safety: 100.0 is completely safe, 0.0 is extreme mortal peril).
#[derive(Component, Debug, Clone, PartialEq)]
pub struct InmateNeeds {
    pub food: f32,
    pub bladder: f32,
    pub bowel: f32,
    pub sleep: f32,
    pub hygiene: f32,
    pub exercise: f32,
    pub safety: f32,
    pub privacy: f32,
    pub freedom: f32,
    pub comfort: f32,
    pub environment: f32,
    pub family: f32,
    pub recreation: f32,
    pub spirituality: f32,
    pub literacy: f32,

    // Addiction and psychology state
    pub has_drug_addiction: bool,
    pub has_alcohol_addiction: bool,
    pub withdrawal_level: f32,
    pub is_suppressed: bool,
    pub suppression_timer: f32,
    pub anger_score: f32,
}

impl Default for InmateNeeds {
    fn default() -> Self {
        Self {
            food: 10.0,
            bladder: 10.0,
            bowel: 10.0,
            sleep: 10.0,
            hygiene: 10.0,
            exercise: 10.0,
            safety: 100.0, // Fully safe by default
            privacy: 10.0,
            freedom: 10.0,
            comfort: 10.0,
            environment: 10.0,
            family: 10.0,
            recreation: 10.0,
            spirituality: 10.0,
            literacy: 10.0,
            has_drug_addiction: false,
            has_alcohol_addiction: false,
            withdrawal_level: 0.0,
            is_suppressed: false,
            suppression_timer: 0.0,
            anger_score: 0.0,
        }
    }
}

impl InmateNeeds {
    pub fn new_satisfied() -> Self {
        Self::default()
    }

    /// Calculates individual volatility/anger score based on critical unmet needs (>80%)
    pub fn compute_individual_anger(&mut self) -> f32 {
        let mut score = 0.0f32;

        if self.food > 80.0 {
            score += (self.food - 80.0) * 1.5;
        }
        if self.sleep > 80.0 {
            score += (self.sleep - 80.0) * 1.2;
        }
        if self.bladder > 80.0 {
            score += (self.bladder - 80.0) * 1.0;
        }
        if self.bowel > 80.0 {
            score += (self.bowel - 80.0) * 1.0;
        }
        if self.hygiene > 80.0 {
            score += (self.hygiene - 80.0) * 0.8;
        }
        if self.freedom > 80.0 {
            score += (self.freedom - 80.0) * 1.0;
        }
        if self.privacy > 80.0 {
            score += (self.privacy - 80.0) * 0.7;
        }
        if self.safety < 20.0 {
            score += (20.0 - self.safety) * 2.0;
        }
        if self.withdrawal_level > 60.0 {
            score += (self.withdrawal_level - 60.0) * 1.5;
        }

        // Suppression dampens active anger display
        if self.is_suppressed {
            score *= 0.25;
        }

        self.anger_score = score.clamp(0.0, 200.0);
        self.anger_score
    }

    /// Step continuous need decay for a time step `dt_hours` (in game hours)
    pub fn step_decay(&mut self, dt_hours: f32) {
        // Polynomial acceleration formula: Need(t + dt) = Need(t) + BaseRate * (1 + (Need/100)^2) * dt
        let accelerate = |current: f32, base_rate: f32| -> f32 {
            let factor = 1.0 + (current / 100.0).powi(2);
            (current + base_rate * factor * dt_hours).clamp(0.0, 100.0)
        };

        self.food = accelerate(self.food, BaseDecayRates::FOOD);
        self.bladder = accelerate(self.bladder, BaseDecayRates::BLADDER);
        self.bowel = accelerate(self.bowel, BaseDecayRates::BOWEL);
        self.sleep = accelerate(self.sleep, BaseDecayRates::SLEEP);
        self.hygiene = accelerate(self.hygiene, BaseDecayRates::HYGIENE);
        self.exercise = accelerate(self.exercise, BaseDecayRates::EXERCISE);
        self.privacy = accelerate(self.privacy, BaseDecayRates::PRIVACY);
        self.freedom = accelerate(self.freedom, BaseDecayRates::FREEDOM);
        self.comfort = accelerate(self.comfort, BaseDecayRates::COMFORT);
        self.family = accelerate(self.family, BaseDecayRates::FAMILY);
        self.recreation = accelerate(self.recreation, BaseDecayRates::RECREATION);
        self.spirituality = accelerate(self.spirituality, BaseDecayRates::SPIRITUALITY);
        self.literacy = accelerate(self.literacy, BaseDecayRates::LITERACY);

        // Safety decays if environment is hostile (or slowly recovers towards 100 if peaceful)
        if !self.is_suppressed {
            self.safety = (self.safety + 2.0 * dt_hours).clamp(0.0, 100.0);
        }

        // Addiction withdrawal decay
        if self.has_drug_addiction || self.has_alcohol_addiction {
            self.withdrawal_level = (self.withdrawal_level + BaseDecayRates::WITHDRAWAL * dt_hours).clamp(0.0, 100.0);
        }

        // Suppression timer countdown
        if self.suppression_timer > 0.0 {
            self.suppression_timer = (self.suppression_timer - dt_hours).max(0.0);
            self.is_suppressed = self.suppression_timer > 0.0;
        }

        self.compute_individual_anger();
    }
}

/// Tracks recent violent incidents, fights, deaths, and searches
#[derive(Resource, Debug, Clone, Default)]
pub struct RecentIncidentsTracker {
    pub unrest_points: f32,
}

/// Global Danger Level Calculus across all inmates in the prison
pub fn calculate_prison_danger(
    inmates: &[(InmateNeeds, SecurityClass)],
    unrest_points: f32,
    armed_guards_count: u32,
) -> f32 {
    if inmates.is_empty() {
        return 0.0;
    }

    let mut total_frustration = 0.0f32;

    for (needs, sec_class) in inmates {
        let mut individual_score = 0.0f32;

        if needs.food > 80.0 {
            individual_score += (needs.food - 80.0) * 1.5;
        }
        if needs.sleep > 80.0 {
            individual_score += (needs.sleep - 80.0) * 1.2;
        }
        if needs.freedom > 80.0 {
            individual_score += (needs.freedom - 80.0) * 1.0;
        }
        if needs.bladder > 80.0 {
            individual_score += (needs.bladder - 80.0) * 0.8;
        }
        if needs.safety < 20.0 {
            individual_score += (20.0 - needs.safety) * 2.0;
        }
        if needs.withdrawal_level > 60.0 {
            individual_score += (needs.withdrawal_level - 60.0) * 1.2;
        }

        let multiplier = match sec_class {
            SecurityClass::MinimumSecurity => 0.5,
            SecurityClass::MediumSecurity => 1.0,
            SecurityClass::MaximumSecurity => 2.0,
            SecurityClass::SuperMax => 3.5,
            SecurityClass::DeathRow => 1.5,
            SecurityClass::Insane => 2.5,
        };

        total_frustration += individual_score * multiplier;
    }

    // Average per inmate
    let avg_frustration = total_frustration / (inmates.len() as f32);

    // Include recent trauma
    let raw_danger = avg_frustration * 2.5 + unrest_points;

    // Armed guard suppression discount (temporarily cools visible danger)
    let suppression_discount = (armed_guards_count as f32) * 5.0;

    (raw_danger - suppression_discount).clamp(0.0, 100.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_food_need_starvation_after_12_hours() {
        let mut needs = InmateNeeds::default();
        needs.food = 0.0;

        // Step 12 in-game hours
        for _ in 0..120 {
            needs.step_decay(0.1); // 12.0 total hours
        }

        assert!(
            needs.food >= 100.0,
            "After 12 hours without food, food need must reach 100% (was {:.1}%)",
            needs.food
        );
        assert!(
            needs.anger_score > 20.0,
            "Starving inmate must have high anger score (was {:.1})",
            needs.anger_score
        );
    }

    #[test]
    fn test_danger_calculus_well_fed_vs_critical_riot() {
        // 50 Well-fed compliant inmates
        let well_fed: Vec<(InmateNeeds, SecurityClass)> = (0..50)
            .map(|_| (InmateNeeds::new_satisfied(), SecurityClass::MediumSecurity))
            .collect();

        let low_danger = calculate_prison_danger(&well_fed, 0.0, 0);
        assert!(
            low_danger < 10.0,
            "Danger in well-fed prison must be < 10% (was {:.1}%)",
            low_danger
        );

        // Deny food and sleep to all 50 inmates
        let rioting: Vec<(InmateNeeds, SecurityClass)> = (0..50)
            .map(|_| {
                let mut n = InmateNeeds::default();
                n.food = 98.0;
                n.sleep = 95.0;
                n.freedom = 92.0;
                n.safety = 5.0;
                (n, SecurityClass::MaximumSecurity)
            })
            .collect();

        let critical_danger = calculate_prison_danger(&rioting, 20.0, 0);
        assert!(
            critical_danger >= 80.0,
            "Danger in starving, exhausted prison must cross 80% riot threshold (was {:.1}%)",
            critical_danger
        );
    }

    #[test]
    fn test_addiction_withdrawal_and_suppression() {
        let mut needs = InmateNeeds::default();
        needs.has_drug_addiction = true;
        needs.withdrawal_level = 10.0;
        needs.is_suppressed = true;
        needs.suppression_timer = 5.0;

        // Step 10 hours
        needs.step_decay(10.0);

        assert!(
            needs.withdrawal_level > 50.0,
            "Drug addicted inmate must experience withdrawal decay (was {:.1}%)",
            needs.withdrawal_level
        );
        assert!(
            !needs.is_suppressed,
            "Suppression timer should expire after 5 hours"
        );
    }
}
