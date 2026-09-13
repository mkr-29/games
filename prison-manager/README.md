# Prison Manager

A 2D prison management simulation game built with modern web technologies.

## 🎮 Overview
Prison Manager is a browser-based prison management simulation where players design, build, and manage a correctional facility while balancing security, rehabilitation, budget, and inmate welfare.

## 🛠️ Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd prison-manager

# Install dependencies
npm install
```

### Development Commands
```bash
# Start development server with hot module replacement
npm run dev

# Run unit tests
npm test

# Run tests with visual interface
npm run test:ui

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure
```
prison-manager/
├── src/
│   ├── config.js          # Game configuration constants
│   ├── helpers.js         # Utility functions
│   ├── game.js            # Core game logic (functional components)
│   ├── main.js            # Entry point
│   └── __tests__/         # Test files
│       └── game.init.test.js
├── docs/                  # Documentation
├── index.html             # Main HTML file
├── package.json           # Dependencies and scripts
└── vite.config.js         # Vite configuration
```

## 🧪 Testing
The project uses Vitest for unit testing:
- Tests are located in `src/__tests__/`
- Run `npm test` to execute all tests
- Run `npm run test:ui` for a visual test runner

## 📚 Documentation
See the `docs/` directory for detailed game design and technical architecture:
- `docs/GAME_DESIGN.md` - Complete game design and mechanics
- `docs/technical/ECS_ARCHITECTURE.md` - Entity-Component-System architecture
- `docs/technical/DATA_MODELS.md` - Data models and relationships

## 🎯 Features
- Top-down 2D grid-based visualization
- Entity-component-system architecture
- Budget management with building costs
- Time system with adjustable speed
- Basic AI for inmates (needs-driven behavior)
- Staff patrol behavior with fatigue systems
- Entity inspection via click-to-view details
- Construction system for walls, doors, cells, canteens, yards
- Responsive UI with sidebar navigation

## 🚀 Getting Started
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open browser to http://localhost:3000
4. Use the build menu to construct facilities
5. Click on entities to view their details
6. Adjust game speed with the speed button
7. Pause/resume gameplay with the pause button

## 📝 License
MIT