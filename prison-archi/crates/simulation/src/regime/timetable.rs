//! Domain 04: Security, Logistics & Regime
//! Task 4.4: 24-Hour Master Regime Timetable & Emergency Overrides

use crate::ai::needs::SecurityClass;
use crate::ai::utility::RegimeActivity;

pub const HOURS_PER_DAY: usize = 24;
pub const SECURITY_TIERS_COUNT: usize = 7;

#[repr(u8)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Hash)]
pub enum GlobalEmergencyOverride {
    None = 0,
    Bangup = 1,
    Lockdown = 2,
    Shakedown = 3,
    FreeFire = 4,
}

#[derive(Clone, Debug)]
pub struct MasterClock {
    pub day: u32,
    pub hour: u8,
    pub minute: u8,
    pub second: f32,
    pub time_scale: f32,
    pub total_elapsed_minutes: f64,
}

impl Default for MasterClock {
    fn default() -> Self {
        Self {
            day: 1,
            hour: 8, // Start at 08:00 AM breakfast
            minute: 0,
            second: 0.0,
            time_scale: 1.0,
            total_elapsed_minutes: 8.0 * 60.0,
        }
    }
}

impl MasterClock {
    pub fn new(start_hour: u8) -> Self {
        Self {
            day: 1,
            hour: start_hour % 24,
            minute: 0,
            second: 0.0,
            time_scale: 1.0,
            total_elapsed_minutes: (start_hour as f64) * 60.0,
        }
    }

    /// Advances the simulation clock by real time `dt_seconds`.
    /// 1 real-world second at 1.0x speed = 1 in-game minute (60x time factor).
    pub fn tick(&mut self, dt_seconds: f32) {
        if self.time_scale <= 0.0 {
            return;
        }

        let game_minutes_delta = (dt_seconds as f64) * (self.time_scale as f64);
        self.total_elapsed_minutes += game_minutes_delta;

        let total_secs = self.second as f64 + (dt_seconds as f64 * 60.0 * self.time_scale as f64);
        let added_mins = (total_secs / 60.0).floor() as u32;
        self.second = (total_secs % 60.0) as f32;

        let total_mins = self.minute as u32 + added_mins;
        let added_hours = total_mins / 60;
        self.minute = (total_mins % 60) as u8;

        let total_hours = self.hour as u32 + added_hours;
        let added_days = total_hours / 24;
        self.hour = (total_hours % 24) as u8;
        self.day += added_days;
    }

    pub fn format_time_string(&self) -> String {
        format!("Day {} - {:02}:{:02}", self.day, self.hour, self.minute)
    }
}

#[derive(Clone, Debug)]
pub struct RegimeScheduleTable {
    // 7 tiers x 24 hours
    pub schedule: [[RegimeActivity; HOURS_PER_DAY]; SECURITY_TIERS_COUNT],
}

