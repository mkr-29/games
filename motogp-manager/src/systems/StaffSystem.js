// StaffSystem.js - Rider training & crew engineering upgrades

import { gameState } from '../engine/GameState.js';

export const CREW_TYPES = [
    {
        id: 'chief_mechanic',
        name: 'Chief Pit Mechanic',
        icon: '👨‍🔧',
        desc: '+15% Spare Parts production rate per level.',
        baseCost: { cash: 200 },
        costMultiplier: 1.5
    },
    {
        id: 'data_engineer',
        name: 'Senior Telemetry Engineer',
        icon: '💻',
        desc: '+15% Research Points (RP) generation rate per level.',
        baseCost: { cash: 350 },
        costMultiplier: 1.5
    },
    {
        id: 'aerodynamicist',
        name: 'Lead Aerodynamicist',
        icon: '🛩️',
        desc: '+5 Aero Downforce stat to the bike per level.',
        baseCost: { cash: 500, science: 30 },
        costMultiplier: 1.6
    },
    {
        id: 'telemetry_chief',
        name: 'Chief Data Analyst',
        icon: '📡',
        desc: '+20% Telemetry generation rate per level.',
        baseCost: { cash: 400 },
        costMultiplier: 1.5
    },
    {
        id: 'physio_trainer',
        name: 'Paddock Physio Trainer',
        icon: '🩺',
        desc: 'Accelerates rider injury recovery and boosts Consistency skill by +5 per level.',
        baseCost: { cash: 300 },
        costMultiplier: 1.5
    }
];

export class StaffSystem {
    static getRiderSkillCost(skillType, riderSlot = 0) {
        const state = gameState.getState();
        const r = (state.riders && state.riders[riderSlot]) ? state.riders[riderSlot] : state.rider;
        if (!r) return { cash: 100 };
        const levelKey = `${skillType}Lvl`;
        const currentLvl = r[levelKey] || 1;
        return {
            cash: Math.floor(100 * Math.pow(1.3, currentLvl - 1))
        };
    }

    static getTrainingDuration(skillType, riderSlot = 0) {
        const state = gameState.getState();
        const r = (state.riders && state.riders[riderSlot]) ? state.riders[riderSlot] : state.rider;
        const levelKey = `${skillType}Lvl`;
        const currentLvl = r ? (r[levelKey] || 1) : 1;

        let baseSec = 10 + (currentLvl * 3);
        const physioLvl = state.crew?.physio_trainer || 0;
        const speedBonus = 1 + (physioLvl * 0.15);

        return Math.max(4, Math.round(baseSec / speedBonus));
    }

    static isTrainingActive(skillType, riderSlot = 0) {
        const state = gameState.getState();
        const key = `${riderSlot}_${skillType}`;
        return !!(state.riderTraining && state.riderTraining[key]);
    }

    static getActiveTraining(skillType, riderSlot = 0) {
        const state = gameState.getState();
        const key = `${riderSlot}_${skillType}`;
        return state.riderTraining ? state.riderTraining[key] : null;
    }

    static startTraining(skillType, riderSlot = 0) {
        const state = gameState.getState();
        const r = (state.riders && state.riders[riderSlot]) ? state.riders[riderSlot] : state.rider;
        if (!r) return false;

        const key = `${riderSlot}_${skillType}`;
        if (state.riderTraining && state.riderTraining[key]) return false;

        const cost = this.getRiderSkillCost(skillType, riderSlot);
        if (state.cash < cost.cash) return false;

        state.cash -= cost.cash;
        const duration = this.getTrainingDuration(skillType, riderSlot);
        const levelKey = `${skillType}Lvl`;
        const targetLvl = (r[levelKey] || 1) + 1;

        if (!state.riderTraining) state.riderTraining = {};
        state.riderTraining[key] = {
            riderSlot,
            skillType,
            riderName: r.name,
            progress: 0,
            duration: duration,
            targetLvl: targetLvl
        };

        gameState.addLog(`🏋️ TRAINING STARTED: ${r.name} (#${r.number || (riderSlot + 1)}) entered specialized camp for ${skillType.toUpperCase()} (Lvl ${targetLvl}, ${duration}s).`);
        return true;
    }

