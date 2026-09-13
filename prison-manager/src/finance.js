// Financial System Module for Prison Manager
// Implements the Financial Model defined in docs/technical/DATA_MODELS.md (Section 9)

import { CONFIG } from './config.js';
import { Helpers } from './helpers.js';

export class FinanceSystem {
  constructor(initialBudget = CONFIG.STARTING_BUDGET) {
    this.id = Helpers.generateId('finance');
    this.type = 'financial_system';

    // Budget State
    this.budget = {
      dailyAllocation: 0,
      currentBalance: initialBudget,
      dailyIncome: 0,
      dailyExpenses: 0,
      projectedBalance: initialBudget
    };

    // Income Breakdown (Daily Rates)
    this.incomeSources = {
      governmentStipend: 0,
      workProgramRevenue: 0,
      commissaryProfit: 0,
      phoneRevenue: 0,
      grants: 0,
      finesCollected: 0,
      other: 0
    };

    // Expense Breakdown (Daily Rates)
    this.expenseCategories = {
      staffSalaries: 0,
      utilities: 0,
      food: 0,
      medical: 0,
      clothing: 0,
      maintenance: 0,
      securityEquipment: 0,
      transportation: 0,
      administrative: CONFIG.DAILY_ADMIN_COST || 40,
      other: 0
    };

    // Cash Flow Tracking
    this.cashFlow = {
      dailyNet: 0,
      weeklyNet: 0,
      monthlyNet: 0,
      runningAverage: 0,
      trend: 'stable' // 'improving' | 'stable' | 'declining'
    };

    // Assets & Liabilities
    this.assets = {
      facilityValue: 0,
      equipmentValue: 0,
      cashReserves: initialBudget,
      investments: 0
    };

    this.liabilities = {
      outstandingLoans: 0,
      unpaidBills: 0,
      legalReserves: 0
    };

    // Performance Metrics
    this.metrics = {
      costPerInmate: 0,
      revenuePerInmate: 0,
      roi: 0,
      efficiencyScore: 1.0,
      sustainability: 999
    };

    // Alerts & Thresholds
    this.alerts = {
      lowFunds: false,
      overspending: false,
      budgetOverrun: false,
      emergencyFunds: false,
      bankrupt: false
    };

    // Historical Records & Transaction Ledger
    this.history = []; // Daily summaries: { day, income, expenses, net, closingBalance, breakdown }
    this.transactions = []; // List of individual transactions { id, day, timeOfDay, type, category, amount, description, balanceAfter }
    this.emergencyGrantClaimed = false;
  }

  // Record an immediate transaction (capital cost, fine, grant, etc.)
  recordTransaction(type, category, amount, description, day = 1, timeOfDay = 0) {
    const numAmount = Math.max(0, Number(amount) || 0);

    if (type === 'income') {
      this.budget.currentBalance += numAmount;
    } else {
      this.budget.currentBalance -= numAmount;
    }

    const tx = {
      id: Helpers.generateId('tx'),
      day,
      timeOfDay,
      type, // 'income' | 'expense'
      category,
      amount: numAmount,
      description,
      balanceAfter: this.budget.currentBalance,
      timestamp: Date.now()
    };

    this.transactions.unshift(tx); // Newest first

    // Limit stored transactions to recent 100 for memory
    if (this.transactions.length > 100) {
      this.transactions.pop();
    }

    this.updateAlerts();
    return tx;
  }

