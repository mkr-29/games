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

    // ==========================================
    // OFFICIAL MOTOGP™ PADDOCK SPONSORS
    // ==========================================
    static getAvailableSponsors(tier = 1) {
        return OFFICIAL_MOTOGP_SPONSORS.filter(s => s.tier === tier);
    }

    static signSponsor(sponsorId) {
        const state = gameState.getState();
        if (!Array.isArray(state.activeSponsors)) state.activeSponsors = [];

        if (state.activeSponsors.includes(sponsorId)) {
            gameState.addLog(`⚠️ Sponsor already under contract.`);
            return false;
        }

        const sponsor = OFFICIAL_MOTOGP_SPONSORS.find(s => s.id === sponsorId);
        if (!sponsor) return false;

        if (state.tier < sponsor.tier) {
            gameState.addLog(`❌ Cannot sign ${sponsor.name}: Requires Category Tier ${sponsor.tier}.`);
            return false;
        }

        if (state.hype < sponsor.requiredHype) {
            gameState.addLog(`❌ Cannot sign ${sponsor.name}: Requires ${sponsor.requiredHype} Team Hype (Current: ${state.hype}).`);
            return false;
        }

        state.activeSponsors.push(sponsorId);
        state.cash += sponsor.signingBonus;
        gameState.addLog(`🤝 OFFICIAL SPONSOR SIGNED: ${sponsor.icon} ${sponsor.name} (${sponsor.category})! +$${sponsor.signingBonus.toLocaleString()} Signing Bonus deposited.`);
        return true;
    }

    static processRaceSponsorPayouts(userBestPos = 1) {
        const state = gameState.getState();
        if (!Array.isArray(state.activeSponsors) || state.activeSponsors.length === 0) {
            return { totalPayout: 0, count: 0 };
        }

        let baseTotal = 0;
        const activeList = OFFICIAL_MOTOGP_SPONSORS.filter(s => state.activeSponsors.includes(s.id));
        activeList.forEach(s => {
            let payout = s.racePayout || 0;
            if (userBestPos === 1) payout = Math.floor(payout * 1.5);
            else if (userBestPos <= 3) payout = Math.floor(payout * 1.25);
            baseTotal += payout;
        });

        if (state.heritagePerks && state.heritagePerks.includes('heritage_paddock_brand')) {
            baseTotal *= 2;
        }

        state.cash += baseTotal;
        if (baseTotal > 0) {
            gameState.addLog(`💼 PADDOCK COMMERCIAL PAYOUT: +$${baseTotal.toLocaleString()} from ${activeList.length} Official Grand Prix Sponsors!`);
        }
        return { totalPayout: baseTotal, count: activeList.length };
    }
}

