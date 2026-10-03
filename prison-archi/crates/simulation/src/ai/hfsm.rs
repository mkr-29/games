//! Domain 03: Inmate Simulation & Agent AI
//! Task 4.3: Hierarchical Finite State Machine (HFSM) for Inmate Action Execution

use crate::ai::needs::InmateNeeds;
use crate::ai::utility::{select_best_action, ActionFacilityDistances, InmateAction, RegimeActivity};

#[derive(Clone, PartialEq, Debug)]
pub enum AgentState {
    SelectNextAction,
    NavigatingToTarget {
        action: InmateAction,
        target_x: f32,
        target_y: f32,
    },
    InteractingWithObject {
        action: InmateAction,
        progress: f32,
        total_duration: f32,
    },
    NeedSatisfied {
        action: InmateAction,
    },
    Interrupted {
        reason: String,
    },
}

#[derive(Clone, Debug)]
pub struct AgentBehavior {
    pub current_state: AgentState,
    pub current_action: Option<InmateAction>,
    pub position: (f32, f32),
    pub move_speed: f32,
    pub is_compliant: bool,
}

impl AgentBehavior {
    pub fn new(x: f32, y: f32) -> Self {
        Self {
            current_state: AgentState::SelectNextAction,
            current_action: None,
            position: (x, y),
            move_speed: 3.5,
            is_compliant: true,
        }
    }

    /// Determines the world coordinate target for a chosen action given standard facility layouts.
    pub fn get_target_for_action(&self, action: InmateAction) -> (f32, f32) {
        match action {
            InmateAction::UseToilet => (246.0, 246.0),
            InmateAction::Eat => (256.0, 245.0),
            InmateAction::Sleep => (245.0, 246.0),
            InmateAction::Shower => (244.0, 247.0),
            InmateAction::Exercise => (246.0, 265.0),
            InmateAction::WanderFreeTime => (self.position.0 + 2.0, self.position.1 + 1.0),
            InmateAction::Work => (270.0, 250.0),
            InmateAction::LockupInCell => (245.0, 245.0),
        }
    }

    /// Determines interaction duration in seconds for each activity.
    pub fn get_interaction_duration(&self, action: InmateAction) -> f32 {
        match action {
            InmateAction::UseToilet => 3.0,
            InmateAction::Eat => 10.0,
            InmateAction::Sleep => 20.0,
            InmateAction::Shower => 6.0,
            InmateAction::Exercise => 8.0,
            InmateAction::WanderFreeTime => 5.0,
            InmateAction::Work => 15.0,
            InmateAction::LockupInCell => 12.0,
        }
    }

