import type {
  Household,
  Property,
  SaleCondition,
  AnalysisResult,
  Scenario,
  PropertyTaxDetail,
  SaleStep,
  TimelineEvent
} from '../types';

// 기본세율 테이블 (2023년 이후)
const TAX_BRACKETS = [
  { limit: 14000000, rate: 0.06, deduction: 0 },
  { limit: 50000000, rate: 0.15, deduction: 1260000 },
  { limit: 88000000, rate: 0.24, deduction: 5760000 },
  { limit: 150000000, rate: 0.35, deduction: 15440000 },
  { limit: 300000000, rate: 0.38, deduction: 19940000 },
  { limit: 500000000, rate: 0.40, deduction: 25940000 },
  { limit: 1000000000, rate: 0.42, deduction: 35940000 },
  { limit: Infinity, rate: 0.45, deduction: 65940000 }
];

// 양도소득세 계산
function calculateTax(
  property: Property,
  saleDate: Date,
  household: Household,
  allProperties: Property[],
  isLastProperty: boolean
): PropertyTaxDetail {
  const salePrice = property.estimatedMarketPrice;
  const acquisitionPrice = property.acquisitionPrice;
  const necessaryExpenses = property.necessaryExpenses + property.acquisitionTax;

  // 양도차익
  const capitalGain = salePrice - acquisitionPrice - necessaryExpenses;

  // 보유기간 계산 (개월)
  const holdingMonths = Math.floor(
    (saleDate.getTime() - property.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const holdingYears = Math.floor(holdingMonths / 12);

  // 비과세 판정
  const { isTaxExempt, exemptionType } = checkExemption(
    property,
    household,
    allProperties,
    isLastProperty,
    holdingMonths,
    salePrice
  );

  if (isTaxExempt) {
    return {
      propertyId: property.id,
      propertyName: property.nickname,
      salePrice,
      acquisitionPrice,
      necessaryExpenses,
      capitalGain,
      longTermDeductionRate: 0,
      longTermDeduction: 0,
      taxableIncome: 0,
      basicDeduction: 0,
      taxBase: 0,
      taxRate: 0,
      calculatedTax: 0,
      localTax: 0,
      totalTax: 0,
      isTaxExempt: true,
      exemptionType,
      isHeavyTax: false
    };
  }

  // 장기보유특별공제
  const longTermDeductionRate = calculateLongTermDeduction(
    property,
    holdingYears,
    isLastProperty,
    salePrice
  );
  const longTermDeduction = capitalGain * longTermDeductionRate;

  // 양도소득금액
  const taxableIncome = capitalGain - longTermDeduction;

  // 기본공제 (연 250만원)
  const basicDeduction = 2500000;

  // 과세표준
  const taxBase = Math.max(taxableIncome - basicDeduction, 0);

  // 중과 판정
  const { isHeavyTax, heavyTaxRate } = checkHeavyTax(
    property,
    allProperties,
    saleDate,
    household
  );

  // 세율 적용
  let taxRate: number;
  if (isHeavyTax) {
    taxRate = heavyTaxRate || 0;
  } else if (holdingMonths < 12) {
    taxRate = 0.5; // 1년 미만 50%
  } else if (holdingMonths < 24) {
    taxRate = 0.4; // 1~2년 40%
  } else {
    // 기본세율
    const bracket = TAX_BRACKETS.find((b) => taxBase <= b.limit);
    taxRate = bracket ? bracket.rate : 0.45;
  }

  // 산출세액
  let calculatedTax: number;
  if (isHeavyTax || holdingMonths < 24) {
    calculatedTax = taxBase * taxRate;
  } else {
    const bracket = TAX_BRACKETS.find((b) => taxBase <= b.limit);
    calculatedTax = bracket ? taxBase * bracket.rate - bracket.deduction : 0;
  }

  // 지방소득세 (10%)
  const localTax = calculatedTax * 0.1;

  return {
    propertyId: property.id,
    propertyName: property.nickname,
    salePrice,
    acquisitionPrice,
    necessaryExpenses,
    capitalGain,
    longTermDeductionRate,
    longTermDeduction,
    taxableIncome,
    basicDeduction,
    taxBase,
    taxRate,
    calculatedTax,
    localTax,
    totalTax: calculatedTax + localTax,
    isTaxExempt: false,
    isHeavyTax,
    heavyTaxRate
  };
}

// 비과세 판정
function checkExemption(
  property: Property,
  household: Household,
  allProperties: Property[],
  isLastProperty: boolean,
  holdingMonths: number,
  salePrice: number
): { isTaxExempt: boolean; exemptionType?: string } {
  // 1세대 1주택 비과세 (12억 이하, 2년 보유)
  if (isLastProperty && salePrice <= 1200000000 && holdingMonths >= 24) {
    return { isTaxExempt: true, exemptionType: '1세대 1주택 비과세' };
  }

  // 거주주택 비과세 특례 (임대사업자)
  if (
    property.isCurrentResidence &&
    property.totalResidenceMonths >= 24 &&
    household.rentalBusinessRegistered
  ) {
    const hasRegisteredRental = allProperties.some(
      (p) => p.id !== property.id && p.rental?.isRegistered
    );
    if (hasRegisteredRental) {
      return { isTaxExempt: true, exemptionType: '거주주택 비과세 특례' };
    }
  }

  // 상생임대주택 비과세
  if (
    property.coexistence?.isCoexistenceRental &&
    property.coexistence?.rentIncreaseUnder5Pct &&
    property.coexistence?.rentalPeriodOver2Years
  ) {
    return { isTaxExempt: true, exemptionType: '상생임대주택 비과세' };
  }

  return { isTaxExempt: false };
}

// 장기보유특별공제율 계산
function calculateLongTermDeduction(
  property: Property,
  holdingYears: number,
  isLastProperty: boolean,
  salePrice: number
): number {
  // 임대사업자 우대
  if (property.rental?.isRegistered && property.rental.currentMonths) {
    const rentalYears = Math.floor(property.rental.currentMonths / 12);
    if (rentalYears >= 10) return 0.7; // 10년 70%
    if (rentalYears >= 8) return 0.5; // 8년 50%
  }

  // 1주택 고가주택 (12억 초과 + 2년 이상 거주)
  if (isLastProperty && salePrice > 1200000000 && property.totalResidenceMonths >= 24) {
    const residenceYears = Math.floor(property.totalResidenceMonths / 12);
    const holdingDeduction = Math.min(holdingYears * 0.04, 0.4);
    const residenceDeduction = Math.min(residenceYears * 0.04, 0.4);
    return Math.min(holdingDeduction + residenceDeduction, 0.8);
  }

  // 일반 (최대 30%)
  if (holdingYears < 3) return 0;
  return Math.min(0.06 + (holdingYears - 3) * 0.02, 0.3);
}

// 중과 판정
function checkHeavyTax(
  property: Property,
  allProperties: Property[],
  saleDate: Date,
  household: Household
): { isHeavyTax: boolean; heavyTaxRate?: number } {
  // 중과배제 기간 체크 (2026.5.9 이전)
  const exemptionDeadline = new Date('2026-05-09');
  if (saleDate <= exemptionDeadline) {
    const holdingMonths = Math.floor(
      (saleDate.getTime() - property.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (holdingMonths >= 24) {
      return { isHeavyTax: false };
    }
  }

  // 임대사업자 중과배제
  if (property.rental?.isRegistered && property.rental.status === 'ACTIVE') {
    return { isHeavyTax: false };
  }

  // 조정지역 다주택 판정
  if (!property.isRegulatedAreaNow) {
    return { isHeavyTax: false };
  }

  const houseCount = allProperties.length;

  if (houseCount >= 3) {
    return { isHeavyTax: true, heavyTaxRate: 0.75 }; // 기본세율 + 30%p (최대 75%)
  }

  if (houseCount >= 2) {
    return { isHeavyTax: true, heavyTaxRate: 0.65 }; // 기본세율 + 20%p (최대 65%)
  }

  return { isHeavyTax: false };
}

// 최적 양도 순서 분석
export function analyzeOptimalStrategy(
  household: Household,
  properties: Property[],
  condition: SaleCondition
): AnalysisResult {
  const scenarios: Scenario[] = [];

  // 시나리오 1: 세금 최소화 전략
  const taxMinimizeScenario = generateTaxMinimizeScenario(household, properties, condition);
  scenarios.push(taxMinimizeScenario);

  // 시나리오 2: 빠른 현금화 전략
  const quickCashScenario = generateQuickCashScenario(household, properties, condition);
  scenarios.push(quickCashScenario);

  // 시나리오 3: 1주택 비과세 확보 전략
  if (properties.length > 1 && condition.targetHouseCount === 1) {
    const oneHouseScenario = generateOneHouseScenario(household, properties, condition);
    scenarios.push(oneHouseScenario);
  }

  // 추천 시나리오 선정
  const recommendedScenarioId =
    condition.saleGoal === 'TAX_MINIMIZE'
      ? taxMinimizeScenario.id
      : condition.saleGoal === 'QUICK_CASH'
      ? quickCashScenario.id
      : taxMinimizeScenario.id;

  scenarios.forEach((s) => {
    if (s.id === recommendedScenarioId) s.isRecommended = true;
  });

  const totalPropertyValue = properties.reduce((sum, p) => sum + p.estimatedMarketPrice, 0);
  const totalAcquisitionCost = properties.reduce((sum, p) => sum + p.acquisitionPrice, 0);

  return {
    scenarios,
    recommendedScenarioId,
    generatedAt: new Date(),
    totalPropertyValue,
    totalAcquisitionCost,
    potentialGain: totalPropertyValue - totalAcquisitionCost
  };
}

// 세금 최소화 시나리오 생성
function generateTaxMinimizeScenario(
  household: Household,
  properties: Property[],
  condition: SaleCondition
): Scenario {
  const startDate = new Date();
  const saleSequence: SaleStep[] = [];
  const propertyTaxDetails: PropertyTaxDetail[] = [];
  const timeline: TimelineEvent[] = [];
  const warnings: string[] = [];
  const appliedBenefits: string[] = [];

  // 정렬 우선순위:
  // 1. 거주주택 비과세 특례 활용 (임대등록 있는 경우)
  // 2. 중과배제 기한 (2026.5.9) 이전 양도
  // 3. 1주택 비과세 마지막 확보
  // 4. 보유기간/거주기간이 긴 주택 나중에 (공제율 높음)

  let sortedProperties = [...properties];

  // 거주주택을 우선 양도 (임대사업자이고 임대주택 있는 경우)
  const residenceProperty = sortedProperties.find((p) => p.isCurrentResidence);
  const hasRegisteredRental = sortedProperties.some((p) => p.rental?.isRegistered);

  if (residenceProperty && hasRegisteredRental && household.rentalBusinessRegistered) {
    saleSequence.push({
      propertyId: residenceProperty.id,
      saleDate: new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000), // 3개월 후
      reason: '거주주택 비과세 특례 활용',
      priority: 1
    });
    appliedBenefits.push('거주주택 비과세 특례');
    sortedProperties = sortedProperties.filter((p) => p.id !== residenceProperty.id);
  }

  // 나머지 주택 정렬
  sortedProperties.sort((a, b) => {
    // 중과대상 먼저 처리
    const aRegulated = a.isRegulatedAreaNow ? 0 : 1;
    const bRegulated = b.isRegulatedAreaNow ? 0 : 1;
    if (aRegulated !== bRegulated) return aRegulated - bRegulated;

    // 보유기간 짧은 것 먼저
    return a.acquisitionDate.getTime() - b.acquisitionDate.getTime();
  });

  // 양도 순서 생성
  let currentDate = residenceProperty
    ? new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000)
    : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

  sortedProperties.forEach((property, index) => {
    const isLast = index === sortedProperties.length - 1;
    saleSequence.push({
      propertyId: property.id,
      saleDate: new Date(currentDate),
      reason: isLast ? '1주택 비과세 확보' : '다주택 중과 회피',
      priority: residenceProperty ? index + 2 : index + 1
    });
    currentDate = new Date(currentDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 6개월 간격
  });

  // 세금 계산
  let totalTax = 0;
  let totalProceeds = 0;

  saleSequence.forEach((step, index) => {
    const property = properties.find((p) => p.id === step.propertyId)!;
    const remainingProperties = properties.filter((p) =>
      saleSequence.slice(index).some((s) => s.propertyId === p.id)
    );
    const isLast = index === saleSequence.length - 1;

    const taxDetail = calculateTax(property, step.saleDate, household, remainingProperties, isLast);
    propertyTaxDetails.push(taxDetail);
    totalTax += taxDetail.totalTax;
    totalProceeds += property.estimatedMarketPrice - taxDetail.totalTax;

    timeline.push({
      date: step.saleDate,
      action: `${property.nickname} 양도`,
      description: step.reason,
      type: 'SALE'
    });

    if (taxDetail.isTaxExempt && taxDetail.exemptionType) {
      appliedBenefits.push(taxDetail.exemptionType);
    }
  });

  // 경고 메시지
  if (saleSequence.some((s) => s.saleDate > new Date('2026-05-09'))) {
    warnings.push('⚠️ 일부 주택이 중과배제 기한(2026.5.9) 이후 양도될 수 있습니다.');
  }

  return {
    id: 'tax-minimize',
    name: '세금 최소화 전략',
    isRecommended: false,
    saleSequence,
    totalEstimatedTax: totalTax,
    totalNetProceeds: totalProceeds,
    appliedBenefits: [...new Set(appliedBenefits)],
    timeline,
    warnings,
    propertyTaxDetails
  };
}

// 빠른 현금화 시나리오
function generateQuickCashScenario(
  household: Household,
  properties: Property[],
  condition: SaleCondition
): Scenario {
  const startDate = new Date();
  const saleSequence: SaleStep[] = [];
  const propertyTaxDetails: PropertyTaxDetail[] = [];
  const timeline: TimelineEvent[] = [];
  const warnings: string[] = ['이 전략은 세금보다 현금 확보를 우선합니다.'];

  // 시세 높은 순으로 정렬
  const sorted = [...properties].sort(
    (a, b) => b.estimatedMarketPrice - a.estimatedMarketPrice
  );

  let currentDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 1개월 후

  sorted.forEach((property, index) => {
    saleSequence.push({
      propertyId: property.id,
      saleDate: new Date(currentDate),
      reason: '빠른 현금화',
      priority: index + 1
    });
    currentDate = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000); // 2개월 간격
  });

  let totalTax = 0;
  let totalProceeds = 0;

  saleSequence.forEach((step, index) => {
    const property = properties.find((p) => p.id === step.propertyId)!;
    const remainingProperties = properties.filter((p) =>
      saleSequence.slice(index).some((s) => s.propertyId === p.id)
    );
    const isLast = index === saleSequence.length - 1;

    const taxDetail = calculateTax(property, step.saleDate, household, remainingProperties, isLast);
    propertyTaxDetails.push(taxDetail);
    totalTax += taxDetail.totalTax;
    totalProceeds += property.estimatedMarketPrice - taxDetail.totalTax;

    timeline.push({
      date: step.saleDate,
      action: `${property.nickname} 양도`,
      description: step.reason,
      type: 'SALE'
    });
  });

  return {
    id: 'quick-cash',
    name: '빠른 현금화 전략',
    isRecommended: false,
    saleSequence,
    totalEstimatedTax: totalTax,
    totalNetProceeds: totalProceeds,
    appliedBenefits: [],
    timeline,
    warnings,
    propertyTaxDetails
  };
}

// 1주택 비과세 확보 시나리오
function generateOneHouseScenario(
  household: Household,
  properties: Property[],
  condition: SaleCondition
): Scenario {
  const startDate = new Date();
  const saleSequence: SaleStep[] = [];
  const propertyTaxDetails: PropertyTaxDetail[] = [];
  const timeline: TimelineEvent[] = [];
  const appliedBenefits: string[] = ['1주택 비과세 확보'];

  // 거주주택을 마지막에 양도
  const residenceProperty = properties.find((p) => p.isCurrentResidence);
  const others = properties.filter((p) => !p.isCurrentResidence);

  let currentDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

  // 다른 주택 먼저 양도
  others.forEach((property, index) => {
    saleSequence.push({
      propertyId: property.id,
      saleDate: new Date(currentDate),
      reason: '다주택 정리',
      priority: index + 1
    });
    currentDate = new Date(currentDate.getTime() + 180 * 24 * 60 * 60 * 1000);
  });

  // 거주주택 마지막 (1주택 비과세)
  if (residenceProperty) {
    saleSequence.push({
      propertyId: residenceProperty.id,
      saleDate: new Date(currentDate),
      reason: '1주택 비과세 확보',
      priority: others.length + 1
    });
  }

  let totalTax = 0;
  let totalProceeds = 0;

  saleSequence.forEach((step, index) => {
    const property = properties.find((p) => p.id === step.propertyId)!;
    const remainingProperties = properties.filter((p) =>
      saleSequence.slice(index).some((s) => s.propertyId === p.id)
    );
    const isLast = index === saleSequence.length - 1;

    const taxDetail = calculateTax(property, step.saleDate, household, remainingProperties, isLast);
    propertyTaxDetails.push(taxDetail);
    totalTax += taxDetail.totalTax;
    totalProceeds += property.estimatedMarketPrice - taxDetail.totalTax;

    timeline.push({
      date: step.saleDate,
      action: `${property.nickname} 양도`,
      description: step.reason,
      type: 'SALE'
    });
  });

  return {
    id: 'one-house',
    name: '1주택 비과세 확보 전략',
    isRecommended: false,
    saleSequence,
    totalEstimatedTax: totalTax,
    totalNetProceeds: totalProceeds,
    appliedBenefits,
    timeline,
    warnings: [],
    propertyTaxDetails
  };
}
