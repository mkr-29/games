# Entity-Component-System Architecture

## Overview
The prison manager game uses an Entity-Component-System (ECS) architecture for maximum flexibility and performance. This approach separates data (components) from behavior (systems) and entities (containers).

## Core Principles
- **Entities**: Unique IDs that represent game objects (inmate, guard, wall, door, etc.)
- **Components**: Pure data structures that define what an entity is/has
- **Systems**: Logic that operates on entities with specific component combinations
- **Events**: Communication mechanism between systems

## Entity Categories

### 1. Structural Entities
- Walls, doors, floors, windows
- Utility conduits (power, water, vents)
- Furniture (beds, toilets, tables, benches)

### 2. Personnel Entities
- Inmates (with varying security levels, needs, traits)
- Staff (guards, wardens, doctors, cooks, janitors, counselors)
- Visitors (family, lawyers, officials)

### 3. Management Entities
- Rooms (defined areas with specific functions)
- Workshops, yards, cafeterias, infirmaries
- Security zones, patrol routes

### 4. Abstract Entities
- Budgets, financial transactions
- Policies, regulations, schedules
- Events, incidents, reports
- Research projects, programs

## Component Types

### Spatial Components
- `Position`: x, y coordinates (grid-based)
- `Bounds`: width, height, collision shape
- `Rotation`: facing direction (0-360 degrees)
- `ZIndex`: rendering layer

### Visual Components
- `Sprite`: texture/animation reference
- `Color`: tint/color override
- `Visibility`: render flag, fade effects
- `Highlight`: selection/interaction indicator

### Behavioral Components
- `AIController`: current state, goals, priorities
- `Needs`: hunger, hygiene, health, comfort, family, recreation
- `Temperament`: aggression, cooperativeness, intelligence
- `Skills`: work proficiency, learning rate
- `Schedule`: assigned activities, time blocks

### Functional Components
- `Constructible`: build cost, time, prerequisites
- `PowerConsumer`: energy usage, backup requirements
- `WaterConsumer`: consumption, drainage needs
- `ContrabandHolder`: holds forbidden items
- `MedicalCondition`: illness, injury, treatment
- `Sentence`: remaining time, crime type, security level

### Management Components
- `BudgetItem`: cost, revenue, depreciation
- `StaffAssignment`: role, shift, qualifications
- `InmateClassification`: security level, privileges
- `WorkProgram`: type, productivity, security risk
- `Reputation`: with government, public, gangs

### State Components
- `Locked`: security state, access requirements
- `OnFire`: intensity, spread rate
- `UnderRenovation`: progress, disruption level
- `Contaminated`: biohazard, chemical levels
- `Monitored`: camera coverage, guard visibility

## Key Systems

### 1. Spatial Systems
- **MovementSystem**: Handles pathfinding and movement for mobile entities
- **CollisionSystem**: Prevents overlap, handles interactions
- **ConstructionSystem**: Manages building/placement of structures
- **VisionSystem**: Calculates line of sight, camera coverage

### 2. Behavioral Systems
- **NeedsSystem**: Updates needs over time, generates discomfort
- **TemperamentSystem**: Modifies behavior based on mood and traits
- **AISystem**: Implements goal-oriented behavior for inmates/staff
- **SocialSystem**: Handles interactions, relationships, gang formation

### 3. Facility Systems
- **UtilitySystem**: Manages power/water distribution and consumption
- **SecuritySystem**: Monitors contraband, alarms, lockdown status
- **SanitationSystem**: Tracks cleanliness, disease spread
- **MaintenanceSystem**: Handles wear and tear, repairs

### 4. Management Systems
- **EconomySystem**: Tracks budget, income, expenses, payroll
- **StaffingSystem**: Handles hiring, firing, training, assignments
- **InmateSystem**: Manages intake, classification, release, transfers
- **ReportingSystem**: Generates statistics, alerts, compliance reports
- **PolicySystem**: Enforces rules, schedules, privilege levels

### 5. Event Systems
- **IncidentSystem**: Detects and responds to riots, fights, escapes
- **MedicalSystem**: Handles sickness, injury, treatment
- **DisasterSystem**: Manages fires, floods, power outages
- **OpportunitySystem**: Triggers grants, inspections, positive events

## Component Examples

### Inmate Entity Components
```
Entity ID: 1001
- Position: {x: 15, y: 22}
- Bounds: {width: 1, height: 1}
- Sprite: {texture: "inmate_male", state: "idle"}
- Needs: {hunger: 0.3, hygiene: 0.7, health: 1.0, comfort: 0.8, family: 0.4, recreation: 0.6}
- Temperament: {aggression: 0.4, cooperativeness: 0.7, intelligence: 0.6}
- Skills: {cleaning: 0.5, cooking: 0.2, manufacturing: 0.8}
- Schedule: {current: "work", next_change: "12:00", activity: "license_plates"}
- InmateClassification: {security: "medium", privileges: ["yard", "work"]}
- Sentence: {remaining: 365, crime: "theft", security_level: 2}
```

