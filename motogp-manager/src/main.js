// main.js - Entry point for MotoGP Manager game

import { tickEngine } from './engine/TickEngine.js';
import { SaveManager } from './engine/SaveManager.js';
import { TabsManager } from './ui/Tabs.js';
import { UIComponents } from './ui/Components.js';
import { RaceView } from './ui/RaceView.js';
import { CalendarView } from './ui/CalendarView.js';
import { PreSeasonTestView } from './ui/PreSeasonTestView.js';
import { LongRunSimView } from './ui/LongRunSimView.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize UI Navigation & Event Listeners
    TabsManager.init();
    UIComponents.initEvents();
    RaceView.initEvents();
    CalendarView.initEvents();
    PreSeasonTestView.initEvents();
    LongRunSimView.initEvents();

    // 2. Settings Event Handlers
    document.getElementById('btn-manual-save')?.addEventListener('click', () => {
        const saved = SaveManager.save();
        alert(saved ? 'Game saved successfully!' : 'Failed to save game.');
    });

    document.getElementById('btn-export-save')?.addEventListener('click', () => {
        const code = SaveManager.exportSaveString();
        const area = document.getElementById('save-string-area');
        if (area) {
            area.value = code;
            area.select();
            document.execCommand('copy');
            alert('Save string copied to clipboard!');
        }
    });

    document.getElementById('btn-import-save')?.addEventListener('click', () => {
        const area = document.getElementById('save-string-area');
        if (area && area.value) {
            const success = SaveManager.importSaveString(area.value);
            if (success) {
                alert('Save imported successfully!');
            } else {
                alert('Invalid save string.');
            }
        }
    });

    document.getElementById('btn-hard-reset')?.addEventListener('click', () => {
        if (confirm("WARNING: Hard Reset will wipe ALL game progress and save data! Are you sure?")) {
            SaveManager.hardReset();
            location.reload();
        }
    });

    // 3. Subscribe UI updates to tick engine
    tickEngine.subscribe((state, rates) => {
        UIComponents.render(state, rates);
        RaceView.render(state);
        CalendarView.render(state);
    });

    // 4. Start the tick loop
    tickEngine.start();
});
