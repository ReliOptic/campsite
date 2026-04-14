import { CalculationResults, CalculationInputs } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ResultsTableProps {
  results: CalculationResults;
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

export function ResultsTable({ results, inputs }: ResultsTableProps) {
  const appraisalToSaleRatio = (results.avgAppraisal / inputs.salePrice) * 100;
  const deviationPercent = results.deviationFromMarket * 100;
  const appDiffPercent = results.deviationBetweenApp * 100;

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <CardTitle className="text-white">계산 결과</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* 세금 비교 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <table className="w-full">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-gray-600">실거래가 기준 세금</td>
                  <td className="py-2 text-right text-red-600">
                    {formatKoreanCurrency(results.taxReal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">감정가 기준 세금</td>
                  <td className="py-2 text-right text-blue-600">
                    {formatKoreanCurrency(results.taxApp)}
                  </td>
                </tr>
                <tr className="bg-emerald-50">
                  <td className="py-2 text-emerald-900">절세액</td>
                  <td className="py-2 text-right text-emerald-900">
                    {formatKoreanCurrency(results.taxSaving)}
                  </td>
                </tr>
                <tr className="bg-indigo-50">
                  <td className="py-2 text-indigo-900">순이익 (수수료 차감)</td>
                  <td className="py-2 text-right text-indigo-900">
                    {formatKoreanCurrency(results.netBenefit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 비율 분석 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-blue-900 mb-3">주요 비율</h4>
            <table className="w-full">
              <tbody className="divide-y divide-blue-200">
                <tr>
                  <td className="py-2 text-gray-700">감정가 평균</td>
                  <td className="py-2 text-right">
                    {formatKoreanCurrency(results.avgAppraisal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">감정가 / 실거래가</td>
                  <td className="py-2 text-right">
                    {appraisalToSaleRatio.toFixed(2)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">감정가 괴리율</td>
                  <td className="py-2 text-right">
                    {deviationPercent.toFixed(2)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">감정기관 간 편차</td>
                  <td className="py-2 text-right">
                    {appDiffPercent.toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 감정 상세 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-purple-900 mb-3">감정 상세</h4>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-purple-200">
                <tr>
                  <td className="py-2 text-gray-700">감정가 1</td>
                  <td className="py-2 text-right">
                    {formatKoreanCurrency(inputs.appraisal1)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">감정가 2</td>
                  <td className="py-2 text-right">
                    {formatKoreanCurrency(inputs.appraisal2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">총 감정 수수료</td>
                  <td className="py-2 text-right">
                    {formatKoreanCurrency(inputs.fee1 + inputs.fee2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
