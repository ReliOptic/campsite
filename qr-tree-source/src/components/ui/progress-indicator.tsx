import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="bg-white sticky top-0 z-50 border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
              {currentStep < totalSteps - 1 ? (
                currentStep + 1
              ) : (
                <Check className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-sm text-blue-900">
                {currentStep + 1}/{totalSteps} 단계
              </div>
              <div className="text-xs text-gray-600">
                {Math.round(progress)}% 완료
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            자동 저장됨 ✓
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="w-full h-full bg-white/30 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
