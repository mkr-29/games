// Main entry point for the Prison Manager game
import './config.js';
import './helpers.js';
import { FinanceSystem } from './finance.js';

// Game State
let gameState = {
  entities: [],
  structures: [],
  selectedBuildType: null,
  isBuilding: false,
  inmates: [],
  staff: [],
  budget: CONFIG.STARTING_BUDGET,
  day: CONFIG.STARTING_DAY,
  timeOfDay: CONFIG.STARTING_TIME,
  finance: new FinanceSystem(CONFIG.STARTING_BUDGET)
};

// Game Control State
let controlState = {
  currentSpeedIndex: 1, // Start at 1x
  isPaused: false,
  lastTimestamp: 0
};

// DOM Elements Cache
let domElements = {};

// Initialize the game
function initGame() {
  cacheDomElements();
  setupGrid();
  createInitialEntities();
  setupEventListeners();
  startGameLoop();
}

// Cache DOM elements for easy access
function cacheDomElements() {
  // Ensure #app exists
  let app = document.getElementById('app');
  if (!app) {
    app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
  }

  // Function to get or create element by id
  const getOrCreateId = (id, tag = 'div') => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag);
      el.id = id;
      app.appendChild(el);
    }
    return el;
  };

  // Function to get or create element by class name within app
  const getOrCreateClass = (className, tag = 'div') => {
    let el = app.querySelector('.' + className);
    if (!el) {
      el = document.createElement(tag);
      el.className = className;
      app.appendChild(el);
      // If it's header, ensure it contains a p
      if (className === 'header' && tag === 'div') {
        const p = document.createElement('p');
        el.appendChild(p);
      }
    }
    return el;
  };

  // Get or create main elements
  domElements = {
    prisonGrid: getOrCreateId('prison-grid'),
    buildMenu: getOrCreateId('build-menu'),
    pauseBtn: getOrCreateId('pause-btn', 'button'),
    speedBtn: getOrCreateId('speed-btn', 'button'),
    emergencyBtn: getOrCreateId('emergency-btn', 'button'),
    saveBtn: getOrCreateId('save-btn', 'button'),
    loadBtn: getOrCreateId('load-btn', 'button'),
    inmateCountEl: getOrCreateId('inmate-count'),
    staffCountEl: getOrCreateId('staff-count'),
    budgetEl: getOrCreateId('budget'),
    headerTimeEl: document.getElementById('header-time-text') || getOrCreateClass('header', 'div').querySelector('p'),
    financeModal: getOrCreateId('finance-modal'),
    toastNotification: getOrCreateId('toast-notification'),
    managementModal: getOrCreateId('management-modal'),
    cancelBuildBtn: document.getElementById('cancel-build-btn'),
    sidebarInmateBadge: document.getElementById('sidebar-inmate-badge'),
    sidebarStaffBadge: document.getElementById('sidebar-staff-badge')
  };
  domElements.saveBtn.textContent = '💾 Save';
  domElements.loadBtn.textContent = '📂 Load';
  domElements.budgetEl.title = 'Click to open Financial Dashboard';

  // Create finance modal structure if missing
  if (domElements.financeModal && domElements.financeModal.children.length === 0) {
    domElements.financeModal.innerHTML = `
      <div class="finance-modal-content">
        <div class="finance-modal-header">
          <h2><span>🏦</span> Treasury & Financial System</h2>
          <button class="close-btn" id="close-finance-modal" aria-label="Close">×</button>
        </div>
        <div class="finance-tabs">
          <button class="finance-tab-btn active" data-tab="overview">Overview</button>
          <button class="finance-tab-btn" data-tab="income">Income</button>
          <button class="finance-tab-btn" data-tab="expenses">Expenses</button>
          <button class="finance-tab-btn" data-tab="ledger">Ledger</button>
          <button class="finance-tab-btn" data-tab="grants">Grants & Bailouts</button>
        </div>
        <div class="finance-tab-pane" id="finance-tab-content"></div>
      </div>
    `;
  }

  // Create management modal structure if missing
  if (domElements.managementModal && domElements.managementModal.children.length === 0) {
    domElements.managementModal.innerHTML = `
      <div class="finance-modal-content" style="max-width: 820px;">
        <div class="finance-modal-header">
          <h2 id="mgmt-modal-title"><span>📋</span> Management</h2>
          <button class="close-btn" id="close-mgmt-modal" aria-label="Close">×</button>
        </div>
        <div class="finance-tab-pane" id="mgmt-modal-content"></div>
      </div>
    `;
  }

  // Create build options if buildMenu exists and has no options yet
  if (domElements.buildMenu && domElements.buildMenu.children.length === 0) {
    const buildTypes = [
      { type: 'wall', label: 'Wall', icon: '🧱', cost: CONFIG.WALL_COST },
      { type: 'door', label: 'Door', icon: '🚪', cost: CONFIG.DOOR_COST },
      { type: 'cell', label: 'Cell', icon: '🛏️', cost: CONFIG.CELL_COST },
      { type: 'canteen', label: 'Canteen', icon: '🍽️', cost: CONFIG.CANTEEN_COST },
      { type: 'yard', label: 'Yard', icon: '🏃', cost: CONFIG.YARD_COST },
      { type: 'solitary_cell', label: 'Solitary', icon: '🔒', cost: CONFIG.SOLITARY_CELL_COST },
      { type: 'kitchen', label: 'Kitchen', icon: '🍳', cost: CONFIG.KITCHEN_COST },
      { type: 'infirmary', label: 'Infirmary', icon: '🏥', cost: CONFIG.INFIRMARY_COST },
      { type: 'workshop', label: 'Workshop', icon: '🔨', cost: CONFIG.WORKSHOP_COST }
    ];
    buildTypes.forEach(bt => {
      const btn = document.createElement('button');
      btn.className = 'build-option';
      btn.dataset.type = bt.type;
      btn.innerHTML = `<span>${bt.icon}</span> <span>${bt.label}</span> <span class="build-cost">$${bt.cost}</span>`;
      domElements.buildMenu.appendChild(btn);
    });
  }

  // Create entity modal if missing
  const entityModal = getOrCreateId('entity-modal');
  if (entityModal.children.length === 0) {
    entityModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-title"></h3>
          <button class="close-btn" id="close-modal">×</button>
        </div>
        <div id="modal-content"></div>
      </div>
    `;
  }

  // Create sidebar section if missing
  const sidebarSection = getOrCreateClass('sidebar-section', 'nav');
  if (sidebarSection.children.length === 0) {
    sidebarSection.innerHTML = `
      <a href="#" data-section="overview">Overview</a>
      <a href="#" data-section="inmates">Inmates</a>
      <a href="#" data-section="staff">Staff</a>
      <a href="#" data-section="finances">Finances</a>
    `;
  }
}

// Setup the game grid
function setupGrid() {
  const grid = domElements.prisonGrid;
  grid.style.width = `${CONFIG.GRID_SIZE * CONFIG.CELL_SIZE}px`;
  grid.style.height = `${CONFIG.GRID_SIZE * CONFIG.CELL_SIZE}px`;

  // Create grid cells for visual reference
  for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
    for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.style.left = `${x * CONFIG.CELL_SIZE}px`;
      cell.style.top = `${y * CONFIG.CELL_SIZE}px`;
      cell.style.width = `${CONFIG.CELL_SIZE}px`;
      cell.style.height = `${CONFIG.CELL_SIZE}px`;
      grid.appendChild(cell);
    }
  }
}

// Create initial game entities
function createInitialEntities() {
  // Create perimeter walls
  createWall(0, 0, CONFIG.GRID_SIZE, 1); // Top wall
  createWall(0, CONFIG.GRID_SIZE-1, CONFIG.GRID_SIZE, 1); // Bottom wall
  createWall(0, 0, 1, CONFIG.GRID_SIZE); // Left wall
  createWall(CONFIG.GRID_SIZE-1, 0, 1, CONFIG.GRID_SIZE); // Right wall

  // Create entrance
  createDoor(Math.floor(CONFIG.GRID_SIZE/2) - 1, 0, 2, 1);

  // Create initial staff
  createGuard(5, 5);
  createGuard(5, 6);

  // Create initial inmates
  createInmate(10, 10);
  createInmate(12, 12);
  createInmate(8, 14);

  updateStats();
}

// Create a wall structure
function createWall(x, y, width, height) {
  const wall = {
    id: Helpers.generateId('wall'),
    type: 'wall',
    x: x, y: y, width: width, height: height,
    element: null
  };

  gameState.structures.push(wall);
  renderStructure(wall);
  return wall;
}

// Create a door structure
function createDoor(x, y, width, height) {
  const door = {
    id: Helpers.generateId('door'),
    type: 'door',
    x: x, y: y, width: width, height: height,
    element: null,
    isOpen: true
  };

  gameState.structures.push(door);
  renderStructure(door);
  return door;
}

// Create an inmate entity
function createInmate(x, y) {
  const inmate = {
    id: Helpers.generateId('inmate'),
    type: 'inmate',
    x: x, y: y,
    name: `Inmate ${gameState.inmates.length + 1}`,
    needs: {
      hunger: Math.random() * 0.3,
      hygiene: Math.random() * 0.3,
      health: 1.0,
      comfort: Math.random() * 0.5,
      family: Math.random() * 0.4,
      recreation: Math.random() * 0.5
    },
    temperament: {
      aggression: Math.random() * 0.5,
      cooperativeness: Math.random() * 0.7,
      intelligence: Math.random() * 0.6
    },
    skills: {
      license_plates: Math.random() * 0.5,
      laundry: Math.random() * 0.5,
      kitchen: Math.random() * 0.5,
      farming: Math.random() * 0.5,
      maintenance: Math.random() * 0.5,
      tailoring: Math.random() * 0.5,
      carpentry: Math.random() * 0.5,
      metalwork: Math.random() * 0.5
    },
    status: {
      isIdle: false,
      isWorking: false,
      isInCell: false,
      isInYard: false,
      contraband: [],
      gangAffiliation: null,
      reputation: {
        guards: 0,
        inmates: 0,
        warden: 0
      },
      health: 1.0,
      energy: 1.0,
      stress: Math.random() * 0.3
    },
    schedule: {
      currentActivity: 'idle',
      activityStartTime: performance.now(),
      activityEndTime: performance.now() + (60 * 60 * 1000), // 1 hour
      nextActivity: 'idle'
    },
    element: null
  };

  gameState.entities.push(inmate);
  gameState.inmates.push(inmate);
  renderEntity(inmate);
  return inmate;
}

// Create a guard entity
function createGuard(x, y) {
  const guard = {
    id: Helpers.generateId('guard'),
    type: 'guard',
    x: x, y: y,
    name: `Guard ${gameState.staff.length + 1}`,
    role: 'GUARD',
    attributes: {
      vigilance: 0.7 + Math.random() * 0.3,
      compassion: 0.5 + Math.random() * 0.3,
      authority: 0.6 + Math.random() * 0.4,
      stamina: 0.7 + Math.random() * 0.3,
      stressResistance: 0.6 + Math.random() * 0.4
    },
    status: {
      isOnDuty: true,
      currentAssignment: 'patrol',
      fatigue: Math.random() * 0.3,
      stress: Math.random() * 0.3,
      morale: 0.7 + Math.random() * 0.3,
      health: 1.0
    },
    schedule: {
      shiftStart: '06:00',
      shiftEnd: '18:00',
      breakTimes: [{start: '12:00', end: '12:30'}],
      overtimeHours: 0
    },
    performance: {
      effectiveness: 0.7 + Math.random() * 0.3,
      reliability: 0.7 + Math.random() * 0.3,
      incidentResponse: 0.6 + Math.random() * 0.4,
      inmateRelations: 0.6 + Math.random() * 0.4
    },
    element: null
  };

  gameState.entities.push(guard);
  gameState.staff.push(guard);
  renderEntity(guard);
  return guard;
}

// Render an entity to the screen
function renderEntity(entity) {
  // Remove existing element if any
  if (entity.element && entity.element.parentNode) {
    entity.element.parentNode.removeChild(entity.element);
  }

  const element = document.createElement('div');
  element.className = `entity ${entity.type}`;
  element.style.left = `${entity.x * CONFIG.CELL_SIZE + (CONFIG.CELL_SIZE - 20) / 2}px`;
  element.style.top = `${entity.y * CONFIG.CELL_SIZE + (CONFIG.CELL_SIZE - 20) / 2}px`;

  // Add tooltip/info on click
  element.addEventListener('click', (e) => {
    e.stopPropagation();
    showEntityDetails(entity);
  });

  // Add drag capability for building/testing
  if (gameState.isBuilding) {
    element.style.cursor = 'pointer';
  }

  domElements.prisonGrid.appendChild(element);
  entity.element = element;
}

// Render a structure to the screen
function renderStructure(structure) {
  // Remove existing element if any
  if (structure.element && structure.element.parentNode) {
    structure.element.parentNode.removeChild(structure.element);
  }

  const element = document.createElement('div');
  element.className = `structure ${structure.type}`;
  element.style.left = `${structure.x * CONFIG.CELL_SIZE}px`;
  element.style.top = `${structure.y * CONFIG.CELL_SIZE}px`;
  element.style.width = `${structure.width * CONFIG.CELL_SIZE}px`;
  element.style.height = `${structure.height * CONFIG.CELL_SIZE}px`;

  // For doors, show open/closed state
  if (structure.type === 'door') {
    element.style.backgroundColor = structure.isOpen ? '#8e44ad' : '#5d216f';
    element.style.opacity = structure.isOpen ? 0.7 : 1.0;
  }

  domElements.prisonGrid.appendChild(element);
  structure.element = element;
}

// Show entity details in a modal
function showEntityDetails(entity) {
  const modal = document.getElementById('entity-modal');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('modal-content');

  const icon = entity.type === 'inmate' ? '👤' : '👮';
  title.innerHTML = `${icon} ${entity.name || entity.id} <span style="font-size:11px; font-weight:600; text-transform:uppercase; color:#94a3b8; margin-left:6px;">(${entity.type})</span>`;

  let details = '';
  if (entity.type === 'inmate') {
    const stressPct = Math.round((entity.status?.stress || 0) * 100);
    const stressColor = stressPct > 70 ? '#ef4444' : stressPct > 40 ? '#f59e0b' : '#10b981';

    details = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
        <div style="background:#0f172a; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Security Level</div>
          <div style="font-size:14px; font-weight:700; color:#38bdf8;">Medium</div>
        </div>
        <div style="background:#0f172a; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Activity</div>
          <div style="font-size:14px; font-weight:700; text-transform:capitalize; color:#f8fafc;">${entity.schedule?.currentActivity || 'Idle'}</div>
        </div>
      </div>

      <div class="form-group">
        <strong>Status & Vitals:</strong>
        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span>Stress Level:</span> <span style="color:${stressColor}; font-weight:700;">${stressPct}%</span>
        </div>
        <div class="inspector-bar"><div class="inspector-bar-fill" style="width:${stressPct}%; background:${stressColor};"></div></div>

        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span>Health:</span> <span style="color:#34d399; font-weight:700;">${Helpers.formatPercent(entity.needs?.health || 1)}%</span>
        </div>
        <div class="inspector-bar"><div class="inspector-bar-fill" style="width:${Helpers.formatPercent(entity.needs?.health || 1)}%; background:#10b981;"></div></div>

        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span>Energy:</span> <span style="font-weight:700; color:#38bdf8;">${Helpers.formatPercent(entity.status?.energy || 1)}%</span>
        </div>
        <div class="inspector-bar"><div class="inspector-bar-fill" style="width:${Helpers.formatPercent(entity.status?.energy || 1)}%; background:#3b82f6;"></div></div>
      </div>

      <div class="form-group">
        <strong>Inmate Needs:</strong>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; color:#cbd5e1;">
          <div>🍽️ Hunger: <strong>${Helpers.formatPercent(entity.needs?.hunger || 0)}%</strong></div>
          <div>🚿 Hygiene: <strong>${Helpers.formatPercent(entity.needs?.hygiene || 0)}%</strong></div>
          <div>🛏️ Comfort: <strong>${Helpers.formatPercent(entity.needs?.comfort || 0)}%</strong></div>
          <div>🏃 Rec: <strong>${Helpers.formatPercent(entity.needs?.recreation || 0)}%</strong></div>
          <div>👪 Family: <strong>${Helpers.formatPercent(entity.needs?.family || 0)}%</strong></div>
          <div>💼 Working: <strong>${entity.status?.isWorking ? 'Yes' : 'No'}</strong></div>
        </div>
      </div>
    `;
  } else if (entity.type === 'guard' || entity.type === 'staff') {
    const fatiguePct = Math.round((entity.status?.fatigue || 0) * 100);
    const moralePct = Math.round((entity.status?.morale || 0.8) * 100);

    details = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
        <div style="background:#0f172a; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Role</div>
          <div style="font-size:14px; font-weight:700; color:#38bdf8;">${entity.role || 'GUARD'}</div>
        </div>
        <div style="background:#0f172a; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700;">Duty Status</div>
          <div style="font-size:14px; font-weight:700; color:#10b981;">${entity.status?.isOnDuty ? 'On Patrol' : 'Off Duty'}</div>
        </div>
      </div>

      <div class="form-group">
        <strong>Condition:</strong>
        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span>Fatigue:</span> <span style="font-weight:700; color:${fatiguePct > 60 ? '#f59e0b' : '#38bdf8'};">${fatiguePct}%</span>
        </div>
        <div class="inspector-bar"><div class="inspector-bar-fill" style="width:${fatiguePct}%; background:${fatiguePct > 60 ? '#f59e0b' : '#38bdf8'};"></div></div>

        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span>Morale:</span> <span style="font-weight:700; color:#34d399;">${moralePct}%</span>
        </div>
        <div class="inspector-bar"><div class="inspector-bar-fill" style="width:${moralePct}%; background:#10b981;"></div></div>
      </div>

      <div class="form-group">
        <strong>Attributes:</strong>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; color:#cbd5e1;">
          <div>👁️ Vigilance: <strong>${Helpers.formatPercent(entity.attributes?.vigilance || 0.7)}%</strong></div>
          <div>⭐ Authority: <strong>${Helpers.formatPercent(entity.attributes?.authority || 0.7)}%</strong></div>
          <div>❤️ Compassion: <strong>${Helpers.formatPercent(entity.attributes?.compassion || 0.5)}%</strong></div>
          <div>⚡ Stamina: <strong>${Helpers.formatPercent(entity.attributes?.stamina || 0.7)}%</strong></div>
        </div>
      </div>
    `;
  } else {
    details = `<p>Basic entity details.</p>`;
  }

  content.innerHTML = details;
  modal.style.display = 'flex';
}

// Open Facility Management Modal (Overview, Inmates, Staff)
function openManagementModal(section = 'overview') {
  const modal = document.getElementById('management-modal');
  const title = document.getElementById('mgmt-modal-title');
  const content = document.getElementById('mgmt-modal-content');
  if (!modal || !content) return;

  if (section === 'overview') {
    title.innerHTML = `<span>📊</span> Facility Management Overview`;
    const cellsCount = gameState.structures.filter(s => s.type === 'cell').length;
    const capacity = cellsCount * 2;
    const staffRatio = gameState.inmates.length > 0
      ? (gameState.staff.length / gameState.inmates.length).toFixed(1)
      : 'N/A';

    content.innerHTML = `
      <div class="metric-grid">
        <div class="metric-card highlight">
          <div class="metric-title">Inmate Population</div>
          <div class="metric-value">${gameState.inmates.length} <span style="font-size:13px; color:#94a3b8;">/ ${capacity} cap</span></div>
          <div class="metric-sub">${cellsCount} housing cells built</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Security Personnel</div>
          <div class="metric-value">${gameState.staff.length} guards</div>
          <div class="metric-sub">Staff:Inmate ratio 1:${staffRatio}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Constructed Structures</div>
          <div class="metric-value">${gameState.structures.length}</div>
          <div class="metric-sub">Active facility footprint</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Facility Security</div>
          <div class="metric-value" style="color:#10b981;">SECURE</div>
          <div class="metric-sub">Zero active incidents</div>
        </div>
      </div>

      <div style="background:#0f172a; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; margin-top:16px;">
        <h4 style="font-size:14px; margin-bottom:8px; color:#f8fafc;">Warden Operational Briefing</h4>
        <p style="font-size:13px; color:#94a3b8; line-height:1.6; margin-bottom:12px;">
          Your facility is operating normally on <strong>Day ${gameState.day}</strong>. Treasury balance stands at <strong>${Helpers.formatCurrency(gameState.budget)}</strong>.
        </p>
        <div style="display:flex; gap:10px;">
          <button class="ui-btn" id="open-finances-from-mgmt">
            🏦 Open Financial Ledger & Treasury
          </button>
        </div>
      </div>
    `;

    document.getElementById('open-finances-from-mgmt')?.addEventListener('click', () => {
      modal.style.display = 'none';
      openFinanceModal();
    });
  } else if (section === 'inmates') {
    title.innerHTML = `<span>👥</span> Inmate Population Directory (${gameState.inmates.length})`;
    content.innerHTML = `
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Security</th>
            <th>Activity</th>
            <th>Stress</th>
            <th>Health</th>
            <th style="text-align:right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${gameState.inmates.map((inm, idx) => `
            <tr>
              <td><strong>${inm.name}</strong></td>
              <td><span class="status-badge stable">Medium</span></td>
              <td style="text-transform:capitalize; color:#94a3b8;">${inm.schedule?.currentActivity || 'Idle'}</td>
              <td style="color:${(inm.status?.stress || 0) > 0.6 ? '#ef4444' : '#10b981'}; font-weight:700;">${Math.round((inm.status?.stress || 0) * 100)}%</td>
              <td style="color:#34d399; font-weight:700;">${Helpers.formatPercent(inm.needs?.health || 1)}%</td>
              <td style="text-align:right;">
                <button class="ui-btn inspect-inmate-btn" data-index="${idx}" style="padding:4px 8px; font-size:11px;">Inspect</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    content.querySelectorAll('.inspect-inmate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        modal.style.display = 'none';
        showEntityDetails(gameState.inmates[idx]);
      });
    });
  } else if (section === 'staff') {
    title.innerHTML = `<span>👮</span> Correctional Staff Directory (${gameState.staff.length})`;
    content.innerHTML = `
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Assignment</th>
            <th>Fatigue</th>
            <th>Morale</th>
            <th style="text-align:right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${gameState.staff.map((st, idx) => `
            <tr>
              <td><strong>${st.name}</strong></td>
              <td><span class="status-badge improving">${st.role || 'GUARD'}</span></td>
              <td style="text-transform:capitalize; color:#94a3b8;">${st.status?.currentAssignment || 'Patrol'}</td>
              <td style="font-weight:700; color:${(st.status?.fatigue || 0) > 0.6 ? '#f59e0b' : '#38bdf8'};">${Math.round((st.status?.fatigue || 0) * 100)}%</td>
              <td style="font-weight:700; color:#10b981;">${Math.round((st.status?.morale || 0.8) * 100)}%</td>
              <td style="text-align:right;">
                <button class="ui-btn inspect-staff-btn" data-index="${idx}" style="padding:4px 8px; font-size:11px;">Inspect</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    content.querySelectorAll('.inspect-staff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        modal.style.display = 'none';
        showEntityDetails(gameState.staff[idx]);
      });
    });
  }

  modal.style.display = 'flex';
}

