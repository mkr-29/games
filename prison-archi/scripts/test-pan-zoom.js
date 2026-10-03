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

  await new Promise((r) => setTimeout(r, 1500));

  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = targets.find((t) => t.type === 'page');
  if (!page?.webSocketDebuggerUrl) {
    chromeProcess.kill();
    return;
  }

  const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res) => (ws.onopen = res));

  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

  // Wait 3 seconds
  await new Promise((r) => setTimeout(r, 3000));

  // Click Macro (0.2x) button via Runtime.evaluate
  ws.send(JSON.stringify({
    id: 5,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Macro (0.2x)'));
        if (btn) btn.click();
      `
    }
  }));

  // Wait 1 second for render
  await new Promise((r) => setTimeout(r, 1000));

  // Take screenshot
  const screenshotPromise = new Promise((resolve) => {
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === 10) {
        ws.removeEventListener('message', handler);
        resolve(data.result.data);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id: 10,
      method: 'Page.captureScreenshot',
      params: { format: 'png' }
    }));
  });

  const base64Png = await screenshotPromise;
  const artifactPath = '/Users/mkr-27/.gemini/antigravity-ide/brain/0f967992-29ca-40bf-93f1-ee10f4a5796a/task2_3_macro_zoom_live.png';
  fs.writeFileSync(artifactPath, Buffer.from(base64Png, 'base64'));
  console.log('[MACRO SCREENSHOT SAVED]', artifactPath);

  ws.close();
  chromeProcess.kill();
}

main().catch(console.error);