  // Calculate live daily rates (Income & Expenses) based on current game state
  calculateDailyRates(gameState = {}) {
    const inmates = gameState.inmates || [];
    const staff = gameState.staff || [];
    const structures = gameState.structures || [];

    const inmateCount = inmates.length;
    const staffCount = staff.length;
    const structureCount = structures.length;

    // 1. Income calculations
    const governmentStipend = inmateCount * (CONFIG.INMATE_DAILY_STIPEND || 150);

    // Working inmates or workshop contribution
    let workingInmates = inmates.filter(inm => inm.status && inm.status.isWorking).length;
    // If workshops exist, give baseline production
    const workshopCount = structures.filter(s => s.type === 'workshop').length;
    const workProgramRevenue = (workingInmates * (CONFIG.WORKSHOP_DAILY_REVENUE || 50)) +
                               (workshopCount * 75);

    const commissaryProfit = inmateCount * (CONFIG.COMMISSARY_REVENUE_PER_INMATE || 15);
    const phoneRevenue = inmateCount * (CONFIG.PHONE_REVENUE_PER_INMATE || 5);

    this.incomeSources.governmentStipend = governmentStipend;
    this.incomeSources.workProgramRevenue = workProgramRevenue;
    this.incomeSources.commissaryProfit = commissaryProfit;
    this.incomeSources.phoneRevenue = phoneRevenue;

    const totalDailyIncome = Object.values(this.incomeSources).reduce((sum, val) => sum + (Number(val) || 0), 0);
    this.budget.dailyIncome = totalDailyIncome;
    this.budget.dailyAllocation = governmentStipend;

    // 2. Expense calculations
    const staffSalaries = staffCount * (CONFIG.GUARD_DAILY_SALARY || 180);
    const food = inmateCount * (CONFIG.INMATE_DAILY_FOOD_COST || 20);
    const utilities = (CONFIG.FACILITY_DAILY_UTILITY_BASE || 50) +
                      (structureCount * (CONFIG.STRUCTURE_DAILY_UTILITY || 2));
    const maintenance = structureCount * (CONFIG.STRUCTURE_DAILY_MAINTENANCE || 1);

    // Medical cost based on inmates with low health (< 0.7)
    const unhealthyCount = inmates.filter(inm => inm.needs && inm.needs.health < 0.7).length;
    const medical = unhealthyCount * 30;

    const clothing = inmateCount * 5;
    const administrative = CONFIG.DAILY_ADMIN_COST || 40;

    // Security equipment expense (doors, solitary cells, infirmaries)
    const securityStructures = structures.filter(s => ['door', 'solitary_cell', 'infirmary'].includes(s.type)).length;
    const securityEquipment = securityStructures * 3;

    this.expenseCategories.staffSalaries = staffSalaries;
    this.expenseCategories.food = food;
    this.expenseCategories.utilities = utilities;
    this.expenseCategories.maintenance = maintenance;
    this.expenseCategories.medical = medical;
    this.expenseCategories.clothing = clothing;
    this.expenseCategories.administrative = administrative;
    this.expenseCategories.securityEquipment = securityEquipment;

    const totalDailyExpenses = Object.values(this.expenseCategories).reduce((sum, val) => sum + (Number(val) || 0), 0);
    this.budget.dailyExpenses = totalDailyExpenses;

    // 3. Cash flow & Projections
    this.cashFlow.dailyNet = totalDailyIncome - totalDailyExpenses;
    this.budget.projectedBalance = this.budget.currentBalance + (this.cashFlow.dailyNet * 30);

    // 4. Facility Valuation (Estimated replacement value of structures)
    let facilityVal = 0;
    structures.forEach(s => {
      switch (s.type) {
        case 'wall': facilityVal += (CONFIG.WALL_COST || 50); break;
        case 'door': facilityVal += (CONFIG.DOOR_COST || 25); break;
        case 'cell': facilityVal += (CONFIG.CELL_COST || 150); break;
        case 'canteen': facilityVal += (CONFIG.CANTEEN_COST || 200); break;
        case 'yard': facilityVal += (CONFIG.YARD_COST || 250); break;
        case 'solitary_cell': facilityVal += (CONFIG.SOLITARY_CELL_COST || 100); break;
        case 'kitchen': facilityVal += (CONFIG.KITCHEN_COST || 300); break;
        case 'infirmary': facilityVal += (CONFIG.INFIRMARY_COST || 400); break;
        case 'workshop': facilityVal += (CONFIG.WORKSHOP_COST || 350); break;
        default: facilityVal += 50; break;
      }
    });
    this.assets.facilityValue = facilityVal;
    this.assets.cashReserves = Math.max(0, this.budget.currentBalance);

    // 5. Performance Metrics
    this.metrics.costPerInmate = inmateCount > 0 ? Math.round(totalDailyExpenses / inmateCount) : 0;
    this.metrics.revenuePerInmate = inmateCount > 0 ? Math.round(totalDailyIncome / inmateCount) : 0;
    this.metrics.efficiencyScore = totalDailyExpenses > 0
      ? Math.min(1.0, parseFloat((totalDailyIncome / totalDailyExpenses).toFixed(2)))
      : 1.0;

    if (this.cashFlow.dailyNet < 0 && this.budget.currentBalance > 0) {
      this.metrics.sustainability = parseFloat((this.budget.currentBalance / (Math.abs(this.cashFlow.dailyNet) * 30)).toFixed(1));
    } else if (this.cashFlow.dailyNet >= 0) {
      this.metrics.sustainability = 999;
    } else {
      this.metrics.sustainability = 0;
    }

    this.updateAlerts();
    return {
      dailyIncome: totalDailyIncome,
      dailyExpenses: totalDailyExpenses,
      dailyNet: this.cashFlow.dailyNet,
      projectedBalance: this.budget.projectedBalance
    };
  }