### Wall Entity Components
```
Entity ID: 2005
- Position: {x: 10, y: 5}
- Bounds: {width: 1, height: 3}
- Sprite: {texture: "concrete_wall", variant: "straight"}
- Constructible: {cost: 50, build_time: 10, prerequisites: []}
- Locked: {state: "unlocked", keycard_required: false}
- PowerConsumer: {usage: 0, backup_required: false}
```

### Cafeteria Room Entity Components
```
Entity ID: 3001 (room marker)
- Position: {x: 8, y: 8} (center point)
- Bounds: {width: 6, height: 4} (area coverage)
- Sprite: {texture: "room_highlight", alpha: 0.2}
- Constructible: {cost: 0, build_time: 0, prerequisites: []} (defined by walls/furniture)
- RoomType: {type: "cafeteria", capacity: 20, efficiency: 1.0}
- UtilityConsumer: {power: 15, water: 8}
- StaffAssignment: {required_roles: ["cook"], min_staff: 2}
- Schedule: {open: "06:00", close: "18:00", meal_times: ["07:00", "12:00"]}
```

## Data Flow

### 1. Game Loop
```
Input → [Event Queue] → [System Pre-processing] → 
[Parallel Systems Execution] → [Collision Resolution] → 
[Post-processing] → [Render Preparation] → [GPU Render]
```

### 2. Information Flow Between Systems
- NeedsSystem → AISystem (generates goals based on unmet needs)
- TemperamentSystem → AISystem (modifies goal selection/urgency)
- AISystem → MovementSystem (generates movement commands)
- MovementSystem → CollisionSystem (tests proposed moves)
- CollisionSystem → PositionComponent (applies valid movement)
- UtilitySystem → PowerConsumer Components (updates available power)
- SecuritySystem → Locked Components (modifies lock states during lockdown)
- IncidentSystem → AISystem (triggers fear/aggression responses)
- EconomySystem → BudgetItem Components (applies income/expenses)
- ReportingSystem → All Systems (collects metrics for analytics)

### 3. Event System
```
[Any System] → [Event Queue] → [Event Dispatcher] → [Subscribed Systems]
```
Common Events:
- `InmateEnteredRoom`
- `ContrabandDetected`
- `StaffAssigned`
- `RoomCompleted`
- `BudgetChanged`
- `IncidentStarted` (riot, fight, escape)
- `MedicalEmergency`
- `ShiftChange`
- `PolicyUpdated`

## Performance Considerations

### 1. Component Storage
- **Array of Structures (AoS)**: Good for iteration cache locality
- **Structure of Arrays (SoA)**: Better for SIMD, used for frequently accessed components
- **Hybrid Approach**: Frequently accessed components (Position, Sprite) in SoA; others in AoS

### 2. System Parallelization
- **Read-only Systems**: Can run in parallel (NeedsSystem, TemperamentSystem)
- **Write-conflicting Systems**: Require locking or spatial partitioning (MovementSystem, ConstructionSystem)
- **Event-based Systems**: Naturally decoupled (IncidentSystem, ReportingSystem)

### 3. Spatial Partitioning
- **Grid-based**: Matches construction grid, efficient for neighbor queries
- **Quadtree**: For dynamic queries (vision, detection ranges)
- **Buckets**: For system-specific grouping (inmates by cell block, staff by zone)

## Extension Points

### 1. Modding Support
- **Custom Components**: Defined via JSON/XML schemas
- **Custom Systems**: Registered at runtime with priority ordering
- **Event Types**: Extensible through registration system
- **Data-driven**: Most behavior tunable through configuration files

### 2. Save/Load System
- **Entity Archetypes**: Predefined entity templates
- **Component Serialization**: Automatic JSON serialization
- **Versioning**: Schema evolution support
- **References**: Entity ID mapping during load

### 3. Debugging & Editor Tools
- **Entity Inspector**: View/modify any component
- **System Profiler**: Performance metrics per system
- **Visualization Overlays**: Needs heatmaps, utility flows, security coverage
- **Pause & Step**: Frame-by-frame execution for debugging

## Implementation Notes

### 1. Entity ID Management
- **Generation**: Monotonically increasing integers
- **Recycling**: Free list for reused IDs (with generation counters to prevent stale references)
- **References**: Strong references only during frame; weak references for cross-frame

### 2. Component Access Patterns
- **Direct Access**: Systems access components of entities they process
- **Queries**: Entity views for common component combinations (Position+Sprite for rendering)
- **Events**: Loose coupling for infrequent or broadcast communications

### 3. Memory Layout
- **Contiguous Storage**: Components of same type stored together
- **Alignment**: Cache-line aligned for SIMD operations
- **Padding**: Minimized through careful ordering

### 4. Thread Safety
- **Immutable Components**: During system execution (double-buffering for reads)
- **Atomic Updates**: For simple value changes
- **Message Passing**: For complex inter-system communication
- **Frame Sync**: All systems read from previous frame, write to next frame

This ECS architecture provides:
- High performance through cache-friendly data layouts
- Maximum flexibility for adding new entity types and behaviors
- Clear separation of concerns between data and logic
- Excellent moddability and extensibility
- Straightforward save/load and debugging capabilities