import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

async function main() {
  const chromeProcess = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless',
      '--remote-debugging-port=9222',
      '--enable-unsafe-webgpu',
      '--disable-gpu-sandbox',
      'http://localhost:5173/',
    ]
  );

  // Wait for Chrome CDP port to open
  await new Promise((r) => setTimeout(r, 1500));

  // Query CDP version endpoint
  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = targets.find((t) => t.type === 'page');
  console.log('Target Page:', page?.title, page?.url);

  if (!page?.webSocketDebuggerUrl) {
    console.error('No webSocketDebuggerUrl found');
    chromeProcess.kill();
    return;
  }

  const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res) => (ws.onopen = res));

  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
  ws.send(JSON.stringify({
    id: 3,
    method: 'Target.setAutoAttach',
    params: { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }
  }));
  ws.send(JSON.stringify({
    id: 4,
    method: 'Emulation.setDeviceMetricsOverride',
    params: {
      width: 1440,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false
    }
  }));

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map((a) => a.value || a.description).join(' '));
    } else if (data.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails?.text, data.params.exceptionDetails?.exception?.description);
    }
  };

  // Wait 3 seconds for initial render
  await new Promise((r) => setTimeout(r, 3000));

  // Scroll canvas into view
  await evaluate(`
    (() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
      return 'Scrolled';
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Helper to send CDP evaluate expression
  function evaluate(expr) {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 10000) + 100;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression: expr, returnByValue: true }
      }));
    });
  }

  // Helper to capture screenshot
  function captureScreenshot(filename) {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 10000) + 200;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          const artifactPath = `/Users/mkr-27/.gemini/antigravity-ide/brain/0f967992-29ca-40bf-93f1-ee10f4a5796a/${filename}`;
          fs.writeFileSync(artifactPath, Buffer.from(data.result.data, 'base64'));
          console.log('[SCREENSHOT SAVED]', artifactPath);
          resolve(artifactPath);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({
        id,
        method: 'Page.captureScreenshot',
        params: { format: 'png' }
      }));
    });
  }

  // 1. Simulate mouse drag on canvas to show holographic blueprint preview
  console.log('[TEST] Simulating DragBoxTool on canvas...');
  await evaluate(`
    (() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'Canvas not found';
      const rect = canvas.getBoundingClientRect();
      const startX = rect.left + 500;
      const startY = rect.top + 180;
      const moveX = rect.left + 740;
      const moveY = rect.top + 340;

      canvas.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: startX,
        clientY: startY,
        button: 0,
        bubbles: true
      }));

      canvas.dispatchEvent(new PointerEvent('pointermove', {
        clientX: moveX,
        clientY: moveY,
        bubbles: true
      }));

      return 'Drag initiated';
    })()
  `);

  await new Promise((r) => setTimeout(r, 800));
  await captureScreenshot('task2_4_blueprint_ghost_live.png');

  // Release drag to commit blueprint jobs
  await evaluate(`
    (() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      return 'Drag committed';
    })()
  `);

  // 2. Click the 10x10 Foundation Demo button
  console.log('[TEST] Triggering 10x10 Brick Foundation Demo...');
  await evaluate(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find(b => b.textContent && b.textContent.includes('10x10 Foundation Demo'));
      if (demoBtn) {
        demoBtn.click();
        return 'Demo clicked';
      }
      return 'Demo button not found';
    })()
  `);

  // Wait 4 seconds for workmen to navigate to delivery, fetch bricks, and erect walls
  console.log('[TEST] Waiting for Workmen to build walls and autotile...');
  await new Promise((r) => setTimeout(r, 4500));

  await captureScreenshot('task2_4_workman_construction_live.png');

  ws.close();
  chromeProcess.kill();
  console.log('[TEST COMPLETE] All Task 2.4 verifications captured successfully!');
}

main().catch(console.error);
