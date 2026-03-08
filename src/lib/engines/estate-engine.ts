// ============================================================================
// Estate Planning Engine
// Estate tax analysis, document checklist, beneficiary review
// ============================================================================

import {
  EstatePlan, EstateDocument, EstateRecommendation, Beneficiary,
  PersonalInfo, Asset, Liability, InsurancePolicy
} from '../types';
import { ESTATE_TAX_2025 } from '../constants';
import { calculateAge } from './retirement-engine';

export function calculateGrossEstate(
  assets: Asset[],
  lifeInsurancePolicies: InsurancePolicy[]
): number {
  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const lifeInsuranceDeathBenefit = lifeInsurancePolicies
    .filter(p => p.type === 'life')
    .reduce((sum, p) => sum + p.coverageAmount, 0);
  return totalAssets + lifeInsuranceDeathBenefit;
}

export function calculateEstateTax(
  grossEstate: number,
  filingStatus: string,
  liabilities: number = 0,
  charitableBequest: number = 0
): { taxableEstate: number; estimatedTax: number; exemptionUsed: number } {
  const exemption = filingStatus === 'married_filing_jointly'
    ? ESTATE_TAX_2025.marriedExemption
    : ESTATE_TAX_2025.exemption;

  const taxableEstate = Math.max(0, grossEstate - liabilities - charitableBequest - exemption);
  const estimatedTax = taxableEstate * ESTATE_TAX_2025.maxRate;

  return {
    taxableEstate,
    estimatedTax: Math.round(estimatedTax),
    exemptionUsed: Math.min(grossEstate, exemption),
  };
}

export function generateEstateDocumentChecklist(
  hasWill: boolean,
  hasTrust: boolean,
  hasPOA: boolean,
  hasHealthcareDirective: boolean,
  hasBeneficiaryDesignations: boolean,
  lastUpdatedDate?: string
): EstateDocument[] {
  const needsUpdate = lastUpdatedDate
    ? (new Date().getTime() - new Date(lastUpdatedDate).getTime()) > 3 * 365 * 24 * 60 * 60 * 1000
    : true;

  return [
    {
      type: 'will',
      exists: hasWill,
      lastUpdated: lastUpdatedDate,
      needsUpdate: hasWill ? needsUpdate : true,
      notes: hasWill ? (needsUpdate ? 'Consider reviewing and updating' : 'Up to date') : 'Critical: No will in place',
    },
    {
      type: 'revocable_trust',
      exists: hasTrust,
      lastUpdated: lastUpdatedDate,
      needsUpdate: hasTrust ? needsUpdate : false,
      notes: hasTrust ? 'Review funding and terms' : 'May help avoid probate',
    },
    {
      type: 'poa_financial',
      exists: hasPOA,
      lastUpdated: lastUpdatedDate,
      needsUpdate: hasPOA ? needsUpdate : true,
      notes: hasPOA ? 'Review agent designations' : 'Essential for incapacity planning',
    },
    {
      type: 'poa_healthcare',
      exists: hasHealthcareDirective,
      lastUpdated: lastUpdatedDate,
      needsUpdate: hasHealthcareDirective ? needsUpdate : true,
      notes: hasHealthcareDirective ? 'Review wishes and agent' : 'Critical for medical decisions',
    },
    {
      type: 'living_will',
      exists: hasHealthcareDirective,
      lastUpdated: lastUpdatedDate,
      needsUpdate: hasHealthcareDirective ? needsUpdate : true,
      notes: 'Specifies end-of-life care preferences',
    },
    {
      type: 'hipaa_authorization',
      exists: false,
      needsUpdate: true,
      notes: 'Allows designated persons to access medical records',
    },
    {
      type: 'beneficiary_designation',
      exists: hasBeneficiaryDesignations,
      lastUpdated: lastUpdatedDate,
      needsUpdate: hasBeneficiaryDesignations ? needsUpdate : true,
      notes: hasBeneficiaryDesignations ? 'Verify all accounts are designated' : 'Review all retirement and insurance beneficiaries',
    },
  ];
}

