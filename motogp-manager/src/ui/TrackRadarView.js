// TrackRadarView.js - Live 2D Track GPS Radar & Interactive Circuit Telemetry Map

import { TrackMapSystem, CIRCUIT_GEOMETRIES } from '../systems/TrackMapSystem.js';
import { RaceSystem } from '../systems/RaceSystem.js';

export class TrackRadarView {
    static lastCircuitId = null;

    static render(state) {
        const rs = state.raceState;
        const gp = RaceSystem.getCurrentGP();
        const container = document.getElementById('track-radar-container');
        if (!container) return;

        const circuitId = gp.id || 'qatar';
        const geo = TrackMapSystem.getCircuitGeometry(circuitId);

        const leaderProgress = (rs.trackProgress || 0) / 100;
        const baseLapSec = Math.max(70, gp.baseSec || 95);

        // Flag states
        const flagState = rs.flagState || { status: 'GREEN', sector: null };
        const isYellowFlag = flagState.status === 'YELLOW';
        const isRedFlag = flagState.status === 'RED';
        const yellowSector = flagState.sector || 1;

        // Calculate all rider positions
        const riders = (rs.leaderboard && rs.leaderboard.length > 0) ? rs.leaderboard : [];
        const riderPoints = [];

        riders.forEach((r, idx) => {
            const pos = idx + 1;
            let prog = leaderProgress;

            if (r.dnf) {
                // If crashed, lock at crash sector position
                const crashProg = ((r.crashProgress || (idx * 0.13)) % 1.0);
                const pt = TrackMapSystem.getPointOnCircuit(circuitId, crashProg);
                riderPoints.push({
                    rider: r,
                    pos,
                    isUser: r.isUser,
                    isLeader: pos === 1,
                    isDnf: true,
                    pt
                });
                return;
            }

            if (pos > 1) {
                const gap = r.gapSeconds !== undefined ? r.gapSeconds : (pos - 1) * 0.75;
                const lapDelta = gap / baseLapSec;
                prog = ((leaderProgress - lapDelta) + 10.0) % 1.0;
            }

            const pt = TrackMapSystem.getPointOnCircuit(circuitId, prog);
            riderPoints.push({
                rider: r,
                pos,
                isUser: r.isUser,
                isLeader: pos === 1,
                isDnf: false,
                pt
            });
        });

        // Detect Slipstream Bubbles and Overtake Battles
        const slipstreamLinks = [];
        const battleMarkers = [];

        for (let i = 0; i < riderPoints.length - 1; i++) {
            const leader = riderPoints[i];
            const chaser = riderPoints[i + 1];

            if (leader.isDnf || chaser.isDnf) continue;

            const gap = Math.abs((chaser.rider.gapSeconds || 0) - (leader.rider.gapSeconds || 0));

            // Slipstream on straights when within 0.45s
            if (chaser.pt.isStraight && gap > 0 && gap < 0.45) {
                slipstreamLinks.push({
                    from: chaser.pt,
                    to: leader.pt,
                    gap: gap.toFixed(2)
                });
            }

            // Overtake clash in braking zones when gap < 0.20s
            if (chaser.pt.isBrakingZone && gap > 0 && gap < 0.20) {
                battleMarkers.push({
                    pt: leader.pt,
                    title: `⚔️ P${leader.pos} vs P${chaser.pos}`
                });
            }
        }

        // Render Turn Numbers if defined
        const turnsSVG = (geo.turns && geo.turns.length > 0) ? geo.turns.map(t => `
            <g transform="translate(${t.x}, ${t.y})" class="turn-number-marker" opacity="0.75">
                <circle cx="0" cy="0" r="6" fill="rgba(10, 14, 22, 0.85)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="0.8" />
                <text x="0" y="2.5" text-anchor="middle" font-size="6.5" font-weight="600" fill="rgba(255, 255, 255, 0.85)">${t.num}</text>
            </g>
        `).join('') : '';

        // SVG Render Elements
        const yellowGlowFilter = `
            <filter id="radar-yellow-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <filter id="radar-user-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        `;

        // Render Slipstream Aerodynamic Wake lines
        const slipstreamSVG = slipstreamLinks.map(link => `
            <line x1="${link.from.x}" y1="${link.from.y}" x2="${link.to.x}" y2="${link.to.y}"
                  stroke="rgba(0, 210, 255, 0.85)" stroke-width="3" stroke-dasharray="4,4" class="slipstream-trail">
                <animate attributeName="stroke-dashoffset" values="8;0" dur="0.3s" repeatCount="indefinite" />
            </line>
            <circle cx="${(link.from.x + link.to.x) / 2}" cy="${(link.from.y + link.to.y) / 2 - 8}" r="2" fill="#00d2ff" />
        `).join('');

        // Render Battle Clash Markers
        const battlesSVG = battleMarkers.map(b => `
            <g transform="translate(${b.pt.x}, ${b.pt.y - 14})" class="battle-clash-badge">
                <rect x="-35" y="-12" width="70" height="16" rx="4" fill="rgba(255, 51, 75, 0.9)" stroke="#fff" stroke-width="1" />
                <text x="0" y="0" text-anchor="middle" font-size="9" font-weight="bold" fill="#fff">${b.title}</text>
            </g>
        `).join('');

        // Render Rider Dots
        const dotsSVG = riderPoints.map(item => {
            const { rider, pos, isUser, isLeader, isDnf, pt } = item;

            if (isDnf) {
                return `
                    <g transform="translate(${pt.x}, ${pt.y})" class="rider-dot-dnf">
                        <circle cx="0" cy="0" r="6" fill="#ff334b" stroke="#fff" stroke-width="1.5" />
                        <text x="0" y="3" text-anchor="middle" font-size="7" font-weight="bold" fill="#fff">✕</text>
                        <text x="0" y="-8" text-anchor="middle" font-size="8" font-weight="bold" fill="#ff4757">CRASH</text>
                    </g>
                `;
            }

            if (isUser) {
                return `
                    <g transform="translate(${pt.x}, ${pt.y})" class="rider-dot-user" filter="url(#radar-user-glow)">
                        <circle cx="0" cy="0" r="10" fill="none" stroke="#00d2ff" stroke-width="1.5" class="user-pulse-ring">
                            <animate attributeName="r" values="6;14;6" dur="1.4s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.4s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="0" cy="0" r="6.5" fill="#00d2ff" stroke="#fff" stroke-width="2" />
                        <text x="0" y="2.5" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#000">P${pos}</text>
                        <g transform="translate(0, -12)">
                            <rect x="-30" y="-10" width="60" height="14" rx="3" fill="rgba(0, 210, 255, 0.95)" stroke="#fff" stroke-width="1" />
                            <text x="0" y="0" text-anchor="middle" font-size="8" font-weight="bold" fill="#000">⭐ YOU (P${pos})</text>
                        </g>
                    </g>
                `;
            }

            if (isLeader) {
                return `
                    <g transform="translate(${pt.x}, ${pt.y})" class="rider-dot-leader">
                        <circle cx="0" cy="0" r="5.5" fill="#ffb700" stroke="#fff" stroke-width="1.5" />
                        <text x="0" y="2.5" text-anchor="middle" font-size="7" font-weight="bold" fill="#000">1</text>
                        <g transform="translate(0, -10)">
                            <rect x="-24" y="-8" width="48" height="12" rx="3" fill="rgba(255, 183, 0, 0.9)" />
                            <text x="0" y="1" text-anchor="middle" font-size="7" font-weight="bold" fill="#000">👑 ${rider.name.split(' ')[1] || rider.name}</text>
                        </g>
                    </g>
                `;
            }

            // Top 8 AI Riders get distinct numbered dots, rest smaller field dots
            if (pos <= 8) {
                return `
                    <g transform="translate(${pt.x}, ${pt.y})" class="rider-dot-ai">
                        <circle cx="0" cy="0" r="4.5" fill="#1e2430" stroke="#00e676" stroke-width="1.2" />
                        <text x="0" y="2" text-anchor="middle" font-size="6.5" font-weight="bold" fill="#fff">${pos}</text>
                    </g>
                `;
            }

            // Field Riders
            return `
                <circle cx="${pt.x}" cy="${pt.y}" r="3" fill="#8b9bb4" stroke="#0b0e14" stroke-width="1" class="rider-dot-field" />
            `;
        }).join('');

        const trackStrokeClass = isRedFlag ? 'track-red-flag' : (isYellowFlag ? 'track-yellow-flag' : 'track-normal');

        container.innerHTML = `
            <div class="track-radar-header">
                <div class="radar-title-box">
                    <span class="radar-live-icon">📡</span>
                    <strong>LIVE 2D CIRCUIT RADAR</strong>
                    <span class="radar-circuit-tag">${gp.flag} ${gp.title}</span>
                </div>
                <div class="radar-legend-bar">
                    <span class="legend-item"><span class="dot-sample user-dot"></span> You</span>
                    <span class="legend-item"><span class="dot-sample leader-dot"></span> P1 Leader</span>
                    <span class="legend-item"><span class="dot-sample slip-dot"></span> 💨 Slipstream</span>
                    <span class="legend-item"><span class="dot-sample battle-dot"></span> ⚔️ Battle</span>
                </div>
            </div>

            <div class="track-radar-viewport">
                <svg viewBox="${geo.viewBox}" class="track-radar-svg">
                    <defs>${yellowGlowFilter}</defs>

                    <!-- Runoff Curb Layer -->
                    <path d="${geo.path}" fill="none" stroke="#222b3d" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />

                    <!-- Asphalt Racing Line -->
                    <path d="${geo.path}" fill="none" stroke="#121620" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" class="${trackStrokeClass}" />

                    <!-- Inner Guide Dash -->
                    <path d="${geo.path}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="6,6" />

                    <!-- Turn Number Markers -->
                    <g class="radar-turns">${turnsSVG}</g>

                    <!-- Start / Finish Line Banner -->
                    <g transform="translate(${geo.startFinish.x}, ${geo.startFinish.y}) rotate(${geo.startFinish.angle})">
                        <line x1="0" y1="-8" x2="0" y2="8" stroke="#fff" stroke-width="2.5" stroke-dasharray="2,2" />
                        <text x="-4" y="-12" font-size="8" font-weight="bold" fill="#fff">🏁 S/F</text>
                    </g>

                    <!-- Sector Splices & Labels -->
                    <g class="sector-markers">
                        <text x="30" y="25" font-size="8" font-weight="bold" fill="rgba(255,255,255,0.5)">S1</text>
                        <text x="450" y="35" font-size="8" font-weight="bold" fill="rgba(255,255,255,0.5)">S2</text>
                        <text x="460" y="280" font-size="8" font-weight="bold" fill="rgba(255,255,255,0.5)">S3</text>
                        <text x="35" y="280" font-size="8" font-weight="bold" fill="rgba(255,255,255,0.5)">S4</text>
                    </g>

                    <!-- Slipstream Aero Wake Lines -->
                    <g class="radar-slipstreams">${slipstreamSVG}</g>

                    <!-- Overtake Battle Badges -->
                    <g class="radar-battles">${battlesSVG}</g>

                    <!-- Real-Time Rider GPS Dots -->
                    <g class="radar-riders">${dotsSVG}</g>
                </svg>

                <!-- Floating Caution Notice if Yellow Flag -->
                ${isYellowFlag ? `
                    <div class="radar-caution-overlay">
                        🟨 SECTOR ${yellowSector} CAUTION ZONE • NO OVERTAKING
                    </div>
                ` : ''}

                <!-- Floating Track Weather & Temp Overlay -->
                <div class="radar-weather-badge">
                    ${rs.weather === 'wet' ? '🌧️ Wet Track' : '☀️ Dry Track'} • ${rs.trackTempC || 28}°C
                </div>
            </div>
        `;
    }
}
