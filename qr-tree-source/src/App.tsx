import { useState, useEffect } from 'react';
import { WizardProvider } from './components/wizard/WizardContext';
import { WizardSteps } from './components/wizard/WizardSteps';
import { ProgressIndicator } from './components/ui/progress-indicator';
import { HouseholdStep } from './components/wizard/HouseholdStep';
import { PropertyListStep } from './components/wizard/PropertyListStep';
import { SaleConditionStep } from './components/wizard/SaleConditionStep';
import { AnalysisResults } from './components/analysis/AnalysisResults';
import { QRTreeDemo } from './components/qr-tree/QRTreeDemo';
import { Building2 } from 'lucide-react';
import type { Household, Property, SaleCondition, AnalysisResult } from './types';

// Daum 우편번호 API 스크립트 로드
declare global {
  interface Window {
    daum: any;
  }
}

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();

  // QR Tree is the default landing page
  if (!hash || hash === '#/' || hash === '#/qr-tree') {
    return <QRTreeDemo />;
  }

  // Original app at #/app
  if (hash === '#/app') {
    return <MainApp />;
  }

  return <QRTreeDemo />;
}

function MainApp() {
  const [currentStep, setCurrentStep] = useState(0);
  const [household, setHousehold] = useState<Household | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [saleCondition, setSaleCondition] = useState<SaleCondition | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // 다음 우편번호 API 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.body.appendChild(script);

    // 로컬스토리지에서 복구
    const savedHousehold = localStorage.getItem('household_data');
    if (savedHousehold) {
      try {
        const parsed = JSON.parse(savedHousehold);
        if (parsed.businessRegistrationDate) {
          parsed.businessRegistrationDate = new Date(parsed.businessRegistrationDate);
        }
        setHousehold(parsed);
      } catch (e) {
        console.error('Failed to parse saved household data');
      }
    }

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const steps = [
    { id: 0, title: '세대 정보', description: '세대주 및 가구 정보' },
    { id: 1, title: '보유 주택', description: '주택 포트폴리오 관리' },
    { id: 2, title: '양도 조건', description: '목표 및 시점 설정' },
    { id: 3, title: '분석 결과', description: '최적화 전략 제안' }
  ];

  const handleHouseholdComplete = (data: Household) => {
    setHousehold(data);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePropertiesComplete = (data: Property[]) => {
    setProperties(data);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaleConditionComplete = (data: SaleCondition) => {
    setSaleCondition(data);
    if (household && properties.length > 0) {
      const result = runAnalysis(household, properties, data);
      setAnalysisResult(result);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const runAnalysis = (
    household: Household,
    properties: Property[],
    condition: SaleCondition
  ): AnalysisResult => {
    const { analyzeOptimalStrategy } = require('./lib/analysisEngine');
    return analyzeOptimalStrategy(household, properties, condition);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-blue-900 text-xl">다주택자 양도전략 AI</h1>
              <p className="text-xs text-gray-600">2026년 세법 기준 · 최적 양도 순서 자동 분석</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={currentStep} totalSteps={steps.length} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <WizardProvider value={{ currentStep, setCurrentStep, steps }}>
          <WizardSteps />

          <div className="mt-8">
            {currentStep === 0 && (
              <div className="animate-in fade-in slide-in-from-right duration-500">
                <HouseholdStep
                  initialData={household}
                  onComplete={handleHouseholdComplete}
                />
              </div>
            )}

            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right duration-500">
                <PropertyListStep
                  initialData={properties}
                  household={household}
                  onComplete={handlePropertiesComplete}
                  onBack={() => setCurrentStep(0)}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right duration-500">
                <SaleConditionStep
                  properties={properties}
                  initialData={saleCondition}
                  onComplete={handleSaleConditionComplete}
                  onBack={() => setCurrentStep(1)}
                />
              </div>
            )}

            {currentStep === 3 && analysisResult && (
              <div className="animate-in fade-in slide-in-from-right duration-500">
                <AnalysisResults
                  result={analysisResult}
                  household={household!}
                  properties={properties}
                  onEdit={() => setCurrentStep(0)}
                />
              </div>
            )}
          </div>
        </WizardProvider>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-xs text-gray-500 space-y-2">
            <p>⚠️ 본 서비스는 참고용이며, 실제 세무 상담은 전문가와 진행하시기 바랍니다.</p>
            <p>© 2025 다주택자 양도전략 AI. All rights reserved.</p>
            <p className="pt-2">
              <a href="#/qr-tree" className="text-indigo-500 hover:text-indigo-700 underline">
                QR Tree Demo
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
