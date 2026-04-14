// 세대 정보
export interface Household {
  householdHeadAge: number;
  hasSpouse: boolean;
  householdMembers: number;
  separableChildren: number;
  elderlyParents: boolean;
  currentResidenceId: string;
  rentalBusinessRegistered: boolean;
  businessRegistrationDate?: Date;
}

// 주택 유형
export type PropertyType =
  | 'APARTMENT'
  | 'VILLA'
  | 'MULTI_FAMILY'
  | 'OFFICETEL'
  | 'DETACHED'
  | 'MULTI_HOUSE';

// 취득 유형
export type AcquisitionType =
  | 'PURCHASE'
  | 'INHERITANCE'
  | 'GIFT'
  | 'NEW_BUILD'
  | 'PRE_SALE';

// 거주 기간
export interface Period {
  startDate: Date;
  endDate: Date;
}

// 임대 유형
export type RentalType =
  | 'LONG_10Y'
  | 'PUBLIC_SUPPORT_10Y'
  | 'SHORT_6Y'
  | 'OLD_SHORT_4Y';

// 임대등록 정보
export interface RentalRegistration {
  isRegistered: boolean;
  registrationDate?: Date;
  rentalType?: RentalType;
  constructionOrPurchase?: 'CONSTRUCTION' | 'PURCHASE';
  rentalStartDate?: Date;
  standardPriceAtStart?: number;
  mandatoryEndDate?: Date;
  currentMonths?: number;
  status?: 'ACTIVE' | 'VOLUNTARY_CANCEL' | 'AUTO_CANCEL';
  cancellationDate?: Date;
  rentCompliance?: boolean;
  previousRent?: { deposit: number; monthlyRent: number };
  currentRent?: { deposit: number; monthlyRent: number };
  vacancyMonths?: number;
}

// 상생임대 정보
export interface CoexistenceRental {
  isCoexistenceRental: boolean;
  coexistenceContractDate?: Date;
  rentIncreaseUnder5Pct?: boolean;
  rentalPeriodOver2Years?: boolean;
}

// 특수상황
export interface SpecialConditions {
  isMarriageMergeProperty: boolean;
  isElderlyCareMerge: boolean;
  isInheritedProperty: boolean;
  isRuralProperty: boolean;
  isDepopulationArea: boolean;
  isUnsoldNewProperty: boolean;
  isSmallNewProperty: boolean;
}

// 주택 정보
export interface Property {
  id: string;
  nickname: string;
  address: string;
  propertyType: PropertyType;
  exclusiveArea: number;
  landArea?: number;
  isRegulatedAreaAtAcq: boolean;
  isRegulatedAreaNow: boolean;

  // 취득정보
  acquisitionDate: Date;
  acquisitionPrice: number;
  acquisitionType: AcquisitionType;
  acquisitionTax: number;
  necessaryExpenses: number;
  inheritedHoldingPeriod?: number;

  // 현재가치
  estimatedMarketPrice: number;
  officialPrice: number;
  standardPrice: number;

  // 거주정보
  isCurrentResidence: boolean;
  residencePeriods: Period[];
  totalResidenceMonths: number;

  // 임대등록 정보
  rental?: RentalRegistration;

  // 상생임대
  coexistence?: CoexistenceRental;

  // 특수상황
  specialConditions: SpecialConditions;
}

// 양도 목표
export type SaleGoal =
  | 'TAX_MINIMIZE'
  | 'QUICK_CASH'
  | 'SPECIFIC_PROPERTY'
  | 'ONE_HOUSE_EXEMPTION';

// 양도 시점
export type SaleTimeframe =
  | 'IMMEDIATE'
  | 'WITHIN_1Y'
  | 'WITHIN_3Y'
  | 'WITHIN_5Y'
  | 'AFTER_MANDATORY';

// 양도 조건
export interface SaleCondition {
  saleGoal: SaleGoal;
  saleTimeframe: SaleTimeframe;
  targetHouseCount: number;
  cashNeededDate?: Date;
  cashNeededAmount?: number;
  planNewAcquisition: boolean;
  planRentalRegistration: boolean;
  planHouseholdSeparation: boolean;
}

// 양도 단계
export interface SaleStep {
  propertyId: string;
  saleDate: Date;
  reason: string;
  priority: number;
}

// 타임라인 이벤트
export interface TimelineEvent {
  date: Date;
  action: string;
  description: string;
  type: 'SALE' | 'DEADLINE' | 'MILESTONE';
}

// 주택별 세금 상세
export interface PropertyTaxDetail {
  propertyId: string;
  propertyName: string;
  salePrice: number;
  acquisitionPrice: number;
  necessaryExpenses: number;
  capitalGain: number;
  longTermDeductionRate: number;
  longTermDeduction: number;
  taxableIncome: number;
  basicDeduction: number;
  taxBase: number;
  taxRate: number;
  calculatedTax: number;
  localTax: number;
  totalTax: number;
  isTaxExempt: boolean;
  exemptionType?: string;
  isHeavyTax: boolean;
  heavyTaxRate?: number;
}

// 시나리오
export interface Scenario {
  id: string;
  name: string;
  isRecommended: boolean;
  saleSequence: SaleStep[];
  totalEstimatedTax: number;
  totalNetProceeds: number;
  appliedBenefits: string[];
  timeline: TimelineEvent[];
  warnings: string[];
  propertyTaxDetails: PropertyTaxDetail[];
}

// 분석 결과
export interface AnalysisResult {
  scenarios: Scenario[];
  recommendedScenarioId: string;
  generatedAt: Date;
  totalPropertyValue: number;
  totalAcquisitionCost: number;
  potentialGain: number;
}
