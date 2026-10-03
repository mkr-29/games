import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Camera2D } from '../src/lib/renderer/Camera2D.ts';

test('Camera2D: Screen-To-World and World-To-Screen Projection Invariance', () => {
  const camera = new Camera2D(256, 256, 1.0, 32, 1280, 720);

  // 1. Center of viewport must project to camera world position
  const centerScreen = camera.worldToScreen(256, 256);
  assert.equal(centerScreen.x, 1280 / 2);
  assert.equal(centerScreen.y, 720 / 2);

  const centerWorld = camera.screenToWorld(1280 / 2, 720 / 2);
  assert.equal(centerWorld.x, 256);
  assert.equal(centerWorld.y, 256);

  // 2. Off-center coordinate roundtrip invariance
  const testPoints = [
    { x: 10, y: 10 },
    { x: 100.5, y: 200.25 },
    { x: 500, y: 510 },
  ];

  for (const pt of testPoints) {
    const screen = camera.worldToScreen(pt.x, pt.y);
    const unprojected = camera.screenToWorld(screen.x, screen.y);
    assert.ok(
      Math.abs(unprojected.x - pt.x) < 1e-5,
      `Unproject X mismatch: expected ${pt.x}, got ${unprojected.x}`
    );
    assert.ok(
      Math.abs(unprojected.y - pt.y) < 1e-5,
      `Unproject Y mismatch: expected ${pt.y}, got ${unprojected.y}`
    );
  }
});

test('Camera2D: Zoom Clamping (0.1x to 5.0x)', () => {
  const camera = new Camera2D(256, 256, 1.0, 32, 1280, 720);

  // Attempt extreme zoom out
  camera.zoomAtScreenPoint(0.0001, 640, 360);
  assert.equal(camera.zoom, camera.minZoom); // 0.1

  // Attempt extreme zoom in
  camera.zoomAtScreenPoint(1000.0, 640, 360);
  assert.equal(camera.zoom, camera.maxZoom); // 5.0
});

test('Camera2D: Mouse-Centered Zoom Invariance', () => {
  const camera = new Camera2D(256, 256, 1.0, 32, 1280, 720);

  const cursorScreenX = 450;
  const cursorScreenY = 280;

  // World coordinate under cursor before zoom
  const worldBefore = camera.screenToWorld(cursorScreenX, cursorScreenY);

  // Zoom in by factor of 1.5 centered at cursor
  camera.zoomAtScreenPoint(1.5, cursorScreenX, cursorScreenY);

  // World coordinate under cursor after zoom must remain identical
  const worldAfter = camera.screenToWorld(cursorScreenX, cursorScreenY);

  assert.ok(
    Math.abs(worldAfter.x - worldBefore.x) < 1e-4,
    `Cursor world X shifted during zoom: before=${worldBefore.x}, after=${worldAfter.x}`
  );
  assert.ok(
    Math.abs(worldAfter.y - worldBefore.y) < 1e-4,
    `Cursor world Y shifted during zoom: before=${worldBefore.y}, after=${worldAfter.y}`
  );
});

test('Camera2D: Spatial Chunk Frustum Culling (32x32 Chunks)', () => {
  // Zoomed in at center of map (256, 256) at zoom = 3.0
  const camera = new Camera2D(256, 256, 3.0, 32, 1280, 720);

  // Chunk (8, 8) spans tiles 256..287, centered in viewport
  assert.equal(camera.isChunkVisible(8, 8, 32), true, 'Center chunk (8,8) must be visible');

  // Chunk (0, 0) spans tiles 0..31, far offscreen
  assert.equal(camera.isChunkVisible(0, 0, 32), false, 'Far top-left chunk (0,0) must be culled');

  // Chunk (15, 15) spans tiles 480..511, far offscreen
  assert.equal(camera.isChunkVisible(15, 15, 32), false, 'Far bottom-right chunk (15,15) must be culled');

  // Count visible chunks at zoom = 3.0 (zoomed in)
  let visibleAtZoom3 = 0;
  for (let cy = 0; cy < 16; cy++) {
    for (let cx = 0; cx < 16; cx++) {
      if (camera.isChunkVisible(cx, cy, 32)) visibleAtZoom3++;
    }
  }
  // Zoomed in (3.0x), only ~1 to 4 chunks intersect the 13x7 tile viewport
  assert.ok(visibleAtZoom3 <= 4, `Zoomed in should view <= 4 chunks, got ${visibleAtZoom3}`);

  // Now zoom out to macro overview (0.1x)
  camera.zoom = 0.1;
  let visibleAtZoom01 = 0;
  for (let cy = 0; cy < 16; cy++) {
    for (let cx = 0; cx < 16; cx++) {
      if (camera.isChunkVisible(cx, cy, 32)) visibleAtZoom01++;
    }
  }

  // Macro view should see many more chunks (> 50 chunks out of 256)
  assert.ok(
    visibleAtZoom01 > visibleAtZoom3 * 10,
    `Macro zoom (0.1x) must see significantly more chunks: zoom01=${visibleAtZoom01}, zoom3=${visibleAtZoom3}`
  );
});

test('Camera2D: View-Projection Matrix Structure', () => {
  const camera = new Camera2D(256, 256, 1.0, 32, 1280, 720);
  const matrix = camera.getViewProjectionMatrix();

  assert.equal(matrix.length, 16);
  for (let i = 0; i < 16; i++) {
    assert.ok(Number.isFinite(matrix[i]), `Matrix element [${i}] must be finite`);
  }

  // Orthographic diagonal elements must be non-zero
  assert.notEqual(matrix[0], 0, 'scaleX must be non-zero');
  assert.notEqual(matrix[5], 0, 'scaleY must be non-zero');
  assert.equal(matrix[10], 1, 'depth scale must be 1');
  assert.equal(matrix[15], 1, 'affine W must be 1');
});