impl Default for RegimeScheduleTable {
    fn default() -> Self {
        let mut table = Self {
            schedule: [[RegimeActivity::Lockdown; HOURS_PER_DAY]; SECURITY_TIERS_COUNT],
        };

        // Populate realistic default staggered schedules for each security tier
        for tier in 0..SECURITY_TIERS_COUNT {
            // Hours 00..06: Sleep
            for h in 0..6 {
                table.schedule[tier][h] = RegimeActivity::Sleep;
            }
            // Hour 06: Shower
            table.schedule[tier][6] = RegimeActivity::Shower;

            // Staggered Meal & Yard Times to prevent cross-tier collisions
            match tier {
                0 => {
                    // Minimum Security: Eat at 07:00 & 12:00, Yard at 16:00, Free time evening
                    table.schedule[tier][7] = RegimeActivity::Eat;
                    table.schedule[tier][8] = RegimeActivity::WorkFreeTime;
                    table.schedule[tier][9] = RegimeActivity::WorkFreeTime;
                    table.schedule[tier][10] = RegimeActivity::WorkFreeTime;
                    table.schedule[tier][11] = RegimeActivity::FreeTime;
                    table.schedule[tier][12] = RegimeActivity::Eat;
                    table.schedule[tier][13] = RegimeActivity::WorkFreeTime;
                    table.schedule[tier][14] = RegimeActivity::WorkFreeTime;
                    table.schedule[tier][15] = RegimeActivity::FreeTime;
                    table.schedule[tier][16] = RegimeActivity::Yard;
                    table.schedule[tier][17] = RegimeActivity::Eat;
                    table.schedule[tier][18] = RegimeActivity::FreeTime;
                    table.schedule[tier][19] = RegimeActivity::FreeTime;
                    table.schedule[tier][20] = RegimeActivity::FreeTime;
                    table.schedule[tier][21] = RegimeActivity::Lockdown;
                    table.schedule[tier][22] = RegimeActivity::Sleep;
                    table.schedule[tier][23] = RegimeActivity::Sleep;
                }
                1 => {
                    // Medium Security: Eat at 08:00 & 13:00, Yard at 17:00
                    table.schedule[tier][7] = RegimeActivity::Lockdown;
                    table.schedule[tier][8] = RegimeActivity::Eat;
                    table.schedule[tier][9] = RegimeActivity::WorkLockup;
                    table.schedule[tier][10] = RegimeActivity::WorkLockup;
                    table.schedule[tier][11] = RegimeActivity::WorkLockup;
                    table.schedule[tier][12] = RegimeActivity::Lockdown;
                    table.schedule[tier][13] = RegimeActivity::Eat;
                    table.schedule[tier][14] = RegimeActivity::WorkLockup;
                    table.schedule[tier][15] = RegimeActivity::WorkLockup;
                    table.schedule[tier][16] = RegimeActivity::FreeTime;
                    table.schedule[tier][17] = RegimeActivity::Yard;
                    table.schedule[tier][18] = RegimeActivity::Eat;
                    table.schedule[tier][19] = RegimeActivity::FreeTime;
                    table.schedule[tier][20] = RegimeActivity::Lockdown;
                    table.schedule[tier][21] = RegimeActivity::Lockdown;
                    table.schedule[tier][22] = RegimeActivity::Sleep;
                    table.schedule[tier][23] = RegimeActivity::Sleep;
                }
                2 => {
                    // Maximum Security: Eat at 09:00 & 14:00, Yard at 18:00
                    table.schedule[tier][7] = RegimeActivity::Lockdown;
                    table.schedule[tier][8] = RegimeActivity::Lockdown;
                    table.schedule[tier][9] = RegimeActivity::Eat;
                    table.schedule[tier][10] = RegimeActivity::WorkLockup;
                    table.schedule[tier][11] = RegimeActivity::WorkLockup;
                    table.schedule[tier][12] = RegimeActivity::Lockdown;
                    table.schedule[tier][13] = RegimeActivity::Lockdown;
                    table.schedule[tier][14] = RegimeActivity::Eat;
                    table.schedule[tier][15] = RegimeActivity::Lockdown;
                    table.schedule[tier][16] = RegimeActivity::Lockdown;
                    table.schedule[tier][17] = RegimeActivity::FreeTime;
                    table.schedule[tier][18] = RegimeActivity::Yard;
                    table.schedule[tier][19] = RegimeActivity::Eat;
                    table.schedule[tier][20] = RegimeActivity::Lockdown;
                    table.schedule[tier][21] = RegimeActivity::Lockdown;
                    table.schedule[tier][22] = RegimeActivity::Sleep;
                    table.schedule[tier][23] = RegimeActivity::Sleep;
                }
                _ => {
                    // SuperMax / Solitary: 23-hour lockdown, 1-hour solitary yard
                    for h in 7..19 {
                        table.schedule[tier][h] = RegimeActivity::Lockdown;
                    }
                    table.schedule[tier][19] = RegimeActivity::Yard;
                    for h in 20..24 {
                        table.schedule[tier][h] = RegimeActivity::Lockdown;
                    }
                }
            }
        }

        table
    }
}

impl RegimeScheduleTable {
    pub fn get_activity(&self, tier: usize, hour: usize) -> RegimeActivity {
        let t = tier.min(SECURITY_TIERS_COUNT - 1);
        let h = hour % HOURS_PER_DAY;
        self.schedule[t][h]
    }

    pub fn set_activity(&mut self, tier: usize, hour: usize, activity: RegimeActivity) {
        let t = tier.min(SECURITY_TIERS_COUNT - 1);
        let h = hour % HOURS_PER_DAY;
        self.schedule[t][h] = activity;
    }
}