// Setup event listeners
function setupEventListeners() {
  const cancelBtn = document.getElementById('cancel-build-btn');

  // Build menu options
  document.querySelectorAll('.build-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.build-option').forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');

      gameState.selectedBuildType = option.dataset.type;
      gameState.isBuilding = true;
      domElements.prisonGrid.style.cursor = 'crosshair';
      if (cancelBtn) cancelBtn.style.display = 'inline-block';
    });
  });

  // Cancel build button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      gameState.isBuilding = false;
      gameState.selectedBuildType = null;
      document.querySelectorAll('.build-option').forEach(opt => opt.classList.remove('active'));
      domElements.prisonGrid.style.cursor = 'default';
      cancelBtn.style.display = 'none';
    });
  }

  // Grid click for building
  domElements.prisonGrid.addEventListener('click', (e) => {
    if (!gameState.isBuilding || !gameState.selectedBuildType) return;

    const costs = {
      wall: CONFIG.WALL_COST,
      door: CONFIG.DOOR_COST,
      cell: CONFIG.CELL_COST,
      canteen: CONFIG.CANTEEN_COST,
      yard: CONFIG.YARD_COST,
      solitary_cell: CONFIG.SOLITARY_CELL_COST,
      kitchen: CONFIG.KITCHEN_COST,
      infirmary: CONFIG.INFIRMARY_COST,
      workshop: CONFIG.WORKSHOP_COST
    };

    const cost = costs[gameState.selectedBuildType] || 0;
    const currentBalance = gameState.finance ? gameState.finance.budget.currentBalance : gameState.budget;
    if (currentBalance < cost) {
      showToast(`⚠️ Insufficient funds! Needed $${cost.toLocaleString()}, available $${currentBalance.toLocaleString()}`);
      return;
    }

    const rect = domElements.prisonGrid.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CONFIG.CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CONFIG.CELL_SIZE);

    // Handle different build types
    switch (gameState.selectedBuildType) {
      case 'wall':
        createWall(x, y, 1, 1);
        break;
      case 'door':
        createDoor(x, y, 1, 1);
        break;
      case 'cell':
        createWall(x, y, 2, 1); // top wall
        createWall(x, y + 1, 2, 1); // bottom wall
        createWall(x, y, 1, 2); // left wall
        createWall(x + 1, y, 1, 2); // right wall
        createDoor(x + 1, y, 1, 1); // door in right wall
        break;
      case 'canteen':
        createWall(x, y, 3, 1); // top
        createWall(x, y + 1, 3, 1); // bottom
        createWall(x, y, 1, 2); // left
        createWall(x + 2, y, 1, 2); // right
        createDoor(x + 1, y, 1, 1); // door
        break;
      case 'yard':
        createWall(x, y, 4, 1); // top
        createWall(x, y + 2, 4, 1); // bottom
        createWall(x, y, 1, 3); // left
        createWall(x + 3, y, 1, 3); // right
        createDoor(x + 2, y, 1, 1); // door
        break;
      case 'solitary_cell':
        createWall(x, y, 1, 1); // top wall
        createWall(x, y, 1, 1); // left wall
        createWall(x, y, 1, 1); // right wall
        createWall(x, y, 1, 1); // bottom wall
        createDoor(x, y, 1, 1); // door
        break;
      case 'kitchen':
        createWall(x, y, 3, 1); // top
        createWall(x, y + 2, 3, 1); // bottom
        createWall(x, y, 1, 3); // left
        createWall(x + 2, y, 1, 3); // right
        createDoor(x + 1, y, 1, 1); // door
        break;
      case 'infirmary':
        createWall(x, y, 4, 1); // top
        createWall(x, y + 2, 4, 1); // bottom
        createWall(x, y, 1, 3); // left
        createWall(x + 3, y, 1, 3); // right
        createDoor(x + 1, y, 1, 1); // door
        break;
      case 'workshop':
        createWall(x, y, 4, 1); // top
        createWall(x, y + 3, 4, 1); // bottom
        createWall(x, y, 1, 4); // left
        createWall(x + 3, y, 1, 4); // right
        createDoor(x + 1, y, 1, 1); // door
        break;
    }

    if (gameState.finance) {
      gameState.finance.recordTransaction(
        'expense',
        'Construction',
        cost,
        `Built ${gameState.selectedBuildType.replace('_', ' ')} at (${x}, ${y})`,
        gameState.day,
        Math.floor(gameState.timeOfDay)
      );
      gameState.budget = gameState.finance.budget.currentBalance;
      gameState.finance.calculateDailyRates(gameState);
    } else {
      gameState.budget -= cost;
    }

    updateStats();
  });

  // Close entity modal
  document.querySelector('.close-btn')?.addEventListener('click', () => {
    document.getElementById('entity-modal').style.display = 'none';
  });

  document.getElementById('close-modal')?.addEventListener('click', () => {
    document.getElementById('entity-modal').style.display = 'none';
  });

  // Close management modal
  document.getElementById('close-mgmt-modal')?.addEventListener('click', () => {
    const mgmtModal = document.getElementById('management-modal');
    if (mgmtModal) mgmtModal.style.display = 'none';
  });

  // Close finance modal
  document.getElementById('close-finance-modal')?.addEventListener('click', () => {
    closeFinanceModal();
  });

  if (domElements.financeModal) {
    domElements.financeModal.addEventListener('click', (e) => {
      if (e.target === domElements.financeModal) {
        closeFinanceModal();
      }
    });
  }

  // Finance tab buttons
  document.querySelectorAll('.finance-tab-btn').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.finance-tab-btn').forEach(btn => btn.classList.remove('active'));
      tabBtn.classList.add('active');
      renderFinanceModal(tabBtn.dataset.tab);
    });
  });

  // Click on Budget HUD opens Finance Modal
  domElements.budgetEl.addEventListener('click', () => {
    openFinanceModal();
  });

  // Controls
  domElements.pauseBtn.addEventListener('click', () => {
    controlState.isPaused = !controlState.isPaused;
    domElements.pauseBtn.textContent = controlState.isPaused ? '▶ Resume' : '⏸ Pause';
  });

  domElements.speedBtn.addEventListener('click', () => {
    controlState.currentSpeedIndex = (controlState.currentSpeedIndex + 1) % CONFIG.GAME_SPEEDS.length;
    domElements.speedBtn.textContent = `${CONFIG.GAME_SPEEDS[controlState.currentSpeedIndex]}x`;
  });

  domElements.emergencyBtn.addEventListener('click', () => {
    if (gameState.inmates.length > 0) {
      const randomInmate = gameState.inmates[Math.floor(Math.random() * gameState.inmates.length)];
      randomInmate.status.stress = Math.min(1.0, randomInmate.status.stress + 0.4);
      randomInmate.status.energy = Math.max(0.1, randomInmate.status.energy - 0.3);
      showToast(`🚨 Lockdown Drill! Inmate ${randomInmate.name} stress spiked!`);
    } else {
      showToast(`🚨 Emergency Drill Initiated! All sectors secure.`);
    }
  });

  domElements.saveBtn.addEventListener('click', () => {
    saveGame();
  });

  domElements.loadBtn.addEventListener('click', () => {
    loadGame();
  });

  // Sidebar navigation
  document.querySelectorAll('.sidebar-section a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.sidebar-section a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const section = link.dataset.section;
      if (section === 'finances') {
        openFinanceModal();
      } else {
        openManagementModal(section);
      }
    });
  });
}

