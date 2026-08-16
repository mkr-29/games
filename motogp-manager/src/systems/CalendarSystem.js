// CalendarSystem.js - F1 & MotoGP Manager Style Season Calendar & Sequential Day-by-Day Progression Engine

import { gameState } from '../engine/GameState.js';
import { GP_CALENDAR, RaceSystem } from './RaceSystem.js';
import { RiderSystem } from './RiderSystem.js';

export const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Midweek'];

export const SEASON_WEEKS_TEMPLATE = [
    // Pre-Season
    {
        weekNumber: 1,
        dateRange: "Feb 16 – Feb 22",
        title: "Official Sepang Pre-Season Test",
        type: "test_week",
        circuitId: "sepang",
        flag: "🇲🇾",
        desc: "First official pre-season shakedown in Malaysia. Gather baseline aerodynamic and powertrain telemetry.",
        activities: [
            { id: 'w1_shakedown', title: 'Bike Systems & Electronics Map', day: 'Wednesday', required: false, reward: { telemetry: 60, science: 25 }, desc: 'Check sensors and calibrate baseline throttle maps.' },
            { id: 'w1_test_main', title: 'Official Sepang Timing Day (Mandatory Test)', day: 'Friday', required: true, reward: { telemetry: 120, science: 60 }, desc: 'Run mandatory full-day testing laps for official FIM timing.' },
            { id: 'w1_long_run', title: 'Race Pace Long-Run Simulation (20 Laps)', day: 'Saturday', required: false, reward: { telemetry: 80, science: 40, hype: 15 }, desc: 'Evaluate tire degradation over race distance.' }
        ]
    },
    {
        weekNumber: 2,
        dateRange: "Feb 23 – Mar 01",
        title: "Factory Aerodynamics & Travel Prep",
        type: "factory_week",
        flag: "🏭",
        desc: "Finalize engine seal specs and pack paddock freight for the flyaway season opener in Southeast Asia.",
        activities: [
            { id: 'w2_sponsor', title: 'Global Season Launch & Sponsor Media Shoot', day: 'Tuesday', required: false, reward: { cash: 2500, hype: 35 }, desc: 'Unveil the official season team livery to the press.' },
            { id: 'w2_dyno', title: 'Factory Dyno Engine Break-In', day: 'Thursday', required: false, reward: { telemetry: 50, science: 30 }, desc: 'Bench test race engines before shipping.' }
        ]
    },

    // Round 1: Thailand
    {
        weekNumber: 3,
        dateRange: "Mar 02 – Mar 08",
        title: "Round 1: Thai Grand Prix (Buriram)",
        type: "race_week",
        gpId: "thailand",
        roundIndex: 0,
        flag: "🇹🇭",
        desc: "Season opener at Chang International Circuit. 1km slipstream straight and heavy braking hairpins in extreme tropical heat.",
        activities: [
            { id: 'th_media', title: '🎙️ Thursday Press Conference & Media Pen', day: 'Thursday', required: false, reward: { cash: 800, hype: 25 }, actionType: 'media', desc: 'Represent team at the official pre-event press briefing.' },
            { id: 'th_walk', title: '🚶 Track Walk & Chief Mechanic Setup Briefing', day: 'Thursday', required: false, reward: { telemetry: 40, science: 20 }, actionType: 'briefing', desc: 'Inspect track curbs, grip levels, and calibrate gear ratios.' },
            { id: 'th_fp1', title: '🛠️ Free Practice 1 Setup Shakedown', day: 'Friday', required: false, reward: { telemetry: 60, parts: 20 }, actionType: 'race_fp1', desc: 'Initial baseline setup and tire compound temperature check.' },
            { id: 'th_pr', title: '⏱️ Practice (PR - Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory timed practice session deciding top-10 direct Q2 entry.' },
            { id: 'th_quali', title: '⚡ Qualifying Shootout (Q1 / Q2 Pole Battle)', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory shootout to determine starting grid position.' },
            { id: 'th_sprint', title: '🏁 MotoGP™ Sprint Race (Half Distance)', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory half-distance championship points race.' },
            { id: 'th_vip', title: '🤝 VIP Paddock Hospitality Meet & Greet', day: 'Saturday', required: false, reward: { cash: 1500, hype: 20 }, actionType: 'sponsor', desc: 'Host corporate guests in the hospitality motorhome.' },
            { id: 'th_gp', title: '🏆 Grand Prix Main Race (Full Feature)', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix World Championship feature race!' }
        ]
    },

    // Round 2: Argentina
    {
        weekNumber: 5,
        dateRange: "Mar 16 – Mar 22",
        title: "Round 2: Argentine Grand Prix (Termas)",
        type: "race_week",
        gpId: "argentina",
        roundIndex: 1,
        flag: "🇦🇷",
        desc: "Termas de Río Hondo. Fast, sweeping corners requiring exceptional aerodynamic stability and front-end feedback.",
        activities: [
            { id: 'arg_media', title: '🎙️ Thursday Rider Media Session', day: 'Thursday', required: false, reward: { cash: 800, hype: 20 }, actionType: 'media', desc: 'Press interviews with South American sports outlets.' },
            { id: 'arg_fp1', title: '🛠️ FP1 Track Evolution Shakedown', day: 'Friday', required: false, reward: { telemetry: 50 }, actionType: 'race_fp1', desc: 'Clean dusty tarmac and gather rubber laydown telemetry.' },
            { id: 'arg_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory timed practice session.' },
            { id: 'arg_quali', title: '⚡ Qualifying Shootout (Q1 & Q2)', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'arg_sprint', title: '🏁 Argentine Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint race.' },
            { id: 'arg_gp', title: '🏆 Argentine Grand Prix Race', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 3: Americas
    {
        weekNumber: 7,
        dateRange: "Mar 30 – Apr 05",
        title: "Round 3: Grand Prix of the Americas (COTA)",
        type: "race_week",
        gpId: "americas",
        roundIndex: 2,
        flag: "🇺🇸",
        desc: "Circuit of the Americas in Austin, Texas. Steep uphill Turn 1, rhythmic S-curves, and demanding elevation changes.",
        activities: [
            { id: 'usa_media', title: '🎙️ US Media Tour & Tech Showcase', day: 'Thursday', required: false, reward: { cash: 1200, hype: 30 }, actionType: 'media', desc: 'High-profile US television appearances.' },
            { id: 'usa_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory timed practice session.' },
            { id: 'usa_quali', title: '⚡ COTA Qualifying Shootout', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'usa_sprint', title: '🏁 COTA Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint race.' },
            { id: 'usa_gp', title: '🏆 Grand Prix of the Americas', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 4: Qatar
    {
        weekNumber: 8,
        dateRange: "Apr 06 – Apr 12",
        title: "Round 4: Qatar Grand Prix (Lusail)",
        type: "race_week",
        gpId: "qatar",
        roundIndex: 3,
        flag: "🇶🇦",
        desc: "Lusail International Circuit under floodlights. High top speed and cooler night-time desert temperatures.",
        activities: [
            { id: 'qat_pr', title: '⏱️ Night Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice under floodlights.' },
            { id: 'qat_quali', title: '⚡ Lusail Qualifying Shootout', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying under the lights.' },
            { id: 'qat_sprint', title: '🏁 Qatar Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint race.' },
            { id: 'qat_gp', title: '🏆 Qatar Grand Prix Main Race', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 5: Jerez
    {
        weekNumber: 10,
        dateRange: "Apr 20 – Apr 26",
        title: "Round 5: Gran Premio de España (Jerez)",
        type: "race_week",
        gpId: "jerez",
        roundIndex: 4,
        flag: "🇪🇸",
        desc: "Circuito de Jerez - Angel Nieto. European season opener packed with passionate fans and technical braking zones.",
        activities: [
            { id: 'jer_media', title: '🎙️ Spanish Media Paddock Interview', day: 'Thursday', required: false, reward: { cash: 900, hype: 25 }, actionType: 'media', desc: 'Press interview in the legendary Jerez paddock.' },
            { id: 'jer_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory timed practice.' },
            { id: 'jer_quali', title: '⚡ Jerez Qualifying Shootout', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'jer_sprint', title: '🏁 Spanish Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint race.' },
            { id: 'jer_gp', title: '🏆 Gran Premio de España', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Post-Jerez Test Week
    {
        weekNumber: 11,
        dateRange: "Apr 27 – May 03",
        title: "Official Jerez In-Season Development Test",
        type: "test_week",
        circuitId: "jerez",
        flag: "🔧",
        desc: "Full-day official in-season test at Jerez. Crucial milestone to benchmark new aero packages and engine maps.",
        activities: [
            { id: 'w11_aero_evo', title: 'Evaluate New Aero & Downforce Winglets', day: 'Monday', required: false, reward: { telemetry: 75, science: 40 }, desc: 'Back-to-back testing of updated front wing configurations.' },
            { id: 'w11_test_main', title: 'Official FIM Monday Test Protocol', day: 'Monday', required: true, reward: { telemetry: 140, science: 70 }, desc: 'Mandatory in-season official test program.' }
        ]
    },

    // Round 6: France (Le Mans)
    {
        weekNumber: 12,
        dateRange: "May 04 – May 10",
        title: "Round 6: French Grand Prix (Le Mans)",
        type: "race_week",
        gpId: "france",
        roundIndex: 5,
        flag: "🇫🇷",
        desc: "Bugatti Circuit at Le Mans. Heavy stop-and-go acceleration zones with frequent unpredictable weather.",
        activities: [
            { id: 'fra_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'fra_quali', title: '⚡ Le Mans Qualifying Shootout', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'fra_sprint', title: '🏁 French Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'fra_gp', title: '🏆 Grand Prix de France', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 7: Silverstone
    {
        weekNumber: 14,
        dateRange: "May 18 – May 24",
        title: "Round 7: British Grand Prix (Silverstone)",
        type: "race_week",
        gpId: "silverstone",
        roundIndex: 6,
        flag: "🇬🇧",
        desc: "Historic Silverstone circuit. Ultra-fast Maggotts-Becketts sweeps testing high-speed change of direction.",
        activities: [
            { id: 'gb_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'gb_quali', title: '⚡ Silverstone Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'gb_sprint', title: '🏁 British Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'gb_gp', title: '🏆 British Grand Prix Race', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 8: Aragon
    {
        weekNumber: 15,
        dateRange: "May 25 – May 31",
        title: "Round 8: Gran Premio de Aragón (MotorLand)",
        type: "race_week",
        gpId: "aragon",
        roundIndex: 7,
        flag: "🇪🇸",
        desc: "MotorLand Aragón. Corkscrew downhill drops and 1km back straight demanding raw power.",
        activities: [
            { id: 'ara_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'ara_quali', title: '⚡ Aragon Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'ara_sprint', title: '🏁 Aragon Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'ara_gp', title: '🏆 Gran Premio de Aragón', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 9: Mugello
    {
        weekNumber: 16,
        dateRange: "Jun 01 – Jun 07",
        title: "Round 9: Gran Premio d'Italia (Mugello)",
        type: "race_week",
        gpId: "mugello",
        roundIndex: 8,
        flag: "🇮🇹",
        desc: "Autodromo del Mugello in the Tuscan hills. 1.1km front straight with 360+ km/h speeds into San Donato.",
        activities: [
            { id: 'mug_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'mug_quali', title: '⚡ Mugello Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'mug_sprint', title: '🏁 Italian Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'mug_gp', title: '🏆 Gran Premio d\'Italia', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 10: Assen
    {
        weekNumber: 18,
        dateRange: "Jun 15 – Jun 21",
        title: "Round 10: TT Assen (Cathedral of Speed)",
        type: "race_week",
        gpId: "assen",
        roundIndex: 9,
        flag: "🇳🇱",
        desc: "TT Circuit Assen. The oldest and most iconic circuit on the calendar with banked high-speed chicanes.",
        activities: [
            { id: 'ass_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'ass_quali', title: '⚡ Assen Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'ass_sprint', title: '🏁 Dutch TT Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'ass_gp', title: '🏆 Motul TT Assen Grand Prix', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 11: Sachsenring
    {
        weekNumber: 19,
        dateRange: "Jun 22 – Jun 28",
        title: "Round 11: German Grand Prix (Sachsenring)",
        type: "race_week",
        gpId: "sachsenring",
        roundIndex: 10,
        flag: "🇩🇪",
        desc: "Sachsenring. Counter-clockwise layout with 10 left corners and the famous blind downhill Waterfall turn.",
        activities: [
            { id: 'sac_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'sac_quali', title: '⚡ Sachsenring Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'sac_sprint', title: '🏁 German Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'sac_gp', title: '🏆 Liqui Moly Motorrad Grand Prix Deutschland', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 12: Brno
    {
        weekNumber: 20,
        dateRange: "Jun 29 – Jul 05",
        title: "Round 12: Czech Republic Grand Prix (Brno)",
        type: "race_week",
        gpId: "brno",
        roundIndex: 11,
        flag: "🇨🇿",
        desc: "Automotodrom Brno. Natural hillside amphitheater with sweeping cambered turns before the summer break.",
        activities: [
            { id: 'brn_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'brn_quali', title: '⚡ Brno Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'brn_sprint', title: '🏁 Czech Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'brn_gp', title: '🏆 Grand Prix of the Czech Republic', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Summer Break
    {
        weekNumber: 21,
        dateRange: "Jul 06 – Jul 19",
        title: "MotoGP™ Summer Break & Factory Rebuild",
        type: "summer_break",
        flag: "🏖️",
        desc: "Mid-season mandatory factory shutdown and rider conditioning recovery period.",
        activities: [
            { id: 'sum_camp', title: 'Rider Conditioning & Fitness Assessment', day: 'Midweek', required: false, reward: { hype: 20, cash: 1000 }, desc: 'Rider training in mountain altitude camp.' }
        ]
    },

    // Round 13: Red Bull Ring
    {
        weekNumber: 23,
        dateRange: "Aug 03 – Aug 09",
        title: "Round 13: Austrian Grand Prix (Red Bull Ring)",
        type: "race_week",
        gpId: "spielberg",
        roundIndex: 12,
        flag: "🇦🇹",
        desc: "Red Bull Ring in Spielberg. Stop-and-go mountain climbs testing acceleration thrust and hard braking.",
        activities: [
            { id: 'aut_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'aut_quali', title: '⚡ Austrian Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'aut_sprint', title: '🏁 Austrian Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'aut_gp', title: '🏆 CryptoDATA Motorrad Grand Prix von Österreich', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 14: Balaton Park
    {
        weekNumber: 24,
        dateRange: "Aug 10 – Aug 16",
        title: "Round 14: Hungarian Grand Prix (Balaton Park)",
        type: "race_week",
        gpId: "balaton",
        roundIndex: 13,
        flag: "🇭🇺",
        desc: "Balaton Park Circuit near Lake Balaton. Brand new technical venue with rhythmic chicanes.",
        activities: [
            { id: 'hun_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'hun_quali', title: '⚡ Balaton Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'hun_sprint', title: '🏁 Hungarian Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'hun_gp', title: '🏆 Hungarian Grand Prix', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 15: Catalunya
    {
        weekNumber: 26,
        dateRange: "Aug 24 – Aug 30",
        title: "Round 15: Gran Premio de Catalunya (Barcelona)",
        type: "race_week",
        gpId: "catalunya",
        roundIndex: 14,
        flag: "🇪🇸",
        desc: "Circuit de Barcelona-Catalunya. Low grip tarmac and long 1km front straight with sweeping Turn 3.",
        activities: [
            { id: 'cat_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'cat_quali', title: '⚡ Catalunya Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'cat_sprint', title: '🏁 Catalan Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'cat_gp', title: '🏆 Gran Premi Monster Energy de Catalunya', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 16: Misano
    {
        weekNumber: 27,
        dateRange: "Aug 31 – Sep 06",
        title: "Round 16: San Marino Grand Prix (Misano)",
        type: "race_week",
        gpId: "misano",
        roundIndex: 15,
        flag: "🇸🇲",
        desc: "Misano World Circuit Marco Simoncelli on the Adriatic Riviera. High lean angle cornering and the Curvone kink.",
        activities: [
            { id: 'mis_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'mis_quali', title: '⚡ Misano Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'mis_sprint', title: '🏁 San Marino Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'mis_gp', title: '🏆 Gran Premio Red Bull di San Marino', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 17: Motegi (Japan)
    {
        weekNumber: 30,
        dateRange: "Sep 21 – Sep 27",
        title: "Round 17: Grand Prix of Japan (Motegi)",
        type: "race_week",
        gpId: "motegi",
        roundIndex: 16,
        flag: "🇯🇵",
        desc: "Mobility Resort Motegi. Downhill bridge straight into the heaviest carbon braking zone on the calendar.",
        activities: [
            { id: 'mot_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'mot_quali', title: '⚡ Motegi Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'mot_sprint', title: '🏁 Japanese Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'mot_gp', title: '🏆 Motul Grand Prix of Japan', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 18: Mandalika (Indonesia)
    {
        weekNumber: 31,
        dateRange: "Sep 28 – Oct 04",
        title: "Round 18: Indonesian Grand Prix (Mandalika)",
        type: "race_week",
        gpId: "mandalika",
        roundIndex: 17,
        flag: "🇮🇩",
        desc: "Pertamina Mandalika International Circuit on Lombok island. Fast, flowing coastal layout with high heat and track humidity.",
        activities: [
            { id: 'man_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'man_quali', title: '⚡ Mandalika Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'man_sprint', title: '🏁 Indonesian Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'man_gp', title: '🏆 Pertamina Grand Prix of Indonesia', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 19: Phillip Island (Australia)
    {
        weekNumber: 32,
        dateRange: "Oct 05 – Oct 11",
        title: "Round 19: Australian Grand Prix (Phillip Island)",
        type: "race_week",
        gpId: "phillip_island",
        roundIndex: 18,
        flag: "🇦🇺",
        desc: "Phillip Island Grand Prix Circuit. Ocean cliffs, high-speed Stoner Corner, and heavy rear tire management.",
        activities: [
            { id: 'pi_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'pi_quali', title: '⚡ Phillip Island Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'pi_sprint', title: '🏁 Australian Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'pi_gp', title: '🏆 Australian Motorcycle Grand Prix', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 20: Sepang (Malaysia)
    {
        weekNumber: 33,
        dateRange: "Oct 12 – Oct 18",
        title: "Round 20: Malaysian Grand Prix (Sepang)",
        type: "race_week",
        gpId: "sepang",
        roundIndex: 19,
        flag: "🇲🇾",
        desc: "Sepang International Circuit. Twin 900m parallel straights and high physical demands in tropical heat.",
        activities: [
            { id: 'sep_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'sep_quali', title: '⚡ Sepang Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'sep_sprint', title: '🏁 Malaysian Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'sep_gp', title: '🏆 PETRONAS Grand Prix of Malaysia', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 21: Portimão (Portugal)
    {
        weekNumber: 35,
        dateRange: "Oct 26 – Nov 01",
        title: "Round 21: Portuguese Grand Prix (Portimão)",
        type: "race_week",
        gpId: "portugal",
        roundIndex: 20,
        flag: "🇵🇹",
        desc: "Autódromo Internacional do Algarve. The famous rollercoaster with dramatic blind crests and plunging drops.",
        activities: [
            { id: 'por_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'por_quali', title: '⚡ Portimão Qualifying', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'por_sprint', title: '🏁 Portuguese Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint.' },
            { id: 'por_gp', title: '🏆 Grande Prémio de Portugal', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Grand Prix race.' }
        ]
    },

    // Round 22: Valencia Finale
    {
        weekNumber: 37,
        dateRange: "Nov 09 – Nov 15",
        title: "Round 22: Valencia Season Finale (Ricardo Tormo)",
        type: "race_week",
        gpId: "valencia",
        roundIndex: 21,
        flag: "🇪🇸",
        desc: "Circuit Ricardo Tormo in Cheste. The grand finale stadium amphitheater where World Champions are crowned!",
        activities: [
            { id: 'val_media', title: '🎙️ World Championship Title Decider Press Conference', day: 'Thursday', required: false, reward: { cash: 1500, hype: 40 }, actionType: 'media', desc: 'Global media briefing ahead of the championship finale.' },
            { id: 'val_pr', title: '⏱️ Practice (Direct Q2 Decider)', day: 'Friday', required: true, actionType: 'race_pr', desc: 'Mandatory practice.' },
            { id: 'val_quali', title: '⚡ Valencia Qualifying Shootout', day: 'Saturday', required: true, actionType: 'race_quali', desc: 'Mandatory qualifying.' },
            { id: 'val_sprint', title: '🏁 Valencia Finale Sprint Race', day: 'Saturday', required: true, actionType: 'race_sprint', desc: 'Mandatory Sprint race.' },
            { id: 'val_gp', title: '🏆 Gran Premio Motul de la Comunitat Valenciana', day: 'Sunday', required: true, actionType: 'race_gp', desc: 'Mandatory Season Finale Grand Prix!' }
        ]
    }
];

export class CalendarSystem {
    /**
     * Initializes or returns current season calendar state
     */
    static getCalendarState() {
        const state = gameState.getState();
        if (!state.calendar) {
            state.calendar = {
                currentWeekIndex: 0,
                completedActivities: {}, // { activityId: 'completed' | 'skipped' }
                seasonWeeks: JSON.parse(JSON.stringify(SEASON_WEEKS_TEMPLATE)),
                isDrawerOpen: false
            };
        }
        return state.calendar;
    }

    /**
     * Gets the currently active week object
     */
    static getCurrentWeek() {
        const cal = this.getCalendarState();
        if (cal.currentWeekIndex >= cal.seasonWeeks.length) {
            cal.currentWeekIndex = 0; // Wrap/reset for next season
        }
        return cal.seasonWeeks[cal.currentWeekIndex];
    }

    /**
     * Groups current week's activities by day in chronological order
     */
    static getWeekDaysGrouped() {
        const week = this.getCurrentWeek();
        const cal = this.getCalendarState();
        const state = gameState.getState();
        const daysMap = {};

        // Populate days
        week.activities.forEach(act => {
            const day = act.day || 'Midweek';
            if (!daysMap[day]) {
                daysMap[day] = [];
            }
            daysMap[day].push(act);
        });

        // Order days according to DAY_ORDER
        const activeDaysList = [];
        DAY_ORDER.forEach(d => {
            if (daysMap[d]) {
                activeDaysList.push({
                    dayName: d,
                    activities: daysMap[d]
                });
            }
        });

        // Determine day statuses sequentially
        // A day is completed if ALL its activities are completed or skipped (accounting for tier requirements)
        let foundActiveDay = false;

        activeDaysList.forEach((dayObj, idx) => {
            const allDone = dayObj.activities.every(act => {
                if (act.actionType === 'race_sprint' && state.tier < 3) {
                    return true; // Moto3/Moto2 skips sprints
                }
                const status = cal.completedActivities[act.id];
                return status === 'completed' || status === 'skipped';
            });

            if (allDone) {
                dayObj.status = 'completed'; // 🟢 All activities finished/skipped
            } else if (!foundActiveDay) {
                dayObj.status = 'active'; // 📍 Nearest nearest day that must be handled
                foundActiveDay = true;
            } else {
                dayObj.status = 'locked'; // 🔒 Locked behind earlier days
            }
        });

        return activeDaysList;
    }

    /**
     * Checks if a specific activity can be interacted with right now
     */
    static canInteractWithActivity(activityId) {
        const days = this.getWeekDaysGrouped();
        for (const d of days) {
            const act = d.activities.find(a => a.id === activityId);
            if (act) {
                return d.status === 'active';
            }
        }
        return false;
    }

    /**
     * Checks if all mandatory activities in the current week are finished
     */
    static canProceedToNextWeek() {
        const state = gameState.getState();
        const week = this.getCurrentWeek();
        const cal = this.getCalendarState();

        for (const act of week.activities) {
            if (act.required) {
                // In Moto3 / Moto2 (Tiers 1 & 2), Sprint races are only run in MotoGP Premier Class (Tier 3+)
                if (act.actionType === 'race_sprint' && state.tier < 3) {
                    continue;
                }

                const status = cal.completedActivities[act.id];
                if (status !== 'completed') {
                    return { canProceed: false, missingActivity: act };
                }
            }
        }
        return { canProceed: true };
    }

    /**
     * Attends an activity (claims rewards or launches race session)
     */
    static attendActivity(activityId) {
        const state = gameState.getState();
        const cal = this.getCalendarState();
        const week = this.getCurrentWeek();

        const act = week.activities.find(a => a.id === activityId);
        if (!act) return false;

        // Verify sequential day lock
        if (!this.canInteractWithActivity(activityId)) {
            gameState.addLog(`🔒 Day Locked: Complete earlier day activities first before attending "${act.title}".`);
            return false;
        }

        if (cal.completedActivities[activityId] === 'completed') return true;

        // Apply resource rewards if any
        if (act.reward) {
            if (act.reward.cash) state.cash += act.reward.cash;
            if (act.reward.telemetry) state.telemetry = Math.min(state.telemetryMax, state.telemetry + act.reward.telemetry);
            if (act.reward.science) state.science = Math.min(state.scienceMax, state.science + act.reward.science);
            if (act.reward.parts) state.parts = Math.min(state.partsMax, state.parts + act.reward.parts);
            if (act.reward.hype) state.hype += act.reward.hype;
        }

        cal.completedActivities[activityId] = 'completed';
        gameState.addLog(`📅 Attended: ${act.title}`);
        return true;
    }

    /**
     * Skips an optional activity
     */
    static skipActivity(activityId) {
        const state = gameState.getState();
        const cal = this.getCalendarState();
        const week = this.getCurrentWeek();

        const act = week.activities.find(a => a.id === activityId);
        if (!act) return false;

        // Verify sequential day lock
        if (!this.canInteractWithActivity(activityId)) {
            gameState.addLog(`🔒 Day Locked: Complete earlier day activities first before skipping "${act.title}".`);
            return false;
        }

        // Cannot skip mandatory activities (unless tier doesn't participate in sprint)
        if (act.required && !(act.actionType === 'race_sprint' && state.tier < 3)) {
            gameState.addLog(`⚠️ Cannot skip mandatory session: "${act.title}"!`);
            return false;
        }

        cal.completedActivities[activityId] = 'skipped';
        gameState.addLog(`⏭️ Skipped Optional: ${act.title}`);
        return true;
    }

    /**
     * Advances to the next week, automatically skipping empty weeks
     */
    static proceedToNextWeek() {
        const check = this.canProceedToNextWeek();
        if (!check.canProceed) {
            gameState.addLog(`⚠️ Cannot advance week! Complete mandatory activity: "${check.missingActivity.title}".`);
            return false;
        }

        const state = gameState.getState();
        const cal = this.getCalendarState();
        const week = this.getCurrentWeek();

        // Mark any remaining optional activities as skipped
        week.activities.forEach(a => {
            if (!cal.completedActivities[a.id]) {
                cal.completedActivities[a.id] = 'skipped';
            }
        });

        // Advance week index
        cal.currentWeekIndex += 1;

        // If season completed, loop/start new season
        if (cal.currentWeekIndex >= cal.seasonWeeks.length) {
            cal.currentWeekIndex = 0;
            cal.completedActivities = {};
            state.season += 1;
            gameState.addLog(`🎉 Season completed! Welcome to Season ${state.season}!`);
        }

        // Apply weekly passive production & injury healing
        RiderSystem.advancePaddockAfterRace(state.tier, state.raceState.currentGPRound);

        const newWeek = this.getCurrentWeek();
        if (newWeek.type === 'race_week' && typeof newWeek.roundIndex === 'number') {
            state.raceState.currentGPRound = newWeek.roundIndex;
            state.raceState.stage = 'FP1';
        }

        gameState.addLog(`📅 Advanced to Week ${newWeek.weekNumber}: ${newWeek.title} (${newWeek.dateRange})`);
        return true;
    }
}
