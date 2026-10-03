/**
 * Domain 04: Security, Logistics & Regime
 * Task 4.4: 24-Hour Master Regime Timetable & Emergency Overrides
 */

import { SecurityClass } from '../ai/InmateNeedsManager.ts';
import { RegimeActivity } from '../ai/UtilityAIManager.ts';

export { RegimeActivity };

export const GlobalEmergencyOverride = {
  None: 0,
  Bangup: 1,
  Lockdown: 2,
  Shakedown: 3,
  FreeFire: 4,
} as const;
export type GlobalEmergencyOverride =
  (typeof GlobalEmergencyOverride)[keyof typeof GlobalEmergencyOverride];

export const HOURS_PER_DAY = 24;
export const SECURITY_TIERS_COUNT = 7;

export class MasterClock {
  public day: number = 1;
  public hour: number = 8;
  public minute: number = 0;
  public second: number = 0.0;
  public timeScale: number = 1.0; // 0 = Paused, 1x, 2x, 5x
  public totalElapsedMinutes: number = 8.0 * 60.0;

  constructor(startHour: number = 8) {
    this.hour = startHour % 24;
    this.totalElapsedMinutes = startHour * 60.0;
  }

  /**
   * Advances simulation time by `dtSeconds`.
   * 1 real-world second at 1.0x speed = 1 in-game minute (60x time acceleration).
   */
  public tick(dtSeconds: number): void {
    if (this.timeScale <= 0) return;

    const gameMinutesDelta = dtSeconds * this.timeScale;
    this.totalElapsedMinutes += gameMinutesDelta;

    const totalSecs = this.second + dtSeconds * 60.0 * this.timeScale;
    const addedMins = Math.floor(totalSecs / 60.0);
    this.second = totalSecs % 60.0;

    const totalMins = this.minute + addedMins;
    const addedHours = Math.floor(totalMins / 60);
    this.minute = totalMins % 60;

    const totalHours = this.hour + addedHours;
    const addedDays = Math.floor(totalHours / 24);
    this.hour = totalHours % 24;
    this.day += addedDays;
  }

  public getTimeString(): string {
    const hh = this.hour.toString().padStart(2, '0');
    const mm = this.minute.toString().padStart(2, '0');
    return `Day ${this.day} • ${hh}:${mm}`;
  }
}

export class RegimeScheduleTable {
  public schedule: RegimeActivity[][];