    /// Steps the HFSM logic for a time delta `dt` (in seconds).
    pub fn step(
        &mut self,
        dt: f32,
        needs: &mut InmateNeeds,
        distances: &ActionFacilityDistances,
        regime: RegimeActivity,
    ) {
        match self.current_state.clone() {
            AgentState::SelectNextAction => {
                let (best_action, _) = select_best_action(needs, distances, regime);
                let (tx, ty) = self.get_target_for_action(best_action);
                self.current_action = Some(best_action);
                self.current_state = AgentState::NavigatingToTarget {
                    action: best_action,
                    target_x: tx,
                    target_y: ty,
                };
            }

            AgentState::NavigatingToTarget {
                action,
                target_x,
                target_y,
            } => {
                let dx = target_x - self.position.0;
                let dy = target_y - self.position.1;
                let dist = (dx * dx + dy * dy).sqrt();

                if dist < 0.6 {
                    // Reached interaction site! Begin object interaction
                    let duration = self.get_interaction_duration(action);
                    self.current_state = AgentState::InteractingWithObject {
                        action,
                        progress: 0.0,
                        total_duration: duration,
                    };
                } else {
                    // Move towards target
                    let step_dist = self.move_speed * dt;
                    if step_dist >= dist {
                        self.position = (target_x, target_y);
                    } else {
                        self.position.0 += (dx / dist) * step_dist;
                        self.position.1 += (dy / dist) * step_dist;
                    }
                }
            }

            AgentState::InteractingWithObject {
                action,
                mut progress,
                total_duration,
            } => {
                progress += dt;
                if progress >= total_duration {
                    // Action complete! Satisfy corresponding physiological needs
                    match action {
                        InmateAction::UseToilet => {
                            needs.bladder = 0.0;
                            needs.bowel = 0.0;
                        }
                        InmateAction::Eat => {
                            needs.food = (needs.food - 80.0).max(0.0);
                        }
                        InmateAction::Sleep => {
                            needs.sleep = (needs.sleep - 70.0).max(0.0);
                            needs.comfort = (needs.comfort - 50.0).max(0.0);
                        }
                        InmateAction::Shower => {
                            needs.hygiene = (needs.hygiene - 85.0).max(0.0);
                        }
                        InmateAction::Exercise => {
                            needs.exercise = (needs.exercise - 75.0).max(0.0);
                            needs.recreation = (needs.recreation - 40.0).max(0.0);
                        }
                        InmateAction::WanderFreeTime => {
                            needs.freedom = (needs.freedom - 30.0).max(0.0);
                            needs.recreation = (needs.recreation - 30.0).max(0.0);
                        }
                        InmateAction::Work => {
                            needs.literacy = (needs.literacy - 20.0).max(0.0);
                        }
                        InmateAction::LockupInCell => {
                            needs.privacy = (needs.privacy - 40.0).max(0.0);
                        }
                    }

                    self.current_state = AgentState::NeedSatisfied { action };
                } else {
                    self.current_state = AgentState::InteractingWithObject {
                        action,
                        progress,
                        total_duration,
                    };
                }
            }

            AgentState::NeedSatisfied { .. } => {
                // Loop back to evaluate the next highest priority utility action
                self.current_action = None;
                self.current_state = AgentState::SelectNextAction;
            }

            AgentState::Interrupted { .. } => {
                // Return to select next action when interrupt cleared
                self.current_state = AgentState::SelectNextAction;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_inmate_full_hfsm_interaction_lifecycle() {
        let mut behavior = AgentBehavior::new(246.0, 240.0); // Start near toilet at (246, 246)
        let mut needs = InmateNeeds::default();
        needs.bladder = 95.0; // Urgent need
        let distances = ActionFacilityDistances {
            dist_toilet: 6.0,
            ..Default::default()
        };

        // 1. Initial State: SelectNextAction -> picks UseToilet and enters NavigatingToTarget
        behavior.step(0.1, &mut needs, &distances, RegimeActivity::FreeTime);
        match behavior.current_state {
            AgentState::NavigatingToTarget { action, .. } => {
                assert_eq!(action, InmateAction::UseToilet);
            }
            _ => panic!("Expected NavigatingToTarget state, got {:?}", behavior.current_state),
        }

        // 2. Simulate navigation stepping until reaching toilet target (246, 246)
        for _ in 0..50 {
            behavior.step(0.1, &mut needs, &distances, RegimeActivity::FreeTime);
            if let AgentState::InteractingWithObject { .. } = behavior.current_state {
                break;
            }
        }

        // Must be in InteractingWithObject
        match behavior.current_state {
            AgentState::InteractingWithObject { action, total_duration, .. } => {
                assert_eq!(action, InmateAction::UseToilet);
                assert_eq!(total_duration, 3.0);
            }
            _ => panic!("Expected InteractingWithObject state, got {:?}", behavior.current_state),
        }

        // 3. Step through toilet interaction duration (3.0s)
        for _ in 0..35 {
            behavior.step(0.1, &mut needs, &distances, RegimeActivity::FreeTime);
        }

        // 4. Assert bladder has been fully satisfied (reset to 0%)
        assert_eq!(needs.bladder, 0.0, "Bladder must be reset to 0% after using toilet");
    }
}
