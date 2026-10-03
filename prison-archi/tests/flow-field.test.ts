import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  EntityType,
  DoorAccessPolicy,
  getDoorTraversalCost,
  CostField,
  IntegrationField,
  FlowField,
  FlowFieldManager,
  type NavAgent,
} from '../src/lib/ai/FlowFieldManager.ts';

describe('Task 4.1: Flow Field Navigation & Door Weighting', () => {
  it('should calculate accurate door clearance costs according to access policy', () => {
    // Open door
    assert.strictEqual(
      getDoorTraversalCost(
        { accessPolicy: DoorAccessPolicy.StaffOnly, isOpen: true, isLocked: false, hasServo: false },
        EntityType.Prisoner,
        false
      ),
      1.0
    );

    // Locked staff door for prisoner -> Impassable
    assert.strictEqual(
      getDoorTraversalCost(
        { accessPolicy: DoorAccessPolicy.StaffOnly, isOpen: false, isLocked: true, hasServo: false },
        EntityType.Prisoner,
        false
      ),
      Infinity
    );

    // Locked staff door for guard with keys -> 4.0
    assert.strictEqual(
      getDoorTraversalCost(
        { accessPolicy: DoorAccessPolicy.StaffOnly, isOpen: false, isLocked: true, hasServo: false },
        EntityType.Guard,
        true
      ),
      4.0
    );

    // Prisoner in locked normal cell door -> 25.0 (delay waiting for staff)
    assert.strictEqual(
      getDoorTraversalCost(
        { accessPolicy: DoorAccessPolicy.PrisonersAndStaff, isOpen: false, isLocked: true, hasServo: false },
        EntityType.Prisoner,
        false
      ),
      25.0
    );

    // Lockdown door -> Blocks everyone
    assert.strictEqual(
      getDoorTraversalCost(
        { accessPolicy: DoorAccessPolicy.LockedShut, isOpen: false, isLocked: true, hasServo: true },
        EntityType.Guard,
        true
      ),
      Infinity
    );
  });

  it('should generate direct Dijkstra integration and flow vectors towards target', () => {
    const costField = new CostField(10, 10, 1.0);
    const destination = [{ x: 5, y: 5 }];

    const integration = IntegrationField.generate(10, 10, destination, costField);
    assert.strictEqual(integration.get(5, 5), 0.0);
    assert.strictEqual(integration.get(5, 4), 1.0);
    assert.strictEqual(integration.get(5, 6), 1.0);

    const flow = FlowField.fromIntegrationField(integration, destination);

    // Pointing from (5, 2) downwards to (5, 5)
    const dirDown = flow.sampleDirection(5.1, 2.2);
    assert.ok(dirDown);
    assert.strictEqual(dirDown.dx, 0.0);
    assert.strictEqual(dirDown.dy, 1.0);

    // Pointing from (2, 5) rightwards to (5, 5)
    const dirRight = flow.sampleDirection(2.1, 5.0);
    assert.ok(dirRight);
    assert.strictEqual(dirRight.dx, 1.0);
    assert.strictEqual(dirRight.dy, 0.0);
  });

  it('should route around solid walls and impassable barriers', () => {
    const costField = new CostField(10, 10, 1.0);
    // Wall along x = 5 from y=0 to y=8, gap at y=9
    for (let y = 0; y < 9; y++) {
      costField.setImpassable(5, y);
    }

    const destination = [{ x: 8, y: 2 }];
    const integration = IntegrationField.generate(10, 10, destination, costField);

    // Agent on left side at (2, 2) has finite distance routing down
    assert.ok(integration.get(2, 2) < Infinity);
    const flow = FlowField.fromIntegrationField(integration, destination);

    const dir = flow.sampleDirection(2.5, 2.5);
    assert.ok(dir);
    assert.ok(dir.dy > 0, 'Vector must route downwards towards wall opening');
  });

  it('should handle multi-destination collective goals (e.g. Canteen Doors)', () => {
    const costField = new CostField(20, 20, 1.0);
    const canteenDoors = [
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 11 },
      { x: 11, y: 11 },
    ];

    const integration = IntegrationField.generate(20, 20, canteenDoors, costField);
    for (const d of canteenDoors) {
      assert.strictEqual(integration.get(d.x, d.y), 0.0);
    }

    const flow = FlowField.fromIntegrationField(integration, canteenDoors);
    const vel = flow.sampleVelocity(2.0, 2.0, 3.0);
    assert.ok(vel.vx > 0 && vel.vy > 0, 'Velocity should point south-east towards Canteen');
  });

  it('should step mass agents smoothly along flow field to destination', () => {
    const manager = new FlowFieldManager(20, 20, 1.0);
    const destination = [{ x: 10, y: 10 }];
    const flowField = manager.getOrCreateFlowField('canteen', destination);

    const agents: NavAgent[] = [
      {
        id: 1,
        x: 8.0,
        y: 10.0,
        vx: 0,
        vy: 0,
        speed: 2.0,
        entityType: EntityType.Prisoner,
        hasKeys: false,
        reachedGoal: false,
      },
    ];

    // Step 10 ticks
    for (let t = 0; t < 10; t++) {
      manager.stepAgents(agents, flowField, destination, 0.1);
    }

    // Agent moved closer towards x=10
    assert.ok(agents[0].x > 8.0);
    assert.strictEqual(agents[0].y, 10.0);
  });
});
