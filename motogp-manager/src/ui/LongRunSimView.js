// LongRunSimView.js - UI Controller for 20-Lap Race Pace Simulation & Telemetry Report

import { gameState } from '../engine/GameState.js';
import { LongRunSimSystem } from '../systems/LongRunSimSystem.js';
import { UIComponents } from './Components.js';
import { CalendarView } from './CalendarView.js';

export class LongRunSimView {
    static isOpen = false;

    static initEvents() {
        // Close Button
        document.getElementById('btn-close-long-run-sim')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.close();
        });

        // Backdrop Click to Close
        document.getElementById('long-run-sim-backdrop')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.close();
        });

        // Compound Selection Buttons
        document.querySelectorAll('.longrun-compound-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.longrun-compound-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const comp = btn.getAttribute('data-compound');
                LongRunSimSystem.simState.selectedCompound = comp;
            });
        });

        // Engine Map Selection Buttons
        document.querySelectorAll('.longrun-map-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.longrun-map-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const map = btn.getAttribute('data-map');
                LongRunSimSystem.simState.selectedMap = map;
            });
        });

        // Start Simulation Button
        document.getElementById('btn-start-20lap-sim')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLaunchSimulation();
        });

        // Accept Report Button
        document.getElementById('btn-accept-engineering-report')?.addEventListener('click', (e) => {
            e.preventDefault();
            LongRunSimSystem.acceptEngineeringReport();
            alert("📊 Engineering report accepted! Telemetry, Science RP, and Hype awarded.");
            this.close();
        });
    }

    static open() {
        this.isOpen = true;
        const modal = document.getElementById('long-run-sim-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.classList.add('modal-open');
        }

        if (!LongRunSimSystem.simState.active) {
            LongRunSimSystem.initSimulation();
        }

        this.render();
    }

    static close() {
        this.isOpen = false;
        const modal = document.getElementById('long-run-sim-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        UIComponents.forceRender(true);
        CalendarView.render(gameState.getState(), true);
    }

    static handleLaunchSimulation() {
        const comp = LongRunSimSystem.simState.selectedCompound || 'medium';
        const map = LongRunSimSystem.simState.selectedMap || 'balanced';

        LongRunSimSystem.runFullSimulation(comp, map);
        this.render();
        UIComponents.forceRender(true);
    }

    static render() {
        if (!this.isOpen) return;

        const sim = LongRunSimSystem.simState;
        const setupPanel = document.getElementById('longrun-setup-panel');
        const livePanel = document.getElementById('longrun-live-panel');
        const reportPanel = document.getElementById('longrun-report-panel');

        if (!sim.isCompleted) {
            // Setup Mode
            if (setupPanel) setupPanel.style.display = 'block';
            if (livePanel) livePanel.style.display = 'none';
            if (reportPanel) reportPanel.style.display = 'none';
        } else {
            // Completed Mode with Live Telemetry & Report
            if (setupPanel) setupPanel.style.display = 'none';
            if (livePanel) livePanel.style.display = 'block';
            if (reportPanel) reportPanel.style.display = 'block';

            // Render Metrics Cards
            const v = sim.engineeringVerdict;
            if (v) {
                const metricContainer = document.getElementById('longrun-metrics-grid');
                if (metricContainer) {
                    metricContainer.innerHTML = `
                        <div class="metric-card">
                            <small>Compound Tested</small>
                            <strong style="color:var(--accent-gold);">${v.compoundTested} (${v.mapTested})</strong>
                        </div>
                        <div class="metric-card">
                            <small>Fastest Lap</small>
                            <strong style="color:var(--accent-cyan); font-family:monospace;">${v.bestLapTime}</strong>
                        </div>
                        <div class="metric-card">
                            <small>Average Race Pace</small>
                            <strong style="color:var(--text-main); font-family:monospace;">${v.averagePace}</strong>
                        </div>
                        <div class="metric-card">
                            <small>Total Degradation</small>
                            <strong style="color:var(--primary-red);">${v.totalTireDegradation}</strong>
                        </div>
                        <div class="metric-card">
                            <small>Consistency Rating</small>
                            <strong style="color:var(--accent-green);">${v.consistencyIndex}</strong>
                        </div>
                    `;
                }

                // Render Written Verdict
                const verdictBody = document.getElementById('longrun-verdict-body');
                if (verdictBody) {
                    verdictBody.innerHTML = `
                        <div class="verdict-section">
                            <h4>🔬 Technical Tire Degradation Breakdown</h4>
                            <p>${v.technicalAnalysis}</p>
                        </div>
                        <div class="verdict-section" style="margin-top:12px;">
                            <h4>💡 Chief Race Engineer Strategic Verdict</h4>
                            <p style="color:var(--accent-green);">${v.raceStrategyRecommendation}</p>
                        </div>
                    `;
                }
            }

            // Render 20-Lap Telemetry Table
            const tbody = document.getElementById('longrun-telemetry-body');
            if (tbody && sim.lapHistory) {
                tbody.innerHTML = sim.lapHistory.map(h => {
                    const isPb = h.isPersonalBest;
                    const pbBadge = isPb ? '<span class="pb-tag">🟣 PB</span>' : '';
                    const wearColor = h.tireLife > 60 ? 'color:var(--accent-green);' : (h.tireLife > 30 ? 'color:var(--accent-gold);' : 'color:var(--primary-red); font-weight:700;');

                    return `
                        <tr>
                            <td class="lap-cell"><strong>Lap ${h.lap}</strong> ${pbBadge}</td>
                            <td class="time-cell" style="${isPb ? 'color:var(--accent-purple, #d05ce3); font-weight:bold;' : ''}">${h.lapStr}</td>
                            <td>${h.s1}</td>
                            <td>${h.s2}</td>
                            <td>${h.s3}</td>
                            <td>${h.s4}</td>
                            <td style="${wearColor}">${h.tireLife}%</td>
                            <td>${h.tireTempC}°C</td>
                            <td>${h.fuelKg} kg</td>
                        </tr>
                    `;
                }).join('');
            }

            // Render Radio Feed
            const radioContainer = document.getElementById('longrun-radio-feed');
            if (radioContainer && sim.radioFeed) {
                radioContainer.innerHTML = sim.radioFeed.map(r => `
                    <div class="radio-bubble">
                        <span class="radio-tag">${r.tag} (Lap ${r.lap})</span>
                        <p class="radio-msg">${r.message}</p>
                    </div>
                `).join('');
            }
        }
    }
}
