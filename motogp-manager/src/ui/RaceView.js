// RaceView.js - Interactive Race Weekend Dashboard, Standings & Pit Wall Radio UI

import { gameState } from '../engine/GameState.js';
import { RaceSystem, GP_CALENDAR } from '../systems/RaceSystem.js';

export class RaceView {
    static initEvents() {
        // Stage Action Button
        document.getElementById('btn-start-race-stage')?.addEventListener('click', (e) => {
            e.preventDefault();
            const state = gameState.getState();
            const rs = state.raceState;

            if (rs.stage === 'FP') {
                RaceSystem.runFreePractice();
            } else if (rs.stage === 'QP') {
                RaceSystem.runQualifying();
            } else if (rs.stage === 'RACE' && !rs.raceInProgress) {
                RaceSystem.startGrandPrixRace();
            }
        });

        // Strategy Buttons
        document.querySelectorAll('.strat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.strat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const map = btn.getAttribute('data-map');
                RaceSystem.setStrategy(map);
            });
        });
    }

    static updateText(id, val) {
        const el = document.getElementById(id);
        if (el && el.textContent !== String(val)) {
            el.textContent = val;
        }
    }

    static render(state) {
        const rs = state.raceState;
        const gp = RaceSystem.getCurrentGP();
        const r = state.rider;

        // GP Info Header & Weather Status
        this.updateText('championship-season-lbl', `Season ${state.season} - Round ${(rs.currentGPIndex % GP_CALENDAR.length) + 1} of ${GP_CALENDAR.length}`);
        this.updateText('gp-flag', gp.flag);
        this.updateText('gp-title', gp.title);
        
        const setupStr = rs.setupMatch ? ` | Setup: ${rs.setupMatch}%` : '';
        const weatherStr = ` | Weather: ${rs.weather.toUpperCase()} ${rs.weather === 'wet' ? '🌧️' : '☀️'}`;
        const tireStr = ` | Tires: ${rs.tireType.toUpperCase()} (${Math.floor(rs.tireCondition)}% life)`;
        const injuryStr = r.injury ? ` | 🩺 INJURED: ${r.injury.name} (-${r.injury.penalty} skill)` : '';

        this.updateText('gp-track-info', `Length: ${gp.lengthKm} km | Focus: ${gp.type.toUpperCase()}${setupStr}${weatherStr}${tireStr}${injuryStr}`);

        // Stage Steps Active State
        const stepFp = document.getElementById('stage-step-fp');
        if (stepFp) stepFp.className = `stage-step ${rs.stage === 'FP' ? 'active' : ''}`;

        const stepQp = document.getElementById('stage-step-qp');
        if (stepQp) stepQp.className = `stage-step ${rs.stage === 'QP' ? 'active' : ''}`;

        const stepRace = document.getElementById('stage-step-race');
        if (stepRace) stepRace.className = `stage-step ${rs.stage === 'RACE' ? 'active' : ''}`;

        // Stage Action Button Label
        const btnStage = document.getElementById('btn-start-race-stage');
        const stratBox = document.getElementById('race-strategy-box');
        const badgeReady = document.getElementById('race-ready-badge');

        if (badgeReady) {
            badgeReady.style.display = (rs.stage === 'FP' || rs.stage === 'QP') ? 'inline-block' : 'none';
        }

        if (btnStage) {
            if (rs.stage === 'FP') {
                btnStage.textContent = "🚀 Run Free Practice 1";
                btnStage.disabled = false;
                if (stratBox) stratBox.style.display = "none";
            } else if (rs.stage === 'QP') {
                btnStage.textContent = "⏱️ Run Qualifying Hot Laps";
                btnStage.disabled = false;
                if (stratBox) stratBox.style.display = "none";
            } else if (rs.stage === 'RACE') {
                if (rs.raceInProgress) {
                    btnStage.textContent = "🏎️ Race in Progress...";
                    btnStage.disabled = true;
                } else {
                    btnStage.textContent = `🏁 Start Grand Prix (Grid P${rs.qpGridPosition})`;
                    btnStage.disabled = false;
                }
                if (stratBox) stratBox.style.display = "block";
            }
        }

        // Render Pit Wall Radio Incident Prompt (Mid-race interactive decision)
        this.renderPitWallIncident(rs);

        // Live Lap Counter & Fill Bar
        this.updateText('race-lap-counter', `Lap ${rs.currentLap} / ${gp.laps}`);
        const fillBar = document.getElementById('race-lap-fill');
        if (fillBar) fillBar.style.width = `${rs.trackProgress}%`;

        const liveDot = document.getElementById('live-indicator');
        if (liveDot) liveDot.style.display = rs.raceInProgress ? 'inline' : 'none';

        // Live Leaderboard Table Update (Physical DOM Row Sorting)
        this.renderLiveLeaderboard(rs);

        // Render World Championship Standings Table (Physical DOM Row Sorting)
        this.renderChampionshipStandings(state);
    }

    static renderLiveLeaderboard(rs) {
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;

        if (rs.leaderboard && rs.leaderboard.length > 0) {
            const emptyState = tbody.querySelector('.empty-state');
            if (emptyState) tbody.innerHTML = '';

            rs.leaderboard.forEach((r, idx) => {
                const pos = idx + 1;
                const isDnf = r.dnf;
                const gapSec = r.gapSeconds !== undefined ? r.gapSeconds : (pos - 1) * 0.85;
                const gapText = isDnf ? 'DNF' : (pos === 1 ? 'LEADER' : `+${gapSec.toFixed(3)}s`);
                const lapTime = isDnf ? 'CRASH' : (r.lapTimeStr || `1:38.450`);

                let row = tbody.querySelector(`[data-rider-name="${CSS.escape(r.name)}"]`);
                if (!row) {
                    row = document.createElement('tr');
                    row.setAttribute('data-rider-name', r.name);
                    row.innerHTML = `
                        <td class="cell-pos">P${pos}</td>
                        <td class="cell-name">${r.isUser ? '⭐ ' : ''}${r.name}</td>
                        <td class="cell-team">${r.team}</td>
                        <td class="cell-gap">${gapText}</td>
                        <td class="cell-time">${lapTime}</td>
                    `;
                }

                tbody.appendChild(row);

                const targetClass = `${r.isUser ? 'user-rider' : ''} ${isDnf ? 'dnf-row' : ''}`.trim();
                if (row.className !== targetClass) row.className = targetClass;

                const posCell = row.querySelector('.cell-pos');
                if (posCell && posCell.textContent !== (isDnf ? '💥' : `P${pos}`)) {
                    posCell.textContent = isDnf ? '💥' : `P${pos}`;
                }

                const gapCell = row.querySelector('.cell-gap');
                if (gapCell && gapCell.textContent !== gapText) {
                    gapCell.textContent = gapText;
                }

                const timeCell = row.querySelector('.cell-time');
                if (timeCell && timeCell.textContent !== lapTime) {
                    timeCell.textContent = lapTime;
                }
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No telemetry recorded yet. Complete Free Practice & Qualifying to generate grid telemetry.</td>
                </tr>
            `;
        }
    }

    static renderChampionshipStandings(state) {
        const rs = state.raceState;
        this.updateText('standings-season-lbl', `Season ${state.season} Official Standings`);

        const tbody = document.getElementById('championship-standings-body');
        if (!tbody) return;

        if (rs.championshipStandings && rs.championshipStandings.length > 0) {
            const emptyState = tbody.querySelector('.empty-state');
            if (emptyState) tbody.innerHTML = '';

            rs.championshipStandings.forEach((r, idx) => {
                const rank = idx + 1;
                const rankBadge = rank === 1 ? '🥇 P1' : (rank === 2 ? '🥈 P2' : (rank === 3 ? '🥉 P3' : `P${rank}`));

                let row = tbody.querySelector(`[data-standing-name="${CSS.escape(r.name)}"]`);
                if (!row) {
                    row = document.createElement('tr');
                    row.setAttribute('data-standing-name', r.name);
                    row.innerHTML = `
                        <td class="cell-rank" style="font-weight:700;">${rankBadge}</td>
                        <td class="cell-name">${r.isUser ? '⭐ ' : ''}${r.name}</td>
                        <td class="cell-team">${r.team}</td>
                        <td class="cell-pts" style="font-weight:700; color:var(--accent-gold);">${r.points} PTS</td>
                        <td class="cell-wins">${r.wins}</td>
                        <td class="cell-podiums">${r.podiums}</td>
                    `;
                }

                tbody.appendChild(row);

                const targetClass = r.isUser ? 'user-rider' : '';
                if (row.className !== targetClass) row.className = targetClass;

                const rankCell = row.querySelector('.cell-rank');
                if (rankCell && rankCell.textContent !== rankBadge) rankCell.textContent = rankBadge;

                const ptsCell = row.querySelector('.cell-pts');
                if (ptsCell && ptsCell.textContent !== `${r.points} PTS`) ptsCell.textContent = `${r.points} PTS`;

                const winsCell = row.querySelector('.cell-wins');
                if (winsCell && winsCell.textContent !== String(r.wins)) winsCell.textContent = String(r.wins);

                const podCell = row.querySelector('.cell-podiums');
                if (podCell && podCell.textContent !== String(r.podiums)) podCell.textContent = String(r.podiums);
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">No championship points recorded yet. Complete races to earn World Championship points.</td>
                </tr>
            `;
        }
    }

    static renderPitWallIncident(rs) {
        let box = document.getElementById('pit-wall-prompt-box');
        const actionsBox = document.querySelector('.race-actions-box');
        if (!actionsBox) return;

        if (rs.activeIncident) {
            const inc = rs.activeIncident;

            if (!box) {
                box = document.createElement('div');
                box.id = 'pit-wall-prompt-box';
                box.className = 'pit-wall-alert-box';
                actionsBox.appendChild(box);
            }

            const currentIncId = box.getAttribute('data-incident-id');
            if (currentIncId !== inc.id) {
                box.setAttribute('data-incident-id', inc.id);

                let buttonsHtml = '';
                inc.choices.forEach(c => {
                    buttonsHtml += `<button class="btn-primary-large pit-choice-btn" data-action="${c.action}">${c.label}</button>`;
                });

                box.innerHTML = `
                    <div class="alert-header">${inc.title}</div>
                    <div class="alert-desc">${inc.desc}</div>
                    <div class="alert-choices">${buttonsHtml}</div>
                `;

                box.querySelectorAll('.pit-choice-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const action = btn.getAttribute('data-action');
                        RaceSystem.resolveIncidentChoice(action);
                    });
                });
            }

            box.style.display = 'block';
        } else if (box) {
            box.removeAttribute('data-incident-id');
            box.style.display = 'none';
        }
    }
}