    static completeTraining(riderSlot, skillType) {
        const state = gameState.getState();
        const r = (state.riders && state.riders[riderSlot]) ? state.riders[riderSlot] : state.rider;
        if (!r) return false;

        const levelKey = `${skillType}Lvl`;
        r[levelKey] = (r[levelKey] || 1) + 1;
        r[skillType] = (r[skillType] || 75) + 3; // +3 stat per level

        // Recalculate overall rider skill
        const c = r.cornering || 80;
        const b = r.braking || 80;
        const co = r.consistency || 80;
        const w = r.wetSkill || 75;
        r.overallSkill = Math.round((c + b + co + w) / 4);

        if (riderSlot === 0) {
            state.rider = r;
        }

        const key = `${riderSlot}_${skillType}`;
        if (state.riderTraining) {
            delete state.riderTraining[key];
        }

        gameState.addLog(`🏆 TRAINING COMPLETE: ${r.name} (#${r.number || (riderSlot + 1)}) mastered ${skillType.toUpperCase()} (Now Level ${r[levelKey]}, ${r[skillType]} pts, ${r.overallSkill} OVR)!`);
        return true;
    }

    static upgradeRiderSkill(skillType, riderSlot = 0) {
        return this.startTraining(skillType, riderSlot);
    }

    static tick(delta) {
        const state = gameState.getState();
        if (!state.riderTraining) return false;

        let changed = false;
        Object.entries(state.riderTraining).forEach(([key, trainObj]) => {
            trainObj.progress += delta;
            if (trainObj.progress >= trainObj.duration) {
                this.completeTraining(trainObj.riderSlot, trainObj.skillType);
                changed = true;
            }
        });

        return changed;
    }

    static fastForward(seconds) {
        if (!seconds || seconds <= 0) return;
        const state = gameState.getState();
        if (!state.riderTraining) return;

        Object.entries(state.riderTraining).forEach(([key, trainObj]) => {
            trainObj.progress += seconds;
            if (trainObj.progress >= trainObj.duration) {
                this.completeTraining(trainObj.riderSlot, trainObj.skillType);
            }
        });
    }

    static getCrewCost(crewId) {
        const state = gameState.getState();
        const crewDef = CREW_TYPES.find(c => c.id === crewId);
        if (!crewDef) return null;

        const currentLvl = state.crew[crewId] || 0;
        const mult = Math.pow(crewDef.costMultiplier, currentLvl);

        const cost = {};
        if (crewDef.baseCost.cash) cost.cash = Math.floor(crewDef.baseCost.cash * mult);
        if (crewDef.baseCost.science) cost.science = Math.floor(crewDef.baseCost.science * mult);

        return cost;
    }

    static hireCrew(crewId) {
        const state = gameState.getState();
        const cost = this.getCrewCost(crewId);
        if (!cost) return false;

        if (cost.cash && state.cash < cost.cash) return false;
        if (cost.science && state.science < cost.science) return false;

        if (cost.cash) state.cash -= cost.cash;
        if (cost.science) state.science -= cost.science;

        state.crew[crewId] = (state.crew[crewId] || 0) + 1;
        const crewDef = CREW_TYPES.find(c => c.id === crewId);

        if (crewId === 'physio_trainer') {
            const teamRiders = state.riders || [state.rider];
            teamRiders.forEach(r => {
                if (r) {
                    r.consistency = (r.consistency || 75) + 5;
                    const c = r.cornering || 80;
                    const b = r.braking || 80;
                    const co = r.consistency || 80;
                    const w = r.wetSkill || 75;
                    r.overallSkill = Math.round((c + b + co + w) / 4);
                    if (r.injury) {
                        gameState.addLog(`🩺 Physio Trainer treated ${r.name}'s ${r.injury.name}! Injury fully healed.`);
                        r.injury = null;
                    }
                }
            });
            state.rider = teamRiders[0];
        }

        gameState.addLog(`👨‍🔧 Hired ${crewDef.name} (Level ${state.crew[crewId]})!`);
        return true;
    }
}
