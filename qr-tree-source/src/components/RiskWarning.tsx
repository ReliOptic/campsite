import { CalculationResults } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface RiskWarningProps {
  results: CalculationResults;
}

export function RiskWarning({ results }: RiskWarningProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'warning':
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'caution':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'safe':
        return 'bg-green-100 border-green-500 text-green-900';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'danger':
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'caution':
        return <AlertCircle className="w-5 h-5" />;
      case 'safe':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-red-50">
        <CardTitle className="text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          리스크 경고
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">
        <div className={`p-4 rounded-lg border-2 ${getRiskColor(results.marketRisk.level)}`}>
          <div className="flex items-start gap-3">
            {getRiskIcon(results.marketRisk.level)}
            <div>
              <p className="leading-relaxed">{results.marketRisk.message}</p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border-2 ${getRiskColor(results.appDiffRisk.level)}`}>
          <div className="flex items-start gap-3">
            {getRiskIcon(results.appDiffRisk.level)}
            <div>
              <p className="leading-relaxed">{results.appDiffRisk.message}</p>
            </div>
          </div>
        </div>

        {(results.marketRisk.level === 'danger' || results.marketRisk.level === 'warning') && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
            <p className="text-sm text-gray-700">
              <span className="text-gray-900">💡 참고:</span> 감정가가 시가보다 과도하게 낮을 경우 
              세무당국이 시가로 재산정할 수 있습니다. 일반적으로 시가의 80~90% 수준이 
              안전한 범위로 알려져 있습니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
