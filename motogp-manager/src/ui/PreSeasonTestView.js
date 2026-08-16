// PreSeasonTestView.js - UI Controller for Official Sepang Pre-Season Test Day Screen

import { gameState } from '../engine/GameState.js';
import { PreSeasonTestSystem } from '../systems/PreSeasonTestSystem.js';
import { RaceSystem, TIRE_COMPOUNDS } from '../systems/RaceSystem.js';
import { UIComponents } from './Components.js';
import { CalendarView } from './CalendarView.js';

export class PreSeasonTestView {
    static isOpen = false;

    static initEvents() {
        // Modal Close Button
        document.getElementById('btn-close-preseason-test')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.close();
        });

        // Backdrop Click to Close
        document.getElementById('preseason-test-backdrop')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.close();
        });

        // Stint Launch Buttons
        document.querySelectorAll('.btn-test-stint').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const duration = parseInt(btn.getAttribute('data-mins'), 10) || 10;
                this.handleRunStint(duration);
            });
        });

        // Test Tire Compound Selector Buttons
        document.querySelectorAll('.test-compound-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.test-compound-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const compound = btn.getAttribute('data-compound');
                PreSeasonTestSystem.sessionState.selectedCompound = compound;
                this.render();
            });
        });

        // Prototype Selection for Stint Run
        document.addEventListener('click', (e) => {
            const selectBtn = e.target.closest('.btn-select-test-proto');
            if (selectBtn) {
                e.preventDefault();
                const specId = selectBtn.getAttribute('data-spec');
                if (specId) {
                    PreSeasonTestSystem.sessionState.selectedPrototypeId = specId;
                    this.render();
                }
            }

            const confirmBtn = e.target.closest('.btn-confirm-season-proto');
            if (confirmBtn) {
                e.preventDefault();
                const specId = confirmBtn.getAttribute('data-spec');
                if (specId) {
                    this.handleConfirmSeasonSpec(specId);
                }
            }
        });
    }

    static open() {
        this.isOpen = true;
        const modal = document.getElementById('preseason-test-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.classList.add('modal-open');
        }

        // Initialize session if not active
        if (!PreSeasonTestSystem.sessionState.active) {
            PreSeasonTestSystem.initSession();
        }

        this.render();
    }

    static close() {
        this.isOpen = false;
        const modal = document.getElementById('preseason-test-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        UIComponents.forceRender(true);
        CalendarView.render(gameState.getState(), true);
    }

    static handleRunStint(durationMins) {
        const result = PreSeasonTestSystem.runStint(durationMins);
        if (!result.success) {
            alert("⏱️ Session track time has expired! Please make your final Prototype decision.");
        }
        this.render();
        UIComponents.forceRender(true);
    }

    static handleConfirmSeasonSpec(specId) {
        const proto = PreSeasonTestSystem.sessionState.prototypes[specId];
        if (!proto) return;

        const confirmed = confirm(
            `🏆 FACTORY SPECIFICATION CONFIRMATION\n\n` +
            `Are you sure you want to select "${proto.name}" as your official season machine specification?\n\n` +
            `Key Bonuses:\n${proto.bonusesDesc}\n\n` +
            `This decision will lock in your bike baseline for the upcoming 2026 World Championship season.`
        );

        if (confirmed) {
            PreSeasonTestSystem.confirmSeasonPrototype(specId);
            alert(`🎉 Season Machine Locked!\n\n"${proto.name}" is now the official team bike. Mandatory test completed!`);
            this.close();
        }
    }

    static render() {
        if (!this.isOpen) return;

        const session = PreSeasonTestSystem.sessionState;
        const state = gameState.getState();
        const rider = state.rider;

        // 1. Session Clock & Progress Bar
        const clockEl = document.getElementById('test-session-clock');
        if (clockEl) {
            clockEl.textContent = PreSeasonTestSystem.formatSessionClock(session.sessionTimeRemaining);
        }

        const clockBar = document.getElementById('test-clock-bar-fill');
        if (clockBar) {
            const pct = Math.max(0, (session.sessionTimeRemaining / session.sessionTotalSeconds) * 100);
            clockBar.style.width = `${pct}%`;
        }

        // 2. Render Prototypes Cards
        const protoContainer = document.getElementById('test-prototypes-grid');
        if (protoContainer && session.prototypes) {
            const specA = session.prototypes.spec_a;
            const specB = session.prototypes.spec_b;
            const telemA = session.testTelemetry.spec_a;
            const telemB = session.testTelemetry.spec_b;

            const isAActive = session.selectedPrototypeId === 'spec_a';
            const isBActive = session.selectedPrototypeId === 'spec_b';

            protoContainer.innerHTML = `
                <!-- Prototype A Card -->
                <div class="prototype-card ${isAActive ? 'active-test-proto' : ''}">
                    <div class="proto-header">
                        <div class="proto-badge" style="background: ${specA.tagColor}; color:#000;">${specA.badge}</div>
                        <div class="proto-status-pill">${isAActive ? '🟢 ACTIVE IN PIT BOX' : 'STANDBY'}</div>
                    </div>
                    <h3 class="proto-title">${specA.name}</h3>
                    <p class="proto-desc">${specA.description}</p>
                    
                    <div class="proto-stats-bars">
                        <div class="proto-stat-row">
                            <span>Acceleration</span>
                            <div class="stat-bar-mini"><div class="stat-fill" style="width:${specA.accelRating}%; background:var(--accent-cyan);"></div></div>
                            <strong>${specA.accelRating}</strong>
                        </div>
                        <div class="proto-stat-row">
                            <span>Top Speed Trap</span>
                            <div class="stat-bar-mini"><div class="stat-fill" style="width:${Math.min(100, (specA.topSpeedKmh / 360) * 100)}%; background:var(--accent-cyan);"></div></div>
                            <strong>${specA.topSpeedKmh} km/h</strong>
                        </div>
                        <div class="proto-stat-row">
                            <span>Corner Handling</span>
                            <div class="stat-bar-mini"><div class="stat-fill" style="width:${specA.handlingRating}%; background:var(--accent-gold);"></div></div>
                            <strong>${specA.handlingRating}</strong>
                        </div>
                        <div class="proto-stat-row">
                            <span>Tire Preservation</span>
                            <span class="stat-badge badge-warning">${specA.tyreWearIndex}</span>
                        </div>
                        <div class="proto-stat-row">
                            <span>Reliability</span>
                            <span class="stat-badge badge-success">${specA.reliability}%</span>
                        </div>
                    </div>

                    <div class="proto-test-results">
                        <div class="result-box">
                            <small>Best Lap Recorded</small>
                            <strong style="color:var(--accent-cyan); font-family:monospace; font-size:1.1rem;">
                                ${telemA.bestLap ? telemA.bestLap.lapStr : '--:--.---'}
                            </strong>
                        </div>
                        <div class="result-box">
                            <small>Laps Run</small>
                            <strong>${telemA.totalLaps} Laps</strong>
                        </div>
                        <div class="result-box">
                            <small>Peak Trap</small>
                            <strong>${telemA.topSpeedKmh > 0 ? telemA.topSpeedKmh + ' km/h' : '--'}</strong>
                        </div>
                    </div>

                    <div class="proto-actions-row">
                        <button class="btn-sec btn-select-test-proto" data-spec="spec_a" ${isAActive ? 'disabled' : ''}>
                            ${isAActive ? '✓ Currently Selected' : '🏍️ Mount Spec A for Stint'}
                        </button>
                        <button class="btn-race-primary btn-confirm-season-proto" data-spec="spec_a">
                            👑 Lock as Official Season Spec
                        </button>
                    </div>
                </div>

                <!-- Prototype B Card -->
                <div class="prototype-card ${isBActive ? 'active-test-proto' : ''}">
                    <div class="proto-header">
                        <div class="proto-badge" style="background: ${specB.tagColor}; color:#000;">${specB.badge}</div>
                        <div class="proto-status-pill">${isBActive ? '🟢 ACTIVE IN PIT BOX' : 'STANDBY'}</div>
                    </div>
                    <h3 class="proto-title">${specB.name}</h3>
                    <p class="proto-desc">${specB.description}</p>
                    
                    <div class="proto-stats-bars">
                        <div class="proto-stat-row">
                            <span>Acceleration</span>
                            <div class="stat-bar-mini"><div class="stat-fill" style="width:${specB.accelRating}%; background:var(--accent-cyan);"></div></div>
                            <strong>${specB.accelRating}</strong>
                        </div>
                        <div class="proto-stat-row">
                            <span>Top Speed Trap</span>
                            <div class="stat-bar-mini"><div class="stat-fill" style="width:${Math.min(100, (specB.topSpeedKmh / 360) * 100)}%; background:var(--accent-cyan);"></div></div>
                            <strong>${specB.topSpeedKmh} km/h</strong>
                        </div>
                        <div class="proto-stat-row">
                            <span>Corner Handling</span>
                            <div class="stat-bar-mini"><div class="stat-fill" style="width:${specB.handlingRating}%; background:var(--accent-gold);"></div></div>
                            <strong>${specB.handlingRating}</strong>
                        </div>
                        <div class="proto-stat-row">
                            <span>Tire Preservation</span>
                            <span class="stat-badge badge-success">${specB.tyreWearIndex}</span>
                        </div>
                        <div class="proto-stat-row">
                            <span>Reliability</span>
                            <span class="stat-badge badge-success">${specB.reliability}%</span>
                        </div>
                    </div>

                    <div class="proto-test-results">
                        <div class="result-box">
                            <small>Best Lap Recorded</small>
                            <strong style="color:var(--accent-gold); font-family:monospace; font-size:1.1rem;">
                                ${telemB.bestLap ? telemB.bestLap.lapStr : '--:--.---'}
                            </strong>
                        </div>
                        <div class="result-box">
                            <small>Laps Run</small>
                            <strong>${telemB.totalLaps} Laps</strong>
                        </div>
                        <div class="result-box">
                            <small>Peak Trap</small>
                            <strong>${telemB.topSpeedKmh > 0 ? telemB.topSpeedKmh + ' km/h' : '--'}</strong>
                        </div>
                    </div>

                    <div class="proto-actions-row">
                        <button class="btn-sec btn-select-test-proto" data-spec="spec_b" ${isBActive ? 'disabled' : ''}>
                            ${isBActive ? '✓ Currently Selected' : '🏍️ Mount Spec B for Stint'}
                        </button>
                        <button class="btn-race-primary btn-confirm-season-proto" data-spec="spec_b">
                            👑 Lock as Official Season Spec
                        </button>
                    </div>
                </div>
            `;
        }

        // 3. Render Rider Radio Feedback Feed
        const notesContainer = document.getElementById('test-rider-radio-feed');
        if (notesContainer) {
            const allNotes = [
                ...session.testTelemetry.spec_a.riderNotes.map(n => ({ ...n, spec: 'Spec A' })),
                ...session.testTelemetry.spec_b.riderNotes.map(n => ({ ...n, spec: 'Spec B' }))
            ];
            allNotes.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

            if (allNotes.length === 0) {
                notesContainer.innerHTML = `<div class="empty-feed-msg">🎙️ No stint feedback yet. Select a prototype and click "Run Stint" to send ${rider.name} onto the Sepang tarmac.</div>`;
            } else {
                notesContainer.innerHTML = allNotes.slice(0, 4).map(note => `
                    <div class="radio-quote-card">
                        <div class="quote-header">
                            <span class="quote-tag">${note.spec} • ${note.compound} TIRE</span>
                            <span class="quote-time">⏱️ ${note.timestamp} left • Best: ${note.bestTime}</span>
                        </div>
                        <p class="quote-body">${note.quote}</p>
                    </div>
                `).join('');
            }
        }

        // 4. Render FIM Sepang Official Timing Tower
        const tbody = document.getElementById('test-timing-tower-body');
        if (tbody && session.combinedLeaderboard) {
            const sBests = session.sessionFastestSectors;
            tbody.innerHTML = session.combinedLeaderboard.map(entry => {
                const isUserA = entry.isSpecA;
                const isUserB = entry.isSpecB;
                const rowClass = isUserA ? 'row-user-spec-a' : (isUserB ? 'row-user-spec-b' : '');

                const s1Class = entry.sectors[0] && sBests[0] && entry.sectors[0] <= sBests[0] ? 'sector-purple' : (entry.isUser ? 'sector-green' : '');
                const s2Class = entry.sectors[1] && sBests[1] && entry.sectors[1] <= sBests[1] ? 'sector-purple' : (entry.isUser ? 'sector-green' : '');
                const s3Class = entry.sectors[2] && sBests[2] && entry.sectors[2] <= sBests[2] ? 'sector-purple' : (entry.isUser ? 'sector-green' : '');
                const s4Class = entry.sectors[3] && sBests[3] && entry.sectors[3] <= sBests[3] ? 'sector-purple' : (entry.isUser ? 'sector-green' : '');

                const bestLapColor = entry.position === 1 ? 'color:var(--accent-purple, #d05ce3); font-weight:800;' : '';

                return `
                    <tr class="${rowClass}">
                        <td class="pos-cell"><strong>P${entry.position}</strong></td>
                        <td class="rider-cell">
                            <strong>${entry.name}</strong>
                            <small class="team-sub">${entry.team}</small>
                        </td>
                        <td class="time-cell" style="${bestLapColor}">${entry.bestLapStr}</td>
                        <td class="gap-cell">${entry.gapStr}</td>
                        <td class="sec-cell ${s1Class}">${entry.sectors[0] ? entry.sectors[0].toFixed(3) : '--'}</td>
                        <td class="sec-cell ${s2Class}">${entry.sectors[1] ? entry.sectors[1].toFixed(3) : '--'}</td>
                        <td class="sec-cell ${s3Class}">${entry.sectors[2] ? entry.sectors[2].toFixed(3) : '--'}</td>
                        <td class="sec-cell ${s4Class}">${entry.sectors[3] ? entry.sectors[3].toFixed(3) : '--'}</td>
                        <td class="trap-cell">${entry.topSpeedKmh ? entry.topSpeedKmh + ' km/h' : '--'}</td>
                        <td class="laps-cell">${entry.lapsCompleted}</td>
                    </tr>
                `;
            }).join('');
        }
    }
}
