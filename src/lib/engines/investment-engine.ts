// ============================================================================
// Investment Planning Engine
// Risk profiling, asset allocation, FINRA suitability, rebalancing
// ============================================================================

import {
  RiskProfile, RiskTolerance, AssetAllocation, AllocationTarget,
  InvestmentRecommendation, Asset, InvestmentHolding, AssetClass
} from '../types';
import { MODEL_PORTFOLIOS, RISK_ASSESSMENT_QUESTIONS } from '../constants';

export function calculateRiskProfile(
  answers: Record<string, number>,
  age: number,
  annualIncome: number,
  netWorth: number,
  hasEmergencyFund: boolean
): RiskProfile {
  // Calculate tolerance from questionnaire (subjective)
  const questionScores = Object.values(answers);
  const avgScore = questionScores.length > 0
    ? questionScores.reduce((a, b) => a + b, 0) / questionScores.length
    : 3;

  // Calculate capacity (objective)
  const ageScore = Math.max(1, Math.min(5, (100 - age) / 15));
  const incomeScore = Math.min(5, annualIncome / 50000);
  const wealthScore = Math.min(5, netWorth / 200000);
  const emergencyScore = hasEmergencyFund ? 1 : -1;
  const capacityScore = (ageScore + incomeScore + wealthScore + emergencyScore) / 4;

  // Composite: weighted average (60% tolerance, 40% capacity)
  const compositeScore = Math.round((avgScore * 0.6 + capacityScore * 0.4) * 20);

  const toleranceFromScore = (score: number): RiskTolerance => {
    if (score <= 1.5) return 'conservative';
    if (score <= 2.5) return 'moderately_conservative';
    if (score <= 3.5) return 'moderate';
    if (score <= 4.5) return 'moderately_aggressive';
    return 'aggressive';
  };

  const riskTolerance = toleranceFromScore(avgScore);
  const riskCapacity = toleranceFromScore(capacityScore);

  // FINRA Suitability: use the more conservative of tolerance and capacity
  const finalTolerance = compositeScore <= 30 ? 'conservative'
    : compositeScore <= 45 ? 'moderately_conservative'
    : compositeScore <= 60 ? 'moderate'
    : compositeScore <= 75 ? 'moderately_aggressive'
    : 'aggressive';

  const investmentExperience = avgScore <= 1.5 ? 'none' as const
    : avgScore <= 2.5 ? 'beginner' as const
    : avgScore <= 3.5 ? 'intermediate' as const
    : 'advanced' as const;

  const timeHorizon = age >= 55 ? 'short' as const
    : age >= 40 ? 'medium' as const
    : 'long' as const;

  return {
    riskTolerance: finalTolerance,
    riskCapacity,
    investmentExperience,
    timeHorizon,
    investmentObjective: compositeScore <= 20 ? 'preservation'
      : compositeScore <= 40 ? 'income'
      : compositeScore <= 60 ? 'growth_income'
      : compositeScore <= 80 ? 'growth'
      : 'aggressive_growth',
    compositeScore: Math.min(100, Math.max(0, compositeScore)),
  };
}

export function getTargetAllocation(riskTolerance: RiskTolerance): Record<string, number> {
  return MODEL_PORTFOLIOS[riskTolerance];
}

export function calculateCurrentAllocation(assets: Asset[]): Record<string, number> {
  const allocation: Record<string, number> = {};
  let totalInvestmentValue = 0;

  // Aggregate holdings across all investment accounts
  for (const asset of assets) {
    if (asset.holdings && asset.holdings.length > 0) {
      for (const holding of asset.holdings) {
        allocation[holding.assetClass] = (allocation[holding.assetClass] || 0) + holding.totalValue;
        totalInvestmentValue += holding.totalValue;
      }
    } else if (asset.category === 'cash') {
      allocation['cash_equivalents'] = (allocation['cash_equivalents'] || 0) + asset.currentValue;
      totalInvestmentValue += asset.currentValue;
    } else if (asset.category === 'investment' || asset.category === 'retirement') {
      // Default allocation for accounts without detailed holdings
      allocation['us_large_cap'] = (allocation['us_large_cap'] || 0) + asset.currentValue * 0.6;
      allocation['us_bonds'] = (allocation['us_bonds'] || 0) + asset.currentValue * 0.3;
      allocation['cash_equivalents'] = (allocation['cash_equivalents'] || 0) + asset.currentValue * 0.1;
      totalInvestmentValue += asset.currentValue;
    }
  }

  // Convert to percentages
  const percentAllocation: Record<string, number> = {};
  for (const [key, value] of Object.entries(allocation)) {
    percentAllocation[key] = totalInvestmentValue > 0 ? (value / totalInvestmentValue) * 100 : 0;
  }

  return percentAllocation;
}

