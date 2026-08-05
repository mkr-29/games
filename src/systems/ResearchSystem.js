// ResearchSystem.js - Tech Tree Upgrades & Research Logic

import { gameState } from '../engine/GameState.js';

export const TECH_NODES = [
    // --- STORAGE & FACILITIES ---
    {
        id: 'telemetry_storage_1',
        name: 'High-Density Server Racks',
        category: 'storage',
        icon: '💾',
        desc: 'Increases max Telemetry storage by +100.',
        cost: { science: 10, cash: 100 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.telemetryMax += 100; }
    },
    {
        id: 'parts_bin_1',
        name: 'Modular Part Shelving',
        category: 'storage',
        icon: '📦',
        desc: 'Increases max Spare Parts storage by +50.',
        cost: { science: 15, cash: 150 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.partsMax += 50; }
    },
    {
        id: 'science_storage_1',
        name: 'R&D Data Server Vault',
        category: 'storage',
        icon: '🗄️',
        desc: 'Expands maximum Research Points (RP) storage capacity by +50 (Capacity: 100 RP).',
        cost: { science: 15, cash: 120 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.scienceMax += 50; }
    },
    {
        id: 'science_storage_2',
        name: 'High-Performance Compute Cluster',
        category: 'storage',
        icon: '🖥️',
        desc: 'Expands maximum Research Points (RP) storage capacity by +100 (Capacity: 200 RP).',
        cost: { science: 40, cash: 450 },
        prereq: ['science_storage_1'],
        unlockedAtTier: 1,
        effect: (s) => { s.scienceMax += 100; }
    },
    {
        id: 'science_storage_3',
        name: 'Quantum Simulation Server',
        category: 'storage',
        icon: '⚛️',
        desc: 'Expands maximum Research Points (RP) storage capacity by +250 (Capacity: 450 RP).',
        cost: { science: 120, cash: 2500 },
        prereq: ['science_storage_2'],
        unlockedAtTier: 2,
        effect: (s) => { s.scienceMax += 250; }
    },

    // --- ENGINE & POWER ---
    {
        id: 'titanium_valves',
        name: 'Titanium Engine Valves',
        category: 'engine',
        icon: '⚙️',
        desc: 'Allows higher RPM limit. Adds +8 HP to Engine Power.',
        cost: { science: 20, parts: 15 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.powerHP += 8; }
    },
    {
        id: 'high_flow_fuel_pump',
        name: 'High-Flow Fuel Injectors',
        category: 'engine',
        icon: '⛽',
        desc: 'Optimizes fuel combustion. Adds +12 HP to Engine Power.',
        cost: { science: 40, parts: 30 },
        prereq: ['titanium_valves'],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.powerHP += 12; }
    },
    {
        id: 'ram_air_intake',
        name: 'Carbon Fiber Ram-Air Duct',
        category: 'engine',
        icon: '🌪️',
        desc: 'Pressurizes air intake at high speed. Adds +18 HP.',
        cost: { science: 90, parts: 60 },
        prereq: ['high_flow_fuel_pump'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.powerHP += 18; }
    },

    // --- AERODYNAMICS ---
    {
        id: 'front_winglets',
        name: 'Aerodynamic Front Winglets',
        category: 'aero',
        icon: '🦅',
        desc: 'Prevents wheelies under acceleration. Adds +12 Aero Downforce.',
        cost: { science: 25, parts: 20 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.aeroDownforce += 12; }
    },
    {
        id: 'ground_effect_fairings',
        name: 'Ground-Effect Lower Fairings',
        category: 'aero',
        icon: '🛩️',
        desc: 'Creates suction under lean angle. Adds +20 Aero Downforce.',
        cost: { science: 70, parts: 45 },
        prereq: ['front_winglets'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.aeroDownforce += 20; }
    },

    // --- CHASSIS & BRAKES ---
    {
        id: 'carbon_disc_brakes',
        name: 'Brembo Carbon Brake Discs',
        category: 'chassis',
        icon: '🛑',
        desc: 'Massive stopping power and trail-braking control. Adds +15 Chassis Grip.',
        cost: { science: 30, parts: 25 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.chassisGrip += 15; }
    },
    {
        id: 'ohlins_pressurized_fork',
        name: 'Pressurized Front Suspension',
        category: 'chassis',
        icon: '🔩',
        desc: 'Improves corner entry stability. Adds +22 Chassis Grip.',
        cost: { science: 75, parts: 50 },
        prereq: ['carbon_disc_brakes'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.chassisGrip += 22; }
    },

    // --- ELECTRONICS & ECU ---
    {
        id: 'traction_control_v1',
        name: 'Lean Angle Traction Control',
        category: 'electronics',
        icon: '🎛️',
        desc: 'Cuts engine torque when rear tire spins. Adds +10 ECU Intelligence.',
        cost: { science: 30, telemetry: 40 },
        prereq: [],
        unlockedAtTier: 1,
        effect: (s) => { s.bike.ecuIntelligence += 10; }
    },
    {
        id: 'anti_wheelie_algo',
        name: 'Algorithmic Anti-Wheelie Control',
        category: 'electronics',
        icon: '📟',
        desc: 'Smooths out corner exit power delivery. Adds +18 ECU Intelligence.',
        cost: { science: 80, telemetry: 80 },
        prereq: ['traction_control_v1'],
        unlockedAtTier: 2,
        effect: (s) => { s.bike.ecuIntelligence += 18; }
    },

    // --- ECONOMY BOOST TECHS ---
    {
        id: 'adv_dyno',
        name: 'Automated Dyno Scripting',
        category: 'storage',
        icon: '📈',
        desc: '+50% Telemetry generation rate.',
        cost: { science: 45, cash: 400 },
        prereq: [],
        unlockedAtTier: 1,
        effect: () => {}
    },
    {
        id: 'carbon_autoclave',
        name: 'High-Pressure Carbon Autoclave',
        category: 'storage',
        icon: '🔥',
        desc: '+50% Spare Parts manufacturing rate.',
        cost: { science: 50, parts: 30 },
        prereq: [],
        unlockedAtTier: 1,
        effect: () => {}
    },
    {
        id: 'sponsor_manager',
        name: 'Professional Paddock PR Manager',
        category: 'storage',
        icon: '💼',
        desc: '+50% Cash generation rate.',
        cost: { science: 60, cash: 800 },
        prereq: [],
        unlockedAtTier: 1,
        effect: () => {}
    }
];

