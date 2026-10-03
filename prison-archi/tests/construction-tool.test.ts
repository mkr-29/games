import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Camera2D } from '../src/lib/renderer/Camera2D.ts';
import { DragBoxTool } from '../src/lib/tools/DragBoxTool.ts';

// Mock minimal HTMLCanvasElement for testing
function createMockCanvas(width = 1280, height = 720): HTMLCanvasElement {
  return {
    width,
    height,
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        right: width,
        bottom: height,
        width,
        height,
        x: 0,
        y: 0,
        toJSON() { return {}; }
      };
    }
  } as unknown as HTMLCanvasElement;
}

describe('Task 2.4: DragBoxTool Construction Pipeline', () => {
  it('should calculate accurate 10x10 hollow wall foundation perimeter (36 tiles)', () => {
    const canvas = createMockCanvas();
    const camera = new Camera2D(0, 0, 1.0, 32, 1280, 720);
    const tool = new DragBoxTool(canvas, camera);

    tool.setMode('brick_wall');
    tool.setHollow(true);

    // Screen coords mapping to world (10, 10) to (19, 19)
    // screen = world * 32 + (1280/2, 720/2) = (10*32 + 640, 10*32 + 360) = (960, 680)
    // and world (19, 19) -> (19*32 + 640, 19*32 + 360) = (1248, 968)
    const p1 = camera.worldToScreen(10, 10);
    const p2 = camera.worldToScreen(19, 19);

    tool.handlePointerDown({ clientX: p1.x + 2, clientY: p1.y + 2, button: 0 } as MouseEvent);
    tool.handlePointerMove({ clientX: p2.x + 2, clientY: p2.y + 2 } as MouseEvent);

    const ghosts = tool.getActiveGhostTiles();
    // 10x10 perimeter: Top(10) + Bottom(10) + Left(8) + Right(8) = 36 tiles
    assert.strictEqual(ghosts.length, 36, '10x10 hollow perimeter must have exactly 36 tiles');

    // Corners must exist
    assert(ghosts.some(g => g.x === 10 && g.y === 10));
    assert(ghosts.some(g => g.x === 19 && g.y === 10));
    assert(ghosts.some(g => g.x === 10 && g.y === 19));
    assert(ghosts.some(g => g.x === 19 && g.y === 19));

    // Center interior tile (14, 14) must NOT exist in hollow perimeter
    assert(!ghosts.some(g => g.x === 14 && g.y === 14));

    const cmd = tool.handlePointerUp();
    assert(cmd !== null);
    assert.strictEqual(cmd.width, 10);
    assert.strictEqual(cmd.height, 10);
    assert.strictEqual(cmd.tileCount, 36);
    assert.strictEqual(cmd.materialId, 1); // Brick wall
    assert.strictEqual(cmd.costEstimateCents, 36 * 5000); // $1,800.00
  });

  it('should correctly normalize reverse-drag (bottom-right to top-left)', () => {
    const canvas = createMockCanvas();
    const camera = new Camera2D(0, 0, 1.0, 32, 1280, 720);
    const tool = new DragBoxTool(canvas, camera);

    tool.setMode('concrete_wall');
    tool.setHollow(false); // Filled block

    const start = camera.worldToScreen(25, 25);
    const end = camera.worldToScreen(20, 20);

    tool.handlePointerDown({ clientX: start.x + 2, clientY: start.y + 2, button: 0 } as MouseEvent);
    tool.handlePointerMove({ clientX: end.x + 2, clientY: end.y + 2 } as MouseEvent);

    const bounds = tool.getActiveBounds();
    assert(bounds !== null);
    assert.strictEqual(bounds.minX, 20);
    assert.strictEqual(bounds.maxX, 25);
    assert.strictEqual(bounds.minY, 20);
    assert.strictEqual(bounds.maxY, 25);
    assert.strictEqual(bounds.width, 6);
    assert.strictEqual(bounds.height, 6);

    const cmd = tool.handlePointerUp();
    assert(cmd !== null);
    assert.strictEqual(cmd.tileCount, 36); // 6x6 filled = 36 tiles
    assert.strictEqual(cmd.materialId, 2); // Reinforced concrete
    assert.strictEqual(cmd.costEstimateCents, 36 * 12000); // 36 * $120.00 = $4,320.00
  });

  it('should ignore non-left click and cancel properly', () => {
    const canvas = createMockCanvas();
    const camera = new Camera2D(0, 0, 1.0, 32, 1280, 720);
    const tool = new DragBoxTool(canvas, camera);

    // Right click (button = 2) should NOT start dragging
    const handled = tool.handlePointerDown({ clientX: 100, clientY: 100, button: 2 } as MouseEvent);
    assert.strictEqual(handled, false);
    assert.strictEqual(tool.isDragging, false);

    // Left click starts drag, cancelDrag clears it
    tool.handlePointerDown({ clientX: 100, clientY: 100, button: 0 } as MouseEvent);
    assert.strictEqual(tool.isDragging, true);

    tool.cancelDrag();
    assert.strictEqual(tool.isDragging, false);
    assert.strictEqual(tool.getActiveGhostTiles().length, 0);
  });

  it('should support Perimeter Wall tool mode and high security cost calculation', () => {
    const canvas = createMockCanvas();
    const camera = new Camera2D(0, 0, 1.0, 32, 1280, 720);
    const tool = new DragBoxTool(canvas, camera);

    tool.setMode('perimeter_wall');
    assert.strictEqual(tool.getMaterialId(), 3);
    assert.strictEqual(tool.getMaterialUnitCostCents(), 35000); // $350.00
  });
});
