import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PlumbingManager,
  getTunnelDigCost,
  FIXTURE_REGISTRY,
} from '../src/lib/utilities/PlumbingManager.ts';

describe('Task 3.2: BFS Hydraulic Plumbing Solver & Hot Water Boiler Loops', () => {
  it('should verify Fixture registry requirements match specification', () => {
    assert.equal(FIXTURE_REGISTRY.toilet.minColdPressure, 10);
    assert.equal(FIXTURE_REGISTRY.toilet.requiresWarmWater, false);
    assert.equal(FIXTURE_REGISTRY.shower.minColdPressure, 10);
    assert.equal(FIXTURE_REGISTRY.shower.requiresWarmWater, true);
    assert.equal(FIXTURE_REGISTRY.sink.minColdPressure, 10);
    assert.equal(FIXTURE_REGISTRY.laundry_machine.minColdPressure, 10);
    assert.equal(FIXTURE_REGISTRY.sprinkler.minColdPressure, 10);
  });

  it('Verification Criterion 1: Large Pipe reaches 200 tiles with >75% pressure remaining (80%), and Small Pipe drops below 10% after 31 tiles (7%)', () => {
    const manager = new PlumbingManager(250, 50);

    // Place Water Pump at (0, 0)
    manager.addPumpStation(1, 0, 0);

    // Lay Large Pipe line of 200 tiles from (3, 0) to (203, 0)
    for (let x = 3; x <= 203; x++) {
      manager.placePipe(x, 0, 'large_cold');
    }

    // Lay Small Pipe line connected to pump at (3, 2) extending to (40, 2)
    for (let x = 3; x <= 40; x++) {
      manager.placePipe(x, 2, 'small_cold');
    }

    manager.solve();

    // 1. Large Pipe check at 200 tiles from pump edge: tile (202, 0)
    // Starting at 100%, 200 tiles at -0.1%/tile = 80% remaining (> 75%)
    const largePipeEnd = manager.getPipe(202, 0)!;


    assert.ok(
      largePipeEnd.coldPressure > 75,
      `Large pipe after 200 tiles should have >75% pressure, got ${largePipeEnd.coldPressure}%`
    );
    assert.equal(largePipeEnd.coldPressure, 80);

    // 2. Small Pipe check:
    // At 30 tiles from pump edge: tile (32, 2)
    // Starting at 100%, 30 tiles at -3.0%/tile = 10%
    const smallPipe30 = manager.getPipe(32, 2)!;
    assert.equal(smallPipe30.coldPressure, 10, 'Small pipe at 30 tiles should be 10%');

    // At 31 tiles from pump edge: tile (33, 2)
    // Starting at 100%, 31 tiles at -3.0%/tile = 7% (< 10% functional threshold)
    const smallPipe31 = manager.getPipe(33, 2)!;
    assert.ok(
      smallPipe31.coldPressure < 10,
      `Small pipe at 31 tiles should drop below 10%, got ${smallPipe31.coldPressure}%`
    );
    assert.equal(smallPipe31.coldPressure, 7);
  });

  it('Verification Criterion 2: Boiler with zero electric power outputs cold water (10°C); when powered, outputs hot water (55°C)', () => {
    const manager = new PlumbingManager(50, 50);

    // Water Pump at (0, 0)
    manager.addPumpStation(1, 0, 0);

    // Cold pipe from pump to boiler at (5, 0)
    manager.placePipe(3, 0, 'large_cold');
    manager.placePipe(4, 0, 'large_cold');

    // Boiler at (5, 0)
    manager.addBoilerStation(10, 5, 0);

    // Hot water small pipes connected to boiler at (8, 0) extending 10 tiles
    for (let x = 8; x <= 17; x++) {
      manager.placePipe(x, 0, 'small_hot');
    }

    // Subcase A: Unpowered boiler
    manager.boilers.get(10)!.isPowered = false;
    manager.solve();

    assert.equal(manager.boilers.get(10)!.isHeating, false);
    const pipeUnpowered = manager.getPipe(10, 0)!;
    assert.equal(pipeUnpowered.temperatureC, 10, 'Unpowered boiler pipe should be tap cold (10°C)');
    assert.equal(pipeUnpowered.hotPressure, 0, 'Unpowered boiler pipe should have 0 hot pressure');

    // Subcase B: Powered boiler
    manager.boilers.get(10)!.isPowered = true;
    manager.solve();

    assert.equal(manager.boilers.get(10)!.isHeating, true);
    const pipePowered = manager.getPipe(10, 0)!;
    assert.equal(pipePowered.temperatureC, 55, 'Powered boiler pipe should heat to 55°C');
    assert.ok(pipePowered.hotPressure > 0, 'Powered boiler pipe should have hot pressure');
  });

  it('Verification Criterion 3: Verify get_tunnel_dig_cost() returns 0.20 for large pipe tiles vs 1.00 for small pipes', () => {
    assert.equal(getTunnelDigCost('large_cold'), 0.20);
    assert.equal(getTunnelDigCost(2), 0.20);

    assert.equal(getTunnelDigCost('small_cold'), 1.00);
    assert.equal(getTunnelDigCost(1), 1.00);

    assert.equal(getTunnelDigCost('small_hot'), 1.00);
    assert.equal(getTunnelDigCost(3), 1.00);

    assert.equal(getTunnelDigCost('none'), 1.00);
    assert.equal(getTunnelDigCost(0), 1.00);
  });

  it('should supply toilets and showers according to hydraulic and thermal requirements', () => {
    const manager = new PlumbingManager(50, 50);

    // Setup Pump -> Large pipe -> Boiler -> Hot pipe -> Shower
    manager.addPumpStation(1, 0, 0);
    manager.placePipe(3, 0, 'large_cold');
    manager.placePipe(4, 0, 'large_cold');

    manager.addBoilerStation(10, 5, 0);
    manager.placePipe(8, 0, 'small_hot');

    // Add Toilet on cold pipe (3, 0)
    manager.addFixture(100, 3, 0, 'toilet');

    // Add Shower on hot pipe (8, 0)
    manager.addFixture(200, 8, 0, 'shower');

    manager.solve();

    const toilet = manager.fixtures.get(100)!;
    assert.equal(toilet.isSupplied, true);

    const shower = manager.fixtures.get(200)!;
    assert.equal(shower.isSupplied, true);
    assert.equal(shower.isWarm, true);

    const telemetry = manager.getTelemetry();
    assert.equal(telemetry.activePumps, 1);
    assert.equal(telemetry.activeBoilers, 1);
    assert.equal(telemetry.suppliedFixtures, 2);
    assert.equal(telemetry.totalFixtures, 2);
  });
});