export function buildEstatePlan(
  personalInfo: PersonalInfo,
  assets: Asset[],
  liabilities: Liability[],
  insurancePolicies: InsurancePolicy[],
  estateInfo: {
    hasWill: boolean;
    hasTrust: boolean;
    hasPOA: boolean;
    hasHealthcareDirective: boolean;
    hasBeneficiaryDesignations: boolean;
    beneficiaries: Beneficiary[];
  }
): EstatePlan {
  const age = calculateAge(personalInfo.dateOfBirth);
  const grossEstateValue = calculateGrossEstate(assets, insurancePolicies);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
  const estateTaxCalc = calculateEstateTax(grossEstateValue, personalInfo.filingStatus, totalLiabilities);

  const documents = generateEstateDocumentChecklist(
    estateInfo.hasWill,
    estateInfo.hasTrust,
    estateInfo.hasPOA,
    estateInfo.hasHealthcareDirective,
    estateInfo.hasBeneficiaryDesignations
  );

  // Generate recommendations
  const recommendations: EstateRecommendation[] = [];

  // Critical: Missing essential documents
  if (!estateInfo.hasWill) {
    recommendations.push({
      id: 'need_will',
      priority: 'critical',
      title: 'Create a Will Immediately',
      description: 'Without a will, your assets will be distributed according to state intestacy laws, which may not align with your wishes. This is the most fundamental estate planning document.',
      category: 'documents',
    });
  }

  if (!estateInfo.hasPOA) {
    recommendations.push({
      id: 'need_poa',
      priority: 'critical',
      title: 'Establish Power of Attorney',
      description: 'A durable power of attorney ensures someone you trust can manage your finances if you become incapacitated.',
      category: 'documents',
    });
  }

  if (!estateInfo.hasHealthcareDirective) {
    recommendations.push({
      id: 'need_healthcare',
      priority: 'critical',
      title: 'Create Healthcare Directive',
      description: 'A healthcare proxy and living will ensure your medical wishes are followed and someone you trust makes decisions if you cannot.',
      category: 'documents',
    });
  }

  // Beneficiary review
  if (!estateInfo.hasBeneficiaryDesignations) {
    recommendations.push({
      id: 'review_beneficiaries',
      priority: 'high',
      title: 'Review All Beneficiary Designations',
      description: 'Beneficiary designations on retirement accounts and life insurance override your will. Ensure all accounts have current, correct beneficiaries.',
      category: 'beneficiaries',
    });
  }

  // Trust consideration
  if (!estateInfo.hasTrust && grossEstateValue > 500000) {
    recommendations.push({
      id: 'consider_trust',
      priority: 'medium',
      title: 'Consider a Revocable Living Trust',
      description: `With an estate valued at $${grossEstateValue.toLocaleString()}, a revocable living trust can help avoid probate, provide privacy, and ensure smooth transfer of assets.`,
      category: 'documents',
    });
  }

  // Estate tax planning
  if (estateTaxCalc.taxableEstate > 0) {
    recommendations.push({
      id: 'estate_tax',
      priority: 'high',
      title: 'Estate Tax Planning Needed',
      description: `Your estimated taxable estate of $${estateTaxCalc.taxableEstate.toLocaleString()} could result in estate taxes of $${estateTaxCalc.estimatedTax.toLocaleString()}. Consider strategies like irrevocable trusts, charitable giving, or gifting to reduce exposure.`,
      category: 'tax_planning',
    });
  }

  // Gift tax strategy
  if (grossEstateValue > ESTATE_TAX_2025.exemption * 0.5) {
    recommendations.push({
      id: 'gifting',
      priority: 'low',
      title: 'Consider Annual Gifting Strategy',
      description: `You can gift up to $${ESTATE_TAX_2025.annualGiftExclusion.toLocaleString()} per person per year without gift tax implications. This helps reduce your taxable estate over time.`,
      category: 'tax_planning',
    });
  }

  return {
    hasWill: estateInfo.hasWill,
    hasTrust: estateInfo.hasTrust,
    hasPowerOfAttorney: estateInfo.hasPOA,
    hasHealthcareDirective: estateInfo.hasHealthcareDirective,
    hasBeneficiaryDesignations: estateInfo.hasBeneficiaryDesignations,
    grossEstateValue: Math.round(grossEstateValue),
    estimateEstateTax: estateTaxCalc.estimatedTax,
    documents,
    beneficiaries: estateInfo.beneficiaries,
    recommendations,
  };
}