// Official 2026 MotoGP™ Paddock Commercial Partners & Title Sponsors
export const OFFICIAL_MOTOGP_SPONSORS = [
    // --- TIER 1: Moto3™ Official Junior Paddock Partners ---
    {
        id: 'estrella_galicia',
        name: 'Estrella Galicia 0,0',
        tier: 1,
        category: 'Official Junior Talent Partner',
        icon: '⭐',
        color: '#c29b38',
        requiredHype: 0,
        signingBonus: 1000,
        racePayout: 450,
        desc: 'Historic junior development partner backing rising stars in Moto3™ and European Talent Cup.'
    },
    {
        id: 'liqui_moly',
        name: 'Liqui Moly Moto',
        tier: 1,
        category: 'Official Paddock Lubricants',
        icon: '🛢️',
        color: '#0055b8',
        requiredHype: 15,
        signingBonus: 2200,
        racePayout: 750,
        desc: 'Exclusive engine oil and chemical sponsor across Moto3™ and Moto2™ lightweight machines.'
    },
    {
        id: 'leopard_energy',
        name: 'Leopard Natural Energy',
        tier: 1,
        category: 'Championship Title Partner',
        icon: '🐆',
        color: '#00c3b2',
        requiredHype: 30,
        signingBonus: 3800,
        racePayout: 1100,
        desc: 'Multiple-time Moto3™ World Championship title sponsor supporting high-revving 250cc entries.'
    },
    {
        id: 'dellorto_systems',
        name: "Dell'Orto Electronics",
        tier: 1,
        category: 'Official Moto3 Spec ECU Supplier',
        icon: '⚡',
        color: '#d6001c',
        requiredHype: 45,
        signingBonus: 5000,
        racePayout: 1400,
        desc: 'FIM official spec electronic control unit and data logger supplier for all Moto3™ bikes.'
    },

    // --- TIER 2: Moto2™ Official Intermediate Partners ---
    {
        id: 'triumph_racing',
        name: 'Triumph Motorcycles',
        tier: 2,
        category: 'Official Moto2 Spec Engine Supplier',
        icon: '🇬🇧',
        color: '#ba0c2f',
        requiredHype: 50,
        signingBonus: 8000,
        racePayout: 2500,
        desc: 'Supplies the race-tuned 765cc triple engine powering every single machine on the Moto2™ grid.'
    },
    {
        id: 'idemitsu_lube',
        name: 'Idemitsu Honda Team Asia',
        tier: 2,
        category: 'Continental Talent Partner',
        icon: '🔴',
        color: '#e60012',
        requiredHype: 65,
        signingBonus: 12000,
        racePayout: 3400,
        desc: 'Prestigious Asian development title sponsor in Moto2™ and feeder to MotoGP™.'
    },
    {
        id: 'kalex_engineering',
        name: 'Kalex Engineering',
        tier: 2,
        category: 'Championship Chassis Constructor',
        icon: '⚙️',
        color: '#333333',
        requiredHype: 80,
        signingBonus: 16000,
        racePayout: 4200,
        desc: 'Dominant multiple-time Moto2™ World Championship constructor and chassis supplier.'
    },
    {
        id: 'elf_moto',
        name: 'TotalEnergies ELF Lubes',
        tier: 2,
        category: 'Factory Racing Fuel & Oil',
        icon: '⛽',
        color: '#00205b',
        requiredHype: 95,
        signingBonus: 20000,
        racePayout: 5200,
        desc: 'Long-standing Grand Prix partner supporting premier Moto2™ Marc VDS and factory operations.'
    },

    // --- TIER 3: MotoGP™ Premier Class Global Title Partners ---
    {
        id: 'red_bull_energy',
        name: 'Red Bull Racing',
        tier: 3,
        category: 'Global Energy Title Partner',
        icon: '🐂',
        color: '#001a4d',
        requiredHype: 120,
        signingBonus: 35000,
        racePayout: 9500,
        desc: 'Iconic factory title sponsor for KTM Factory Racing, Tech3, and the Red Bull Rookies Cup.'
    },
    {
        id: 'monster_energy',
        name: 'Monster Energy',
        tier: 3,
        category: 'Official Grand Prix Energy Drink',
        icon: '⚡',
        color: '#98c93c',
        requiredHype: 135,
        signingBonus: 40000,
        racePayout: 11000,
        desc: 'Title sponsor of Yamaha Factory Racing and primary partner across the MotoGP™ paddock.'
    },
    {
        id: 'repsol_oil',
        name: 'Repsol Lubricants & Fuels',
        tier: 3,
        category: 'Historic 30-Year Grand Prix Partner',
        icon: '🟠',
        color: '#ff6200',
        requiredHype: 150,
        signingBonus: 50000,
        racePayout: 13500,
        desc: 'The most decorated title sponsor in Grand Prix history, powering 15 premier class championships.'
    },
    {
        id: 'lenovo_tech',
        name: 'Lenovo Cloud AI & HPC',
        tier: 3,
        category: 'Official MotoGP Tech & Ducati Title Sponsor',
        icon: '💻',
        color: '#e2231a',
        requiredHype: 165,
        signingBonus: 65000,
        racePayout: 16000,
        desc: 'Powers Ducati Lenovo Team simulations, telemetry data analysis, and Dorna race analytics.'
    },
    {
        id: 'pertamina_enduro',
        name: 'Pertamina Enduro',
        tier: 3,
        category: 'VR46 Racing Team Title Partner',
        icon: '🇮🇩',
        color: '#009a44',
        requiredHype: 180,
        signingBonus: 80000,
        racePayout: 19000,
        desc: 'Title partner of Valentino Rossi’s VR46 Ducati team and Indonesia GP title sponsor.'
    },
    {
        id: 'castrol_power1',
        name: 'Castrol POWER1 Ultimate',
        tier: 3,
        category: 'LCR Factory Technical Partner',
        icon: '🟢',
        color: '#00853f',
        requiredHype: 195,
        signingBonus: 95000,
        racePayout: 22000,
        desc: 'High-performance synthetic lubricant partner with over 100 years of Isle of Man & GP pedigree.'
    },
    {
        id: 'brembo_carbon',
        name: 'Brembo Racing Carbon Discs',
        tier: 3,
        category: 'Official Sole MotoGP Brake Supplier',
        icon: '🛑',
        color: '#e30613',
        requiredHype: 210,
        signingBonus: 110000,
        racePayout: 26000,
        desc: 'Supplies 100% of the premier class grid with 355mm carbon-carbon discs and monobloc calipers.'
    },
    {
        id: 'michelin_motorsport',
        name: 'Michelin Motorsport',
        tier: 3,
        category: 'Sole Official Tire Supplier to MotoGP™',
        icon: '🏎️',
        color: '#002f6c',
        requiredHype: 230,
        signingBonus: 130000,
        racePayout: 30000,
        desc: 'Sole official tire partner of the premier class, engineering asymmetric compounds and RFID sensors.'
    }
];