  // Update alert status based on thresholds
  updateAlerts() {
    const lowThreshold = CONFIG.LOW_FUNDS_THRESHOLD || 1000;
    this.alerts.lowFunds = this.budget.currentBalance > 0 && this.budget.currentBalance < lowThreshold;
    this.alerts.bankrupt = this.budget.currentBalance <= 0;
    this.alerts.overspending = this.cashFlow.dailyNet < 0;
    this.alerts.budgetOverrun = this.budget.projectedBalance < 0;
  }

  // Perform daily settlement at day end (midnight)
  settleDay(day, gameState = {}) {
    // Re-calculate latest rates
    this.calculateDailyRates(gameState);

    const income = this.budget.dailyIncome;
    const expenses = this.budget.dailyExpenses;
    const net = this.cashFlow.dailyNet;

    // Record ledger transactions for transparency (adjusts currentBalance by +income and -expenses)
    this.recordTransaction('income', 'Daily Revenue', income, `Day ${day} daily operating income settlement`, day, 0);
    this.recordTransaction('expense', 'Daily Operations', expenses, `Day ${day} daily operating expenses settlement`, day, 0);

    // Create history snapshot
    const snapshot = {
      day,
      income,
      expenses,
      net,
      closingBalance: this.budget.currentBalance,
      breakdown: {
        incomeSources: { ...this.incomeSources },
        expenseCategories: { ...this.expenseCategories }
      },
      timestamp: Date.now()
    };

    this.history.push(snapshot);

    // Calculate 7-day rolling average and trend
    const recentHistory = this.history.slice(-7);
    const avgNet = recentHistory.reduce((sum, h) => sum + h.net, 0) / recentHistory.length;
    this.cashFlow.runningAverage = Math.round(avgNet);

    if (recentHistory.length >= 2) {
      const prevNet = recentHistory[recentHistory.length - 2].net;
      const curNet = recentHistory[recentHistory.length - 1].net;
      if (curNet > prevNet + 10) {
        this.cashFlow.trend = 'improving';
      } else if (curNet < prevNet - 10) {
        this.cashFlow.trend = 'declining';
      } else {
        this.cashFlow.trend = 'stable';
      }
    }

    this.updateAlerts();

    return {
      day,
      income,
      expenses,
      net,
      newBalance: this.budget.currentBalance,
      historyLength: this.history.length
    };
  }

  // Emergency grant bailout
  claimEmergencyGrant(day = 1, timeOfDay = 0) {
    const grantAmount = CONFIG.EMERGENCY_GRANT_AMOUNT || 2500;
    if (this.emergencyGrantClaimed) {
      return { success: false, message: 'Emergency grant already claimed.' };
    }
    if (this.budget.currentBalance >= (CONFIG.LOW_FUNDS_THRESHOLD || 1000)) {
      return { success: false, message: 'Emergency grant only available when treasury is below $1,000.' };
    }

    this.emergencyGrantClaimed = true;
    this.incomeSources.grants = (this.incomeSources.grants || 0) + grantAmount;
    this.recordTransaction('income', 'Federal Emergency Grant', grantAmount, 'Federal bailout subsidy for distressed facility', day, timeOfDay);

    return {
      success: true,
      amount: grantAmount,
      newBalance: this.budget.currentBalance,
      message: `Emergency Grant of $${grantAmount.toLocaleString()} received!`
    };
  }

  // Serialization for save/load
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      budget: { ...this.budget },
      incomeSources: { ...this.incomeSources },
      expenseCategories: { ...this.expenseCategories },
      cashFlow: { ...this.cashFlow },
      assets: { ...this.assets },
      liabilities: { ...this.liabilities },
      metrics: { ...this.metrics },
      alerts: { ...this.alerts },
      emergencyGrantClaimed: this.emergencyGrantClaimed,
      history: this.history,
      transactions: this.transactions
    };
  }

  // Deserialization
  fromJSON(data) {
    if (!data) return;
    if (data.id) this.id = data.id;
    if (data.budget) Object.assign(this.budget, data.budget);
    if (data.incomeSources) Object.assign(this.incomeSources, data.incomeSources);
    if (data.expenseCategories) Object.assign(this.expenseCategories, data.expenseCategories);
    if (data.cashFlow) Object.assign(this.cashFlow, data.cashFlow);
    if (data.assets) Object.assign(this.assets, data.assets);
    if (data.liabilities) Object.assign(this.liabilities, data.liabilities);
    if (data.metrics) Object.assign(this.metrics, data.metrics);
    if (data.alerts) Object.assign(this.alerts, data.alerts);
    this.emergencyGrantClaimed = Boolean(data.emergencyGrantClaimed);
    this.history = Array.isArray(data.history) ? data.history : [];
    this.transactions = Array.isArray(data.transactions) ? data.transactions : [];
  }
}
