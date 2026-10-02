<script lang="ts">
  import { onMount } from 'svelte';
  import type { WorkerInMessage, WorkerOutMessage } from './types/worker';

  let crossOriginIsolated = $state(false);
  let workerStatus = $state<'Disconnected' | 'Connecting...' | 'Online'>('Connecting...');
  let workerPingReply = $state<string>('Pending handshake...');
  let simulationWorker: Worker | null = null;

  onMount(() => {
    crossOriginIsolated = window.crossOriginIsolated ?? false;

    // Instantiate Simulation Web Worker
    simulationWorker = new Worker(
      new URL('./workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    simulationWorker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
      const msg = e.data;
      if (msg.type === 'READY') {
        workerStatus = 'Online';
        simulationWorker?.postMessage({
          type: 'PING',
          payload: 'System Handshake Verification',
        } as WorkerInMessage);
      } else if (msg.type === 'PONG') {
        workerPingReply = msg.message;
      }
    };

    simulationWorker.postMessage({ type: 'INIT', payload: {} } as WorkerInMessage);

    return () => {
      simulationWorker?.terminate();
    };
  });
</script>

<main class="h-full w-full flex flex-col bg-slate-950 text-slate-100 font-sans">
  <!-- Top Blueprint Header -->
  <header class="h-14 border-b border-cyan-900/60 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shadow-lg">
    <div class="flex items-center space-x-3">
      <div class="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
      <h1 class="text-lg font-bold tracking-wider text-cyan-400 uppercase font-mono">
        Prison Architect Web
      </h1>
      <span class="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-mono">
        v0.1.0-alpha
      </span>
    </div>

    <!-- System Diagnostic Badges -->
    <div class="flex items-center space-x-4 text-xs font-mono">
      <div class="flex items-center space-x-1.5 px-3 py-1 rounded border {crossOriginIsolated ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300' : 'bg-rose-950/60 border-rose-700/80 text-rose-300'}">
        <span class="w-2 h-2 rounded-full {crossOriginIsolated ? 'bg-emerald-400' : 'bg-rose-400'}"></span>
        <span>Cross-Origin Isolated: {crossOriginIsolated ? 'TRUE' : 'FALSE'}</span>
      </div>

      <div class="flex items-center space-x-1.5 px-3 py-1 rounded border {workerStatus === 'Online' ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300' : 'bg-amber-950/60 border-amber-700/80 text-amber-300'}">
        <span class="w-2 h-2 rounded-full {workerStatus === 'Online' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}"></span>
        <span>Sim Worker: {workerStatus}</span>
      </div>
    </div>
  </header>

  <!-- Main Canvas / Workspace Placeholder -->
  <div class="flex-1 relative flex items-center justify-center overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
    <!-- Blueprint Grid Underlay -->
    <div class="max-w-xl w-full p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
      <div class="flex items-center space-x-3 mb-6">
        <div class="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">System Scaffolding Verified</h2>
          <p class="text-xs text-slate-400">Phase 1: Foundations, Threading & Memory Model</p>
        </div>
      </div>

      <div class="space-y-3 font-mono text-xs text-slate-300 border-t border-slate-800 pt-4">
        <div class="flex justify-between py-1.5 border-b border-slate-800/60">
          <span class="text-slate-400">COOP / COEP Headers:</span>
          <span class="{crossOriginIsolated ? 'text-emerald-400' : 'text-rose-400'} font-semibold">
            {crossOriginIsolated ? 'Enabled (SharedArrayBuffer Ready)' : 'Disabled (Requires HTTPS / Isolation)'}
          </span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-800/60">
          <span class="text-slate-400">Worker Thread Pipeline:</span>
          <span class="{workerStatus === 'Online' ? 'text-emerald-400' : 'text-amber-400'} font-semibold">
            {workerStatus}
          </span>
        </div>
        <div class="flex justify-between py-1.5 border-b border-slate-800/60">
          <span class="text-slate-400">Simulation Handshake:</span>
          <span class="text-cyan-300 font-semibold">{workerPingReply}</span>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <span class="text-[11px] font-mono text-cyan-400/80">
          Task 1.1 Complete • Ready for Task 1.2
        </span>
      </div>
    </div>
  </div>
</main>
