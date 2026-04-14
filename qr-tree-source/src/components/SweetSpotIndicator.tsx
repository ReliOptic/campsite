import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp } from 'lucide-react';

interface SweetSpotIndicatorProps {
  salePrice: number;
  avgAppraisal: number;
}

export function SweetSpotIndicator({ salePrice, avgAppraisal }: SweetSpotIndicatorProps) {
  const ratio = avgAppraisal / salePrice;
  const percentage = ratio * 100;

  let color = 'bg-red-500';
  let statusText = '위험 구간';
  let description = '감정가가 너무 낮거나 높습니다';

  if (ratio >= 0.80 && ratio <= 0.90) {
    color = 'bg-green-500';
    statusText = '최적 구간 (Sweet Spot)';
    description = '세무 리스크가 낮은 안전한 범위입니다';
  } else if (ratio >= 0.70 && ratio < 0.80) {
    color = 'bg-yellow-500';
    statusText = '주의 구간';
    description = '약간 낮은 편이지만 설명 가능한 범위입니다';
  } else if (ratio > 0.90 && ratio < 0.95) {
    color = 'bg-yellow-500';
    statusText = '주의 구간';
    description = '감정가가 시가에 매우 근접합니다';
  }

  // Calculate position for indicator (scale from 70% to 95%)
  const minScale = 70;
  const maxScale = 95;
  const position = Math.min(Math.max(((percentage - minScale) / (maxScale - minScale)) * 100, 0), 100);

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
        <CardTitle className="text-green-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Sweet Spot Indicator
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl text-gray-800 mb-1">
              {percentage.toFixed(1)}%
            </div>
            <div className={`inline-block px-4 py-1 rounded-full ${color} text-white`}>
              {statusText}
            </div>
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          </div>

          {/* Visual indicator bar */}
          <div className="relative pt-8">
            <div className="h-3 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-yellow-500 to-red-500 rounded-full"></div>
            
            {/* Marker */}
            <div 
              className="absolute top-0 transform -translate-x-1/2 transition-all duration-300"
              style={{ left: `${position}%` }}
            >
              <div className="w-0.5 h-6 bg-gray-800"></div>
              <div className="w-3 h-3 bg-gray-800 rounded-full -mt-1 -ml-1.5"></div>
            </div>

            {/* Scale labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>70%</span>
              <span className="text-green-700">80-90%<br/>최적</span>
              <span>95%</span>
            </div>
          </div>

          {/* Zone descriptions */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-red-700">70% 이하</div>
              <div className="text-gray-600">고위험</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-green-700">80-90%</div>
              <div className="text-gray-600">최적</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-red-700">95% 이상</div>
              <div className="text-gray-600">의미 없음</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
