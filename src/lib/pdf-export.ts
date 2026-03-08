// ============================================================================
// PDF Export - Generate downloadable financial plan PDF
// Uses jspdf (already in package.json)
// ============================================================================

import jsPDF from 'jspdf';

const fmt = (n: number | undefined | null) => {
  if (n == null) return '$0';
  return n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
};

const pct = (n: number | undefined | null) => {
  if (n == null) return '0%';
  return `${(n * 100).toFixed(1)}%`;
};

export function generatePlanPDF(store: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 30;

  const addPage = () => {
    doc.addPage();
    y = 30;
  };

  const checkPage = (needed: number) => {
    if (y + needed > 270) addPage();
  };

  const title = (text: string) => {
    checkPage(20);
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(text, margin, y);
    y += 5;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 60, y);
    y += 10;
  };

  const subtitle = (text: string) => {
    checkPage(12);
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(text, margin, y);
    y += 7;
  };

  const body = (text: string) => {
    checkPage(8);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  };

  const metric = (label: string, value: string) => {
    checkPage(7);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(label, margin + 5, y);
    doc.setTextColor(30, 41, 59);
    doc.text(value, margin + 100, y);
    y += 6;
  };

  // Cover Page
  doc.setFontSize(28);
  doc.setTextColor(30, 41, 59);
  doc.text('WealthMap', pageWidth / 2, 60, { align: 'center' });
  doc.setFontSize(18);
  doc.setTextColor(71, 85, 105);
  doc.text('Comprehensive Financial Plan', pageWidth / 2, 75, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Prepared for ${store.personalInfo.firstName || 'Client'} ${store.personalInfo.lastName}`, pageWidth / 2, 95, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, 110, { align: 'center' });
  doc.text('Based on CFP Board Standards | FINRA Suitability Aligned', pageWidth / 2, 120, { align: 'center' });

  // Executive Summary
  addPage();
  title('Executive Summary');
  if (store.financialHealthScore) {
    body(`Financial Health Score: ${store.financialHealthScore.overall}/100`);
  }
  const nw = store.netWorthSummary;
  const cf = store.cashFlowSummary;
  if (nw) {
    metric('Net Worth', fmt(nw.netWorth));
    metric('Total Assets', fmt(nw.totalAssets));
    metric('Total Liabilities', fmt(nw.totalLiabilities));
  }
  if (cf) {
    metric('Monthly Income', fmt(cf.totalMonthlyIncome));
    metric('Monthly Expenses', fmt(cf.totalMonthlyExpenses));
    metric('Monthly Surplus', fmt(cf.monthlySurplus));
    metric('Savings Rate', pct(cf.savingsRate));
    metric('Emergency Fund', `${cf.emergencyFundMonths?.toFixed(1) || 0} months`);
  }

  // Tax Planning
  addPage();
  title('Tax Planning');
  const tax = store.taxSituation;
  if (tax) {
    metric('Gross Income', fmt(tax.grossIncome));
    metric('Taxable Income', fmt(tax.taxableIncome));
    metric('Total Tax Liability', fmt(tax.totalTaxLiability));
    metric('Effective Tax Rate', pct(tax.effectiveTaxRate));
    metric('Marginal Tax Rate', `${(tax.marginalTaxRate * 100).toFixed(0)}%`);
    metric('Deduction Method', tax.useItemized ? 'Itemized' : 'Standard');
    y += 5;
    if (store.taxStrategies?.length > 0) {
      subtitle('Tax Optimization Strategies');
      store.taxStrategies.forEach((s: any) => {
        body(`[${s.priority.toUpperCase()}] ${s.title} - Est. savings: ${fmt(s.estimatedSavings)}/yr`);
      });
    }
  }

  // Retirement Planning
  addPage();
  title('Retirement Planning');
  const rp = store.retirementPlan;
  if (rp) {
    metric('Current Age', rp.currentAge.toString());
    metric('Target Retirement Age', rp.targetRetirementAge.toString());
    metric('Years to Retirement', rp.yearsToRetirement.toString());
    metric('Current Savings', fmt(rp.currentRetirementSavings));
    metric('Projected Fund at Retirement', fmt(rp.projectedRetirementFund));
    metric('Funded Ratio', `${Math.round(rp.fundedRatio * 100)}%`);
    metric('Desired Annual Income', fmt(rp.desiredAnnualIncome));
    metric('Sustainable Withdrawal', fmt(rp.sustainableWithdrawalAmount));
    if (rp.retirementGap > 0) {
      body(`Retirement Gap: ${fmt(rp.retirementGap)}/year. Additional savings needed: ${fmt(rp.additionalSavingsNeeded)}/year.`);
    }
    y += 5;
    subtitle('Social Security Estimates');
    metric('At Age 62', `${fmt(rp.socialSecurityEstimate.estimatedMonthlyAt62)}/mo`);
    metric(`At FRA (${rp.socialSecurityEstimate.fullRetirementAge})`, `${fmt(rp.socialSecurityEstimate.estimatedMonthlyAtFRA)}/mo`);
    metric('At Age 70', `${fmt(rp.socialSecurityEstimate.estimatedMonthlyAt70)}/mo`);
  }

  // Monte Carlo
  if (store.monteCarloResults) {
    y += 5;
    subtitle('Monte Carlo Simulation (1,000 trials)');
    metric('Success Rate', `${Math.round(store.monteCarloResults.successRate * 100)}%`);
    metric('Median Balance', fmt(store.monteCarloResults.medianBalance));
    metric('10th Percentile', fmt(store.monteCarloResults.percentile10));
    metric('90th Percentile', fmt(store.monteCarloResults.percentile90));
  }

  // Insurance
  addPage();
  title('Risk Management');
  if (store.insuranceAnalysis) {
    metric('Life Insurance Need', fmt(store.insuranceAnalysis.lifeInsuranceNeed));
    metric('Current Coverage', fmt(store.insuranceAnalysis.currentLifeCoverage));
    metric('Coverage Gap', fmt(store.insuranceAnalysis.lifeInsuranceGap));
    if (store.insuranceAnalysis.recommendations?.length > 0) {
      y += 5;
      subtitle('Insurance Recommendations');
      store.insuranceAnalysis.recommendations.forEach((r: any) => {
        body(`[${r.priority.toUpperCase()}] ${r.title}: ${r.description}`);
      });
    }
  }

  // Estate Planning
  title('Estate Planning');
  if (store.estatePlan) {
    metric('Gross Estate Value', fmt(store.estatePlan.grossEstateValue));
    metric('Est. Estate Tax', fmt(store.estatePlan.estimateEstateTax));
    const docs = [
      { label: 'Will', has: store.estatePlan.hasWill },
      { label: 'Trust', has: store.estatePlan.hasTrust },
      { label: 'Power of Attorney', has: store.estatePlan.hasPowerOfAttorney },
      { label: 'Healthcare Directive', has: store.estatePlan.hasHealthcareDirective },
    ];
    docs.forEach(d => metric(d.label, d.has ? 'Yes' : 'MISSING'));
  }

  // Education
  if (store.educationPlan?.children?.length > 0) {
    addPage();
    title('Education Planning');
    metric('Total Projected Cost', fmt(store.educationPlan.totalProjectedCost));
    metric('Current Savings', fmt(store.educationPlan.totalCurrentSavings));
    metric('Funding Gap', fmt(store.educationPlan.totalGap));
    store.educationPlan.children.forEach((c: any) => {
      y += 3;
      subtitle(c.childName);
      metric('Years to College', c.yearsToCollege.toString());
      metric('Projected Cost', fmt(c.projectedTotalCost));
      metric('Funded', `${c.fundedPercent.toFixed(0)}%`);
    });
  }

  // Disclaimers
  addPage();
  title('Important Disclosures');
  body('This financial plan is generated based on the information you provided and is for educational and planning purposes only. It does not constitute financial advice, investment advice, tax advice, or legal advice.');
  body('Projections and estimates are based on assumptions about future market conditions, tax rates, and personal circumstances that may not be accurate. Past performance does not guarantee future results.');
  body('Consult with qualified professionals (CFP, CPA, attorney) before implementing any financial strategies.');

  // Save
  const filename = `WealthMap_Plan_${store.personalInfo.lastName || 'Client'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
