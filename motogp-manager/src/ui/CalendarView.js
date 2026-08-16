import { gameState } from '../engine/GameState.js';
import { CalendarSystem } from '../systems/CalendarSystem.js';
import { RaceSystem } from '../systems/RaceSystem.js';
import { UIComponents } from './Components.js';
import { PreSeasonTestView } from './PreSeasonTestView.js';
import { LongRunSimView } from './LongRunSimView.js';
import { isDev } from '../config/env.js';

export class CalendarView {
    static isDrawerOpen = false;

    static initEvents() {
        // Top-Right Header Next Week Button
        const headerBtn = document.getElementById('btn-header-proceed-week');
        if (headerBtn) {
            headerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleHeaderNextWeekClick();
            });
        }

        // [DEV] Header Prev Week Button
        document.getElementById('btn-header-prev-week')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRewindWeek();
        });

        // Drawer Backdrop click to close
        document.getElementById('dock-backdrop')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleDrawer(false);
        });

        // Drawer Close Button
        document.getElementById('btn-close-cal-drawer')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleDrawer(false);
        });

        // Bottom Drawer Proceed Button
        document.getElementById('btn-drawer-proceed-week')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleProceedWeek();
        });

        // [DEV] Drawer Prev Week Button
        document.getElementById('btn-drawer-prev-week')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRewindWeek();
        });

        // Main Tab Proceed Button (if in calendar pane)
        document.getElementById('btn-proceed-week')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleProceedWeek();
        });

        // [DEV] Calendar Tab Prev Week Button
        document.getElementById('btn-cal-prev-week')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleRewindWeek();
        });
    }

    static handleRewindWeek() {
        if (!isDev()) return;
        if (CalendarSystem.rewindToPreviousWeek()) {
            UIComponents.forceRender(true);
            this.render(gameState.getState(), true);
        }
    }

    static toggleDrawer(open = null) {
        if (open === null) {
            this.isDrawerOpen = !this.isDrawerOpen;
        } else {
            this.isDrawerOpen = open;
        }

        const drawer = document.getElementById('calendar-bottom-dock');
        if (drawer) {
            if (this.isDrawerOpen) {
                drawer.classList.add('drawer-open');
                this.render(gameState.getState(), true);
            } else {
                drawer.classList.remove('drawer-open');
            }
        }
    }

    static handleHeaderNextWeekClick() {
        const check = CalendarSystem.canProceedToNextWeek();
        if (check.canProceed) {
            // All mandatory activities completed! Advance week immediately
            if (CalendarSystem.proceedToNextWeek()) {
                this.toggleDrawer(false);
                UIComponents.forceRender(true);
                this.render(gameState.getState(), true);
            }
        } else {
            // Open the sequential Day-by-Day bottom drawer so player can complete the nearest day
            this.toggleDrawer(true);
        }
    }

    static handleProceedWeek() {
        const check = CalendarSystem.canProceedToNextWeek();
        if (!check.canProceed) {
            alert(`⚠️ Cannot proceed to next week yet!\n\nYou must first complete mandatory activity:\n"${check.missingActivity.title}".`);
            return;
        }

        if (CalendarSystem.proceedToNextWeek()) {
            this.toggleDrawer(false);
            UIComponents.forceRender(true);
            this.render(gameState.getState(), true);
        }
    }

    static updateText(id, text) {
        const el = document.getElementById(id);
        if (el && el.textContent !== String(text)) {
            el.textContent = String(text);
        }
    }

    static render(state, forceRebuild = false) {
        const cal = CalendarSystem.getCalendarState();
        const currentWeek = CalendarSystem.getCurrentWeek();
        if (!currentWeek) return;

        const check = CalendarSystem.canProceedToNextWeek();

        // 1. Update Top-Right Header Bar Button
        const headerBtn = document.getElementById('btn-header-proceed-week');
        if (headerBtn) {
            const btnText = check.canProceed ? `📅 Proceed to Next Week ⏩` : `📅 W${currentWeek.weekNumber}: Open Agenda (${currentWeek.flag || '🏁'})`;
            if (headerBtn.textContent !== btnText) headerBtn.textContent = btnText;
            const targetClass = check.canProceed ? 'btn-nav-proceed ready-pulse' : 'btn-nav-proceed';
            if (headerBtn.className !== targetClass) headerBtn.className = targetClass;
        }

        this.updateText('header-cal-week', `Week ${currentWeek.weekNumber}: ${currentWeek.title}`);
        this.updateText('header-cal-dates', currentWeek.dateRange);

        // 2. Render Drawer / Pane Headers
        this.updateText('drawer-week-lbl', `Week ${currentWeek.weekNumber} of ${cal.seasonWeeks.length} • Season ${state.season}`);
        this.updateText('drawer-week-title', `${currentWeek.flag || '📅'} ${currentWeek.title}`);
        this.updateText('drawer-week-dates', `🗓️ ${currentWeek.dateRange}`);
        this.updateText('drawer-week-desc', currentWeek.desc || '');

        this.updateText('cal-current-week-lbl', `Week ${currentWeek.weekNumber} of ${cal.seasonWeeks.length} • Season ${state.season}`);
        this.updateText('cal-current-title', `${currentWeek.flag || '📅'} ${currentWeek.title}`);
        this.updateText('cal-current-dates', `🗓️ ${currentWeek.dateRange}`);
        this.updateText('cal-current-desc', currentWeek.desc || '');

        // 3. Render Sequential Day-by-Day Days Row (both in bottom drawer and calendar tab)
        const daysGrouped = CalendarSystem.getWeekDaysGrouped();

        this.renderDaysRow('drawer-days-row', daysGrouped, cal, state, forceRebuild);
        this.renderDaysRow('cal-activities-list', daysGrouped, cal, state, forceRebuild);

        // 4. Update Status Box in Drawer & Pane
        const statusMsg = check.canProceed
            ? `<span style="color:var(--accent-green); font-weight:700;">✓ All mandatory activities completed! Click Proceed to Next Week.</span>`
            : `<span style="color:#ffb700; font-weight:600;">⏳ Nearest day locked activities must be attended or skipped before advancing.</span>`;

        const drawerStatusEl = document.getElementById('drawer-proceed-status');
        if (drawerStatusEl && drawerStatusEl.innerHTML !== statusMsg) {
            drawerStatusEl.innerHTML = statusMsg;
        }

        const paneStatusEl = document.getElementById('cal-proceed-status');
        if (paneStatusEl && paneStatusEl.innerHTML !== statusMsg) {
            paneStatusEl.innerHTML = statusMsg;
        }

        const drawerProceedBtn = document.getElementById('btn-drawer-proceed-week');
        if (drawerProceedBtn) {
            if (drawerProceedBtn.disabled !== !check.canProceed) drawerProceedBtn.disabled = !check.canProceed;
            const targetOpacity = check.canProceed ? '1' : '0.5';
            if (drawerProceedBtn.style.opacity !== targetOpacity) drawerProceedBtn.style.opacity = targetOpacity;
        }

        const paneProceedBtn = document.getElementById('btn-proceed-week');
        if (paneProceedBtn) {
            if (paneProceedBtn.disabled !== !check.canProceed) paneProceedBtn.disabled = !check.canProceed;
            const targetOpacity = check.canProceed ? '1' : '0.5';
            if (paneProceedBtn.style.opacity !== targetOpacity) paneProceedBtn.style.opacity = targetOpacity;
        }

        // 4b. Update [DEV] Rewind Buttons
        const devMode = isDev();
        const canRewind = devMode && cal.currentWeekIndex > 0;

        const headerPrevBtn = document.getElementById('btn-header-prev-week');
        if (headerPrevBtn) {
            headerPrevBtn.style.display = devMode ? 'inline-flex' : 'none';
            headerPrevBtn.disabled = !canRewind;
            headerPrevBtn.style.opacity = canRewind ? '1' : '0.4';
        }

        const drawerPrevBtn = document.getElementById('btn-drawer-prev-week');
        if (drawerPrevBtn) {
            drawerPrevBtn.style.display = devMode ? 'inline-flex' : 'none';
            drawerPrevBtn.disabled = !canRewind;
            drawerPrevBtn.style.opacity = canRewind ? '1' : '0.4';
        }

        const panePrevBtn = document.getElementById('btn-cal-prev-week');
        if (panePrevBtn) {
            panePrevBtn.style.display = devMode ? 'inline-flex' : 'none';
            panePrevBtn.disabled = !canRewind;
            panePrevBtn.style.opacity = canRewind ? '1' : '0.4';
        }

        // 5. Render Season Timeline
        const timelineContainer = document.getElementById('cal-season-timeline');
        if (timelineContainer) {
            if (forceRebuild) timelineContainer.innerHTML = '';

            cal.seasonWeeks.forEach((w, idx) => {
                const isCurrent = idx === cal.currentWeekIndex;
                const isPassed = idx < cal.currentWeekIndex;
                const statusBadge = isCurrent ? '📍 CURRENT' : (isPassed ? '✓ PASSED' : '🔒 UPCOMING');
                const statusClass = isCurrent ? 'timeline-current' : (isPassed ? 'timeline-passed' : 'timeline-upcoming');

                let card = timelineContainer.querySelector(`[data-week-index="${idx}"]`);
                if (!card) {
                    card = document.createElement('div');
                    card.setAttribute('data-week-index', idx);
                    card.className = `timeline-card ${statusClass}`;
                    card.innerHTML = `
                        <div class="timeline-top">
                            <span class="timeline-week-lbl">W${w.weekNumber}</span>
                            <span class="timeline-status-pill">${statusBadge}</span>
                        </div>
                        <div class="timeline-title">${w.flag || '🏁'} ${w.title}</div>
                        <div class="timeline-dates">${w.dateRange}</div>
                    `;
                    timelineContainer.appendChild(card);
                } else {
                    if (card.className !== `timeline-card ${statusClass}`) {
                        card.className = `timeline-card ${statusClass}`;
                    }
                    const statusEl = card.querySelector('.timeline-status-pill');
                    if (statusEl && statusEl.textContent !== statusBadge) {
                        statusEl.textContent = statusBadge;
                    }
                }
            });
        }
    }

    /**
     * Renders sequential days with day cards and activity items (Flicker-free surgical DOM updates)
     */
    static renderDaysRow(containerId, daysGrouped, cal, state, forceRebuild) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (forceRebuild) container.innerHTML = '';

        const completedMap = cal.completedActivities || {};

        daysGrouped.forEach(dayObj => {
            let dayCard = container.querySelector(`[data-day-name="${dayObj.dayName}"]`);
            if (!dayCard) {
                dayCard = document.createElement('div');
                dayCard.setAttribute('data-day-name', dayObj.dayName);
                dayCard.className = 'day-column-card';

                dayCard.innerHTML = `
                    <div class="day-card-header">
                        <span class="day-card-name">${dayObj.dayName}</span>
                        <span class="day-status-pill"></span>
                    </div>
                    <div class="day-activities-container"></div>
                `;

                container.appendChild(dayCard);
            }

            // Update day card status class & pill
            const statusBadgeText = dayObj.status === 'completed' ? '🟢 DONE' : (dayObj.status === 'active' ? '📍 ACTIVE' : '🔒 LOCKED');
            const statusClass = `day-column-card day-${dayObj.status}`;
            if (dayCard.className !== statusClass) dayCard.className = statusClass;

            const dayPill = dayCard.querySelector('.day-status-pill');
            if (dayPill && dayPill.textContent !== statusBadgeText) dayPill.textContent = statusBadgeText;

            // Render activities inside this day
            const actContainer = dayCard.querySelector('.day-activities-container');
            if (!actContainer) return;

            dayObj.activities.forEach(act => {
                const status = completedMap[act.id] || 'pending';
                const isCompleted = status === 'completed';
                const isSkipped = status === 'skipped';
                const isDayActive = dayObj.status === 'active';

                let rewardText = [];
                if (act.reward) {
                    if (act.reward.cash) rewardText.push(`+$${act.reward.cash}`);
                    if (act.reward.telemetry) rewardText.push(`+${act.reward.telemetry} Tel`);
                    if (act.reward.science) rewardText.push(`+${act.reward.science} RP`);
                    if (act.reward.parts) rewardText.push(`+${act.reward.parts} Parts`);
                    if (act.reward.hype) rewardText.push(`+${act.reward.hype} Rep`);
                }

                let actEl = actContainer.querySelector(`[data-act-id="${act.id}"]`);
                if (!actEl) {
                    actEl = document.createElement('div');
                    actEl.setAttribute('data-act-id', act.id);
                    actEl.className = 'day-act-item';

                    actEl.innerHTML = `
                        <div class="day-act-top">
                            <span class="activity-req-pill ${act.required ? 'req-mandatory' : 'req-optional'}">${act.required ? '🔴 REQ' : '🟡 OPT'}</span>
                            <span class="day-act-title">${act.title}</span>
                        </div>
                        <div class="day-act-desc">${act.desc || ''}</div>
                        <div class="day-act-rewards">${rewardText.length > 0 ? `🎁 ${rewardText.join(', ')}` : ''}</div>
                        <div class="day-act-btn-row" data-btn-state="init"></div>
                    `;

                    actContainer.appendChild(actEl);
                }

                const itemClass = `day-act-item ${isCompleted ? 'act-done' : ''} ${isSkipped ? 'act-skipped' : ''} ${act.required ? 'is-req' : ''}`;
                if (actEl.className !== itemClass) actEl.className = itemClass;

                const btnRow = actEl.querySelector('.day-act-btn-row');
                if (btnRow) {
                    let targetState = 'active_pending';
                    if (isCompleted) targetState = 'completed';
                    else if (isSkipped) targetState = 'skipped';
                    else if (!isDayActive) targetState = 'locked';

                    // CRITICAL: Only modify innerHTML when the state actually transitions!
                    if (btnRow.getAttribute('data-btn-state') !== targetState) {
                        btnRow.setAttribute('data-btn-state', targetState);
                        btnRow.innerHTML = '';

                        if (targetState === 'completed') {
                            if (act.actionType === 'preseason_test' || act.id === 'w1_test_main') {
                                btnRow.innerHTML = `<button class="btn-buy" style="padding:4px 8px; font-size:0.72rem; background:rgba(0,230,118,0.15); color:var(--accent-green); border:1px solid var(--accent-green); cursor:pointer;">✓ ATTENDED (View Data)</button>`;
                                btnRow.querySelector('button')?.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    CalendarView.toggleDrawer(false);
                                    PreSeasonTestView.open();
                                });
                            } else if (act.actionType === 'long_run_sim' || act.id === 'w1_long_run') {
                                btnRow.innerHTML = `<button class="btn-buy" style="padding:4px 8px; font-size:0.72rem; background:rgba(0,230,118,0.15); color:var(--accent-green); border:1px solid var(--accent-green); cursor:pointer;">✓ ATTENDED (View Debrief)</button>`;
                                btnRow.querySelector('button')?.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    CalendarView.toggleDrawer(false);
                                    LongRunSimView.open();
                                });
                            } else {
                                btnRow.innerHTML = `<span class="sub-tag unlocked-tag" style="color:var(--accent-green); font-weight:700;">✓ ATTENDED</span>`;
                            }
                        } else if (targetState === 'skipped') {
                            btnRow.innerHTML = `<span class="sub-tag" style="color:var(--text-muted);">⏭️ SKIPPED</span>`;
                        } else if (targetState === 'locked') {
                            btnRow.innerHTML = `<span class="sub-tag locked-tag" style="opacity:0.6;">🔒 Complete Earlier Days</span>`;
                        } else {
                            // Active and pending! Create buttons once and attach click listeners
                            const isTestMain = act.actionType === 'preseason_test' || act.id === 'w1_test_main';
                            const isLongRun = act.actionType === 'long_run_sim' || act.id === 'w1_long_run';

                            const attendBtn = document.createElement('button');
                            attendBtn.className = act.required ? 'btn-race-primary' : 'btn-buy';
                            attendBtn.style.padding = '5px 10px';
                            attendBtn.style.fontSize = '0.75rem';
                            attendBtn.textContent = (isTestMain || isLongRun || act.actionType) ? '🏁 Attend / Launch' : '⚡ Attend Activity';

                            attendBtn.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (isTestMain) {
                                    CalendarView.toggleDrawer(false);
                                    PreSeasonTestView.open();
                                } else if (isLongRun) {
                                    CalendarView.toggleDrawer(false);
                                    LongRunSimView.open();
                                } else if (act.actionType) {
                                    CalendarView.toggleDrawer(false);
                                    const raceTabBtn = document.getElementById('tab-btn-race');
                                    if (raceTabBtn) raceTabBtn.click();
                                } else {
                                    CalendarSystem.attendActivity(act.id);
                                    UIComponents.forceRender(true);
                                    CalendarView.render(gameState.getState(), true);
                                }
                            });
                            btnRow.appendChild(attendBtn);

                            if (!act.required) {
                                const skipBtn = document.createElement('button');
                                skipBtn.className = 'btn-buy';
                                skipBtn.style.padding = '5px 8px';
                                skipBtn.style.fontSize = '0.72rem';
                                skipBtn.style.background = 'rgba(255,255,255,0.06)';
                                skipBtn.style.color = 'var(--text-muted)';
                                skipBtn.textContent = 'Skip';
                                skipBtn.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    CalendarSystem.skipActivity(act.id);
                                    UIComponents.forceRender(true);
                                    CalendarView.render(gameState.getState(), true);
                                });
                                btnRow.appendChild(skipBtn);
                            }
                        }
                    }
                }
            });
        });
    }
}