#[derive(Clone, Debug)]
pub struct RegimeBroadcastManager {
    pub clock: MasterClock,
    pub schedule: RegimeScheduleTable,
    pub active_override: GlobalEmergencyOverride,
}

impl Default for RegimeBroadcastManager {
    fn default() -> Self {
        Self {
            clock: MasterClock::default(),
            schedule: RegimeScheduleTable::default(),
            active_override: GlobalEmergencyOverride::None,
        }
    }
}

impl RegimeBroadcastManager {
    /// Determines the effective regime activity for an inmate taking emergency overrides and compliance into account.
    pub fn get_effective_activity(
        &self,
        sec_class: SecurityClass,
        anger_score: f32,
    ) -> RegimeActivity {
        let tier_idx = match sec_class {
            SecurityClass::MinimumSecurity => 0,
            SecurityClass::MediumSecurity => 1,
            SecurityClass::MaximumSecurity => 2,
            SecurityClass::SuperMax => 3,
            SecurityClass::DeathRow => 4,
            SecurityClass::Insane => 5,
        };

        match self.active_override {
            GlobalEmergencyOverride::Lockdown => {
                // All doors and inmates sealed shut
                RegimeActivity::Lockdown
            }
            GlobalEmergencyOverride::Bangup => {
                if anger_score > 80.0 {
                    // Hostile rioting prisoner refuses Bangup order!
                    self.schedule.get_activity(tier_idx, self.clock.hour as usize)
                } else {
                    // Compliant prisoner obeys and locks down in cell
                    RegimeActivity::Lockdown
                }
            }
            _ => self.schedule.get_activity(tier_idx, self.clock.hour as usize),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_staggered_canteen_regime_times() {
        let regime = RegimeBroadcastManager::default();

        // At 12:00 PM (Hour 12):
        // Min-Sec is eating (Eat)
        let min_act = regime.schedule.get_activity(0, 12);
        assert_eq!(min_act, RegimeActivity::Eat, "Min-Sec must be scheduled to eat at 12:00");

        // Med-Sec is locked down / not eating (Lockdown)
        let med_act = regime.schedule.get_activity(1, 12);
        assert_ne!(med_act, RegimeActivity::Eat, "Med-Sec must NOT be in canteen at 12:00");

        // At 13:00 PM (Hour 13):
        // Med-Sec is eating (Eat)
        let med_act_13 = regime.schedule.get_activity(1, 13);
        assert_eq!(med_act_13, RegimeActivity::Eat, "Med-Sec must be scheduled to eat at 13:00");

        // Min-Sec has vacated canteen for work
        let min_act_13 = regime.schedule.get_activity(0, 13);
        assert_ne!(min_act_13, RegimeActivity::Eat, "Min-Sec must have vacated canteen by 13:00");
    }

    #[test]
    fn test_bangup_compliance_and_hostile_refusal() {
        let mut regime = RegimeBroadcastManager::default();
        regime.clock.hour = 14; // Afternoon Free time / Work
        regime.active_override = GlobalEmergencyOverride::Bangup;

        // Compliant prisoner (Anger = 15.0) -> Returns Lockdown in cell
        let compliant_act = regime.get_effective_activity(SecurityClass::MinimumSecurity, 15.0);
        assert_eq!(
            compliant_act,
            RegimeActivity::Lockdown,
            "Compliant inmate must obey Bangup and return to cell"
        );

        // Hostile rioting prisoner (Anger = 95.0) -> Refuses Bangup order
        let hostile_act = regime.get_effective_activity(SecurityClass::MaximumSecurity, 95.0);
        assert_ne!(
            hostile_act,
            RegimeActivity::Lockdown,
            "Hostile rioting inmate must refuse Bangup order"
        );
    }

    #[test]
    fn test_master_clock_tick_advancement() {
        let mut clock = MasterClock::new(7); // 07:00 AM
        assert_eq!(clock.hour, 7);
        assert_eq!(clock.minute, 0);

        // 60 real-time seconds at 1.0x speed = 60 in-game minutes = 1 hour
        clock.tick(60.0);
        assert_eq!(clock.hour, 8);
        assert_eq!(clock.minute, 0);

        // Advance another 90 real-time seconds = 1 hr 30 mins -> 09:30 AM
        clock.tick(90.0);
        assert_eq!(clock.hour, 9);
        assert_eq!(clock.minute, 30);
    }
}