// Start the game loop
function startGameLoop() {
  requestAnimationFrame(gameLoop);
}

// Game loop
function gameLoop(timestamp) {
  if (controlState.lastTimestamp === 0) controlState.lastTimestamp = timestamp;
  const deltaTime = timestamp - controlState.lastTimestamp;
  controlState.lastTimestamp = timestamp;

  if (!controlState.isPaused) {
    // Update game time
    const gameDelta = deltaTime * CONFIG.GAME_SPEEDS[controlState.currentSpeedIndex] / 1000; // Convert to seconds
    gameState.timeOfDay += gameDelta * 60; // Convert seconds to game minutes

    // Wrap day
    if (gameState.timeOfDay >= 1440) { // 24 hours * 60 minutes
      gameState.timeOfDay -= 1440;
      const completedDay = gameState.day;
      gameState.day++;

      // Process End-of-Day Financial Settlement
      if (gameState.finance) {
        const report = gameState.finance.settleDay(completedDay, gameState);
        gameState.budget = gameState.finance.budget.currentBalance;
        const sign = report.net >= 0 ? '+' : '';
        showToast(`📅 Day ${completedDay} Settlement: Net ${sign}$${report.net.toLocaleString()} • Treasury: $${gameState.budget.toLocaleString()}`);

        // If finance modal is open, re-render it
        if (domElements.financeModal && domElements.financeModal.style.display === 'flex') {
          const activeTab = document.querySelector('.finance-tab-btn.active')?.dataset.tab || 'overview';
          renderFinanceModal(activeTab);
        }
      }
    }

    // Update header time
    const hours = Math.floor(gameState.timeOfDay / 60);
    const minutes = Math.floor(gameState.timeOfDay % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    domElements.headerTimeEl.textContent = `Day ${gameState.day} • ${Helpers.formatTime(gameState.timeOfDay)}`;

    // Update entity AI (simplified)
    updateEntities(gameDelta);

    // Update structures (maintenance, etc.)
    updateStructures(gameDelta);
  }

  // Render
  render();

  requestAnimationFrame(gameLoop);
}

// Helper to find all structures of a specific type
function findStructuresOfType(type) {
  return gameState.structures.filter(s => s.type === type);
}

// Update entities (inmates and staff)
function updateEntities(deltaTime) {
  // Update inmate needs
  gameState.inmates.forEach(inmate => {
    // Needs increase over time
    inmate.needs.hunger = Math.min(1.0, inmate.needs.hunger + deltaTime * 0.0001);
    inmate.needs.hygiene = Math.min(1.0, inmate.needs.hygiene + deltaTime * 0.00008);
    inmate.needs.health = Math.max(0.0, inmate.needs.health - deltaTime * 0.00005); // Slight degradation
    inmate.needs.comfort = Math.max(0.0, inmate.needs.comfort - deltaTime * 0.00006);
    inmate.needs.family = Math.max(0.0, inmate.needs.family - deltaTime * 0.00003);
    inmate.needs.recreation = Math.max(0.0, inmate.needs.recreation - deltaTime * 0.00007);

    // Simple AI: if needs are high, move to fulfill them
    if (inmate.needs.health < 0.4) { // Prioritize health
      moveTowardsNeed(inmate, 'infirmary');
    } else if (inmate.needs.hunger > 0.7) {
      moveTowardsNeed(inmate, 'kitchen'); // Direct to kitchen instead of generic canteen area
    } else if (inmate.needs.recreation > 0.7) {
      // Move towards yard
      moveTowardsNeed(inmate, 'yard');
    } else if (inmate.needs.hygiene > 0.7) {
      // Move towards showers (not implemented yet)
      // For now, just wander
      wanderEntity(inmate, deltaTime);
    } else {
      wanderEntity(inmate, deltaTime);
    }

    // Check if inmate has reached a target structure for need fulfillment
    if (inmate.targetX !== undefined && inmate.targetY !== undefined &&
        Helpers.distance(inmate.x, inmate.y, inmate.targetX, inmate.targetY) < 1) { // Close enough to target

      if (inmate.needs.hunger > 0.7 && findStructuresOfType('kitchen').length > 0) {
        inmate.needs.hunger = Math.max(0, inmate.needs.hunger - deltaTime * 0.05); // Reduce hunger
        // (Future: Add activity timer, animations, etc.)
      } else if (inmate.needs.health < 0.4 && findStructuresOfType('infirmary').length > 0) {
        inmate.needs.health = Math.min(1, inmate.needs.health + deltaTime * 0.02); // Increase health
      }
      // Clear target only if need is sufficiently met, or after some time.
      // For now, let's keep it simple and clear the target immediately
      delete inmate.targetX;
      delete inmate.targetY;
    }

    // Stress increases with unmet needs
    const avgNeed = (inmate.needs.hunger + inmate.needs.hygiene +
                   (1 - inmate.needs.health) + (1 - inmate.needs.comfort) +
                   (1 - inmate.needs.family) + (1 - inmate.needs.recreation)) / 6;
    inmate.status.stress = Math.min(1.0, inmate.status.stress + deltaTime * 0.0002 * avgNeed);

    // Energy decreases with activity and stress
    inmate.status.energy = Math.max(0.1, inmate.status.energy - deltaTime * 0.0001 * (1 + inmate.status.stress));

    // Clamp values
    Object.keys(inmate.needs).forEach(key => {
      inmate.needs[key] = Math.max(0, Math.min(1, inmate.needs[key]));
    });
    inmate.status.stress = Math.max(0, Math.min(1, inmate.status.stress));
    inmate.status.energy = Math.max(0, Math.min(1, inmate.status.energy));
  });

  // Update staff
  gameState.staff.forEach(staff => {
    // Staff gets tired over time
    staff.status.fatigue = Math.min(1.0, staff.status.fatigue + deltaTime * 0.00005);
    staff.status.stress = Math.min(1.0, staff.status.stress + deltaTime * 0.00003);

    // Simple patrol behavior
    wanderEntity(staff, deltaTime * 0.5); // Staff moves slower than inmates

    // Recover during breaks
    const hours = Math.floor(gameState.timeOfDay / 60);
    const minutes = gameState.timeOfDay % 60;
    const timeInMinutes = hours * 60 + minutes;

    // Check if on break (simplified)
    const onBreak = staff.schedule.breakTimes.some(breakTime => {
      const startMin = parseInt(breakTime.start.split(':')[0]) * 60 + parseInt(breakTime.start.split(':')[1]);
      const endMin = parseInt(breakTime.end.split(':')[0]) * 60 + parseInt(breakTime.end.split(':')[1]);
      return timeInMinutes >= startMin && timeInMinutes <= endMin;
    });

    if (onBreak) {
      staff.status.fatigue = Math.max(0, staff.status.fatigue - deltaTime * 0.0002);
      staff.status.stress = Math.max(0, staff.status.stress - deltaTime * 0.0001);
    }
  });
}

// Move entity towards a need (simplified pathfinding for prototype)
function moveTowardsNeed(entity, needType) {
  let targetStructure = null;
  let targetX, targetY;

  const relevantStructures = findStructuresOfType(needType);

  if (relevantStructures.length > 0) {
    // Find the closest relevant structure
    let minDistance = Infinity;
    for (const s of relevantStructures) {
      // Calculate center of the structure
      const sCenterX = s.x + s.width / 2;
      const sCenterY = s.y + s.height / 2;
      const dist = Helpers.distance(entity.x, entity.y, sCenterX, sCenterY);
      if (dist < minDistance) {
        minDistance = dist;
        targetStructure = s;
      }
    }
    if (targetStructure) {
      targetX = targetStructure.x + targetStructure.width / 2;
      targetY = targetStructure.y + targetStructure.height / 2;
    }
  } else {
    // Fallback if no specific structure for the need is found
    // (e.g., if a canteen is needed but none exist, or for generic wandering)
    wanderEntity(entity, 0.5); // Provide a small deltaTime for a gentle nudge
    return; // Exit if no specific target
  }

  if (targetX !== undefined && targetY !== undefined) {
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.5) { // Move if not already very close
      const speed = 0.3; // Adjust speed as needed (deltaTime is handled in wanderEntity)
      entity.x += (dx / distance) * speed;
      entity.y += (dy / distance) * speed;

      // Keep within bounds
      entity.x = Math.max(0, Math.min(CONFIG.GRID_SIZE - 1, entity.x));
      entity.y = Math.max(0, Math.min(CONFIG.GRID_SIZE - 1, entity.y));
    } else {
      // Reached target, potentially fulfill need here or switch activity
      // For now, just clear target and let AI re-evaluate next frame
      delete entity.targetX; // Clear target once reached
      delete entity.targetY;
      // (Future: Add logic to actually fulfill the need, e.g., reduce hunger)
    }
  }
}

