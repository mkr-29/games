#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const statePath = path.join(rootDir, 'PROJECT_STATE.json');

if (!fs.existsSync(statePath)) {
  console.error('Error: PROJECT_STATE.json not found!');
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

let totalTasks = 0;
let completedTasks = 0;
let nextTask = null;
let currentPhase = null;

for (const phase of state.phases) {
  let phaseCompleted = 0;
  for (const task of phase.tasks) {
    totalTasks++;
    if (task.completed) {
      completedTasks++;
      phaseCompleted++;
    } else if (!nextTask) {
      nextTask = task;
      currentPhase = phase;
    }
  }
}

const percentage = Math.round((completedTasks / totalTasks) * 100);
const barLength = 30;
const filledLength = Math.round((percentage / 100) * barLength);
const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

console.log('\n======================================================');
console.log('       PRISON ARCHITECT WEB — PROGRESS DASHBOARD      ');
console.log('======================================================\n');
console.log(`Progress: [${bar}] ${percentage}% (${completedTasks}/${totalTasks} Tasks)`);

if (nextTask && currentPhase) {
  console.log(`\nActive Phase: Phase ${currentPhase.phase_number} — ${currentPhase.name}`);
  console.log(`Active Task:  [${nextTask.id}] ${nextTask.name}`);
  console.log(`Specification: ${currentPhase.doc_file}`);
  console.log(`\nTo view task details:`);
  console.log(`  cat ${currentPhase.doc_file}\n`);
} else {
  console.log('\n🎉 ALL 28 TASKS COMPLETED! READY FOR RELEASE.\n');
}
console.log('======================================================\n');
