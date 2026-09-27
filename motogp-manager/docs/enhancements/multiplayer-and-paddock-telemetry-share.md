# Enhancement 04: Asynchronous Time-Trial & Paddock Telemetry Cloud

- **Type**: Community & Social Features
- **Target Subsystem**: New `src/services/TelemetryCloudService.js` / [`src/ui/PreSeasonTestView.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/PreSeasonTestView.js)
- **Status**: Proposed / Medium Priority

---

## 💡 Concept Overview

Allows players to compare machine setups, benchmark lap times, and race against ghost telemetry traces of other team principals worldwide without requiring a real-time multiplayer server.

---

## 🛠️ Feature Breakdown

### 1. Compressed Setup Code Sharing
- Generate a shareable, compact URL parameter or hash string containing:
  - Bike hardware configuration (Engine HP, Aero, Chassis Grip, ECU).
  - Selected tire compound and engine map.
  - Sepang test sector splits.
- Example: `https://motogp-manager.app/?setup=B84-A62-C75-E50-SMED-T117.240`

### 2. Global Pre-Season Time Attack Leaderboard
- Asynchronous API endpoints (e.g., lightweight Cloudflare Worker or serverless functions):
  - Post fastest Sepang or Jerez pre-season test lap times.
  - Weekly leaderboards categorized by Tier (Moto3, Moto2, MotoGP).

### 3. Ghost Radar Telemetry
- In [`TrackRadarView.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/ui/TrackRadarView.js), display a translucent **Ghost Dot** representing the community world record lap or a friend's best qualifying run.
- Real-time delta readout: `Delta vs Ghost: -0.142s (Sector 2)`.
