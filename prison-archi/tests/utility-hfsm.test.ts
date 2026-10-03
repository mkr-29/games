import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  InmateAction,
  RegimeActivity,
  createDefaultDistances,
  scoreAction,
  selectBestAction,
  InmateHFSM,
} from '../src/lib/ai/UtilityAIManager.ts';
import {
  createDefaultNeeds,
  SecurityClass,
} from '../src/lib/ai/InmateNeedsManager.ts';

describe('Task 4.3: Utility AI Behavior Scoring & Action State Machine (HFSM)', () => {
  it('Verification Criterion 1: Inmate with Bladder=90% and Food=20% chooses UseToilet over Eat', () => {
    const needs = createDefaultNeeds(1, SecurityClass.MediumSecurity);
    needs.bladder = 90.0;
    needs.food = 20.0;

    const distances = createDefaultDistances();
    const { action, score } = selectBestAction(needs, distances, RegimeActivity.FreeTime);

    assert.strictEqual(
      action,
      InmateAction.UseToilet,
      `Expected Inmate to choose UseToilet (0), got ${action} with score ${score}`
    );
  });

  it('should test regime mandate boosts on utility scoring', () => {
    const needs = createDefaultNeeds(2, SecurityClass.MinimumSecurity);
    needs.food = 35.0;
    needs.sleep = 35.0;
    needs.hygiene = 35.0;
    needs.exercise = 35.0;

    const distances = createDefaultDistances();

    // Eat regime
    const eatDecision = selectBestAction(needs, distances, RegimeActivity.Eat);
    assert.strictEqual(eatDecision.action, InmateAction.Eat);

    // Sleep regime
    const sleepDecision = selectBestAction(needs, distances, RegimeActivity.Sleep);
    assert.strictEqual(sleepDecision.action, InmateAction.Sleep);

    // Shower regime
    const showerDecision = selectBestAction(needs, distances, RegimeActivity.Shower);
    assert.strictEqual(showerDecision.action, InmateAction.Shower);

    // Yard regime
    const yardDecision = selectBestAction(needs, distances, RegimeActivity.Yard);
    assert.strictEqual(yardDecision.action, InmateAction.Exercise);

    // Lockdown regime
    const lockDecision = selectBestAction(needs, distances, RegimeActivity.Lockdown);
    assert.strictEqual(lockDecision.action, InmateAction.LockupInCell);
  });

  it('Verification Criterion 2: Inmate autonomously walks to toilet, plays interaction, resets Bladder to 0%, and returns to SelectNextAction', () => {
    const hfsm = new InmateHFSM(246.0, 240.0); // 6 tiles away from toilet at (246, 246)
    const needs = createDefaultNeeds(3, SecurityClass.MediumSecurity);
    needs.bladder = 95.0; // Critical bladder

    const distances = createDefaultDistances();
    distances.distToilet = 6.0;

    // 1. Initial Step: SelectNextAction -> NavigatingToTarget
    hfsm.step(0.1, needs, distances, RegimeActivity.FreeTime);
    assert.strictEqual(hfsm.state.kind, 'NavigatingToTarget');
    assert.strictEqual(hfsm.state.action, InmateAction.UseToilet);

    // 2. Step through navigation until arrival at (246, 246)
    for (let i = 0; i < 40; i++) {
      hfsm.step(0.1, needs, distances, RegimeActivity.FreeTime);
      if (hfsm.state.kind === 'InteractingWithObject') break;
    }
    assert.strictEqual(hfsm.state.kind, 'InteractingWithObject');
    assert.strictEqual(hfsm.state.action, InmateAction.UseToilet);

    // 3. Step through interaction duration until need is satisfied
    while (needs.bladder > 0) {
      hfsm.step(0.1, needs, distances, RegimeActivity.FreeTime);
    }

    // 4. Assert bladder is reset to 0% and HFSM is in NeedSatisfied
    assert.strictEqual(needs.bladder, 0.0, 'Bladder need must be 0% after using toilet');
    assert.strictEqual(hfsm.state.kind, 'NeedSatisfied');

    // 5. Next step transitions to SelectNextAction
    hfsm.step(0.1, needs, distances, RegimeActivity.FreeTime);
    assert.strictEqual(hfsm.state.kind, 'SelectNextAction');
  });
});
