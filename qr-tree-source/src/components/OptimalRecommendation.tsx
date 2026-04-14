import { CalculationInputs } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lightbulb, Target } from 'lucide-react';

interface OptimalRecommendationProps {
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

export function OptimalRecommendation({ inputs }: OptimalRecommendationProps) {
  // Calculate optimal appraisal in safe zone (82-88%)
  const candidates = [];
  for (let percent = 82; percent <= 88; percent += 0.5) {
    const appraisal = inputs.salePrice * (percent / 100);
    const gain = appraisal - inputs.purchasePrice - inputs.expenses;
    const taxWithAppraisal = Math.max(gain, 0) * inputs.taxRate;
    
    const gainReal = inputs.salePrice - inputs.purchasePrice - inputs.expenses;
    const taxReal = Math.max(gainReal, 0) * inputs.taxRate;
    
    const saving = taxReal - taxWithAppraisal;
    const netBenefit = saving - (inputs.fee1 + inputs.fee2);
    
    candidates.push({
      percent,
      appraisal,
      taxSaving: saving,
      netBenefit
    });
  }

  // Find the one with maximum net benefit
  const optimal = candidates.reduce((max, current) => 
    current.netBenefit > max.netBenefit ? current : max
  );

  // Calculate what each appraiser should report (variation ±2%)
  const variation = 0.02;
  const appraisal1Recommended = optimal.appraisal * (1 - variation);
  const appraisal2Recommended = optimal.appraisal * (1 + variation);

  return (
    <Card className="shadow-xl border-2 border-emerald-300">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500">
        <CardTitle className="text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          최적 감정가 추천
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Main recommendation */}
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-emerald-700" />
              <h3 className="text-emerald-900">최적 평균 감정가</h3>
            </div>
            <div className="text-3xl text-emerald-900 mb-2">
              {formatKoreanCurrency(optimal.appraisal)}
            </div>
            <div className="text-emerald-700">
              실거래가의 {optimal.percent.toFixed(1)}%
            </div>
          </div>

          {/* Expected results */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">예상 절세액</div>
              <div className="text-xl text-blue-900">
                {formatKoreanCurrency(optimal.taxSaving)}
              </div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">예상 순이익</div>
              <div className="text-xl text-indigo-900">
                {formatKoreanCurrency(optimal.netBenefit)}
              </div>
            </div>
          </div>

          {/* Individual appraisal recommendations */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-purple-900 mb-3">개별 감정가 권장 범위</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-gray-700">감정가 1</span>
                <span className="text-purple-900">
                  {formatKoreanCurrency(appraisal1Recommended)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-gray-700">감정가 2</span>
                <span className="text-purple-900">
                  {formatKoreanCurrency(appraisal2Recommended)}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                * 두 감정가의 차이를 약 4% 이내로 유지하여 신뢰도를 높입니다
              </p>
            </div>
          </div>

          {/* Why this is optimal */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-gray-900 mb-2">왜 이 구간이 최적인가?</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>실거래가의 82-88% 구간은 세무당국의 시가 재산정 위험이 낮습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>충분한 절세 효과를 얻으면서도 리스크를 최소화합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>감정 수수료를 고려한 순이익이 최대가 되는 지점입니다</span>
              </li>
            </ul>
          </div>

          {/* Action items */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
            <h4 className="text-amber-900 mb-2 flex items-center gap-2">
              <span>⚠️</span>
              <span>실행 전 확인사항</span>
            </h4>
            <ul className="space-y-1 text-sm text-amber-900">
              <li>• 감정평가사에게 유사 매매 사례와 비교 근거 요청</li>
              <li>• 주변 시세 하락 등 감정가가 낮은 합리적 이유 확보</li>
              <li>• 세무사와 사전 상담하여 개별 상황 검토</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
