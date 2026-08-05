// EconomySystem.js - Resource rates, producers, and upgrade calculations

import { gameState } from '../engine/GameState.js';

export const PRODUCERS = [
    {
        id: 'dyno_bench',
        name: 'Manual Dyno Bench',
        icon: '📊',
        desc: 'Runs automated engine dyno tests to log continuous telemetry data.',
        baseCost: { cash: 50 },
        costMultiplier: 1.15,
        baseOutput: { telemetry: 0.5 },
        unlockedAtTier: 1
    },
    {
        id: 'manual_lathe',
        name: 'Pit Lathe & Machine',
        icon: '🛠️',
        desc: 'Basic pit shop lathe for machining spare titanium bolts and brackets.',
        baseCost: { cash: 100 },
        costMultiplier: 1.15,
        baseOutput: { parts: 0.3 },
        unlockedAtTier: 1
    },
    {
        id: 'local_fan_club',
        name: 'Local Fan Booth & Merch',
        icon: '🧢',
        desc: 'Sells team caps, shirts, and tickets at the track gate.',
        baseCost: { cash: 150 },
        costMultiplier: 1.15,
        baseOutput: { cash: 3.0 },
        unlockedAtTier: 1
    },
    {
        id: 'data_analyst',
        name: 'Junior Data Analyst',
        icon: '💻',
        desc: 'Converts raw Telemetry data into Research Points (RP). Consumes 0.5 Telemetry/s.',
        baseCost: { cash: 350 },
        costMultiplier: 1.18,
        baseOutput: { science: 0.3 },
        unlockedAtTier: 1
    },
    {
        id: 'wind_tunnel_slot',
        name: 'Wind Tunnel Testing Slot',
        icon: '🌀',
        desc: 'Simulates aerodynamic airflow. High yield for Telemetry and RP.',
        baseCost: { cash: 1200, parts: 20 },
        costMultiplier: 1.2,
        baseOutput: { telemetry: 2.0, science: 0.8 },
        unlockedAtTier: 2
    },
    {
        id: 'cnc_milling_vMC',
        name: '5-Axis CNC Milling Center',
        icon: '⚙️',
        desc: 'Automates precision machining of carbon parts and engine blocks.',
        baseCost: { cash: 2500, parts: 40 },
        costMultiplier: 1.22,
        baseOutput: { parts: 1.5 },
        unlockedAtTier: 2
    },
    {
        id: 'hospitality_suite',
        name: 'VIP Paddock Hospitality',
        icon: '🥂',
        desc: 'Entertains corporate sponsors and VIP guests for massive cash flow.',
        baseCost: { cash: 8000 },
        costMultiplier: 1.25,
        baseOutput: { cash: 45.0 },
        unlockedAtTier: 3
    },
    {
        id: 'ai_telemetry_hub',
        name: 'Cloud Telemetry Supercomputer',
        icon: '🖥️',
        desc: 'Deep learning ECU telemetry processor for rapid tech development.',
        baseCost: { cash: 25000, science: 100 },
        costMultiplier: 1.28,
        baseOutput: { science: 4.5, telemetry: 8.0 },
        unlockedAtTier: 3
    }
];

export class EconomySystem {
    static getRates() {
        const state = gameState.getState();
        const p = state.producers;
        const c = state.crew;

        // Base outputs
        let cashRate = 0;
        let telemetryRate = 0;
        let scienceRate = 0;
        let partsRate = 0;

        PRODUCERS.forEach(prod => {
            const count = p[prod.id] || 0;
            if (count > 0) {
                if (prod.baseOutput.cash) cashRate += prod.baseOutput.cash * count;
                if (prod.baseOutput.telemetry) telemetryRate += prod.baseOutput.telemetry * count;
                if (prod.baseOutput.science) scienceRate += prod.baseOutput.science * count;
                if (prod.baseOutput.parts) partsRate += prod.baseOutput.parts * count;
            }
        });

        // Apply Multipliers from Crew
        if (c.chief_mechanic > 0) partsRate *= (1 + c.chief_mechanic * 0.15);
        if (c.data_engineer > 0) scienceRate *= (1 + c.data_engineer * 0.15);
        if (c.telemetry_chief > 0) telemetryRate *= (1 + c.telemetry_chief * 0.20);

        // Apply Multipliers from Unlocked Tech
        if (state.unlockedTech.includes('adv_dyno')) telemetryRate *= 1.5;
        if (state.unlockedTech.includes('carbon_autoclave')) partsRate *= 1.5;
        if (state.unlockedTech.includes('sponsor_manager')) cashRate *= 1.5;
        if (state.unlockedTech.includes('telemetry_cloud')) scienceRate *= 1.5;

        // Apply Heritage Prestige Perks Multipliers
        if (state.heritagePerks.includes('heritage_paddock_brand')) cashRate *= 2.0;
        if (state.heritagePerks.includes('heritage_fast_rnd')) scienceRate *= 2.0;

        return { cashRate, telemetryRate, scienceRate, partsRate };
    }

