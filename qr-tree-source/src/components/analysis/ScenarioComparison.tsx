import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { Scenario, Property } from '../../types';
import { TrendingDown, Check, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ScenarioComparisonProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  properties: Property[];
}

export function ScenarioComparison({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  properties
}: ScenarioComparisonProps) {
  function formatCurrency(amount: number): string {
    const eok = Math.floor(amount / 100000000);
    if (eok > 0) return `${eok}억`;
    const man = Math.floor(amount / 10000);
    if (man > 0) return `${man.toLocaleString()}만`;
    return `${amount.toLocaleString()}`;
  }

  const chartData = scenarios.map((scenario) => ({
    name: scenario.name,
    세금: scenario.totalEstimatedTax / 100000000, // 억 단위
    순수익: scenario.totalNetProceeds / 100000000
  }));

  return (
    <div className="space-y-6">
      {/* 차트 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            시나리오별 세금 및 순수익 비교
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: '억원', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}억원`}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Bar dataKey="세금" fill="#ef4444" />
              <Bar dataKey="순수익" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 시나리오 카드 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
          <Card
            key={scenario.id}
            className={`cursor-pointer transition-all ${
              selectedScenarioId === scenario.id
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => onSelectScenario(scenario.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{scenario.name}</CardTitle>
                {scenario.isRecommended && (
                  <Badge className="bg-blue-600">
                    <Check className="w-3 h-3 mr-1" />
                    추천
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">예상 총 세금</div>
                <div className="text-xl text-red-700">
                  {formatCurrency(scenario.totalEstimatedTax)}원
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">예상 순수익</div>
                <div className="text-xl text-green-700">
                  {formatCurrency(scenario.totalNetProceeds)}원
                </div>
              </div>

              {scenario.appliedBenefits.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">적용 혜택</div>
                  {scenario.appliedBenefits.map((benefit, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs mr-1">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              )}

              {scenario.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2">
                  <div className="flex items-start gap-2 text-xs text-amber-900">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{scenario.warnings[0]}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={() => onSelectScenario(scenario.id)}
                variant={selectedScenarioId === scenario.id ? 'default' : 'outline'}
                size="sm"
                className="w-full"
              >
                {selectedScenarioId === scenario.id ? '선택됨' : '상세 보기'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 비교 테이블 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>상세 비교표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="py-3 px-4 text-left text-gray-700">전략</th>
                  <th className="py-3 px-4 text-right text-gray-700">총 세금</th>
                  <th className="py-3 px-4 text-right text-gray-700">순수익</th>
                  <th className="py-3 px-4 text-right text-gray-700">양도 순서</th>
                  <th className="py-3 px-4 text-center text-gray-700">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scenarios.map((scenario) => (
                  <tr
                    key={scenario.id}
                    className={`hover:bg-gray-50 ${
                      selectedScenarioId === scenario.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {scenario.name}
                        {scenario.isRecommended && (
                          <Badge className="bg-blue-600 text-xs">추천</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-red-700">
                      {formatCurrency(scenario.totalEstimatedTax)}원
                    </td>
                    <td className="py-3 px-4 text-right text-green-700">
                      {formatCurrency(scenario.totalNetProceeds)}원
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                      {scenario.saleSequence.length}건
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        onClick={() => onSelectScenario(scenario.id)}
                        variant={selectedScenarioId === scenario.id ? 'default' : 'ghost'}
                        size="sm"
                      >
                        {selectedScenarioId === scenario.id ? '선택됨' : '선택'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
