#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const statePath = path.join(rootDir, 'PROJECT_STATE.json');

const targetTaskId = process.argv[2]?.toUpperCase();

if (!targetTaskId) {
  console.log('Usage: node scripts/update-task.mjs <TASK_ID>');
  console.log('Example: node scripts/update-task.mjs TASK-1.1');
  process.exit(1);
}

if (!fs.existsSync(statePath)) {
  console.error('Error: PROJECT_STATE.json not found!');
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

let targetFound = false;
let targetTaskName = '';
let targetDocFile = '';
let targetPhaseNumber = 1;

for (const phase of state.phases) {
  for (const task of phase.tasks) {
    if (task.id === targetTaskId) {
      task.completed = true;
      targetFound = true;
      targetTaskName = task.name;
      targetDocFile = phase.doc_file;
      targetPhaseNumber = phase.phase_number;
    }
  }
}

if (!targetFound) {
  console.error(`Error: Task ID "${targetTaskId}" not found in PROJECT_STATE.json`);
  process.exit(1);
}

// Recalculate stats
let completedCount = 0;
let totalCount = 0;
let nextTask = null;
let nextPhase = null;

for (const phase of state.phases) {
  for (const task of phase.tasks) {
    totalCount++;
    if (task.completed) {
      completedCount++;
    } else if (!nextTask) {
      nextTask = task;
      nextPhase = phase;
    }
  }
}

state.completed_tasks_count = completedCount;
state.progress_percentage = Math.round((completedCount / totalCount) * 100);
state.last_updated = new Date().toISOString();

if (nextTask) {
  state.active_task = nextTask.name;
  state.active_task_id = nextTask.id;
  state.current_phase = nextPhase.phase_number;
} else {
  state.active_task = "All Completed";
  state.active_task_id = "DONE";
}

// Save updated state
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');

// Also update markdown checkbox in phase document
const fullDocPath = path.join(rootDir, targetDocFile);
if (fs.existsSync(fullDocPath)) {
  let docContent = fs.readFileSync(fullDocPath, 'utf8');
  // Match `- [ ] **Task 1.1:**` or `- [ ] **Task 1.1**`
  const regex = new RegExp(`- \\[ \\] \\*\\*Task ${targetTaskId.replace('TASK-', '')}:?\\*\\*`, 'g');
  docContent = docContent.replace(regex, `- [x] **Task ${targetTaskId.replace('TASK-', '')}:**`);
  fs.writeFileSync(fullDocPath, docContent);
}

console.log(`\n✅ Marked [${targetTaskId}] "${targetTaskName}" as COMPLETED!`);
console.log(`Updated: ${targetDocFile} and PROJECT_STATE.json`);
console.log(`Current Progress: ${completedCount}/${totalCount} (${state.progress_percentage}%)\n`);

if (nextTask) {
  console.log(`➡️ Next Active Task: [${nextTask.id}] ${nextTask.name}`);
  console.log(`   Phase ${nextPhase.phase_number} — ${nextPhase.doc_file}\n`);
} else {
  console.log(`🎉 ALL TASKS COMPLETE!\n`);
}
