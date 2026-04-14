import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Scenario, Property } from '../../types';
import { Calendar, Home, TrendingUp } from 'lucide-react';

interface TimelineViewProps {
  scenario: Scenario;
  properties: Property[];
}

export function TimelineView({ scenario, properties }: TimelineViewProps) {
  const sortedTimeline = [...scenario.timeline].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const getProperty = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId);
  };

  function formatCurrency(amount: number): string {
    const eok = Math.floor(amount / 100000000);
    if (eok > 0) return `${eok}억원`;
    const man = Math.floor(amount / 10000);
    if (man > 0) return `${man.toLocaleString()}만원`;
    return `${amount.toLocaleString()}원`;
  }

  return (
    <div className="space-y-6">
      {/* 타임라인 헤더 */}
      <Card className="shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Calendar className="w-5 h-5" />
            {scenario.name} - 양도 타임라인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">양도 건수</div>
              <div className="text-2xl text-purple-900">{scenario.saleSequence.length}건</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">예상 기간</div>
              <div className="text-2xl text-purple-900">
                {Math.ceil(
                  (scenario.saleSequence[scenario.saleSequence.length - 1].saleDate.getTime() -
                    scenario.saleSequence[0].saleDate.getTime()) /
                    (1000 * 60 * 60 * 24 * 30)
                )}
                개월
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">시작 시점</div>
              <div className="text-xl text-purple-900">
                {scenario.saleSequence[0].saleDate.toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 타임라인 */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            {/* 타임라인 라인 */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 to-pink-300"></div>

            {/* 타임라인 아이템 */}
            <div className="space-y-8">
              {scenario.saleSequence.map((step, index) => {
                const property = getProperty(step.propertyId);
                if (!property) return null;

                const taxDetail = scenario.propertyTaxDetails.find(
                  (t) => t.propertyId === step.propertyId
                );

                return (
                  <div key={step.propertyId} className="relative pl-20">
                    {/* 타임라인 포인트 */}
                    <div className="absolute left-5 top-2 w-6 h-6 rounded-full bg-purple-600 border-4 border-white shadow-md flex items-center justify-center text-xs text-white">
                      {index + 1}
                    </div>

                    {/* 카드 */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Home className="w-4 h-4 text-purple-600" />
                                <h3 className="text-purple-900">{property.nickname}</h3>
                              </div>
                              <p className="text-sm text-gray-600">{property.address}</p>
                            </div>
                            <Badge variant="secondary">
                              {step.saleDate.toLocaleDateString('ko-KR')}
                            </Badge>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-xs text-purple-700 mb-1">양도 사유</div>
                            <div className="text-sm text-purple-900">{step.reason}</div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-xs text-gray-600">양도가</div>
                              <div className="text-gray-900">
                                {formatCurrency(property.estimatedMarketPrice)}
                              </div>
                            </div>
                            <div className="bg-red-50 p-2 rounded">
                              <div className="text-xs text-gray-600">세금</div>
                              <div className="text-red-700">
                                {taxDetail?.isTaxExempt
                                  ? '비과세'
                                  : formatCurrency(taxDetail?.totalTax || 0)}
                              </div>
                            </div>
                            <div className="bg-green-50 p-2 rounded">
                              <div className="text-xs text-gray-600">순수익</div>
                              <div className="text-green-700">
                                {formatCurrency(
                                  property.estimatedMarketPrice - (taxDetail?.totalTax || 0)
                                )}
                              </div>
                            </div>
                          </div>

                          {taxDetail?.isTaxExempt && (
                            <Badge className="bg-green-600 w-full justify-center">
                              ✓ {taxDetail.exemptionType}
                            </Badge>
                          )}

                          {taxDetail?.isHeavyTax && (
                            <Badge variant="destructive" className="w-full justify-center">
                              ⚠️ 중과세 적용 ({(taxDetail.heavyTaxRate! * 100).toFixed(0)}%)
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주요 마일스톤 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            주요 마일스톤
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scenario.appliedBenefits.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-900 mb-2">✓ 적용 예상 혜택</div>
                <div className="flex flex-wrap gap-2">
                  {scenario.appliedBenefits.map((benefit, idx) => (
                    <Badge key={idx} className="bg-green-600">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {scenario.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm text-amber-900 mb-2">⚠️ 주의사항</div>
                <ul className="space-y-1 text-sm text-amber-800">
                  {scenario.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-900 mb-2">💡 실행 체크리스트</div>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• 각 주택 양도 전 취득가액 및 필요경비 증빙서류 준비</li>
                <li>• 거주기간 증빙 (주민등록등본 등)</li>
                <li>• 임대사업자 등록 유지 및 의무기간 준수 확인</li>
                <li>• 양도 시점 조정지역 지정 여부 확인</li>
                <li>• 세무사 사전 상담 권장</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
