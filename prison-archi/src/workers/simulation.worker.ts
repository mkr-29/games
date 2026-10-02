import type { WorkerInMessage, WorkerOutMessage } from '../types/worker';
import { SharedMemoryBridge, CTRL } from '../lib/memory/SharedMemoryBridge.ts';
import { TripleBufferProducer, type UserCommandInput } from '../lib/memory/TripleBufferConsumer.ts';

let isWasmLoaded = false;
let wasmPingFn: ((msg: string) => string) | null = null;
let sharedMemory: SharedMemoryBridge | null = null;
let producer: TripleBufferProducer | null = null;
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

function processIncomingCommand(cmd: UserCommandInput, memory: SharedMemoryBridge) {
  const ctrl = memory.ctrlInt32;

  switch (cmd.commandType) {
    case 1: { // Place Wall ($50 per meter)
      Atomics.sub(ctrl, CTRL.BANK_BALANCE, 5000); // -$50.00
      break;
    }
    case 2: { // Zone Cell (+2 Inmates)
      Atomics.add(ctrl, CTRL.PRISONER_COUNT, 2);
      break;
    }
    case 3: { // Hire Guard (+1 Guard, -$500 hiring cost)
      Atomics.add(ctrl, CTRL.GUARD_COUNT, 1);
      Atomics.sub(ctrl, CTRL.BANK_BALANCE, 50000); // -$500.00
      break;
    }
    case 4: { // Emergency Lockdown Toggle
      const currentDanger = Atomics.load(ctrl, CTRL.DANGER_LEVEL);
      const newDanger = currentDanger > 50000 ? 5000 : 75000; // Toggle 5.0% / 75.0%
      Atomics.store(ctrl, CTRL.DANGER_LEVEL, newDanger);
      break;
    }
  }
}

function startSimulationLoop() {
  if (!sharedMemory || tickIntervalId !== null) return;

  producer = new TripleBufferProducer(1);
  const startTime = performance.now();

  // 60Hz Fixed-Step Simulation Loop (16.666 ms)
  tickIntervalId = self.setInterval(() => {
    if (!sharedMemory || !producer) return;

    // 1. Drain and execute commands from lock-free circular SPSC queue
    const commands = producer.drainUserCommands(sharedMemory);
    for (const cmd of commands) {
      processIncomingCommand(cmd, sharedMemory);
    }

    // 2. Commit triple-buffer state snapshot (Release ordering)
    producer.commitSimulationSnapshot(sharedMemory);

    // 3. Update simulation elapsed time
    const elapsed = performance.now() - startTime;
    Atomics.store(sharedMemory.ctrlInt32, CTRL.SIM_TIME_MS, elapsed >>> 0);
  }, 1000 / 60);

  console.log('[Simulation Worker] 60Hz Lock-Free Triple-Buffer Simulation Loop Started.');
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
            startSimulationLoop();
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
