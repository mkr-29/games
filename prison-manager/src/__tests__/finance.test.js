import { describe, it, expect, beforeEach } from 'vitest';
import { FinanceSystem } from '../finance.js';
import { CONFIG } from '../config.js';

describe('FinanceSystem', () => {
  let finance;

  beforeEach(() => {
    finance = new FinanceSystem(10000);
  });

  it('should initialize with correct default values and starting budget', () => {
    expect(finance.budget.currentBalance).toBe(10000);
    expect(finance.type).toBe('financial_system');
    expect(finance.history).toEqual([]);
    expect(finance.transactions).toEqual([]);
    expect(finance.emergencyGrantClaimed).toBe(false);
  });

  it('should record immediate income and expense transactions', () => {
    const expenseTx = finance.recordTransaction('expense', 'Construction', 150, 'Built a cell', 1, 480);
    expect(finance.budget.currentBalance).toBe(9850);
    expect(expenseTx.amount).toBe(150);
    expect(expenseTx.balanceAfter).toBe(9850);
    expect(finance.transactions.length).toBe(1);

    const incomeTx = finance.recordTransaction('income', 'Grant', 500, 'Federal research subsidy', 1, 600);
    expect(finance.budget.currentBalance).toBe(10350);
    expect(incomeTx.amount).toBe(500);
    expect(incomeTx.balanceAfter).toBe(10350);
    expect(finance.transactions.length).toBe(2);
  });

  it('should calculate live daily rates accurately based on inmate and staff population', () => {
    const mockGameState = {
      inmates: [
        { id: 'inmate-1', status: { isWorking: false }, needs: { health: 1.0 } },
        { id: 'inmate-2', status: { isWorking: true }, needs: { health: 0.9 } },
        { id: 'inmate-3', status: { isWorking: false }, needs: { health: 0.5 } } // unhealthy -> medical expense
      ],
      staff: [
        { id: 'guard-1' },
        { id: 'guard-2' }
      ],
      structures: [
        { type: 'wall' },
        { type: 'wall' },
        { type: 'door' },
        { type: 'cell' },
        { type: 'workshop' }
      ]
    };

    const rates = finance.calculateDailyRates(mockGameState);

    // Income checks:
    // 3 inmates * 150 stipend = 450
    // 1 working inmate * 50 + 1 workshop * 75 = 125
    // 3 inmates * 15 commissary = 45
    // 3 inmates * 5 phone = 15
    // Total income = 450 + 125 + 45 + 15 = 635
    expect(finance.incomeSources.governmentStipend).toBe(450);
    expect(finance.incomeSources.workProgramRevenue).toBe(125);
    expect(finance.incomeSources.commissaryProfit).toBe(45);
    expect(finance.incomeSources.phoneRevenue).toBe(15);
    expect(rates.dailyIncome).toBe(635);

    // Expense checks:
    // 2 staff * 180 salary = 360
    // 3 inmates * 20 food = 60
    // 5 structures: utility = 50 base + 5*2 = 60
    // maintenance = 5 * 1 = 5
    // medical: 1 unhealthy inmate * 30 = 30
    // clothing: 3 * 5 = 15
    // admin = 40
    // security equipment (1 door): 1 * 3 = 3
    // Total expenses = 360 + 60 + 60 + 5 + 30 + 15 + 40 + 3 = 573
    expect(finance.expenseCategories.staffSalaries).toBe(360);
    expect(finance.expenseCategories.food).toBe(60);
    expect(finance.expenseCategories.utilities).toBe(60);
    expect(finance.expenseCategories.maintenance).toBe(5);
    expect(finance.expenseCategories.medical).toBe(30);
    expect(finance.expenseCategories.clothing).toBe(15);
    expect(finance.expenseCategories.administrative).toBe(40);
    expect(finance.expenseCategories.securityEquipment).toBe(3);
    expect(rates.dailyExpenses).toBe(573);

    // Net check: 635 - 573 = 62
    expect(rates.dailyNet).toBe(62);
    expect(rates.projectedBalance).toBe(10000 + (62 * 30));
  });

  it('should process daily settlement at midnight properly', () => {
    const mockGameState = {
      inmates: [{ id: 'inmate-1', status: { isWorking: false }, needs: { health: 1.0 } }],
      staff: [{ id: 'guard-1' }],
      structures: []
    };

    // calculate before settlement
    finance.calculateDailyRates(mockGameState);
    const expectedIncome = finance.budget.dailyIncome;
    const expectedExpenses = finance.budget.dailyExpenses;
    const expectedNet = expectedIncome - expectedExpenses;

    const initialBal = finance.budget.currentBalance;
    const report = finance.settleDay(1, mockGameState);

    expect(report.day).toBe(1);
    expect(report.income).toBe(expectedIncome);
    expect(report.expenses).toBe(expectedExpenses);
    expect(report.net).toBe(expectedNet);
    expect(finance.budget.currentBalance).toBe(initialBal + expectedNet);
    expect(finance.history.length).toBe(1);
    expect(finance.history[0].day).toBe(1);
    expect(finance.history[0].closingBalance).toBe(finance.budget.currentBalance);
  });

  it('should detect low funds and handle emergency bailout grant', () => {
    finance.budget.currentBalance = 500;
    finance.updateAlerts();
    expect(finance.alerts.lowFunds).toBe(true);

    const result = finance.claimEmergencyGrant(1, 480);
    expect(result.success).toBe(true);
    expect(finance.budget.currentBalance).toBe(500 + CONFIG.EMERGENCY_GRANT_AMOUNT);
    expect(finance.emergencyGrantClaimed).toBe(true);

    // Second attempt should fail
    const secondResult = finance.claimEmergencyGrant(1, 500);
    expect(secondResult.success).toBe(false);
  });

  it('should serialize and deserialize cleanly', () => {
    finance.recordTransaction('expense', 'Construction', 200, 'Built wall', 1, 300);
    finance.settleDay(1, { inmates: [], staff: [], structures: [] });

    const json = finance.toJSON();
    const restored = new FinanceSystem(0);
    restored.fromJSON(json);

    expect(restored.budget.currentBalance).toBe(finance.budget.currentBalance);
    expect(restored.history.length).toBe(finance.history.length);
    expect(restored.transactions.length).toBe(finance.transactions.length);
    expect(restored.transactions[0].description).toBe(finance.transactions[0].description);
  });

  it('should calculate facility valuation based on built structures', () => {
    const mockGameState = {
      inmates: [],
      staff: [],
      structures: [
        { type: 'wall' },
        { type: 'cell' },
        { type: 'workshop' }
      ]
    };
    finance.calculateDailyRates(mockGameState);
    // wall: 50, cell: 150, workshop: 350 -> total 550
    expect(finance.assets.facilityValue).toBe(550);
  });

  it('should identify trend correctly over multiple day settlements', () => {
    // Day 1
    finance.settleDay(1, { inmates: [{ id: '1' }], staff: [{ id: '1' }] });
    // Day 2 with more inmates (more income)
    finance.settleDay(2, { inmates: [{ id: '1' }, { id: '2' }, { id: '3' }], staff: [{ id: '1' }] });
    expect(finance.cashFlow.trend).toBe('improving');
  });

  it('should flag bankruptcy when funds fall to 0 or below', () => {
    finance.budget.currentBalance = 0;
    finance.updateAlerts();
    expect(finance.alerts.bankrupt).toBe(true);

    finance.budget.currentBalance = -100;
    finance.updateAlerts();
    expect(finance.alerts.bankrupt).toBe(true);
  });
});
