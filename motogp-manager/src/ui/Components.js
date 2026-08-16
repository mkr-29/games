// Components.js - Flicker-free DOM rendering & interaction logic

import { gameState } from '../engine/GameState.js';
import { EconomySystem, PRODUCERS } from '../systems/EconomySystem.js';
import { ResearchSystem, TECH_NODES } from '../systems/ResearchSystem.js';
import { BikeSystem } from '../systems/BikeSystem.js';
import { StaffSystem, CREW_TYPES } from '../systems/StaffSystem.js';
import { PrestigeSystem, HERITAGE_PERKS } from '../systems/PrestigeSystem.js';
import { PromotionSystem, TIERS } from '../systems/PromotionSystem.js';

export class UIComponents {
    static activeTechCategory = 'all';

    static initEvents() {
        // Manual Action Click Handlers
        document.getElementById('btn-click-telemetry')?.addEventListener('click', (e) => {
            e.preventDefault();
            EconomySystem.manualClick('telemetry');
            this.forceRender();
        });

        document.getElementById('btn-click-parts')?.addEventListener('click', (e) => {
            e.preventDefault();
            EconomySystem.manualClick('parts');
            this.forceRender();
        });

        document.getElementById('btn-click-sponsor')?.addEventListener('click', (e) => {
            e.preventDefault();
            EconomySystem.manualClick('sponsor');
            this.forceRender();
        });

        // R&D Category Filters
        document.querySelectorAll('.rnd-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.rnd-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTechCategory = btn.getAttribute('data-cat');
                this.renderTechTree(gameState.getState(), true);
            });
        });

        // Prestige Rebirth Button
        document.getElementById('btn-trigger-prestige')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to perform a Legacy Rebirth? Your cash, basic tech, and staff will reset in exchange for Heritage Tokens!")) {
                PrestigeSystem.performPrestige();
                this.forceRender(true);
            }
        });
    }

    static forceRender(fullRebuild = false) {
        const state = gameState.getState();
        const rates = EconomySystem.getRates();
        this.render(state, rates, fullRebuild);
    }

    static render(state, rates, forceRebuild = false) {
        // 1. Header Resource Counters (Text updates only)
        this.updateText('current-tier-name', state.tierName);
        this.updateText('val-cash', `$${Math.floor(state.cash).toLocaleString()}`);
        this.updateText('rate-cash', `+$${rates.cashRate.toFixed(1)}/s`);

        this.updateText('val-telemetry', `${Math.floor(state.telemetry)} / ${state.telemetryMax}`);
        this.updateText('rate-telemetry', `+${rates.telemetryRate.toFixed(1)}/s`);

        this.updateText('val-science', `${Math.floor(state.science)} / ${state.scienceMax}`);
        this.updateText('rate-science', `+${rates.scienceRate.toFixed(1)}/s`);

        this.updateText('val-parts', `${Math.floor(state.parts)} / ${state.partsMax}`);
        this.updateText('rate-parts', `+${rates.partsRate.toFixed(1)}/s`);

        this.updateText('val-hype', `${state.hype} Rep`);
        this.updateText('val-heritage', `${state.heritageTokens} HT`);

        // Manual button values
        this.updateText('click-telemetry-amount', state.clickTelemetryAmount);
        this.updateText('click-parts-amount', state.clickPartsAmount);
        this.updateText('click-sponsor-amount', state.clickSponsorAmount);

        // 2. Bike Overview Stats
        const bikeStats = BikeSystem.getBikeStats();
        this.updateText('bike-model-name', `${state.bike.modelName} (Rating: ${bikeStats.overallRating})`);
        this.updateText('bike-hp', `${bikeStats.hp} HP (${bikeStats.topSpeedKmh} km/h)`);
        this.updateText('bike-aero', `${bikeStats.aero} pts`);
        this.updateText('bike-chassis', `${bikeStats.chassis} pts`);
        this.updateText('bike-ecu', `${bikeStats.ecu} pts`);

        this.updateWidth('bar-hp', Math.min(100, (bikeStats.hp / 240) * 100));
        this.updateWidth('bar-aero', Math.min(100, (bikeStats.aero / 100) * 100));
        this.updateWidth('bar-chassis', Math.min(100, (bikeStats.chassis / 100) * 100));
        this.updateWidth('bar-ecu', Math.min(100, (bikeStats.ecu / 100) * 100));

        // 3. Dynamic Lists (In-Place DOM update)
        this.renderProducers(state, forceRebuild);
        this.renderPromotionHub(state);
        this.renderTechTree(state, forceRebuild);
        this.renderStaff(state, forceRebuild);
        this.renderHeritage(state, forceRebuild);

        // 4. Update Live Feed Footer
        if (state.logs.length > 0) {
            this.updateText('paddock-feed-text', state.logs[0]);
        }
    }

    static updateText(id, val) {
        const el = document.getElementById(id);
        if (el && el.textContent !== String(val)) {
            el.textContent = val;
        }
    }

    static updateWidth(id, pct) {
        const el = document.getElementById(id);
        if (el) {
            const newW = `${pct}%`;
            if (el.style.width !== newW) {
                el.style.width = newW;
            }
        }
    }

    static renderProducers(state, forceRebuild = false) {
        const container = document.getElementById('producers-list');
        if (!container) return;

        if (forceRebuild) container.innerHTML = '';

        PRODUCERS.forEach(prod => {
            if (state.tier < prod.unlockedAtTier) {
                const existing = container.querySelector(`[data-producer-id="${prod.id}"]`);
                if (existing) existing.remove();
                return;
            }

            const count = state.producers[prod.id] || 0;
            const cost = EconomySystem.getProducerCost(prod.id);

            let costString = [];
            if (cost.cash) costString.push(`$${cost.cash}`);
            if (cost.telemetry) costString.push(`${cost.telemetry} Tel`);
            if (cost.science) costString.push(`${cost.science} RP`);
            if (cost.parts) costString.push(`${cost.parts} Parts`);

            const canAfford = (!cost.cash || state.cash >= cost.cash) &&
                              (!cost.telemetry || state.telemetry >= cost.telemetry) &&
                              (!cost.science || state.science >= cost.science) &&
                              (!cost.parts || state.parts >= cost.parts);

            let card = container.querySelector(`[data-producer-id="${prod.id}"]`);
            if (!card) {
                card = document.createElement('div');
                card.className = 'producer-card';
                card.setAttribute('data-producer-id', prod.id);

                card.innerHTML = `
                    <div class="prod-details">
                        <div class="prod-title">
                            <span>${prod.icon} ${prod.name}</span>
                            <span class="prod-count">x${count}</span>
                        </div>
                        <div class="prod-desc">${prod.desc}</div>
                    </div>
                    <button class="btn-buy" data-prod="${prod.id}">
                        Buy (${costString.join(', ')})
                    </button>
                `;

                const btn = card.querySelector('.btn-buy');
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (EconomySystem.buyProducer(prod.id)) {
                        this.forceRender();
                    }
                });

                container.appendChild(card);
            } else {
                const countEl = card.querySelector('.prod-count');
                if (countEl && countEl.textContent !== `x${count}`) countEl.textContent = `x${count}`;

                const btn = card.querySelector('.btn-buy');
                if (btn) {
                    const btnText = `Buy (${costString.join(', ')})`;
                    if (btn.textContent.trim() !== btnText) btn.textContent = btnText;
                    btn.disabled = !canAfford;
                }
            }
        });
    }

    static renderTechTree(state, forceRebuild = false) {
        const container = document.getElementById('tech-grid');
        if (!container) return;

        if (forceRebuild) container.innerHTML = '';

        TECH_NODES.forEach(tech => {
            if (this.activeTechCategory !== 'all' && tech.category !== this.activeTechCategory) {
                const existing = container.querySelector(`[data-tech-id="${tech.id}"]`);
                if (existing) existing.remove();
                return;
            }

            if (state.tier < tech.unlockedAtTier) {
                const existing = container.querySelector(`[data-tech-id="${tech.id}"]`);
                if (existing) existing.remove();
                return;
            }

            const isUnlocked = state.unlockedTech.includes(tech.id);
            const isAvailable = ResearchSystem.isTechAvailable(tech.id);
            const canAfford = ResearchSystem.canAfford(tech.id);

            let costText = [];
            if (tech.cost.science) costText.push(`${tech.cost.science} RP`);
            if (tech.cost.parts) costText.push(`${tech.cost.parts} Parts`);
            if (tech.cost.cash) costText.push(`$${tech.cost.cash}`);
            if (tech.cost.telemetry) costText.push(`${tech.cost.telemetry} Tel`);

            let card = container.querySelector(`[data-tech-id="${tech.id}"]`);
            if (!card) {
                card = document.createElement('div');
                card.className = `tech-card ${isUnlocked ? 'unlocked' : ''}`;
                card.setAttribute('data-tech-id', tech.id);

                card.innerHTML = `
                    <div>
                        <div class="tech-title">${tech.icon} ${tech.name}</div>
                        <div class="tech-desc">${tech.desc}</div>
                    </div>
                    <div class="tech-footer">
                        <div class="tech-cost">Cost: ${costText.join(' + ')}</div>
                        <div class="tech-action"></div>
                    </div>
                `;

                container.appendChild(card);
            }

            if (isUnlocked && !card.classList.contains('unlocked')) {
                card.classList.add('unlocked');
            }

            const actionBox = card.querySelector('.tech-action');
            if (actionBox) {
                if (isUnlocked) {
                    if (!actionBox.querySelector('.unlocked-tag')) {
                        actionBox.innerHTML = `<span class="sub-tag unlocked-tag" style="color:var(--accent-green);">✓ UNLOCKED</span>`;
                    }
                } else {
                    let btn = actionBox.querySelector('.btn-buy');
                    if (!btn) {
                        btn = document.createElement('button');
                        btn.className = 'btn-buy';
                        btn.setAttribute('data-tech', tech.id);
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            if (ResearchSystem.unlockTech(tech.id)) {
                                this.forceRender();
                            }
                        });
                        actionBox.innerHTML = '';
                        actionBox.appendChild(btn);
                    }
                    btn.textContent = isAvailable ? 'Unlock Tech' : 'Locked (Prereqs)';
                    btn.disabled = !(isAvailable && canAfford);
                }
            }
        });
    }

    static renderStaff(state, forceRebuild = false) {
        // Rider Skills
        const riderContainer = document.getElementById('rider-skills-list');
        if (riderContainer) {
            if (forceRebuild) riderContainer.innerHTML = '';

            const r = state.rider;
            this.updateText('rider-name', r.name);
            this.updateText('rider-rating', `Overall Skill: ${r.overallSkill}`);

            const skills = [
                { id: 'cornering', name: 'Cornering Technique', val: r.cornering, lvl: r.corneringLvl },
                { id: 'braking', name: 'Trail Braking', val: r.braking, lvl: r.brakingLvl },
                { id: 'consistency', name: 'Race Consistency', val: r.consistency, lvl: r.consistencyLvl },
                { id: 'wetSkill', name: 'Wet Track Mastery', val: r.wetSkill, lvl: r.wetLvl }
            ];

            skills.forEach(s => {
                const cost = StaffSystem.getRiderSkillCost(s.id);
                const canAfford = state.cash >= cost.cash;

                let card = riderContainer.querySelector(`[data-skill-id="${s.id}"]`);
                if (!card) {
                    card = document.createElement('div');
                    card.className = 'producer-card';
                    card.setAttribute('data-skill-id', s.id);

                    card.innerHTML = `
                        <div class="prod-details">
                            <div class="prod-title">
                                <span class="skill-label">${s.name} (Lvl ${s.lvl})</span>
                                <span class="skill-val" style="color:var(--accent-cyan); font-weight:700;">${s.val} pts</span>
                            </div>
                        </div>
                        <button class="btn-buy" data-skill="${s.id}">
                            Train ($${cost.cash})
                        </button>
                    `;

                    const btn = card.querySelector('.btn-buy');
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (StaffSystem.upgradeRiderSkill(s.id)) {
                            this.forceRender();
                        }
                    });

                    riderContainer.appendChild(card);
                } else {
                    const lbl = card.querySelector('.skill-label');
                    if (lbl && lbl.textContent !== `${s.name} (Lvl ${s.lvl})`) lbl.textContent = `${s.name} (Lvl ${s.lvl})`;

                    const val = card.querySelector('.skill-val');
                    if (val && val.textContent !== `${s.val} pts`) val.textContent = `${s.val} pts`;

                    const btn = card.querySelector('.btn-buy');
                    if (btn) {
                        const btnText = `Train ($${cost.cash})`;
                        if (btn.textContent.trim() !== btnText) btn.textContent = btnText;
                        btn.disabled = !canAfford;
                    }
                }
            });
        }

        // Crew
        const crewContainer = document.getElementById('crew-list');
        if (crewContainer) {
            if (forceRebuild) crewContainer.innerHTML = '';

            CREW_TYPES.forEach(crew => {
                const count = state.crew[crew.id] || 0;
                const cost = StaffSystem.getCrewCost(crew.id);

                let costString = [];
                if (cost.cash) costString.push(`$${cost.cash}`);
                if (cost.science) costString.push(`${cost.science} RP`);

                const canAfford = (!cost.cash || state.cash >= cost.cash) &&
                                  (!cost.science || state.science >= cost.science);

                let card = crewContainer.querySelector(`[data-crew-id="${crew.id}"]`);
                if (!card) {
                    card = document.createElement('div');
                    card.className = 'producer-card';
                    card.setAttribute('data-crew-id', crew.id);

                    card.innerHTML = `
                        <div class="prod-details">
                            <div class="prod-title">
                                <span>${crew.icon} ${crew.name}</span>
                                <span class="crew-count">Lvl ${count}</span>
                            </div>
                            <div class="prod-desc">${crew.desc}</div>
                        </div>
                        <button class="btn-buy" data-crew="${crew.id}">
                            Hire (${costString.join(', ')})
                        </button>
                    `;

                    const btn = card.querySelector('.btn-buy');
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (StaffSystem.hireCrew(crew.id)) {
                            this.forceRender();
                        }
                    });

                    crewContainer.appendChild(card);
                } else {
                    const countEl = card.querySelector('.crew-count');
                    if (countEl && countEl.textContent !== `Lvl ${count}`) countEl.textContent = `Lvl ${count}`;

                    const btn = card.querySelector('.btn-buy');
                    if (btn) {
                        const btnText = `Hire (${costString.join(', ')})`;
                        if (btn.textContent.trim() !== btnText) btn.textContent = btnText;
                        btn.disabled = !canAfford;
                    }
                }
            });
        }
    }

    static renderHeritage(state, forceRebuild = false) {
        this.updateText('prestige-current-rep', `${state.hype} Rep`);

        const pendingHT = PrestigeSystem.getPendingHeritageTokens();
        this.updateText('pending-ht-val', `${pendingHT} HT`);

        const btnPrestige = document.getElementById('btn-trigger-prestige');
        if (btnPrestige) btnPrestige.disabled = !PrestigeSystem.canPrestige();

        const grid = document.getElementById('heritage-upgrades-grid');
        if (!grid) return;

        if (forceRebuild) grid.innerHTML = '';

        HERITAGE_PERKS.forEach(perk => {
            const isOwned = state.heritagePerks.includes(perk.id);
            const canAfford = state.heritageTokens >= perk.cost;

            let card = grid.querySelector(`[data-heritage-id="${perk.id}"]`);
            if (!card) {
                card = document.createElement('div');
                card.className = `tech-card ${isOwned ? 'unlocked' : ''}`;
                card.setAttribute('data-heritage-id', perk.id);

                card.innerHTML = `
                    <div>
                        <div class="tech-title">${perk.icon} ${perk.name}</div>
                        <div class="tech-desc">${perk.desc}</div>
                    </div>
                    <div class="perk-footer">
                        <div class="tech-cost">Cost: ${perk.cost} Heritage Tokens</div>
                        <div class="perk-action"></div>
                    </div>
                `;

                grid.appendChild(card);
            }

            if (isOwned && !card.classList.contains('unlocked')) {
                card.classList.add('unlocked');
            }

            const actionBox = card.querySelector('.perk-action');
            if (actionBox) {
                if (isOwned) {
                    if (!actionBox.querySelector('.legacy-tag')) {
                        actionBox.innerHTML = `<span class="sub-tag legacy-tag" style="color:var(--accent-gold);">★ PERMANENT LEGACY</span>`;
                    }
                } else {
                    let btn = actionBox.querySelector('.btn-buy');
                    if (!btn) {
                        btn = document.createElement('button');
                        btn.className = 'btn-buy';
                        btn.setAttribute('data-heritage', perk.id);
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            if (PrestigeSystem.buyHeritagePerk(perk.id)) {
                                this.forceRender();
                            }
                        });
                        actionBox.innerHTML = '';
                        actionBox.appendChild(btn);
                    }
                    btn.textContent = `Claim Perk (${perk.cost} HT)`;
                    btn.disabled = !canAfford;
                }
            }
        });
    }

    static renderPromotionHub(state) {
        const container = document.getElementById('promotion-hub-content');
        const currentTierBadge = document.getElementById('promotion-current-tier');
        if (!container) return;

        const status = PromotionSystem.getPromotionStatus(state);
        const current = status.currentTier;
        const next = status.nextTier;

        if (currentTierBadge) {
            currentTierBadge.textContent = current.name;
        }

        if (status.isMaxTier || !next) {
            container.innerHTML = `
                <div class="promotion-target-info">
                    <h3>👑 Pinnacle of Motorsport: Premier Class MotoGP™</h3>
                    <p class="promotion-target-desc">Your factory squad is competing at the absolute summit of Grand Prix racing against the best riders on Earth. Defend your World Championships and build a lasting dynasty!</p>
                    <div class="promotion-perks-list">
                        <span class="perk-pill">🏆 $25,000 GP Win Purses</span>
                        <span class="perk-pill">💨 Factory Aero Winglets</span>
                        <span class="perk-pill">⚡ 10x Sponsor Payouts</span>
                        <span class="perk-pill">👑 280+ HP V4 Factory Prototypes</span>
                    </div>
                </div>
            `;
            return;
        }

        const req = status.requirements;
        const seasonMetIcon = req.seasonMet ? '✅' : '🔒';
        const cashMetIcon = req.cashMet ? '✅' : '❌';
        const hypeMetIcon = req.hypeMet ? '✅' : '❌';
        const hpMetIcon = req.hpMet ? '✅' : '❌';

        const seasonClass = req.seasonMet ? 'met' : 'unmet';
        const cashClass = req.cashMet ? 'met' : 'unmet';
        const hypeClass = req.hypeMet ? 'met' : 'unmet';
        const hpClass = req.hpMet ? 'met' : 'unmet';

        const btnDisabled = !status.canPromote;
        const btnText = status.canPromote
            ? `🚀 Upgrade Team to ${next.shortName} (-$${next.promotionCost.toLocaleString()})`
            : `🔒 Requirements Incomplete for ${next.shortName}`;

        container.innerHTML = `
            <div class="promotion-hub-layout">
                <div class="promotion-target-info">
                    <h3>🎯 Next Category: ${next.name}</h3>
                    <p class="promotion-target-desc">${next.description}</p>
                    <div class="promotion-perks-list">
                        <span class="perk-pill">💰 $${next.gpWinPrize.toLocaleString()} GP Win Purse</span>
                        <span class="perk-pill">⚡ ${next.sponsorMulti}x Sponsorship Scaling</span>
                        <span class="perk-pill">🏍️ ${next.baseHP}+ HP ${next.bikeModel}</span>
                    </div>
                </div>

                <div class="promotion-requirements-box">
                    <div class="req-grid">
                        <div class="req-item">
                            <span class="req-label">🗓️ Season Completed:</span>
                            <span class="req-val ${seasonClass}">${seasonMetIcon} S${req.currentSeason} / S${req.requiredSeason}+</span>
                        </div>
                        <div class="req-item">
                            <span class="req-label">💰 Capital Investment:</span>
                            <span class="req-val ${cashClass}">${cashMetIcon} $${Math.floor(req.currentCash).toLocaleString()} / $${next.promotionCost.toLocaleString()}</span>
                        </div>
                        <div class="req-item">
                            <span class="req-label">🔥 Team Reputation:</span>
                            <span class="req-val ${hypeClass}">${hypeMetIcon} ${req.currentHype} / ${next.requiredHype} Hype</span>
                        </div>
                        <div class="req-item">
                            <span class="req-label">🏍️ Bike Engine Spec:</span>
                            <span class="req-val ${hpClass}">${hpMetIcon} ${req.currentHP} / ${next.requiredHP} HP</span>
                        </div>
                    </div>

                    <button class="btn-promote-category" id="btn-promote-category" ${btnDisabled ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-promote-category')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (status.canPromote && status.nextTier) {
                if (confirm(`Are you ready to promote your team to the ${status.nextTier.name}? This will invest $${status.nextTier.promotionCost.toLocaleString()} in factory prototype chassis and team licenses for a brand new season!`)) {
                    PromotionSystem.promoteTeam();
                    this.forceRender(true);
                }
            }
        });
    }
}