// Wander entity (random movement)
function wanderEntity(entity, deltaTime) {
  // Random wandering behavior
  if (Math.random() < deltaTime * 0.01) { // Change direction occasionally
    entity.targetX = entity.x + (Math.random() - 0.5) * 3;
    entity.targetY = entity.y + (Math.random() - 0.5) * 3;

    // Keep target within bounds
    entity.targetX = Math.max(0, Math.min(CONFIG.GRID_SIZE - 1, entity.targetX));
    entity.targetY = Math.max(0, Math.min(CONFIG.GRID_SIZE - 1, entity.targetY));
  }

  if (entity.targetX !== undefined && entity.targetY !== undefined) {
    const dx = entity.targetX - entity.x;
    const dy = entity.targetY - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.1) {
      const speed = 0.2 * deltaTime;
      entity.x += (dx / distance) * speed;
      entity.y += (dy / distance) * speed;

      // Keep within bounds
      entity.x = Math.max(0, Math.min(CONFIG.GRID_SIZE - 1, entity.x));
      entity.y = Math.max(0, Math.min(CONFIG.GRID_SIZE - 1, entity.y));
    } else {
      // Reached target, clear it
      delete entity.targetX;
      delete entity.targetY;
    }
  }
}

// Update structures (mostly static in prototype)
function updateStructures(deltaTime) {
  // Structures mostly static in prototype
  // In a real game, this would handle wear and tear, maintenance needs, etc.
}

