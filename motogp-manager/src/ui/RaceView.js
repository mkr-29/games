import { gameState } from '../engine/GameState.js';
import { RaceSystem, GP_CALENDAR, TIRE_COMPOUNDS } from '../systems/RaceSystem.js';
import { RiderSystem } from '../systems/RiderSystem.js';
import { TrackRadarView } from './TrackRadarView.js';

export class RaceView {
    static initEvents() {
        // Stage Action Button
        document.getElementById('btn-start-race-stage')?.addEventListener('click', (e) => {
            e.preventDefault();
            const state = gameState.getState();
            const rs = state.raceState;

            if (rs.stage === 'FP1' || rs.stage === 'FP') {
                RaceSystem.runFP1();
            } else if (rs.stage === 'PR') {
                RaceSystem.runTimedPractice();
            } else if (rs.stage === 'Q1') {
                RaceSystem.runQ1();
            } else if (rs.stage === 'Q2') {
                RaceSystem.runQ2();
            } else if (rs.stage === 'SPRINT' && !rs.raceInProgress) {
                RaceSystem.startSprintRace();
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

        // Tire Compound Buttons
        document.querySelectorAll('.compound-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.compound-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const compound = btn.getAttribute('data-compound');
                RaceSystem.setTireCompound(compound);
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

        const currentCompound = TIRE_COMPOUNDS[rs.tireCompound] || TIRE_COMPOUNDS.medium;
        const setupStr = rs.setupMatch ? ` | Setup: ${rs.setupMatch}%` : '';
        const weatherIcon = rs.weather === 'wet' ? '🌧️ Wet Track' : '☀️ Dry Track';
        const weatherStr = ` | ${weatherIcon} (${rs.trackTempC || 28}°C)`;
        const tireStr = ` | Tires: ${currentCompound.shortName} (${Math.floor(rs.tireCondition)}% life)`;
        const injuryStr = r.injury ? ` | 🩺 INJURED: ${r.injury.name} (-${r.injury.penalty} skill)` : '';

        this.updateText('gp-track-info', `Length: ${gp.lengthKm} km | Focus: ${gp.type.toUpperCase()}${setupStr}${weatherStr}${tireStr}${injuryStr}`);

        // Update Weather Label above progress bar
        const sessionTag = rs.sessionType === 'SPRINT' ? '⚡ SATURDAY SPRINT' : (rs.stage === 'RACE' ? '🏆 SUNDAY GRAND PRIX' : '⏱️ PRACTICE / QUALIFYING');
        this.updateText('race-weather-lbl', `${sessionTag} • ${weatherIcon} • ${rs.trackTempC || 28}°C`);

        const hasSprint = state.tier >= 3;

        // Stage Steps Active State
        const stepFp = document.getElementById('stage-step-fp');
        if (stepFp) stepFp.className = `stage-step ${(rs.stage === 'FP1' || rs.stage === 'FP') ? 'active' : ''}`;

        const stepPr = document.getElementById('stage-step-pr');
        if (stepPr) stepPr.className = `stage-step ${rs.stage === 'PR' ? 'active' : ''}`;

        const stepQp = document.getElementById('stage-step-qp');
        if (stepQp) stepQp.className = `stage-step ${(rs.stage === 'Q1' || rs.stage === 'Q2') ? 'active' : ''}`;

        const stepSprint = document.getElementById('stage-step-sprint');
        if (stepSprint) {
            stepSprint.style.display = hasSprint ? 'flex' : 'none';
            stepSprint.className = `stage-step ${rs.stage === 'SPRINT' ? 'active' : ''}`;
        }

        const stepRace = document.getElementById('stage-step-race');
        if (stepRace) {
            stepRace.className = `stage-step ${rs.stage === 'RACE' ? 'active' : ''}`;
            const numEl = stepRace.querySelector('.step-num');
            if (numEl) numEl.textContent = hasSprint ? '5' : '4';
        }

        // Stage Action Button Label & Strategy Box visibility
        const btnStage = document.getElementById('btn-start-race-stage');
        const stratBox = document.getElementById('race-strategy-box');
        const badgeReady = document.getElementById('race-ready-badge');

        if (badgeReady) {
            badgeReady.style.display = (rs.stage === 'FP1' || rs.stage === 'FP' || rs.stage === 'PR' || rs.stage === 'Q1' || rs.stage === 'Q2') ? 'inline-block' : 'none';
        }

        if (btnStage) {
            if (rs.stage === 'FP1' || rs.stage === 'FP') {
                btnStage.textContent = "🚀 Run Free Practice 1";
                btnStage.disabled = false;
                if (stratBox) stratBox.style.display = "none";
            } else if (rs.stage === 'PR') {
                btnStage.textContent = "⏱️ Run Timed Practice (Top 10 Direct Q2 Cut)";
                btnStage.disabled = false;
                if (stratBox) stratBox.style.display = "none";
            } else if (rs.stage === 'Q1') {
                btnStage.textContent = "🔥 Run Q1 Shootout (Top 2 to Q2)";
                btnStage.disabled = false;
                if (stratBox) stratBox.style.display = "none";
            } else if (rs.stage === 'Q2') {
                btnStage.textContent = "👑 Run Q2 Pole Position Shootout";
                btnStage.disabled = false;
                if (stratBox) stratBox.style.display = "none";
            } else if (rs.stage === 'SPRINT') {
                if (rs.raceInProgress) {
                    btnStage.textContent = "⚡ Saturday Sprint in Progress...";
                    btnStage.disabled = true;
                } else {
                    const sprintLaps = Math.max(4, Math.floor(gp.laps / 2));
                    btnStage.textContent = `⚡ Start Saturday Sprint (${sprintLaps} Laps | Grid P${rs.qpGridPosition || 1})`;
                    btnStage.disabled = false;
                }
                if (stratBox) stratBox.style.display = "block";
            } else if (rs.stage === 'RACE') {
                if (rs.raceInProgress) {
                    btnStage.textContent = "🏆 Grand Prix in Progress...";
                    btnStage.disabled = true;
                } else {
                    btnStage.textContent = `🏁 Start Sunday Grand Prix (${gp.laps} Laps | Grid P${rs.qpGridPosition || 1})`;
                    btnStage.disabled = false;
                }
                if (stratBox) stratBox.style.display = "block";
            }
        }

        // Keep active strategy and compound buttons synchronized
        document.querySelectorAll('.strat-btn').forEach(btn => {
            const map = btn.getAttribute('data-map');
            if (map === rs.strategy) {
                if (!btn.classList.contains('active')) btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.querySelectorAll('.compound-btn').forEach(btn => {
            const comp = btn.getAttribute('data-compound');
            if (comp === rs.tireCompound) {
                if (!btn.classList.contains('active')) btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Render Fastest Lap Banner
        this.renderFastestLapBanner(rs);

        // Render Official FIM Flag Banner
        this.renderFlagBanner(rs);

        // Render Pit Wall Radio Incident Prompt
        this.renderPitWallIncident(rs);

        // Live Lap Counter & Fill Bar
        const maxLaps = rs.sessionType === 'SPRINT' ? Math.max(4, Math.floor(gp.laps / 2)) : gp.laps;
        this.updateText('race-lap-counter', `Lap ${rs.currentLap} / ${maxLaps}`);
        const fillBar = document.getElementById('race-lap-fill');
        if (fillBar) fillBar.style.width = `${rs.trackProgress}%`;

        const liveDot = document.getElementById('live-indicator');
        if (liveDot) liveDot.style.display = rs.raceInProgress ? 'inline' : 'none';

        // Live 2D Track GPS Radar
        TrackRadarView.render(state);

        // Live Timing Tower Leaderboard Table
        this.renderLiveLeaderboard(rs);

        // Lap Telemetry History Table
        this.renderLapTelemetryHistory(rs);

        // World Championship Standings Table
        this.renderChampionshipStandings(state);
    }

    static renderFastestLapBanner(rs) {
        const banner = document.getElementById('fastest-lap-banner');
        if (!banner) return;

        if (rs.fastestLap && rs.fastestLap.lapTimeSec) {
            banner.style.display = 'flex';
            this.updateText('fastest-lap-info', `${rs.fastestLap.riderName} (${rs.fastestLap.team}) — ${rs.fastestLap.lapTimeStr} on Lap ${rs.fastestLap.lapNum}`);
        } else {
            banner.style.display = 'none';
        }
    }

    static renderFlagBanner(rs) {
        const banner = document.getElementById('fim-flag-banner');
        const icon = document.getElementById('fim-flag-icon');
        const text = document.getElementById('fim-flag-text');
        if (!banner || !icon || !text) return;

        const flag = rs.flagState || { status: 'GREEN', sector: null, reason: 'Track clear' };

        if (flag.status === 'YELLOW') {
            banner.className = 'fim-flag-banner flag-yellow';
            icon.textContent = '🟨';
            text.textContent = `YELLOW FLAG (Sector ${flag.sector || 1}) - CAUTION: ${flag.reason || 'Incident on track'} (No overtaking)`;
        } else if (flag.status === 'RED') {
            banner.className = 'fim-flag-banner flag-red';
            icon.textContent = '🚩';
            text.textContent = `RED FLAG - SESSION SUSPENDED: ${flag.reason || 'Dangerous conditions / Multi-crash'} (Pit lane procedure active)`;
        } else if (flag.status === 'WHITE_CROSS') {
            banner.className = 'fim-flag-banner flag-white-cross';
            icon.textContent = '🏳️';
            text.textContent = `WHITE FLAG (RAIN REPORTED) - ${flag.reason || 'Flag-to-Flag bike swap active'} (Pit open)`;
        } else {
            banner.className = 'fim-flag-banner flag-green';
            icon.textContent = '🟩';
            text.textContent = `TRACK CLEAR (Green Flag - Full Racing Speed)`;
        }
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
                const intText = isDnf ? '-' : (pos === 1 ? '-' : `+${(r.intervalSeconds || 0).toFixed(3)}s`);
                const lastLap = isDnf ? 'CRASH' : (r.lastLapStr || '--:--.---');
                const bestLap = isDnf ? '-' : (r.bestLapStr || '--:--.---');

                const compoundKey = r.tireCompound || 'medium';
                const compDef = TIRE_COMPOUNDS[compoundKey] || TIRE_COMPOUNDS.medium;
                const tirePct = Math.round(r.tireCondition || 100);

                const isFastestLapHolder = rs.fastestLap && rs.fastestLap.riderName === r.name && !isDnf;
                const flBadge = isFastestLapHolder ? '<span class="badge-fl">🟣 FL</span>' : '';
                const favBadge = r.isFavTrack ? '<span class="badge-fav" style="font-size:10px; background:rgba(255,183,0,0.15); color:#ffb700; padding:1px 5px; border-radius:4px; margin-left:4px; border:1px solid rgba(255,183,0,0.3);" title="Favorite Track Boost">⭐ FAV</span>' : '';
                const subBadge = r.isReplacement ? `<span class="badge-sub" style="font-size:10px; background:rgba(0,210,255,0.15); color:#00d2ff; padding:1px 5px; border-radius:4px; margin-left:4px; border:1px solid rgba(0,210,255,0.3);">🔄 SUB</span>` : '';
                const injBadge = r.injury ? `<span class="badge-inj" style="font-size:10px; background:rgba(255,51,75,0.15); color:#ff4d6d; padding:1px 5px; border-radius:4px; margin-left:4px; border:1px solid rgba(255,51,75,0.3);" title="${r.injury.name}">🩺 INJ</span>` : '';

                // Sector split chips
                const sectors = r.lastSectors || [0, 0, 0, 0];
                const sectorColors = r.lastSectorColors || ['yellow', 'yellow', 'yellow', 'yellow'];

                const s1Html = `<span class="sector-chip sector-${sectorColors[0]}">${sectors[0] ? sectors[0].toFixed(2) : '-'}</span>`;
                const s2Html = `<span class="sector-chip sector-${sectorColors[1]}">${sectors[1] ? sectors[1].toFixed(2) : '-'}</span>`;
                const s3Html = `<span class="sector-chip sector-${sectorColors[2]}">${sectors[2] ? sectors[2].toFixed(2) : '-'}</span>`;
                const s4Html = `<span class="sector-chip sector-${sectorColors[3]}">${sectors[3] ? sectors[3].toFixed(2) : '-'}</span>`;

                let row = tbody.querySelector(`[data-rider-name="${CSS.escape(r.name)}"]`);
                if (!row) {
                    row = document.createElement('tr');
                    row.setAttribute('data-rider-name', r.name);
                    row.innerHTML = `
                        <td class="cell-pos">P${pos}</td>
                        <td class="cell-name">${r.isUser ? '⭐ ' : ''}<span class="rider-name-txt">${r.name}</span> <span class="fl-slot"></span><span class="status-slot"></span><small class="team-sub">${r.team}</small></td>
                        <td class="cell-tire"><span class="tire-pill" style="background:${compDef.color};">${compDef.badge}</span> <span class="tire-pct-lbl">${tirePct}%</span></td>
                        <td class="cell-gap">${gapText}</td>
                        <td class="cell-int">${intText}</td>
                        <td class="cell-last-lap">${lastLap}</td>
                        <td class="cell-s1">${s1Html}</td>
                        <td class="cell-s2">${s2Html}</td>
                        <td class="cell-s3">${s3Html}</td>
                        <td class="cell-s4">${s4Html}</td>
                        <td class="cell-best-lap">${bestLap}</td>
                    `;
                }

                tbody.appendChild(row);

                const statusSlot = row.querySelector('.status-slot');
                if (statusSlot) {
                    statusSlot.innerHTML = `${favBadge}${subBadge}${injBadge}`;
                }

                const targetClass = `${r.isUser ? 'user-rider' : ''} ${isDnf ? 'dnf-row' : ''} ${isFastestLapHolder ? 'fastest-lap-row' : ''}`.trim();
                if (row.className !== targetClass) row.className = targetClass;

                const posCell = row.querySelector('.cell-pos');
                if (posCell && posCell.textContent !== (isDnf ? '💥' : `P${pos}`)) {
                    posCell.textContent = isDnf ? '💥' : `P${pos}`;
                }

                const flSlot = row.querySelector('.fl-slot');
                if (flSlot && flSlot.innerHTML !== flBadge) {
                    flSlot.innerHTML = flBadge;
                }

                const tirePill = row.querySelector('.tire-pill');
                if (tirePill && (tirePill.textContent !== compDef.badge || tirePill.style.backgroundColor !== compDef.color)) {
                    tirePill.textContent = compDef.badge;
                    tirePill.style.backgroundColor = compDef.color;
                }

                const tirePctLbl = row.querySelector('.tire-pct-lbl');
                if (tirePctLbl && tirePctLbl.textContent !== `${tirePct}%`) {
                    tirePctLbl.textContent = `${tirePct}%`;
                    if (tirePct < 30) tirePctLbl.style.color = '#ff334b';
                    else if (tirePct < 60) tirePctLbl.style.color = '#ffb700';
                    else tirePctLbl.style.color = '#00e676';
                }

                const gapCell = row.querySelector('.cell-gap');
                if (gapCell && gapCell.textContent !== gapText) gapCell.textContent = gapText;

                const intCell = row.querySelector('.cell-int');
                if (intCell && intCell.textContent !== intText) intCell.textContent = intText;

                const lastLapCell = row.querySelector('.cell-last-lap');
                if (lastLapCell && lastLapCell.textContent !== lastLap) {
                    lastLapCell.textContent = lastLap;
                    if (isFastestLapHolder) lastLapCell.style.color = '#d070ff';
                    else if (r.lastLapSec === r.bestLapSec && !isDnf) lastLapCell.style.color = '#00e676';
                    else lastLapCell.style.color = 'inherit';
                }

                const s1Cell = row.querySelector('.cell-s1');
                if (s1Cell && s1Cell.innerHTML !== s1Html) s1Cell.innerHTML = s1Html;

                const s2Cell = row.querySelector('.cell-s2');
                if (s2Cell && s2Cell.innerHTML !== s2Html) s2Cell.innerHTML = s2Html;

                const s3Cell = row.querySelector('.cell-s3');
                if (s3Cell && s3Cell.innerHTML !== s3Html) s3Cell.innerHTML = s3Html;

                const s4Cell = row.querySelector('.cell-s4');
                if (s4Cell && s4Cell.innerHTML !== s4Html) s4Cell.innerHTML = s4Html;

                const bestLapCell = row.querySelector('.cell-best-lap');
                if (bestLapCell && bestLapCell.textContent !== bestLap) bestLapCell.textContent = bestLap;
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="empty-state">No telemetry recorded yet. Run FP1 & Timed Practice to generate grid data.</td>
                </tr>
            `;
        }
    }

    static renderLapTelemetryHistory(rs) {
        const tbody = document.getElementById('telemetry-body');
        const countLbl = document.getElementById('telemetry-lap-count');
        if (!tbody) return;

        if (countLbl) {
            countLbl.textContent = `${rs.lapHistory ? rs.lapHistory.length : 0} Laps Recorded`;
        }

        if (rs.lapHistory && rs.lapHistory.length > 0) {
            const emptyState = tbody.querySelector('.empty-state');
            if (emptyState) tbody.innerHTML = '';

            rs.lapHistory.forEach(h => {
                let row = tbody.querySelector(`[data-lap-num="${h.lap}"]`);
                const s1Html = `<span class="sector-chip sector-${h.sectorColors[0]}">${h.sectors[0]}</span>`;
                const s2Html = `<span class="sector-chip sector-${h.sectorColors[1]}">${h.sectors[1]}</span>`;
                const s3Html = `<span class="sector-chip sector-${h.sectorColors[2]}">${h.sectors[2]}</span>`;
                const s4Html = `<span class="sector-chip sector-${h.sectorColors[3]}">${h.sectors[3]}</span>`;

                const isFl = h.eventNote && h.eventNote.includes('FASTEST LAP');
                const isPb = h.eventNote && h.eventNote.includes('Personal Best');

                let noteTag = h.eventNote || '-';
                if (isFl) noteTag = `<span class="badge-fl">🟣 FASTEST LAP</span>`;
                else if (isPb) noteTag = `<span class="badge-pb">🟢 PERSONAL BEST</span>`;
                else if (h.eventNote && h.eventNote.includes('Wide')) noteTag = `<span class="badge-err">⚠️ ${h.eventNote}</span>`;
                else if (h.eventNote && h.eventNote.includes('slide')) noteTag = `<span class="badge-warn">⚠️ ${h.eventNote}</span>`;

                if (!row) {
                    row = document.createElement('tr');
                    row.setAttribute('data-lap-num', h.lap);
                    row.innerHTML = `
                        <td class="cell-lap-num" style="font-weight:700;">L${h.lap}</td>
                        <td class="cell-lap-time" style="font-weight:700; ${isFl ? 'color:#d070ff;' : (isPb ? 'color:#00e676;' : '')}">${h.lapTimeStr}</td>
                        <td>${s1Html}</td>
                        <td>${s2Html}</td>
                        <td>${s3Html}</td>
                        <td>${s4Html}</td>
                        <td><span class="tire-pct-lbl">${h.tireCondition}% (${h.compound})</span></td>
                        <td><span class="map-tag">${h.strategy}</span></td>
                        <td>${noteTag}</td>
                    `;
                    tbody.appendChild(row);
                }
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">Telemetry will record automatically as laps are completed.</td>
                </tr>
            `;
        }
    }

    static renderChampionshipStandings(state) {
        const rs = state.raceState;
        this.updateText('standings-season-lbl', `Season ${state.season} Official Standings`);

        const tbody = document.getElementById('championship-standings-body');
        if (!tbody) return;

        const paddock = RiderSystem.getPaddockState();

        if (rs.championshipStandings && rs.championshipStandings.length > 0) {
            const emptyState = tbody.querySelector('.empty-state');
            if (emptyState) tbody.innerHTML = '';

            rs.championshipStandings.forEach((r, idx) => {
                const rank = idx + 1;
                const rankBadge = rank === 1 ? '🥇 P1' : (rank === 2 ? '🥈 P2' : (rank === 3 ? '🥉 P3' : `P${rank}`));

                const pRider = paddock.riders[r.id];
                let statusBadge = '';
                if (pRider && pRider.injury) {
                    if (pRider.injury.severity === 'sidelined') {
                        statusBadge = ` <span style="font-size:10px; padding:1px 5px; border-radius:4px; background:rgba(255,51,75,0.18); color:#ff4d6d; border:1px solid rgba(255,51,75,0.4);" title="${pRider.injury.desc}">🏥 OUT (${pRider.injury.racesRemaining} GP)</span>`;
                    } else {
                        statusBadge = ` <span style="font-size:10px; padding:1px 5px; border-radius:4px; background:rgba(255,183,0,0.18); color:#ffb700; border:1px solid rgba(255,183,0,0.4);" title="${pRider.injury.desc}">🩺 ${pRider.injury.name}</span>`;
                    }
                } else if (r.isUser && state.rider.injury) {
                    statusBadge = ` <span style="font-size:10px; padding:1px 5px; border-radius:4px; background:rgba(255,183,0,0.18); color:#ffb700; border:1px solid rgba(255,183,0,0.4);">🩺 ${state.rider.injury.name}</span>`;
                }

                let row = tbody.querySelector(`[data-standing-name="${CSS.escape(r.name)}"]`);
                if (!row) {
                    row = document.createElement('tr');
                    row.setAttribute('data-standing-name', r.name);
                    row.innerHTML = `
                        <td class="cell-rank" style="font-weight:700;">${rankBadge}</td>
                        <td class="cell-name">${r.isUser ? '⭐ ' : ''}<span class="standing-rider-name">${r.name}</span> <span class="standing-status-slot"></span></td>
                        <td class="cell-team">${r.team}</td>
                        <td class="cell-pts" style="font-weight:700; color:var(--accent-gold);">${r.points} PTS</td>
                        <td class="cell-wins">${r.wins}</td>
                        <td class="cell-sprints">${r.sprintWins || 0}</td>
                        <td class="cell-podiums">${r.podiums}</td>
                        <td class="cell-fls">${r.fastestLaps || 0}</td>
                    `;
                }

                tbody.appendChild(row);

                const statusSlot = row.querySelector('.standing-status-slot');
                if (statusSlot && statusSlot.innerHTML !== statusBadge) {
                    statusSlot.innerHTML = statusBadge;
                }

                const targetClass = r.isUser ? 'user-rider' : '';
                if (row.className !== targetClass) row.className = targetClass;

                const rankCell = row.querySelector('.cell-rank');
                if (rankCell && rankCell.textContent !== rankBadge) rankCell.textContent = rankBadge;

                const ptsCell = row.querySelector('.cell-pts');
                if (ptsCell && ptsCell.textContent !== `${r.points} PTS`) ptsCell.textContent = `${r.points} PTS`;

                const winsCell = row.querySelector('.cell-wins');
                if (winsCell && winsCell.textContent !== String(r.wins)) winsCell.textContent = String(r.wins);

                const sprintsCell = row.querySelector('.cell-sprints');
                if (sprintsCell && sprintsCell.textContent !== String(r.sprintWins || 0)) sprintsCell.textContent = String(r.sprintWins || 0);

                const podCell = row.querySelector('.cell-podiums');
                if (podCell && podCell.textContent !== String(r.podiums)) podCell.textContent = String(r.podiums);

                const flCell = row.querySelector('.cell-fls');
                if (flCell && flCell.textContent !== String(r.fastestLaps || 0)) flCell.textContent = String(r.fastestLaps || 0);
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">No championship points recorded yet. Complete races to earn World Championship points.</td>
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
