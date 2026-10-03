import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  MasterClock,
  RegimeActivity,
  GlobalEmergencyOverride,
  RegimeScheduleTable,
  RegimeBroadcastManager,
} from '../src/lib/regime/RegimeManager.ts';
import { SecurityClass } from '../src/lib/ai/InmateNeedsManager.ts';

describe('Task 4.4: 24-Hour Master Regime Timetable & Emergency Overrides', () => {
  it('Verification Criterion 1: Staggered regime test: Min-Sec scheduled to eat at 12:00, Med-Sec at 13:00', () => {
    const manager = new RegimeBroadcastManager();

    // At 12:00 PM (Hour 12)
    manager.clock.hour = 12;
    const minActivity = manager.schedule.getActivity(0, 12);
    const medActivity = manager.schedule.getActivity(1, 12);

    assert.strictEqual(
      minActivity,
      RegimeActivity.Eat,
      'Min-Sec must be scheduled to eat at 12:00 PM'
    );
    assert.notStrictEqual(
      medActivity,
      RegimeActivity.Eat,
      'Med-Sec must NOT be in canteen at 12:00 PM'
    );

    // At 13:00 PM (Hour 13)
    manager.clock.hour = 13;
    const minActivity13 = manager.schedule.getActivity(0, 13);
    const medActivity13 = manager.schedule.getActivity(1, 13);

    assert.strictEqual(
      medActivity13,
      RegimeActivity.Eat,
      'Med-Sec must be scheduled to eat at 13:00 PM'
    );
    assert.notStrictEqual(
      minActivity13,
      RegimeActivity.Eat,
      'Min-Sec must have vacated canteen by 13:00 PM'
    );
  });

  it('Verification Criterion 2: Emergency test: Trigger Bangup command. Compliant inmates return to cell, hostile inmates refuse', () => {
    const manager = new RegimeBroadcastManager();
    manager.clock.hour = 17; // Afternoon free time / yard
    manager.activeOverride = GlobalEmergencyOverride.Bangup;

    // Compliant prisoner (Anger = 10.0) -> Returns Lockdown in cell
    const compliantAct = manager.getEffectiveActivity(SecurityClass.MinimumSecurity, 10.0);
    assert.strictEqual(
      compliantAct,
      RegimeActivity.Lockdown,
      'Compliant inmate must obey Bangup order and lock down in cell'
    );

    // Hostile rioting prisoner (Anger = 92.0) -> Refuses Bangup order
    const hostileAct = manager.getEffectiveActivity(SecurityClass.MaximumSecurity, 92.0);
    assert.notStrictEqual(
      hostileAct,
      RegimeActivity.Lockdown,
      'Hostile rioting inmate must refuse Bangup order'
    );

    // Lockdown command forces ALL doors and inmates to lock down regardless of anger
    manager.activeOverride = GlobalEmergencyOverride.Lockdown;
    const lockdownAct = manager.getEffectiveActivity(SecurityClass.MaximumSecurity, 99.0);
    assert.strictEqual(
      lockdownAct,
      RegimeActivity.Lockdown,
      'Full Lockdown must enforce Lockdown status'
    );
  });

  it('should test MasterClock time advancement and string formatting', () => {
    const clock = new MasterClock(6); // 06:00 AM
    assert.strictEqual(clock.hour, 6);
    assert.strictEqual(clock.minute, 0);
    assert.strictEqual(clock.getTimeString(), 'Day 1 • 06:00');

    // 60 real-time seconds at 1x speed advances 60 in-game minutes = 1 hour
    clock.tick(60.0);
    assert.strictEqual(clock.hour, 7);
    assert.strictEqual(clock.minute, 0);
    assert.strictEqual(clock.getTimeString(), 'Day 1 • 07:00');

    // Advance 45 real-time seconds = 45 in-game minutes
    clock.tick(45.0);
    assert.strictEqual(clock.hour, 7);
    assert.strictEqual(clock.minute, 45);
    assert.strictEqual(clock.getTimeString(), 'Day 1 • 07:45');
  });
});
