// ============================================================================
// Debt Payoff Engine
// Avalanche vs Snowball strategies, timeline projections
// ============================================================================

import { Liability, DebtPayoffPlan, DebtPayoffMonth } from '../types';

interface DebtItem {
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

function buildDebtItems(liabilities: Liability[]): DebtItem[] {
  return liabilities
    .filter(l => l.currentBalance > 0 && l.interestRate >= 0)
    .map(l => ({
      name: l.name,
      balance: l.currentBalance,
      interestRate: l.interestRate / 100,
      minimumPayment: Math.max(l.minimumPayment, l.monthlyPayment, 25),
    }));
}

function simulatePayoff(
  debts: DebtItem[],
  strategy: 'avalanche' | 'snowball',
  extraMonthly: number = 0
): DebtPayoffPlan {
  if (debts.length === 0) {
    return {
      strategy,
      debts: [],
      totalMonths: 0,
      totalInterestPaid: 0,
      totalPaid: 0,
      debtFreeDate: new Date().toISOString(),
      monthlyTimeline: [],
    };
  }

  // Sort: avalanche = highest rate first, snowball = lowest balance first
  const sorted = [...debts].sort((a, b) =>
    strategy === 'avalanche'
      ? b.interestRate - a.interestRate
      : a.balance - b.balance
  );

  const balances = sorted.map(d => d.balance);
  const rates = sorted.map(d => d.interestRate / 12);
  const minPayments = sorted.map(d => d.minimumPayment);
  const totalInterestByDebt = sorted.map(() => 0);
  const payoffMonthByDebt = sorted.map(() => 0);
  const timeline: DebtPayoffMonth[] = [];

  const totalMinimum = minPayments.reduce((a, b) => a + b, 0);
  let totalBudget = totalMinimum + extraMonthly;
  let month = 0;
  const maxMonths = 600; // 50 years cap

  while (balances.some(b => b > 0) && month < maxMonths) {
    month++;
    let availableExtra = totalBudget;

    // First: apply minimum payments to all debts
    for (let i = 0; i < balances.length; i++) {
      if (balances[i] <= 0) continue;

      const interest = balances[i] * rates[i];
      totalInterestByDebt[i] += interest;
      balances[i] += interest;

      const payment = Math.min(balances[i], minPayments[i]);
      balances[i] -= payment;
      availableExtra -= payment;

      timeline.push({
        month,
        debtName: sorted[i].name,
        payment,
        principal: payment - interest,
        interest,
        remainingBalance: Math.max(0, balances[i]),
      });

      if (balances[i] <= 0.01) {
        balances[i] = 0;
        payoffMonthByDebt[i] = payoffMonthByDebt[i] || month;
      }
    }

    // Then: apply extra to the target debt (first non-zero in sorted order)
    if (availableExtra > 0) {
      for (let i = 0; i < balances.length; i++) {
        if (balances[i] <= 0) continue;
        const extraPayment = Math.min(balances[i], availableExtra);
        balances[i] -= extraPayment;
        availableExtra -= extraPayment;

        // Update the last timeline entry for this debt
        const lastEntry = timeline.filter(t => t.month === month && t.debtName === sorted[i].name).pop();
        if (lastEntry) {
          lastEntry.payment += extraPayment;
          lastEntry.principal += extraPayment;
          lastEntry.remainingBalance = Math.max(0, balances[i]);
        }

        if (balances[i] <= 0.01) {
          balances[i] = 0;
          payoffMonthByDebt[i] = payoffMonthByDebt[i] || month;
        }
        break; // Only apply extra to the top priority debt
      }
    }
  }

  const totalInterestPaid = totalInterestByDebt.reduce((a, b) => a + b, 0);
  const totalPaid = debts.reduce((s, d) => s + d.balance, 0) + totalInterestPaid;

  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

  return {
    strategy,
    debts: sorted.map((d, i) => ({
      name: d.name,
      originalBalance: d.balance,
      interestRate: d.interestRate * 100,
      minimumPayment: d.minimumPayment,
      payoffMonth: payoffMonthByDebt[i],
      totalInterestPaid: Math.round(totalInterestByDebt[i]),
    })),
    totalMonths: month,
    totalInterestPaid: Math.round(totalInterestPaid),
    totalPaid: Math.round(totalPaid),
    debtFreeDate: debtFreeDate.toISOString(),
    monthlyTimeline: timeline,
  };
}

export function calculateAvalanchePayoff(liabilities: Liability[], extraMonthly: number = 0): DebtPayoffPlan {
  return simulatePayoff(buildDebtItems(liabilities), 'avalanche', extraMonthly);
}

export function calculateSnowballPayoff(liabilities: Liability[], extraMonthly: number = 0): DebtPayoffPlan {
  return simulatePayoff(buildDebtItems(liabilities), 'snowball', extraMonthly);
}

export function compareStrategies(liabilities: Liability[], extraMonthly: number = 0): {
  avalanche: DebtPayoffPlan;
  snowball: DebtPayoffPlan;
  interestSavings: number;
  timeSavingsMonths: number;
} {
  const avalanche = calculateAvalanchePayoff(liabilities, extraMonthly);
  const snowball = calculateSnowballPayoff(liabilities, extraMonthly);

  return {
    avalanche,
    snowball,
    interestSavings: snowball.totalInterestPaid - avalanche.totalInterestPaid,
    timeSavingsMonths: snowball.totalMonths - avalanche.totalMonths,
  };
}