    static tick(delta) {
        const state = gameState.getState();
        const rates = this.getRates();

        // Update values
        state.cash += rates.cashRate * delta;
        state.telemetry = Math.min(state.telemetryMax, state.telemetry + rates.telemetryRate * delta);
        state.science = Math.min(state.scienceMax, state.science + rates.scienceRate * delta);
        state.parts = Math.min(state.partsMax, state.parts + rates.partsRate * delta);
    }

    static calculateOfflineGains(seconds) {
        const state = gameState.getState();
        const rates = this.getRates();

        const cashGain = rates.cashRate * seconds;
        const telGain = Math.min(state.telemetryMax - state.telemetry, rates.telemetryRate * seconds);
        const sciGain = Math.min(state.scienceMax - state.science, rates.scienceRate * seconds);
        const partsGain = Math.min(state.partsMax - state.parts, rates.partsRate * seconds);

        state.cash += cashGain;
        state.telemetry += Math.max(0, telGain);
        state.science += Math.max(0, sciGain);
        state.parts += Math.max(0, partsGain);

        return { cash: cashGain, telemetry: Math.max(0, telGain), science: Math.max(0, sciGain), parts: Math.max(0, partsGain) };
    }

    static manualClick(type) {
        const state = gameState.getState();
        if (type === 'telemetry') {
            const added = state.clickTelemetryAmount;
            state.telemetry = Math.min(state.telemetryMax, state.telemetry + added);
        } else if (type === 'parts') {
            const added = state.clickPartsAmount;
            state.parts = Math.min(state.partsMax, state.parts + added);
        } else if (type === 'sponsor') {
            state.cash += state.clickSponsorAmount;
        }
    }

    static getProducerCost(prodId) {
        const state = gameState.getState();
        const prod = PRODUCERS.find(p => p.id === prodId);
        if (!prod) return null;

        const count = state.producers[prodId] || 0;
        const mult = Math.pow(prod.costMultiplier, count);

        const cost = {};
        if (prod.baseCost.cash) cost.cash = Math.floor(prod.baseCost.cash * mult);
        if (prod.baseCost.telemetry) cost.telemetry = Math.floor(prod.baseCost.telemetry * mult);
        if (prod.baseCost.science) cost.science = Math.floor(prod.baseCost.science * mult);
        if (prod.baseCost.parts) cost.parts = Math.floor(prod.baseCost.parts * mult);

        return cost;
    }

    static buyProducer(prodId) {
        const state = gameState.getState();
        const cost = this.getProducerCost(prodId);
        if (!cost) return false;

        // Check resources
        if (cost.cash && state.cash < cost.cash) return false;
        if (cost.telemetry && state.telemetry < cost.telemetry) return false;
        if (cost.science && state.science < cost.science) return false;
        if (cost.parts && state.parts < cost.parts) return false;

        // Deduct
        if (cost.cash) state.cash -= cost.cash;
        if (cost.telemetry) state.telemetry -= cost.telemetry;
        if (cost.science) state.science -= cost.science;
        if (cost.parts) state.parts -= cost.parts;

        state.producers[prodId] = (state.producers[prodId] || 0) + 1;
        gameState.addLog(`Purchased ${PRODUCERS.find(p => p.id === prodId).name} (Total: ${state.producers[prodId]})`);
        return true;
    }
}
