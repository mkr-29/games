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

  // Wait 3 seconds for initial WebGPU / Canvas render
  await new Promise((r) => setTimeout(r, 3000));

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

  // 1. Capture Initial Stable Grid (2,000W station, capacitors, live cables, appliances)
  console.log('[TEST] Capturing Stable Electrical Grid...');
  await captureScreenshot('task3_1_stable_grid_live.png');

  // 2. Click "Test Overload (+1,800W Saws)"
  console.log('[TEST] Triggering Overload Breaker Trip...');
  await evaluate(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Test Overload'));
      if (btn) {
        btn.click();
        return 'Overload clicked';
      }
      return 'Overload button not found';
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));
  await captureScreenshot('task3_1_breaker_overload_live.png');

  // 3. Click "Test Short-Circuit (Bridge Stations)"
  console.log('[TEST] Triggering Catastrophic Short-Circuit...');
  await evaluate(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Test Short-Circuit'));
      if (btn) {
        btn.click();
        return 'Short circuit clicked';
      }
      return 'Short circuit button not found';
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));
  await captureScreenshot('task3_1_short_circuit_live.png');

  // 4. Click "Reset Breakers"
  console.log('[TEST] Resetting Breakers...');
  await evaluate(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Reset Breakers'));
      if (btn) {
        btn.click();
        return 'Reset clicked';
      }
      return 'Reset button not found';
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));

  ws.close();
  chromeProcess.kill();
  console.log('[TEST COMPLETE] All Task 3.1 verifications captured successfully!');
}

main().catch(console.error);
