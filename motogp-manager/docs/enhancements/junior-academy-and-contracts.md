# Enhancement 02: Rider Contract Market & Junior Talent Academy

- **Type**: Deep Tycoon Gameplay Expansion
- **Target Subsystem**: [`src/systems/RiderSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/RiderSystem.js) / [`src/systems/PromotionSystem.js`](file:///Users/mkr-27/Desktop/MY/MKR/games/motogp-manager/src/systems/PromotionSystem.js)
- **Status**: Proposed / Roadmap Feature

---

## 💡 Concept Overview

Currently, the player manages a single designated lead rider (`Marco Rossi`). In top-tier motorcycle racing management, team principals scout talent in the Red Bull MotoGP Rookies Cup and Moto3 Junior championships, negotiate multi-season contracts, manage salary demands, and navigate release buyout clauses.

This enhancement introduces a **Paddock Transfer Window**, **Contract Negotiations**, and a **Junior Talent Scouting Academy**.

---

## 🛠️ Feature Breakdown

### 1. Two-Rider Team Format
- Expand garage capacity from 1 rider to **2 active racing riders** (Bike #1 and Bike #2) per Grand Prix weekend.
- Team championship standings calculated from combined points of both riders.

### 2. Paddock Driver Transfer Market
- **Contract Duration**: 1, 2, or 3-year contracts.
- **Salary Demands**: Weekly salary deductions based on tier and rider skill rating.
- **Contract Negotiations**:
  - Sign-on bonus, performance bonuses for wins/podiums, and buyout release clauses.
  - Seduce riders from rival factory teams using high bike ratings and team reputation (Fan Hype).

### 3. Junior Talent Academy
- Invest Budget Cash and Science RP into a **MotoGP Junior Rider Academy**.
- Scout generated rookie talents with potential ceilings (e.g., *Potential: 94-98 / Current: 64*).
- Nurture young talents through Moto3 and promote them into your premier class team when veterans retire.

```mermaid
graph TD
    ACADEMY[Junior Talent Academy<br/>Rookies Cup / CEV JuniorGP] -->|Scout & Train| ROOKIE[16-Year Old Prospect<br/>High Potential Trait]
    ROOKIE -->|Promote| M3[Team Bike #2 (Moto3)]
    M3 -->|Season Development| M2[Moto2 Lead Seat]
    M2 -->|World Champion| FACTORY[Factory MotoGP Lead Rider]
```
