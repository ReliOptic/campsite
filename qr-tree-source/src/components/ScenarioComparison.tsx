import { CalculationInputs } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart3 } from 'lucide-react';

interface ScenarioComparisonProps {
  inputs: CalculationInputs;
}

function formatKoreanCurrency(amount: number): string {
  const eok = Math.floor(amount / 100000000);
  const man = Math.floor((amount % 100000000) / 10000);
  
  if (eok > 0 && man > 0) {
    return `${eok}억 ${man.toLocaleString()}만원`;
  } else if (eok > 0) {
    return `${eok}억원`;
  } else if (man > 0) {
    return `${man.toLocaleString()}만원`;
  } else {
    return `${amount.toLocaleString()}원`;
  }
}

export function ScenarioComparison({ inputs }: ScenarioComparisonProps) {
  const scenarios = [95, 90, 85, 80].map(percent => {
    const appraisal = inputs.salePrice * (percent / 100);
    const gain = appraisal - inputs.purchasePrice - inputs.expenses;
    const taxWithAppraisal = Math.max(gain, 0) * inputs.taxRate;
    
    const gainReal = inputs.salePrice - inputs.purchasePrice - inputs.expenses;
    const taxReal = Math.max(gainReal, 0) * inputs.taxRate;
    
    const saving = taxReal - taxWithAppraisal;
    const netBenefit = saving - (inputs.fee1 + inputs.fee2);
    
    return {
      percent,
      appraisal,
      taxSaving: saving,
      netBenefit
    };
  });

  const maxSaving = Math.max(...scenarios.map(s => s.taxSaving));

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="text-purple-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          시나리오 비교
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-purple-200">
                <th className="py-3 text-left text-gray-700">시가 대비</th>
                <th className="py-3 text-right text-gray-700">감정가</th>
                <th className="py-3 text-right text-gray-700">절세액</th>
                <th className="py-3 text-right text-gray-700">순이익</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {scenarios.map((scenario, index) => {
                const isOptimal = scenario.taxSaving === maxSaving;
                const rowClass = isOptimal ? 'bg-emerald-50' : '';
                
                return (
                  <tr key={index} className={rowClass}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className={isOptimal ? 'text-emerald-900' : 'text-gray-700'}>
                          {scenario.percent}%
                        </span>
                        {isOptimal && (
                          <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">
                            최대
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 text-right text-sm ${isOptimal ? 'text-emerald-900' : 'text-gray-700'}`}>
                      {formatKoreanCurrency(scenario.appraisal)}
                    </td>
                    <td className={`py-3 text-right ${isOptimal ? 'text-emerald-900' : 'text-blue-600'}`}>
                      {formatKoreanCurrency(scenario.taxSaving)}
                    </td>
                    <td className={`py-3 text-right ${isOptimal ? 'text-emerald-900' : 'text-indigo-600'}`}>
                      {formatKoreanCurrency(scenario.netBenefit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="text-gray-900">💡 해석:</span> 감정가가 낮을수록 절세액은 증가하지만, 
            세무 리스크도 함께 증가합니다. 80-90% 구간에서 균형을 찾는 것이 중요합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
