import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

async function main() {
  const chromeProcess = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless',
      '--remote-debugging-port=9222',
      '--disable-gpu',
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

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map((a) => a.value || a.description).join(' '));
    } else if (data.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails?.text, data.params.exceptionDetails?.exception?.description);
    } else if (data.method === 'Target.attachedToTarget') {
      console.log('[ATTACHED TO WORKER/TARGET]', data.params.targetInfo?.type, data.params.targetInfo?.url);
    }
  };

  // Wait 4 seconds for simulation worker and UI to mount
  await new Promise((r) => setTimeout(r, 4000));

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
  const artifactPath = '/Users/mkr-27/.gemini/antigravity-ide/brain/0f967992-29ca-40bf-93f1-ee10f4a5796a/task2_2_verified_live.png';
  fs.writeFileSync(artifactPath, Buffer.from(base64Png, 'base64'));
  console.log('[SCREENSHOT SAVED]', artifactPath);

  ws.close();
  chromeProcess.kill();
}

main().catch(console.error);