export function buildAssetAllocation(
  riskTolerance: RiskTolerance,
  assets: Asset[]
): AssetAllocation {
  const targetAlloc = getTargetAllocation(riskTolerance);
  const currentAlloc = calculateCurrentAllocation(assets);
  const totalValue = assets.reduce((sum, a) =>
    (a.category === 'investment' || a.category === 'retirement' || a.category === 'cash') ? sum + a.currentValue : sum, 0
  );

  const assetClasses: AssetClass[] = [
    'us_large_cap', 'us_mid_cap', 'us_small_cap',
    'international_developed', 'emerging_markets',
    'us_bonds', 'international_bonds', 'high_yield_bonds', 'tips',
    'reits', 'commodities', 'cash_equivalents',
  ];

  const targetAllocation: AllocationTarget[] = [];
  const currentAllocation: AllocationTarget[] = [];
  let maxDrift = 0;

  for (const ac of assetClasses) {
    const targetPct = targetAlloc[ac] || 0;
    const currentPct = currentAlloc[ac] || 0;
    const currentValue = totalValue * (currentPct / 100);
    const diff = currentPct - targetPct;
    maxDrift = Math.max(maxDrift, Math.abs(diff));

    if (targetPct > 0 || currentPct > 0) {
      targetAllocation.push({
        assetClass: ac,
        targetPercent: targetPct,
        currentPercent: Math.round(currentPct * 10) / 10,
        currentValue: Math.round(currentValue),
        difference: Math.round(diff * 10) / 10,
      });
      currentAllocation.push({
        assetClass: ac,
        targetPercent: targetPct,
        currentPercent: Math.round(currentPct * 10) / 10,
        currentValue: Math.round(currentValue),
        difference: Math.round(diff * 10) / 10,
      });
    }
  }

  return {
    targetAllocation,
    currentAllocation,
    rebalancingNeeded: maxDrift > 5, // Rebalance if any class drifts >5%
    driftPercentage: Math.round(maxDrift * 10) / 10,
  };
}

