import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ElectricityManager,
  DisjointSet,
  APPLIANCE_REGISTRY,
} from '../src/lib/utilities/ElectricityManager.ts';

describe('Task 3.1: Disjoint-Set Electrical Grid Solver & Short-Circuit Physics', () => {
  it('should correctly handle DisjointSet union, find, and path compression', () => {
    const ds = new DisjointSet(100);

    // Initial distinct roots
    assert.equal(ds.find(10), 10);
    assert.equal(ds.find(20), 20);

    // Union
    assert.equal(ds.union(10, 20), true);
    assert.equal(ds.find(10), ds.find(20));

    // Redundant union
    assert.equal(ds.union(10, 20), false);

    // Transitive union
    ds.union(20, 30);
    assert.equal(ds.find(10), ds.find(30));

    // Reset
    ds.reset();
    assert.notEqual(ds.find(10), ds.find(20));
  });

  it('should verify Appliance registry wattages match specification', () => {
    assert.equal(APPLIANCE_REGISTRY.cctv.wattage, 150);
    assert.equal(APPLIANCE_REGISTRY.metal_detector.wattage, 250);
    assert.equal(APPLIANCE_REGISTRY.workshop_saw.wattage, 600);
    assert.equal(APPLIANCE_REGISTRY.electric_chair.wattage, 5000);
  });

  it('should solve stable circuit: 1 Station + 2 Capacitors (2,000W) powering 10 CCTV monitors (1,500W)', () => {
    const manager = new ElectricityManager(100, 100);

    // Build 1 Power Station at (10, 10) with 2 adjacent capacitors
    manager.addPowerStation(1, 10, 10);
    manager.addCapacitor(9, 10);
    manager.addCapacitor(13, 10);

    // Lay 15 cables from (13, 11) to (27, 11)
    for (let x = 13; x <= 27; x++) {
      manager.placeCable(x, 11);
    }

    // Connect 10 CCTV monitors (150W each = 1,500W total)
    for (let i = 0; i < 10; i++) {
      manager.addAppliance(100 + i, 15 + i, 11, 'cctv');
    }

    manager.solve();

    const station = manager.powerStations.get(1)!;
    assert.equal(station.capacitorCount, 2);
    assert.equal(manager.calculateStationCapacity(station), 2000);
    assert.equal(station.isTripped, false);

    // Assert all 10 CCTV monitors are powered
    for (const app of manager.appliances.values()) {
      assert.equal(app.isPowered, true, `Appliance ${app.id} should be powered`);
    }

    // Telemetry assertions
    const tel = manager.getTelemetry();
    assert.equal(tel.totalCapacity, 2000);
    assert.equal(tel.totalLoad, 1500);
    assert.equal(tel.loadFactorPercent, 75.0);
    assert.equal(tel.activeStations, 1);
    assert.equal(tel.trippedBreakers, 0);
    assert.equal(tel.hasShortCircuit, false);
    assert.equal(tel.poweredAppliances, 10);

    // Tile power status along cable
    assert.equal(manager.getTilePowerStatus(20, 11), 'powered');
  });

  it('should trip breaker on overload: 5 Workshop Saws (3,000W) on 2,000W Station', () => {
    const manager = new ElectricityManager(100, 100);

    // Station at (20, 20) with 2 capacitors = 2,000W capacity
    manager.addPowerStation(1, 20, 20);
    manager.addCapacitor(19, 20);
    manager.addCapacitor(23, 20);

    // Lay cable line
    for (let x = 23; x <= 30; x++) {
      manager.placeCable(x, 21);
    }

    // Connect 5 workshop saws (600W each = 3,000W total > 2,000W)
    for (let i = 0; i < 5; i++) {
      manager.addAppliance(200 + i, 24 + i, 21, 'workshop_saw');
    }

    manager.solve();

    const station = manager.powerStations.get(1)!;
    assert.equal(station.isTripped, true, 'Station breaker should trip on overload');

    // All appliances lose power
    for (const app of manager.appliances.values()) {
      assert.equal(app.isPowered, false, `Appliance ${app.id} must lose power`);
    }

    // Cable line tile status should be overloaded
    assert.equal(manager.getTilePowerStatus(25, 21), 'overloaded');

    const tel = manager.getTelemetry();
    assert.equal(tel.trippedBreakers, 1);
    assert.equal(tel.activeStations, 0);
    assert.equal(tel.totalCapacity, 0);
    assert.equal(tel.poweredAppliances, 0);
  });

  it('should enforce The Short-Circuit Rule: 2 live Power Stations connected to same network trip both', () => {
    const manager = new ElectricityManager(100, 100);

    // Power Station A at (10, 10)
    manager.addPowerStation(1, 10, 10);

    // Power Station B at (30, 10)
    manager.addPowerStation(2, 30, 10);

    // Bridge both stations with a single continuous cable line
    for (let x = 13; x <= 29; x++) {
      manager.placeCable(x, 11);
    }

    manager.solve();

    const station1 = manager.powerStations.get(1)!;
    const station2 = manager.powerStations.get(2)!;

    assert.equal(station1.isTripped, true, 'Station 1 must trip on short circuit');
    assert.equal(station2.isTripped, true, 'Station 2 must trip on short circuit');
    assert.equal(manager.hasShortCircuitFault, true, 'Short circuit fault flag must be active');

    // Tile power status along bridged cable line
    assert.equal(manager.getTilePowerStatus(20, 11), 'short_circuit');

    const tel = manager.getTelemetry();
    assert.equal(tel.hasShortCircuit, true);
    assert.equal(tel.trippedBreakers, 2);
    assert.equal(tel.activeStations, 0);
  });

  it('should clamp capacitor capacity to maximum 16 capacitors (9,000W cap)', () => {
    const manager = new ElectricityManager(100, 100);
    manager.addPowerStation(1, 20, 20);

    // Add 20 surrounding capacitors
    for (let i = 0; i < 20; i++) {
      manager.addCapacitor(19 + (i % 5), 19 + Math.floor(i / 5));
    }

    manager.solve();

    const station = manager.powerStations.get(1)!;
    // Capacity should be clamped to 1000 + 16 * 500 = 9000W
    assert.equal(manager.calculateStationCapacity(station), 9000);
  });
});