// Render function to update positions
function render() {
  // Update entity positions on screen
  gameState.entities.forEach(entity => {
    if (entity.element) {
      entity.element.style.left = `${entity.x * CONFIG.CELL_SIZE + (CONFIG.CELL_SIZE - 20) / 2}px`;
      entity.element.style.top = `${entity.y * CONFIG.CELL_SIZE + (CONFIG.CELL_SIZE - 20) / 2}px`;
    }
  });

  // Update structures
  gameState.structures.forEach(structure => {
    if (structure.element) {
      structure.element.style.left = `${structure.x * CONFIG.CELL_SIZE}px`;
      structure.element.style.top = `${structure.y * CONFIG.CELL_SIZE}px`;
    }
  });
}

// Update statistics display
function updateStats() {
  if (domElements.inmateCountEl) {
    domElements.inmateCountEl.textContent = gameState.inmates.length;
  }
  if (domElements.sidebarInmateBadge) {
    domElements.sidebarInmateBadge.textContent = gameState.inmates.length;
  }
  if (domElements.staffCountEl) {
    domElements.staffCountEl.textContent = gameState.staff.length;
  }
  if (domElements.sidebarStaffBadge) {
    domElements.sidebarStaffBadge.textContent = gameState.staff.length;
  }

  if (domElements.budgetEl) {
    if (gameState.finance) {
      const rates = gameState.finance.calculateDailyRates(gameState);
      const net = rates.dailyNet;
      const sign = net >= 0 ? '+' : '';
      const flowClass = net >= 0 ? 'positive' : 'negative';

      domElements.budgetEl.innerHTML = `
        <span class="hud-stat-icon">💰</span>
        <div class="hud-stat-info">
          <span class="hud-stat-label">Treasury</span>
          <div style="display:flex; align-items:center;">
            <span class="hud-stat-val">${Helpers.formatCurrency(gameState.budget)}</span>
            <span class="daily-flow ${flowClass}">(${sign}$${net}/day)</span>
          </div>
        </div>
      `;

      if (gameState.finance.alerts.lowFunds || gameState.finance.alerts.bankrupt) {
        domElements.budgetEl.classList.add('alert-low-funds');
      } else {
        domElements.budgetEl.classList.remove('alert-low-funds');
      }
    } else {
      domElements.budgetEl.textContent = Helpers.formatCurrency(gameState.budget);
    }
  }
}

