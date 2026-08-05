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
    static getRiderSkillCost(skillType) {
        const state = gameState.getState();
        const r = state.rider;
        const levelKey = `${skillType}Lvl`;
        const currentLvl = r[levelKey] || 1;
        return {
            cash: Math.floor(100 * Math.pow(1.3, currentLvl - 1))
        };
    }

    static upgradeRiderSkill(skillType) {
        const state = gameState.getState();
        const r = state.rider;
        const cost = this.getRiderSkillCost(skillType);

        if (state.cash < cost.cash) return false;

        state.cash -= cost.cash;
        const levelKey = `${skillType}Lvl`;
        r[levelKey] = (r[levelKey] || 1) + 1;
        r[skillType] += 3; // +3 stat per level

        // Recalculate overall rider skill
        r.overallSkill = Math.round((r.cornering + r.braking + r.consistency + r.wetSkill) / 4);

        gameState.addLog(`🏎️ Rider ${r.name} improved ${skillType.toUpperCase()} (Lvl ${r[levelKey]})!`);
        return true;
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
            state.rider.consistency += 5;
            state.rider.overallSkill = Math.round((state.rider.cornering + state.rider.braking + state.rider.consistency + state.rider.wetSkill) / 4);
            if (state.rider.injury) {
                gameState.addLog(`🩺 Physio Trainer treated ${state.rider.name}'s ${state.rider.injury.name}! Injury healed.`);
                state.rider.injury = null;
            }
        }

        gameState.addLog(`👨‍🔧 Hired ${crewDef.name} (Level ${state.crew[crewId]})!`);
        return true;
    }
}
