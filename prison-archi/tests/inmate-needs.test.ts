import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SecurityClass,
  createDefaultNeeds,
  stepInmateDecay,
  computeIndividualAnger,
  calculatePrisonDanger,
  InmateNeedsManager,
} from '../src/lib/ai/InmateNeedsManager.ts';

describe('Task 4.2: 15-Need Psychology Engine & Global Danger Calculus', () => {
  it('Verification Criterion 1: Food need reaches 100% (Starving) after 12 in-game hours with high anger', () => {
    const inmate = createDefaultNeeds(1, SecurityClass.MediumSecurity);
    inmate.food = 0.0;

    // Step 12 in-game hours (120 x 0.1 hr steps)
    for (let i = 0; i < 120; i++) {
      stepInmateDecay(inmate, 0.1);
    }

    assert.ok(
      inmate.food >= 100.0,
      `Food need should reach 100% (was ${inmate.food.toFixed(1)}%)`
    );
    assert.ok(
      inmate.angerScore > 20.0,
      `Starving inmate must exhibit high anger score (was ${inmate.angerScore.toFixed(1)})`
    );
  });

  it('Verification Criterion 2: 50 well-fed inmates yield danger <10%; 50 starved/sleep-deprived inmates cross >80% Riot Alert', () => {
    // 50 Well-fed inmates
    const wellFedList = Array.from({ length: 50 }, (_, i) =>
      createDefaultNeeds(i + 1, SecurityClass.MediumSecurity)
    );
    const lowDanger = calculatePrisonDanger(wellFedList, 0, 0);
    assert.ok(
      lowDanger < 10.0,
      `Danger for well-fed prison should be < 10% (was ${lowDanger.toFixed(1)}%)`
    );

    // 50 Critical inmates with severe unmet needs
    const criticalList = Array.from({ length: 50 }, (_, i) => {
      const p = createDefaultNeeds(i + 1, SecurityClass.MaximumSecurity);
      p.food = 98.0;
      p.sleep = 95.0;
      p.freedom = 92.0;
      p.safety = 5.0;
      return p;
    });

    const highDanger = calculatePrisonDanger(criticalList, 20.0, 0);
    assert.ok(
      highDanger >= 80.0,
      `Danger for severely deprived prison should cross 80% riot warning (was ${highDanger.toFixed(1)}%)`
    );
  });

  it('should test addiction withdrawal decay and suppression dampening', () => {
    const inmate = createDefaultNeeds(1, SecurityClass.MediumSecurity);
    inmate.hasDrugAddiction = true;
    inmate.withdrawalLevel = 10.0;
    inmate.isSuppressed = true;
    inmate.suppressionTimer = 4.0;

    // Step 10 hours
    stepInmateDecay(inmate, 10.0);

    assert.ok(
      inmate.withdrawalLevel > 50.0,
      `Withdrawal level should escalate over time (was ${inmate.withdrawalLevel.toFixed(1)}%)`
    );
    assert.strictEqual(
      inmate.isSuppressed,
      false,
      'Suppression timer should expire after 4 hours'
    );
  });

  it('should update and step all registered inmates in InmateNeedsManager', () => {
    const manager = new InmateNeedsManager();
    const p1 = manager.registerInmate(1, SecurityClass.MinimumSecurity);
    const p2 = manager.registerInmate(2, SecurityClass.SuperMax);

    manager.stepAll(2.0); // 2 hours

    assert.ok(p1.food > 10.0);
    assert.ok(p2.food > 10.0);

    const danger = manager.getGlobalDanger();
    assert.ok(typeof danger === 'number' && danger >= 0.0);

    // Satisfy hunger
    manager.satisfyNeed(1, 'food', 50.0);
    assert.strictEqual(p1.food, 0.0);
  });
});