  constructor() {
    this.schedule = Array.from({ length: SECURITY_TIERS_COUNT }, () =>
      Array(HOURS_PER_DAY).fill(RegimeActivity.Lockdown)
    );

    // Initialize default staggered schedule
    for (let tier = 0; tier < SECURITY_TIERS_COUNT; tier++) {
      // 00..06: Sleep
      for (let h = 0; h < 6; h++) {
        this.schedule[tier][h] = RegimeActivity.Sleep;
      }
      this.schedule[tier][6] = RegimeActivity.Shower;

      if (tier === 0) {
        // Min-Sec
        this.schedule[tier][7] = RegimeActivity.Eat;
        this.schedule[tier][8] = RegimeActivity.WorkFreeTime;
        this.schedule[tier][9] = RegimeActivity.WorkFreeTime;
        this.schedule[tier][10] = RegimeActivity.WorkFreeTime;
        this.schedule[tier][11] = RegimeActivity.FreeTime;
        this.schedule[tier][12] = RegimeActivity.Eat;
        this.schedule[tier][13] = RegimeActivity.WorkFreeTime;
        this.schedule[tier][14] = RegimeActivity.WorkFreeTime;
        this.schedule[tier][15] = RegimeActivity.FreeTime;
        this.schedule[tier][16] = RegimeActivity.Yard;
        this.schedule[tier][17] = RegimeActivity.Eat;
        this.schedule[tier][18] = RegimeActivity.FreeTime;
        this.schedule[tier][19] = RegimeActivity.FreeTime;
        this.schedule[tier][20] = RegimeActivity.FreeTime;
        this.schedule[tier][21] = RegimeActivity.Lockdown;
        this.schedule[tier][22] = RegimeActivity.Sleep;
        this.schedule[tier][23] = RegimeActivity.Sleep;
      } else if (tier === 1) {
        // Med-Sec
        this.schedule[tier][7] = RegimeActivity.Lockdown;
        this.schedule[tier][8] = RegimeActivity.Eat;
        this.schedule[tier][9] = RegimeActivity.WorkLockup;
        this.schedule[tier][10] = RegimeActivity.WorkLockup;
        this.schedule[tier][11] = RegimeActivity.WorkLockup;
        this.schedule[tier][12] = RegimeActivity.Lockdown;
        this.schedule[tier][13] = RegimeActivity.Eat;
        this.schedule[tier][14] = RegimeActivity.WorkLockup;
        this.schedule[tier][15] = RegimeActivity.WorkLockup;
        this.schedule[tier][16] = RegimeActivity.FreeTime;
        this.schedule[tier][17] = RegimeActivity.Yard;
        this.schedule[tier][18] = RegimeActivity.Eat;
        this.schedule[tier][19] = RegimeActivity.FreeTime;
        this.schedule[tier][20] = RegimeActivity.Lockdown;
        this.schedule[tier][21] = RegimeActivity.Lockdown;
        this.schedule[tier][22] = RegimeActivity.Sleep;
        this.schedule[tier][23] = RegimeActivity.Sleep;
      } else if (tier === 2) {
        // Max-Sec
        this.schedule[tier][7] = RegimeActivity.Lockdown;
        this.schedule[tier][8] = RegimeActivity.Lockdown;
        this.schedule[tier][9] = RegimeActivity.Eat;
        this.schedule[tier][10] = RegimeActivity.WorkLockup;
        this.schedule[tier][11] = RegimeActivity.WorkLockup;
        this.schedule[tier][12] = RegimeActivity.Lockdown;
        this.schedule[tier][13] = RegimeActivity.Lockdown;
        this.schedule[tier][14] = RegimeActivity.Eat;
        this.schedule[tier][15] = RegimeActivity.Lockdown;
        this.schedule[tier][16] = RegimeActivity.Lockdown;
        this.schedule[tier][17] = RegimeActivity.FreeTime;
        this.schedule[tier][18] = RegimeActivity.Yard;
        this.schedule[tier][19] = RegimeActivity.Eat;
        this.schedule[tier][20] = RegimeActivity.Lockdown;
        this.schedule[tier][21] = RegimeActivity.Lockdown;
        this.schedule[tier][22] = RegimeActivity.Sleep;
        this.schedule[tier][23] = RegimeActivity.Sleep;
      } else {
        // SuperMax / Solitary
        for (let h = 7; h < 19; h++) {
          this.schedule[tier][h] = RegimeActivity.Lockdown;
        }
        this.schedule[tier][19] = RegimeActivity.Yard;
        for (let h = 20; h < 24; h++) {
          this.schedule[tier][h] = RegimeActivity.Lockdown;
        }
      }
    }
  }

  public getActivity(tier: number, hour: number): RegimeActivity {
    const t = Math.min(SECURITY_TIERS_COUNT - 1, Math.max(0, tier));
    const h = hour % HOURS_PER_DAY;
    return this.schedule[t][h];
  }

  public setActivity(tier: number, hour: number, activity: RegimeActivity): void {
    const t = Math.min(SECURITY_TIERS_COUNT - 1, Math.max(0, tier));
    const h = hour % HOURS_PER_DAY;
    this.schedule[t][h] = activity;
  }
}

export class RegimeBroadcastManager {
  public clock: MasterClock = new MasterClock();
  public schedule: RegimeScheduleTable = new RegimeScheduleTable();
  public activeOverride: GlobalEmergencyOverride = GlobalEmergencyOverride.None;

  public getEffectiveActivity(
    secClass: SecurityClass,
    angerScore: number = 0.0
  ): RegimeActivity {
    let tierIdx = 0;
    if (secClass === SecurityClass.MinimumSecurity) tierIdx = 0;
    else if (secClass === SecurityClass.MediumSecurity) tierIdx = 1;
    else if (secClass === SecurityClass.MaximumSecurity) tierIdx = 2;
    else if (secClass === SecurityClass.SuperMax) tierIdx = 3;
    else if (secClass === SecurityClass.DeathRow) tierIdx = 4;
    else if (secClass === SecurityClass.Insane) tierIdx = 5;

    switch (this.activeOverride) {
      case GlobalEmergencyOverride.Lockdown:
        return RegimeActivity.Lockdown;
      case GlobalEmergencyOverride.Bangup:
        if (angerScore > 80.0) {
          // Hostile inmate rejects bangup order!
          return this.schedule.getActivity(tierIdx, this.clock.hour);
        }
        return RegimeActivity.Lockdown;
      default:
        return this.schedule.getActivity(tierIdx, this.clock.hour);
    }
  }
}
