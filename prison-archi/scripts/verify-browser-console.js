import { spawn } from 'node:child_process';
import http from 'node:http';

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

  // Wait 1.5s for Chrome CDP port to open
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

  // Connect WebSocket to CDP using standard Web API WebSocket in Node
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
    method: 'Runtime.evaluate',
    params: { expression: 'JSON.stringify({ isolated: window.crossOriginIsolated, sab: typeof SharedArrayBuffer })' }
  }));

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id === 4) {
      console.log('[CDP EVAL RESULT]', data.result?.result?.value);
    } else if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map((a) => a.value || a.description).join(' '));
    } else if (data.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails?.text, data.params.exceptionDetails?.exception?.description);
    }
  };

  // Wait 4 seconds
  await new Promise((r) => setTimeout(r, 4000));

  ws.close();
  chromeProcess.kill();
}

main().catch(console.error);