export function generateInvestmentRecommendations(
  riskProfile: RiskProfile,
  assetAllocation: AssetAllocation,
  assets: Asset[],
  age: number,
  totalNetWorth: number
): InvestmentRecommendation[] {
  const recommendations: InvestmentRecommendation[] = [];

  // 1. Rebalancing
  if (assetAllocation.rebalancingNeeded) {
    const overweightClasses = assetAllocation.currentAllocation
      .filter(a => a.difference > 3)
      .map(a => formatAssetClass(a.assetClass));
    const underweightClasses = assetAllocation.currentAllocation
      .filter(a => a.difference < -3)
      .map(a => formatAssetClass(a.assetClass));

    recommendations.push({
      id: 'rebalance',
      type: 'rebalance',
      priority: assetAllocation.driftPercentage > 10 ? 'high' : 'medium',
      title: 'Portfolio Rebalancing Required',
      description: `Your portfolio has drifted ${assetAllocation.driftPercentage}% from target allocation. ${overweightClasses.length > 0 ? `Overweight in: ${overweightClasses.join(', ')}.` : ''} ${underweightClasses.length > 0 ? `Underweight in: ${underweightClasses.join(', ')}.` : ''}`,
      impact: 'Maintains your desired risk level and prevents concentration risk.',
      action: 'Review and rebalance portfolio to align with target allocation.',
    });
  }

  // 2. Diversification check
  const investmentAssets = assets.filter(a => a.category === 'investment' || a.category === 'retirement');
  const totalInvestmentValue = investmentAssets.reduce((sum, a) => sum + a.currentValue, 0);

  for (const asset of investmentAssets) {
    if (totalInvestmentValue > 0 && (asset.currentValue / totalInvestmentValue) > 0.25) {
      recommendations.push({
        id: `diversify_${asset.id}`,
        type: 'diversify',
        priority: 'high',
        title: `Concentration Risk: ${asset.name}`,
        description: `${asset.name} represents ${((asset.currentValue / totalInvestmentValue) * 100).toFixed(1)}% of your investment portfolio. FINRA guidelines recommend no single position exceed 10-15% of your portfolio.`,
        impact: 'Reduces risk of significant losses from a single position.',
        action: `Consider gradually reducing position to below 15% of portfolio.`,
      });
    }
  }

  // 3. Fee analysis
  let weightedExpenseRatio = 0;
  let holdingsWithFees = 0;
  for (const asset of investmentAssets) {
    if (asset.holdings) {
      for (const h of asset.holdings) {
        if (h.annualExpenseRatio && h.annualExpenseRatio > 0) {
          weightedExpenseRatio += h.annualExpenseRatio * (h.totalValue / Math.max(1, totalInvestmentValue));
          holdingsWithFees++;
        }
      }
    }
  }

  if (holdingsWithFees > 0 && weightedExpenseRatio > 0.5) {
    recommendations.push({
      id: 'reduce_fees',
      type: 'reduce_fees',
      priority: 'medium',
      title: 'High Investment Fees Detected',
      description: `Your portfolio-weighted expense ratio is ${weightedExpenseRatio.toFixed(2)}%. Consider switching to low-cost index funds (0.03-0.10%).`,
      impact: `Potential savings of $${Math.round(totalInvestmentValue * (weightedExpenseRatio - 0.1) / 100).toLocaleString()} per year in fees.`,
      action: 'Replace high-cost active funds with comparable low-cost index funds or ETFs.',
    });
  }

  // 4. Tax-Loss Harvesting opportunity
  const hasUnrealizedLosses = investmentAssets.some(a =>
    a.holdings?.some(h => h.totalValue < h.costBasis)
  );
  if (hasUnrealizedLosses) {
    recommendations.push({
      id: 'tax_loss',
      type: 'tax_loss_harvest',
      priority: 'medium',
      title: 'Tax-Loss Harvesting Opportunity',
      description: 'Some holdings have unrealized losses that could be harvested to offset capital gains or reduce taxable income by up to $3,000/year.',
      impact: 'Reduces current year tax liability while maintaining market exposure.',
      action: 'Sell positions with losses and replace with similar (not substantially identical) investments.',
    });
  }

  return recommendations;
}

export function formatAssetClass(ac: AssetClass): string {
  const map: Record<string, string> = {
    us_large_cap: 'US Large Cap',
    us_mid_cap: 'US Mid Cap',
    us_small_cap: 'US Small Cap',
    international_developed: 'Intl Developed',
    emerging_markets: 'Emerging Markets',
    us_bonds: 'US Bonds',
    international_bonds: 'Intl Bonds',
    high_yield_bonds: 'High Yield Bonds',
    tips: 'TIPS',
    reits: 'REITs',
    commodities: 'Commodities',
    cash_equivalents: 'Cash/Money Market',
    alternatives: 'Alternatives',
    crypto: 'Cryptocurrency',
    other: 'Other',
  };
  return map[ac] || ac;
}

export function getExpectedReturn(riskTolerance: RiskTolerance): number {
  const returns: Record<RiskTolerance, number> = {
    conservative: 0.05,
    moderately_conservative: 0.06,
    moderate: 0.07,
    moderately_aggressive: 0.085,
    aggressive: 0.10,
  };
  return returns[riskTolerance];
}
