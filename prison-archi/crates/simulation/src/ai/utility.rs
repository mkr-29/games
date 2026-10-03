//! Domain 03: Inmate Simulation & Agent AI
//! Task 4.3: Utility AI Behavior Scoring & Action Selection Curves

use crate::ai::needs::InmateNeeds;

#[repr(u8)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Hash)]
pub enum InmateAction {
    Eat = 0,
    Sleep = 1,
    UseToilet = 2,
    Shower = 3,
    Exercise = 4,
    WanderFreeTime = 5,
    Work = 6,
    LockupInCell = 7,
}

#[repr(u8)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Hash)]
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

#[derive(Clone, Debug)]
pub struct ActionFacilityDistances {
    pub dist_canteen: f32,
    pub dist_bed: f32,
    pub dist_toilet: f32,
    pub dist_shower: f32,
    pub dist_yard: f32,
    pub dist_workplace: f32,
    pub dist_cell: f32,
}

impl Default for ActionFacilityDistances {
    fn default() -> Self {
        Self {
            dist_canteen: 10.0,
            dist_bed: 5.0,
            dist_toilet: 2.0,
            dist_shower: 8.0,
            dist_yard: 15.0,
            dist_workplace: 20.0,
            dist_cell: 5.0,
        }
    }
}

/// Evaluates utility scores for all potential inmate actions given current needs, distances, and regime mandate.
pub fn score_action(
    action: InmateAction,
    needs: &InmateNeeds,
    distances: &ActionFacilityDistances,
    regime: RegimeActivity,
) -> f32 {
    let mut score = 0.0f32;

    match action {
        InmateAction::Eat => {
            // Food need intensity curve
            let intensity = (needs.food / 100.0).powi(2) * 100.0;
            score += intensity * 1.5;
            if needs.food > 80.0 {
                score += (needs.food - 80.0) * 3.0; // Urgent hunger spike
            }
            score -= distances.dist_canteen * 0.3;
            if regime == RegimeActivity::Eat {
                score += 150.0; // Regime mandate bonus
            }
        }
        InmateAction::Sleep => {
            let intensity = (needs.sleep / 100.0).powi(2) * 100.0;
            score += intensity * 1.2;
            if needs.sleep > 80.0 {
                score += (needs.sleep - 80.0) * 2.5;
            }
            score -= distances.dist_bed * 0.2;
            if regime == RegimeActivity::Sleep {
                score += 200.0;
            }
        }
        InmateAction::UseToilet => {
            // Highest of bladder and bowel
            let max_need = needs.bladder.max(needs.bowel);
            let intensity = (max_need / 100.0).powi(2) * 100.0;
            score += intensity * 1.8;
            if max_need > 80.0 {
                // Emergency relief takes precedence over almost anything
                score += (max_need - 80.0) * 5.0 + 50.0;
            }
            score -= distances.dist_toilet * 0.1;
        }
        InmateAction::Shower => {
            let intensity = (needs.hygiene / 100.0).powi(2) * 100.0;
            score += intensity * 1.0;
            if needs.hygiene > 80.0 {
                score += (needs.hygiene - 80.0) * 2.0;
            }
            score -= distances.dist_shower * 0.3;
            if regime == RegimeActivity::Shower {
                score += 120.0;
            }
        }
        InmateAction::Exercise => {
            let intensity = (needs.exercise / 100.0).powi(2) * 100.0;
            score += intensity * 0.9;
            score -= distances.dist_yard * 0.2;
            if regime == RegimeActivity::Yard {
                score += 110.0;
            }
        }
        InmateAction::WanderFreeTime => {
            let freedom_int = (needs.freedom / 100.0).powi(2) * 50.0;
            let rec_int = (needs.recreation / 100.0).powi(2) * 50.0;
            score += freedom_int + rec_int + 10.0; // Base ambient wandering desire
            if regime == RegimeActivity::FreeTime || regime == RegimeActivity::WorkFreeTime {
                score += 60.0;
            }
        }
        InmateAction::Work => {
            if regime == RegimeActivity::WorkLockup || regime == RegimeActivity::WorkFreeTime {
                score += 100.0;
            }
            score -= distances.dist_workplace * 0.2;
        }
        InmateAction::LockupInCell => {
            if regime == RegimeActivity::Lockdown {
                score += 250.0; // Mandatory cell confinement
            } else if regime == RegimeActivity::WorkLockup {
                score += 80.0; // Non-working inmates return to cell
            }
            score -= distances.dist_cell * 0.1;
        }
    }

    score.max(0.0)
}

/// Evaluates all actions and selects the highest scoring action for the inmate.
pub fn select_best_action(
    needs: &InmateNeeds,
    distances: &ActionFacilityDistances,
    regime: RegimeActivity,
) -> (InmateAction, f32) {
    let actions = [
        InmateAction::UseToilet,
        InmateAction::Eat,
        InmateAction::Sleep,
        InmateAction::Shower,
        InmateAction::Exercise,
        InmateAction::WanderFreeTime,
        InmateAction::Work,
        InmateAction::LockupInCell,
    ];

    let mut best_action = InmateAction::WanderFreeTime;
    let mut best_score = -1.0f32;

    for &act in &actions {
        let score = score_action(act, needs, distances, regime);
        if score > best_score {
            best_score = score;
            best_action = act;
        }
    }

    (best_action, best_score)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bladder_emergency_overrides_moderate_food() {
        let mut needs = InmateNeeds::default();
        needs.bladder = 90.0; // Emergency toilet need
        needs.food = 20.0;    // Mild hunger

        let distances = ActionFacilityDistances::default();
        let (best_action, score) = select_best_action(&needs, &distances, RegimeActivity::FreeTime);

        assert_eq!(
            best_action,
            InmateAction::UseToilet,
            "Inmate with Bladder=90% and Food=20% must choose UseToilet, got {:?} with score {}",
            best_action,
            score
        );
    }

    #[test]
    fn test_regime_mandate_boosts_action_priority() {
        let mut needs = InmateNeeds::default();
        needs.food = 40.0;
        needs.sleep = 40.0;
        needs.hygiene = 40.0;

        let distances = ActionFacilityDistances::default();

        // During Eat regime, Eat should win
        let (eat_action, _) = select_best_action(&needs, &distances, RegimeActivity::Eat);
        assert_eq!(eat_action, InmateAction::Eat);

        // During Sleep regime, Sleep should win
        let (sleep_action, _) = select_best_action(&needs, &distances, RegimeActivity::Sleep);
        assert_eq!(sleep_action, InmateAction::Sleep);

        // During Shower regime, Shower should win
        let (shower_action, _) = select_best_action(&needs, &distances, RegimeActivity::Shower);
        assert_eq!(shower_action, InmateAction::Shower);
    }

    #[test]
    fn test_lockdown_regime_forces_lockup_in_cell() {
        let needs = InmateNeeds::default();
        let distances = ActionFacilityDistances::default();

        let (action, _) = select_best_action(&needs, &distances, RegimeActivity::Lockdown);
        assert_eq!(action, InmateAction::LockupInCell);
    }
}
