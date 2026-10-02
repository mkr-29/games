import type { WorkerInMessage, WorkerOutMessage } from '../types/worker';
import { SharedMemoryBridge } from '../lib/memory/SharedMemoryBridge';

let isWasmLoaded = false;
let wasmPingFn: ((msg: string) => string) | null = null;
let sharedMemory: SharedMemoryBridge | null = null;
let tickIntervalId: number | null = null;

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

function startSimulationHeartbeat() {
  if (!sharedMemory || tickIntervalId !== null) return;

  // 60Hz atomic tick pulse (16.6ms)
  const startTime = Date.now();
  tickIntervalId = self.setInterval(() => {
    if (!sharedMemory) return;
    const elapsed = Date.now() - startTime;
    sharedMemory.stepSimulationTick(elapsed);
  }, 1000 / 60);

  console.log('[Simulation Worker] 60Hz Atomic Heartbeat Started.');
}

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT': {
      await bootstrapWasm();

      let attached = false;
      if (msg.payload.sharedBuffer) {
        try {
          sharedMemory = new SharedMemoryBridge(msg.payload.sharedBuffer);
          attached = sharedMemory.isValid();
          if (attached) {
            console.log('[Simulation Worker] SharedArrayBuffer attached successfully (12.66 MB).');
            startSimulationHeartbeat();
          }
        } catch (err) {
          console.error('[Simulation Worker] Failed to attach SharedArrayBuffer:', err);
        }
      }

      const response: WorkerOutMessage = {
        type: 'READY',
        version: '0.1.0',
        crossOriginIsolated: self.crossOriginIsolated,
        sharedMemoryAttached: attached,
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