export class ResearchSystem {
    static isTechAvailable(techId) {
        const state = gameState.getState();
        if (state.unlockedTech.includes(techId)) return false; // Already unlocked

        const node = TECH_NODES.find(t => t.id === techId);
        if (!node) return false;

        if (state.tier < node.unlockedAtTier) return false;

        // Check prerequisites
        for (const prereqId of node.prereq) {
            if (!state.unlockedTech.includes(prereqId)) return false;
        }

        return true;
    }

    static canAfford(techId) {
        const state = gameState.getState();
        const node = TECH_NODES.find(t => t.id === techId);
        if (!node) return false;

        if (node.cost.science && state.science < node.cost.science) return false;
        if (node.cost.parts && state.parts < node.cost.parts) return false;
        if (node.cost.cash && state.cash < node.cost.cash) return false;
        if (node.cost.telemetry && state.telemetry < node.cost.telemetry) return false;

        return true;
    }

    static unlockTech(techId) {
        const state = gameState.getState();
        if (!this.isTechAvailable(techId) || !this.canAfford(techId)) return false;

        const node = TECH_NODES.find(t => t.id === techId);
        if (!node) return false;

        // Deduct cost
        if (node.cost.science) state.science -= node.cost.science;
        if (node.cost.parts) state.parts -= node.cost.parts;
        if (node.cost.cash) state.cash -= node.cost.cash;
        if (node.cost.telemetry) state.telemetry -= node.cost.telemetry;

        state.unlockedTech.push(techId);
        node.effect(state);

        gameState.addLog(`🔬 Unlocked Research: ${node.name}!`);
        return true;
    }
}
