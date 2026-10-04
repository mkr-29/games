// RacerSelectionModal.js - Official MotoGP Paddock Racer Selection & Onboarding UI

import { gameState } from '../engine/GameState.js';
import { RiderSystem, OFFICIAL_RACERS } from '../systems/RiderSystem.js';
import { RaceSystem } from '../systems/RaceSystem.js';
import { SaveManager } from '../engine/SaveManager.js';
import { UIComponents } from './Components.js';

export class RacerSelectionModal {
    static isOpen = false;
    static selectedRacerIds = [];
    static activeCategory = 'all';
    static searchQuery = '';
    static sortBy = 'overall';

    static initEvents() {
        // Close buttons & backdrop
        document.getElementById('btn-close-racer-modal')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.close();
        });

        document.getElementById('racer-modal-backdrop')?.addEventListener('click', (e) => {
            e.preventDefault();
            // If user hasn't chosen initial racers yet, encourage selecting 2
            const state = gameState.getState();
            if (state.selectedRacersChosen && state.riders && state.riders.length >= 2) {
                this.close();
            }
        });

        // Search Input
        const searchInput = document.getElementById('racer-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderRacerGrid();
            });
        }

        // Category Filter Buttons
        document.querySelectorAll('.racer-cat-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.racer-cat-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeCategory = chip.getAttribute('data-cat') || 'all';
                this.renderRacerGrid();
            });
        });

        // Sort Selector
        const sortSelect = document.getElementById('racer-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderRacerGrid();
            });
        }

        // Random Quick Pick Button
        document.getElementById('btn-random-racers')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleQuickPick();
        });

        // Confirm Selection Button
        document.getElementById('btn-confirm-racers')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleConfirm();
        });

        // Manage / Switch Lineup button in Riders & Staff pane
        document.getElementById('btn-open-racer-selection')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.open();
        });
    }

    static checkInitialPrompt() {
        const state = gameState.getState();
        if (!state.selectedRacersChosen || !state.riders || state.riders.length < 2) {
            // Open initial modal automatically
            setTimeout(() => {
                this.open();
            }, 300);
        }
    }

    static open() {
        const state = gameState.getState();
        this.isOpen = true;
        this.searchQuery = '';
        this.activeCategory = 'all';
        this.sortBy = 'overall';

        // Prepopulate with current team racers if already set
        if (state.riders && state.riders.length >= 2) {
            this.selectedRacerIds = state.riders.map(r => r.id);
        } else {
            this.selectedRacerIds = [];
        }

        const modal = document.getElementById('modal-racer-selection');
        if (modal) {
            modal.style.display = 'flex';
        }

        const searchInput = document.getElementById('racer-search-input');
        if (searchInput) searchInput.value = '';

        document.querySelectorAll('.racer-cat-chip').forEach(c => {
            c.classList.toggle('active', c.getAttribute('data-cat') === 'all');
        });

        this.renderSelectedDock();
        this.renderRacerGrid();
    }

    static close() {
        this.isOpen = false;
        const modal = document.getElementById('modal-racer-selection');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    static handleRacerCardClick(racerId) {
        const idx = this.selectedRacerIds.indexOf(racerId);
        if (idx !== -1) {
            // Deselect
            this.selectedRacerIds.splice(idx, 1);
        } else {
            if (this.selectedRacerIds.length < 2) {
                this.selectedRacerIds.push(racerId);
            } else {
                // If 2 are already selected, replace the 2nd one
                this.selectedRacerIds[1] = racerId;
            }
        }

        this.renderSelectedDock();
        this.renderRacerGrid();
    }

    static removeRacerFromSlot(slotIndex) {
        if (this.selectedRacerIds[slotIndex]) {
            this.selectedRacerIds.splice(slotIndex, 1);
            this.renderSelectedDock();
            this.renderRacerGrid();
        }
    }

    static handleQuickPick() {
        const state = gameState.getState();
        const tier = state.tier || 1;
        let pool = OFFICIAL_RACERS;

        // Bias towards relevant tier or premier class
        if (tier === 1) {
            const moto3 = OFFICIAL_RACERS.filter(r => r.category === 'Moto3');
            if (moto3.length >= 2) pool = moto3;
        } else if (tier === 2) {
            const moto2 = OFFICIAL_RACERS.filter(r => r.category === 'Moto2');
            if (moto2.length >= 2) pool = moto2;
        } else {
            const motogp = OFFICIAL_RACERS.filter(r => r.category === 'MotoGP');
            if (motogp.length >= 2) pool = motogp;
        }

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        this.selectedRacerIds = [shuffled[0].id, shuffled[1].id];

        this.renderSelectedDock();
        this.renderRacerGrid();
    }

    static handleConfirm() {
        if (this.selectedRacerIds.length !== 2) {
            alert('Please select exactly 2 racers for your factory team lineup.');
            return;
        }

        const racer1Data = RiderSystem.getRacerById(this.selectedRacerIds[0]);
        const racer2Data = RiderSystem.getRacerById(this.selectedRacerIds[1]);

        if (!racer1Data || !racer2Data) {
            alert('Error loading selected racer details. Please try again.');
            return;
        }

        const formattedRider1 = RiderSystem.formatRiderForTeam(racer1Data, 0);
        const formattedRider2 = RiderSystem.formatRiderForTeam(racer2Data, 1);

        gameState.update(state => {
            state.selectedRacersChosen = true;
            state.riders = [formattedRider1, formattedRider2];
            state.rider = formattedRider1;
        });

        RaceSystem.initChampionshipStandings(true);

        SaveManager.save();
        UIComponents.forceRender();

        gameState.addLog(`🏆 TEAM LINEUP CONFIRMED! Rider #1: ${formattedRider1.name} (#${formattedRider1.number}) & Rider #2: ${formattedRider2.name} (#${formattedRider2.number})!`);

        this.close();
    }

    static renderSelectedDock() {
        const slot1El = document.getElementById('selected-slot-1');
        const slot2El = document.getElementById('selected-slot-2');
        const countBadge = document.getElementById('selection-count-badge');
        const confirmBtn = document.getElementById('btn-confirm-racers');

        const r1Id = this.selectedRacerIds[0];
        const r2Id = this.selectedRacerIds[1];
        const r1 = r1Id ? RiderSystem.getRacerById(r1Id) : null;
        const r2 = r2Id ? RiderSystem.getRacerById(r2Id) : null;

        const count = this.selectedRacerIds.length;
        if (countBadge) {
            countBadge.textContent = `${count} / 2 Selected`;
            countBadge.className = `selection-counter ${count === 2 ? 'ready' : ''}`;
        }

        if (confirmBtn) {
            confirmBtn.disabled = count !== 2;
            confirmBtn.innerHTML = count === 2 
                ? `<span>🏁</span> Confirm 2-Racer Lineup` 
                : `Select 2 Racers (${count}/2)`;
        }

        // Render Slot 1
        if (slot1El) {
            if (r1) {
                slot1El.innerHTML = `
                    <div class="dock-racer-card active-slot">
                        <div class="dock-slot-tag">RIDER #1</div>
                        <div class="dock-racer-header">
                            <span class="dock-num">#${r1.number}</span>
                            <div class="dock-meta">
                                <strong>${r1.name}</strong>
                                <small>${r1.country} • ${r1.category}</small>
                            </div>
                            <span class="dock-ovr">${r1.overallSkill} OVR</span>
                        </div>
                        <button class="btn-dock-remove" onclick="window.racerModalRemoveSlot(0)" title="Remove racer">✕</button>
                    </div>
                `;
            } else {
                slot1El.innerHTML = `
                    <div class="dock-racer-card empty-slot">
                        <div class="dock-slot-tag">RIDER #1</div>
                        <span class="empty-icon">➕</span>
                        <span class="empty-text">Select 1st Racer</span>
                    </div>
                `;
            }
        }

        // Render Slot 2
        if (slot2El) {
            if (r2) {
                slot2El.innerHTML = `
                    <div class="dock-racer-card active-slot">
                        <div class="dock-slot-tag">RIDER #2</div>
                        <div class="dock-racer-header">
                            <span class="dock-num">#${r2.number}</span>
                            <div class="dock-meta">
                                <strong>${r2.name}</strong>
                                <small>${r2.country} • ${r2.category}</small>
                            </div>
                            <span class="dock-ovr">${r2.overallSkill} OVR</span>
                        </div>
                        <button class="btn-dock-remove" onclick="window.racerModalRemoveSlot(1)" title="Remove racer">✕</button>
                    </div>
                `;
            } else {
                slot2El.innerHTML = `
                    <div class="dock-racer-card empty-slot">
                        <div class="dock-slot-tag">RIDER #2</div>
                        <span class="empty-icon">➕</span>
                        <span class="empty-text">Select 2nd Racer</span>
                    </div>
                `;
            }
        }
    }

    static renderRacerGrid() {
        const grid = document.getElementById('racer-cards-grid');
        if (!grid) return;

        let list = [...OFFICIAL_RACERS];

        // Filter Category
        if (this.activeCategory !== 'all') {
            if (this.activeCategory === 'motogp') list = list.filter(r => r.category === 'MotoGP');
            else if (this.activeCategory === 'moto2') list = list.filter(r => r.category === 'Moto2');
            else if (this.activeCategory === 'moto3') list = list.filter(r => r.category === 'Moto3');
            else if (this.activeCategory === 'rookies') list = list.filter(r => r.category === 'Rookies' || r.category === 'Rookies & Academy');
            else if (this.activeCategory === 'legends') list = list.filter(r => r.category === 'Legends & Reserves' || r.category === 'Legends');
        }

        // Search Query
        if (this.searchQuery) {
            list = list.filter(r => 
                r.name.toLowerCase().includes(this.searchQuery) ||
                (r.number && String(r.number).includes(this.searchQuery)) ||
                (r.team && r.team.toLowerCase().includes(this.searchQuery)) ||
                (r.country && r.country.toLowerCase().includes(this.searchQuery))
            );
        }

        // Sort
        if (this.sortBy === 'overall') {
            list.sort((a, b) => b.overallSkill - a.overallSkill);
        } else if (this.sortBy === 'speed') {
            list.sort((a, b) => b.speed - a.speed);
        } else if (this.sortBy === 'racecraft') {
            list.sort((a, b) => b.racecraft - a.racecraft);
        } else if (this.sortBy === 'number') {
            list.sort((a, b) => (a.number || 99) - (b.number || 99));
        } else if (this.sortBy === 'name') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (list.length === 0) {
            grid.innerHTML = `
                <div class="racer-empty-search">
                    <p>🔍 No racers match your filter or search query "${this.searchQuery}".</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = list.map(r => {
            const isSelected = this.selectedRacerIds.includes(r.id);
            const slotIdx = this.selectedRacerIds.indexOf(r.id);
            const slotTag = isSelected ? (slotIdx === 0 ? '⭐ RIDER #1' : '⭐ RIDER #2') : '';
            const categoryClass = r.category === 'MotoGP' ? 'cat-motogp' 
                               : (r.category === 'Moto2' ? 'cat-moto2' 
                               : (r.category === 'Moto3' ? 'cat-moto3' 
                               : (r.category === 'Rookies' || r.category === 'Rookies & Academy' ? 'cat-rookies' : 'cat-legends')));

            return `
                <div class="racer-selection-card ${isSelected ? 'selected' : ''}" data-racer-id="${r.id}" onclick="window.racerModalSelectCard('${r.id}')">
                    <div class="racer-card-top">
                        <div class="racer-num-badge">#${r.number}</div>
                        <span class="racer-cat-badge ${categoryClass}">${r.category}</span>
                        <div class="racer-ovr-pill">${r.overallSkill} <small>OVR</small></div>
                    </div>

                    <div class="racer-card-info">
                        <h3 class="racer-card-name">${r.name}</h3>
                        <div class="racer-card-sub">
                            <span>${r.country}</span> • <span>${r.team}</span>
                        </div>
                        <p class="racer-card-style">🎯 ${r.ridingStyle || 'Balanced Apex Attacker'}</p>
                    </div>

                    <div class="racer-card-stats-mini">
                        <div class="stat-mini-bar">
                            <span class="lbl">SPD</span>
                            <div class="bar-track"><div class="bar-fill" style="width:${r.speed}%;"></div></div>
                            <span class="val">${r.speed}</span>
                        </div>
                        <div class="stat-mini-bar">
                            <span class="lbl">RCFT</span>
                            <div class="bar-track"><div class="bar-fill" style="width:${r.racecraft}%;"></div></div>
                            <span class="val">${r.racecraft}</span>
                        </div>
                        <div class="stat-mini-bar">
                            <span class="lbl">CONS</span>
                            <div class="bar-track"><div class="bar-fill" style="width:${r.consistency}%;"></div></div>
                            <span class="val">${r.consistency}</span>
                        </div>
                        <div class="stat-mini-bar">
                            <span class="lbl">WET</span>
                            <div class="bar-track"><div class="bar-fill" style="width:${r.wetSkill}%;"></div></div>
                            <span class="val">${r.wetSkill}</span>
                        </div>
                    </div>

                    <div class="racer-card-bottom">
                        ${isSelected ? `<span class="slot-badge">${slotTag}</span>` : `<button class="btn-select-racer">Select Racer</button>`}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Global window hooks for inline onclick handlers
if (typeof window !== 'undefined') {
    window.racerModalSelectCard = (id) => RacerSelectionModal.handleRacerCardClick(id);
    window.racerModalRemoveSlot = (slot) => RacerSelectionModal.removeRacerFromSlot(slot);
}
