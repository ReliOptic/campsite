import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Scenario, Property } from '../../types';
import { Calculator, PieChart } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TaxDetailViewProps {
  scenario: Scenario;
  properties: Property[];
}

export function TaxDetailView({ scenario, properties }: TaxDetailViewProps) {
  function formatCurrency(amount: number): string {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
    if (eok > 0) return `${eok}억원`;
    if (man > 0) return `${man.toLocaleString()}만원`;
    return `${amount.toLocaleString()}원`;
  }

  const getProperty = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId);
  };

  // 파이 차트 데이터
  const pieData = [
    {
      name: '세금',
      value: scenario.totalEstimatedTax,
      color: '#ef4444'
    },
    {
      name: '순수익',
      value: scenario.totalNetProceeds,
      color: '#10b981'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              세금 vs 순수익 비율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / (scenario.totalEstimatedTax + scenario.totalNetProceeds)) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              재무 요약
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">총 양도가액</div>
              <div className="text-2xl text-blue-900">
                {formatCurrency(
                  scenario.propertyTaxDetails.reduce((sum, d) => sum + d.salePrice, 0)
                )}
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">총 납부 세금</div>
              <div className="text-2xl text-red-700">
                {formatCurrency(scenario.totalEstimatedTax)}
              </div>
              <div className="text-xs text-red-600 mt-1">
                (지방소득세 포함)
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">예상 순수익</div>
              <div className="text-2xl text-green-700">
                {formatCurrency(scenario.totalNetProceeds)}
              </div>
              <div className="text-xs text-green-600 mt-1">
                실효세율:{' '}
                {(
                  (scenario.totalEstimatedTax /
                    scenario.propertyTaxDetails.reduce((sum, d) => sum + d.capitalGain, 0)) *
                  100
                ).toFixed(2)}
                %
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주택별 상세 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>주택별 세금 계산 상세</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scenario.propertyTaxDetails.map((detail, index) => {
            const property = getProperty(detail.propertyId);
            if (!property) return null;

            return (
              <Card key={detail.propertyId} className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* 헤더 */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-indigo-900 mb-1">
                          {index + 1}. {detail.propertyName}
                        </h3>
                        <p className="text-sm text-gray-600">{property.address}</p>
                      </div>
                      {detail.isTaxExempt ? (
                        <Badge className="bg-green-600">비과세</Badge>
                      ) : detail.isHeavyTax ? (
                        <Badge variant="destructive">중과세</Badge>
                      ) : (
                        <Badge variant="secondary">일반과세</Badge>
                      )}
                    </div>

                    {/* 계산 단계 */}
                    {detail.isTaxExempt ? (
                      <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">✓</span>
                          <div>
                            <div className="text-green-900">비과세 적용</div>
                            <div className="text-sm text-green-700">{detail.exemptionType}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-white rounded-lg p-3">
                          <div className="text-gray-600">양도가액</div>
                          <div className="text-right text-gray-900">
                            {formatCurrency(detail.salePrice)}
                          </div>

                          <div className="text-gray-600">(-) 취득가액</div>
                          <div className="text-right text-gray-900">
                            {formatCurrency(detail.acquisitionPrice)}
                          </div>

                          <div className="text-gray-600">(-) 필요경비</div>
                          <div className="text-right text-gray-900">
                            {formatCurrency(detail.necessaryExpenses)}
                          </div>

                          <div className="col-span-2 border-t border-gray-300 my-1"></div>

                          <div className="text-blue-700">= 양도차익</div>
                          <div className="text-right text-blue-900">
                            {formatCurrency(detail.capitalGain)}
                          </div>
                        </div>

                        {detail.longTermDeductionRate > 0 && (
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-purple-700">
                                (-) 장기보유특별공제 ({(detail.longTermDeductionRate * 100).toFixed(0)}%)
                              </div>
                              <div className="text-right text-purple-900">
                                {formatCurrency(detail.longTermDeduction)}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-indigo-700">= 양도소득금액</div>
                            <div className="text-right text-indigo-900">
                              {formatCurrency(detail.taxableIncome)}
                            </div>

                            <div className="text-gray-600">(-) 기본공제</div>
                            <div className="text-right text-gray-900">
                              {formatCurrency(detail.basicDeduction)}
                            </div>

                            <div className="col-span-2 border-t border-gray-300 my-1"></div>

                            <div className="text-blue-700">= 과세표준</div>
                            <div className="text-right text-blue-900">
                              {formatCurrency(detail.taxBase)}
                            </div>

                            <div className="text-gray-600">
                              × 세율{' '}
                              {detail.isHeavyTax && detail.heavyTaxRate
                                ? `(중과 ${(detail.heavyTaxRate * 100).toFixed(0)}%)`
                                : `(${(detail.taxRate * 100).toFixed(0)}%)`}
                            </div>
                            <div className="text-right"></div>
                          </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-red-700">= 산출세액</div>
                            <div className="text-right text-red-900">
                              {formatCurrency(detail.calculatedTax)}
                            </div>

                            <div className="text-red-700">(+) 지방소득세 (10%)</div>
                            <div className="text-right text-red-900">
                              {formatCurrency(detail.localTax)}
                            </div>

                            <div className="col-span-2 border-t-2 border-red-400 my-1"></div>

                            <div className="text-red-900">= 총 납부세액</div>
                            <div className="text-right text-red-900 text-xl">
                              {formatCurrency(detail.totalTax)}
                            </div>
                          </div>
                        </div>

                        {/* 순수익 */}
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-green-700">순수익 (양도가 - 세금)</div>
                            <div className="text-right text-green-900 text-xl">
                              {formatCurrency(detail.salePrice - detail.totalTax)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* 참고사항 */}
      <Card className="shadow-lg border-2 border-amber-300">
        <CardHeader className="bg-amber-50">
          <CardTitle className="text-amber-900">⚠️ 중요 참고사항</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="space-y-2 text-sm text-amber-900">
            <li>
              • 이 계산은 <strong>예상 금액</strong>이며, 실제 세액은 양도 시점의 세법 및 개별
              상황에 따라 달라질 수 있습니다.
            </li>
            <li>
              • 조정대상지역 지정 여부, 공시가격 변동 등 외부 변수에 따라 중과세 적용 여부가
              변경될 수 있습니다.
            </li>
            <li>
              • 임대사업자 혜택은 의무기간 준수, 5% 임대료 상한 준수 등 요건 충족이 필수입니다.
            </li>
            <li>
              • <strong>반드시 세무사와 상담</strong>하여 개별 상황에 맞는 검토를 받으시기
              바랍니다.
            </li>
            <li>
              • 감정평가, 실거래 신고가액 조정 등을 통해 추가 절세가 가능할 수 있습니다.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
