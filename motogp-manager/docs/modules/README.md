# MotoGP Manager - Core Modules Index

This directory contains the detailed technical documentation for each individual subsystem in the **MotoGP Manager** codebase.

---

## 📑 Module Catalog

| Document | Module Name | Scope & Core Responsibilities |
| :--- | :--- | :--- |
| **[01. Architecture & Engine](01-architecture-and-engine.md)** | Core Architecture | Game loop (`TickEngine`), state store (`GameStateStore`), save persistence (`SaveManager`), offline progress calculation, and environment configuration (`env.js`). |
| **[02. Economy & Garage](02-economy-and-garage.md)** | Economy & Hardware | 8 Production facilities (`PRODUCERS`), exponential cost math, passive/manual income, multiplier hierarchy, and bike hardware metrics (`BikeSystem`). |
| **[03. Research & Tech Tree](03-research-and-tech-tree.md)** | R&D Engineering | 30+ Tech nodes across Powertrain, Aerodynamics, Unified ECU, and Factory Storage with prerequisite trees, costs, and mechanical effects. |
| **[04. Riders & Paddock Staff](04-riders-and-paddock-staff.md)** | Personnel & Healthcare | 70+ Official riders (Moto3, Moto2, MotoGP), dynamic form, circuit affinity, 6-condition injury engine, reserve wildcards, and pit crew hiring. |
| **[05. Calendar & Season Schedule](05-calendar-and-season-schedule.md)** | Calendar & Agenda | 22 Official Grand Prix rounds, testing weeks, day-by-day progression, sequential locking, mandatory session gating, and developer rewind tooling. |
| **[06. Pre-Season Testing & Long-Run Sim](06-preseason-testing-and-longrun-sim.md)** | Testing & Telemetry | Sepang pre-season shakedowns, Prototype A vs B selection, 20-lap race distance simulations, thermal tire wear, fuel curves, and pit wall radio debriefs. |
| **[07. Race Weekend & Track Radar](07-race-weekend-and-track-radar.md)** | Racing & GPS Radar | Official FIM weekend stages (FP1, PR, Q1, Q2, Sprint, Race), live lap simulation loop, FIM flags, interactive race choices, and 22 circuit 2D SVG GPS radar maps. |
| **[08. Promotion & Prestige](08-promotion-and-prestige.md)** | Progression & Legacy | Category promotion criteria (Moto3 -> Moto2 -> MotoGP), prize money scaling, Heritage Token rebirth math, and permanent prestige perks. |
| **[09. UI & Views](09-ui-and-views.md)** | Frontend & Presentation | Flicker-free reactive DOM rendering architecture, navigation tabs, bottom agenda drawer, live race control, and interactive modal screens. |