// Show toast notification
let toastTimeout = null;
function showToast(message, duration = 3500) {
  const toast = domElements.toastNotification || document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Open Finance Modal
function openFinanceModal(tab = 'overview') {
  if (!domElements.financeModal) return;
  domElements.financeModal.style.display = 'flex';

  // Set tab button active state
  document.querySelectorAll('.finance-tab-btn').forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderFinanceModal(tab);
}

// Close Finance Modal
function closeFinanceModal() {
  if (domElements.financeModal) {
    domElements.financeModal.style.display = 'none';
  }
}

// Render Finance Modal Content
function renderFinanceModal(activeTab = 'overview') {
  const pane = document.getElementById('finance-tab-content');
  if (!pane || !gameState.finance) return;

  // Refresh rates
  const rates = gameState.finance.calculateDailyRates(gameState);
  const fin = gameState.finance;
  const balance = fin.budget.currentBalance;
  const net = rates.dailyNet;
  const sign = net >= 0 ? '+' : '';

  if (activeTab === 'overview') {
    const trendClass = fin.cashFlow.trend || 'stable';
    const alertMsg = fin.alerts.bankrupt
      ? `<div style="background:#fee2e2; color:#b91c1c; padding:10px 14px; border-radius:6px; margin-bottom:14px; font-weight:600; font-size:13px;">🚨 BANKRUPT! Treasury is depleted! Claim emergency bailout grants or reduce staff.</div>`
      : fin.alerts.lowFunds
      ? `<div style="background:#fffbeb; color:#b45309; padding:10px 14px; border-radius:6px; margin-bottom:14px; font-weight:600; font-size:13px;">⚠️ LOW TREASURY! Balance below $${(CONFIG.LOW_FUNDS_THRESHOLD || 1000).toLocaleString()}. Monitor expenditures closely.</div>`
      : '';

    pane.innerHTML = `
      ${alertMsg}
      <div class="metric-grid">
        <div class="metric-card highlight">
          <div class="metric-title">Treasury Balance</div>
          <div class="metric-value ${balance < (CONFIG.LOW_FUNDS_THRESHOLD || 1000) ? 'expense' : ''}">${Helpers.formatCurrency(balance)}</div>
          <div class="metric-sub">Liquid funds</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Daily Income</div>
          <div class="metric-value income">+${Helpers.formatCurrency(rates.dailyIncome)}/day</div>
          <div class="metric-sub">${gameState.inmates.length} inmates</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Daily Expenses</div>
          <div class="metric-value expense">-${Helpers.formatCurrency(rates.dailyExpenses)}/day</div>
          <div class="metric-sub">${gameState.staff.length} staff, ${gameState.structures.length} structures</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Net Daily Flow</div>
          <div class="metric-value ${net >= 0 ? 'income' : 'expense'}">${sign}${Helpers.formatCurrency(net)}/day</div>
          <div class="metric-sub">Operating margin</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">30-Day Outlook</div>
          <div class="metric-value ${rates.projectedBalance < 0 ? 'expense' : ''}">${Helpers.formatCurrency(rates.projectedBalance)}</div>
          <div class="metric-sub">Forecast at current run-rate</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Treasury Trend</div>
          <div style="margin-top:6px;"><span class="status-badge ${trendClass}">${trendClass}</span></div>
          <div class="metric-sub" style="margin-top:8px;">Runway: ${fin.metrics.sustainability >= 999 ? 'Sustainable' : fin.metrics.sustainability + ' mo'}</div>
        </div>
      </div>

      <h3 style="font-size:14px; color:#334155; margin:16px 0 8px 0;">Recent Daily Settlements</h3>
      ${fin.history.length === 0 ? '<p style="font-size:13px; color:#64748b; font-style:italic;">No daily settlement cycles completed yet. (Occurs each midnight at 24:00).</p>' : `
        <table class="breakdown-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Net Result</th>
              <th style="text-align:right;">Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            ${fin.history.slice(-5).reverse().map(h => `
              <tr>
                <td>Day ${h.day}</td>
                <td style="color:#16a34a;">+${Helpers.formatCurrency(h.income)}</td>
                <td style="color:#dc2626;">-${Helpers.formatCurrency(h.expenses)}</td>
                <td style="font-weight:600; color:${h.net >= 0 ? '#16a34a' : '#dc2626'}">${h.net >= 0 ? '+' : ''}${Helpers.formatCurrency(h.net)}</td>
                <td class="amount">${Helpers.formatCurrency(h.closingBalance)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    `;
  } else if (activeTab === 'income') {
    const totalInc = Math.max(1, rates.dailyIncome);
    const sources = [
      { name: 'Government Inmate Stipend', amount: fin.incomeSources.governmentStipend, desc: `$${CONFIG.INMATE_DAILY_STIPEND}/day × ${gameState.inmates.length} inmates` },
      { name: 'Work Programs & Workshops', amount: fin.incomeSources.workProgramRevenue, desc: 'Workshop goods & inmate license plate production' },
      { name: 'Commissary Sales Margin', amount: fin.incomeSources.commissaryProfit, desc: 'Inmate snacks, amenities & goods sales' },
      { name: 'Telephone Service Revenue', amount: fin.incomeSources.phoneRevenue, desc: 'Monitored inmate call access fees' },
      { name: 'Grants & Subsidies', amount: fin.incomeSources.grants, desc: 'Government & rehabilitation incentives' },
      { name: 'Contraband Fines', amount: fin.incomeSources.finesCollected, desc: 'Disciplinary fines and contraband seizures' }
    ];

    pane.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="font-size:15px; color:#1e293b; margin:0;">Daily Income Sources</h3>
        <span style="font-size:16px; font-weight:700; color:#16a34a;">Total: +${Helpers.formatCurrency(rates.dailyIncome)}/day</span>
      </div>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th style="width:40%;">Source</th>
            <th style="width:35%;">Description</th>
            <th style="width:25%; text-align:right;">Daily Inflow</th>
          </tr>
        </thead>
        <tbody>
          ${sources.map(s => {
            const pct = Math.round((s.amount / totalInc) * 100);
            return `
              <tr>
                <td>
                  <strong>${s.name}</strong>
                  <div class="breakdown-bar-wrap">
                    <div class="breakdown-bar-fill income" style="width:${pct}%"></div>
                  </div>
                </td>
                <td style="color:#64748b; font-size:12px;">${s.desc}</td>
                <td class="amount" style="color:#16a34a;">+${Helpers.formatCurrency(s.amount)} <span style="color:#94a3b8; font-size:11px;">(${pct}%)</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else if (activeTab === 'expenses') {
    const totalExp = Math.max(1, rates.dailyExpenses);
    const categories = [
      { name: 'Guard & Staff Payroll', amount: fin.expenseCategories.staffSalaries, desc: `$${CONFIG.GUARD_DAILY_SALARY}/day × ${gameState.staff.length} staff members` },
      { name: 'Inmate Food & Meals', amount: fin.expenseCategories.food, desc: `$${CONFIG.INMATE_DAILY_FOOD_COST}/day × ${gameState.inmates.length} inmates` },
      { name: 'Facility Utilities (Power/Water)', amount: fin.expenseCategories.utilities, desc: `Base $${CONFIG.FACILITY_DAILY_UTILITY_BASE} + $${CONFIG.STRUCTURE_DAILY_UTILITY} × ${gameState.structures.length} structures` },
      { name: 'Structural Maintenance', amount: fin.expenseCategories.maintenance, desc: `$${CONFIG.STRUCTURE_DAILY_MAINTENANCE} upkeep × ${gameState.structures.length} structures` },
      { name: 'Inmate Medical & Clinic', amount: fin.expenseCategories.medical, desc: 'Medical care for sick or injured inmates' },
      { name: 'Uniforms & Inmate Supplies', amount: fin.expenseCategories.clothing, desc: '$5/day per inmate' },
      { name: 'Security Equipment Upkeep', amount: fin.expenseCategories.securityEquipment, desc: 'Doors, lock inspection & security systems' },
      { name: 'Administrative Overhead', amount: fin.expenseCategories.administrative, desc: 'Licensing, records & administration base' }
    ];

    pane.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="font-size:15px; color:#1e293b; margin:0;">Daily Operating Expenses</h3>
        <span style="font-size:16px; font-weight:700; color:#dc2626;">Total: -${Helpers.formatCurrency(rates.dailyExpenses)}/day</span>
      </div>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th style="width:40%;">Expense Category</th>
            <th style="width:35%;">Details</th>
            <th style="width:25%; text-align:right;">Daily Outflow</th>
          </tr>
        </thead>
        <tbody>
          ${categories.map(c => {
            const pct = Math.round((c.amount / totalExp) * 100);
            return `
              <tr>
                <td>
                  <strong>${c.name}</strong>
                  <div class="breakdown-bar-wrap">
                    <div class="breakdown-bar-fill expense" style="width:${pct}%"></div>
                  </div>
                </td>
                <td style="color:#64748b; font-size:12px;">${c.desc}</td>
                <td class="amount" style="color:#dc2626;">-${Helpers.formatCurrency(c.amount)} <span style="color:#94a3b8; font-size:11px;">(${pct}%)</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else if (activeTab === 'ledger') {
    const txs = fin.transactions || [];
    pane.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="font-size:15px; color:#1e293b; margin:0;">Transaction Ledger</h3>
        <span style="font-size:12px; color:#64748b;">Showing last ${txs.length} transactions</span>
      </div>
      ${txs.length === 0 ? '<p style="font-size:13px; color:#64748b; font-style:italic;">No recorded transactions yet.</p>' : `
        <div class="ledger-table-container">
          <table class="ledger-table">
            <thead>
              <tr>
                <th>Day & Time</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th style="text-align:right;">Amount</th>
                <th style="text-align:right;">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${txs.map(t => {
                const isInc = t.type === 'income';
                return `
                  <tr>
                    <td>Day ${t.day} • ${Helpers.formatTime(t.timeOfDay)}</td>
                    <td><span class="tx-chip ${isInc ? 'income' : 'expense'}">${t.type}</span></td>
                    <td><strong>${t.category}</strong></td>
                    <td style="color:#475569;">${t.description}</td>
                    <td style="text-align:right; font-weight:600; color:${isInc ? '#16a34a' : '#dc2626'};">
                      ${isInc ? '+' : '-'}${Helpers.formatCurrency(t.amount)}
                    </td>
                    <td style="text-align:right; font-weight:600; color:#334155;">
                      ${Helpers.formatCurrency(t.balanceAfter)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  } else if (activeTab === 'grants') {
    const isClaimed = fin.emergencyGrantClaimed;
    const isEligible = !isClaimed && balance < (CONFIG.LOW_FUNDS_THRESHOLD || 1000);
    const grantAmount = CONFIG.EMERGENCY_GRANT_AMOUNT || 2500;

    pane.innerHTML = `
      <div class="grant-banner">
        <div>
          <h4 style="margin:0 0 6px 0; color:#15803d; font-size:15px;">🏛️ Federal Emergency Bailout Grant</h4>
          <p style="margin:0; color:#334155; font-size:13px;">
            Provides an emergency relief grant of <strong>${Helpers.formatCurrency(grantAmount)}</strong> to correctional facilities in severe financial distress (Treasury &lt; $${(CONFIG.LOW_FUNDS_THRESHOLD || 1000).toLocaleString()}).
          </p>
          <p style="margin:6px 0 0 0; font-size:12px; color:#64748b;">
            Status: ${isClaimed ? '<strong style="color:#b91c1c;">Already Claimed (Limit: 1 per facility)</strong>' : isEligible ? '<strong style="color:#16a34a;">Eligible for immediate disbursement!</strong>' : 'Ineligible (Treasury is currently above $1,000 threshold)'}
          </p>
        </div>
        <div>
          <button class="grant-btn" id="claim-emergency-grant-btn" ${!isEligible ? 'disabled' : ''}>
            ${isClaimed ? 'Claimed' : `Claim ${Helpers.formatCurrency(grantAmount)}`}
          </button>
        </div>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin-top:16px;">
        <h4 style="margin:0 0 8px 0; font-size:14px; color:#1e293b;">Financial Management Tips</h4>
        <ul style="margin:0; padding-left:18px; font-size:13px; color:#475569; line-height:1.6;">
          <li>Construct Workshops to assign working inmates and produce additional daily revenue.</li>
          <li>Each inmate brings in <strong>$${CONFIG.INMATE_DAILY_STIPEND}/day</strong> from government stipends.</li>
          <li>Each guard requires <strong>$${CONFIG.GUARD_DAILY_SALARY}/day</strong> in payroll.</li>
          <li>Avoid building empty rooms unnecessarily since each structure adds daily power and maintenance overhead.</li>
        </ul>
      </div>
    `;

    const claimBtn = document.getElementById('claim-emergency-grant-btn');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        const res = fin.claimEmergencyGrant(gameState.day, Math.floor(gameState.timeOfDay));
        if (res.success) {
          gameState.budget = fin.budget.currentBalance;
          showToast(`🏛️ ${res.message}`);
          updateStats();
          renderFinanceModal('grants');
        } else {
          showToast(`❌ ${res.message}`);
        }
      });
    }
  }
}

// Save and Load System
function saveGame() {
  const saveData = {
    version: "1.0",
    gameState: {
      entities: gameState.entities.map(entity => {
        // Create a plain copy of the entity without the element property
        const { element, ...plainEntity } = entity;
        return plainEntity;
      }),
      structures: gameState.structures.map(structure => {
        const { element, ...plainStructure } = structure;
        return plainStructure;
      }),
      selectedBuildType: gameState.selectedBuildType,
      isBuilding: gameState.isBuilding,
      inmates: gameState.inmates.map(inmate => inmate.id), // save ids
      staff: gameState.staff.map(staff => staff.id),
      budget: gameState.budget,
      day: gameState.day,
      timeOfDay: gameState.timeOfDay,
      finance: gameState.finance ? gameState.finance.toJSON() : null
    },
    controlState: {
      currentSpeedIndex: controlState.currentSpeedIndex,
      isPaused: controlState.isPaused,
      lastTimestamp: 0 // reset on load
    }
  };

  // Save to localStorage
  try {
    localStorage.setItem('prisonManagerSave', JSON.stringify(saveData));
    // Also trigger a download of the save file
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prison-manager-save-day-${gameState.day}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Game saved successfully! A download has also been triggered.');
  } catch (e) {
    console.error('Failed to save game:', e);
    alert('Failed to save game. See console for details.');
  }
}

function loadGame() {
  // Create a file input to let the user choose a save file
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const saveData = JSON.parse(event.target.result);
        loadSaveData(saveData);
      } catch (err) {
        console.error('Failed to parse save file:', err);
        alert('Failed to load save file. Invalid JSON.');
      }
    };
    reader.onerror = err => {
      console.error('Failed to read file:', err);
      alert('Failed to read save file.');
    };
    reader.readAsText(file);
  };
  input.click();
}

function loadSaveData(saveData) {
  // Validate version
  if (saveData.version !== "1.0") {
    alert('Save file version mismatch. This version of the game may not be compatible with this save.');
    return;
  }

  // Clear current game state
  gameState.entities.forEach(entity => {
    if (entity.element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
  gameState.structures.forEach(structure => {
    if (structure.element && structure.element.parentNode) {
      structure.element.parentNode.removeChild(structure.element);
    }
  });

  // Reset arrays
  gameState.entities = [];
  gameState.structures = [];
  gameState.inmates = [];
  gameState.staff = [];

  // Restore gameState from saveData
  gameState.selectedBuildType = saveData.gameState.selectedBuildType;
  gameState.isBuilding = saveData.gameState.isBuilding;
  gameState.budget = saveData.gameState.budget;
  gameState.day = saveData.gameState.day;
  gameState.timeOfDay = saveData.gameState.timeOfDay;

  // Restore controlState
  controlState.currentSpeedIndex = saveData.controlState.currentSpeedIndex;
  controlState.isPaused = saveData.controlState.isPaused;
  controlState.lastTimestamp = saveData.controlState.lastTimestamp;

  // Recreate entities
  saveData.gameState.entities.forEach(savedEntity => {
    let entity;
    switch (savedEntity.type) {
      case 'inmate':
        entity = createInmate(savedEntity.x, savedEntity.y);
        break;
      case 'guard':
        entity = createGuard(savedEntity.x, savedEntity.y);
        break;
      default:
        console.warn('Unknown entity type:', savedEntity.type);
        return;
    }
    // Copy all saved properties except element and id (we'll set id separately)
    for (const key in savedEntity) {
      if (key !== 'element' && key !== 'id') {
        entity[key] = savedEntity[key];
      }
    }
    // Set the id to the saved one to preserve identity
    entity.id = savedEntity.id;
  });

  // Recreate structures
  saveData.gameState.structures.forEach(savedStructure => {
    let structure;
    switch (savedStructure.type) {
      case 'wall':
        structure = createWall(savedStructure.x, savedStructure.y, savedStructure.width, savedStructure.height);
        break;
      case 'door':
        structure = createDoor(savedStructure.x, savedStructure.y, savedStructure.width, savedStructure.height);
        break;
      default:
        console.warn('Unknown structure type:', savedStructure.type);
        return;
    }
    // Copy all saved properties except element and id
    for (const key in savedStructure) {
      if (key !== 'element' && key !== 'id') {
        structure[key] = savedStructure[key];
      }
    }
    // Set the id to the saved one
    structure.id = savedStructure.id;
  });

  // Update the UI
  if (saveData.gameState.finance) {
    if (!gameState.finance) gameState.finance = new FinanceSystem();
    gameState.finance.fromJSON(saveData.gameState.finance);
    gameState.budget = gameState.finance.budget.currentBalance;
  } else {
    gameState.finance = new FinanceSystem(gameState.budget || CONFIG.STARTING_BUDGET);
  }

  updateStats();
  // Update header time
  const hours = Math.floor(gameState.timeOfDay / 60);
  const minutes = Math.floor(gameState.timeOfDay % 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  domElements.headerTimeEl.textContent = `Day ${gameState.day} • ${Helpers.formatTime(gameState.timeOfDay)}`;

  // Update build menu active state if needed
  if (gameState.selectedBuildType && !gameState.isBuilding) {
    // If we have a selected build type but are not in building mode, activate the button
    const btn = domElements.buildMenu.querySelector(`[data-type="${gameState.selectedBuildType}"]`);
    if (btn) {
      btn.classList.add('active');
      domElements.prisonGrid.style.cursor = 'crosshair';
      gameState.isBuilding = true;
    }
  }

  alert('Game loaded successfully!');
}

// Export functions for testing (if needed)
export {
  initGame,
  gameState,
  controlState,
  createWall,
  createDoor,
  createInmate,
  createGuard,
  renderEntity,
  renderStructure,
  showEntityDetails,
  updateEntities,
  updateStructures,
  render,
  updateStats,
  openFinanceModal,
  closeFinanceModal,
  renderFinanceModal,
  openManagementModal,
  showToast
};