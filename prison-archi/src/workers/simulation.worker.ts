import type { WorkerInMessage, WorkerOutMessage } from '../types/worker';

let isWasmLoaded = false;
let wasmPingFn: ((msg: string) => string) | null = null;

async function bootstrapWasm() {
  try {
    // Dynamic import of the compiled Wasm package
    // @ts-ignore - wasm package generated on build
    const wasmModule = await import('../wasm/pkg/prison_simulation.js');
    await wasmModule.default();
    wasmModule.init_simulation();
    wasmPingFn = wasmModule.wasm_ping;
    isWasmLoaded = true;
    console.log('[Simulation Worker] WebAssembly Core Loaded & Bootstrapped.');
  } catch (err) {
    console.warn('[Simulation Worker] Native Wasm package not yet compiled or loading in fallback mode.', err);
  }
}

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT': {
      await bootstrapWasm();
      const response: WorkerOutMessage = {
        type: 'READY',
        version: '0.1.0',
        crossOriginIsolated: self.crossOriginIsolated,
      };
      self.postMessage(response);
      break;
    }
    case 'PING': {
      let pongReply = `[Worker JS Echo]: ${msg.payload}`;
      if (isWasmLoaded && wasmPingFn) {
        pongReply = wasmPingFn(msg.payload);
      }
      self.postMessage({ type: 'PONG', message: pongReply } as WorkerOutMessage);
      break;
    }
  }
};

export {};
