import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { ScenarioComparison } from './ScenarioComparison';
import { TimelineView } from './TimelineView';
import { TaxDetailView } from './TaxDetailView';
import type { AnalysisResult, Household, Property } from '../../types';
import { Sparkles, Edit } from 'lucide-react';

interface AnalysisResultsProps {
  result: AnalysisResult;
  household: Household;
  properties: Property[];
  onEdit: () => void;
}

export function AnalysisResults({ result, household, properties, onEdit }: AnalysisResultsProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(result.recommendedScenarioId);
  const selectedScenario = result.scenarios.find((s) => s.id === selectedScenarioId);

  function formatCurrency(amount: number): string {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
    if (eok > 0) return `${eok}억원`;
    if (man > 0) return `${man.toLocaleString()}만원`;
    return `${amount.toLocaleString()}원`;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Sparkles className="w-6 h-6" />
                AI 양도전략 분석 완료
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {properties.length}개 주택에 대한 최적 양도 전략을 분석했습니다.
              </p>
            </div>
            <Button onClick={onEdit} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              정보 수정
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">총 보유 자산</div>
              <div className="text-xl text-gray-900">
                {formatCurrency(result.totalPropertyValue)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">예상 평가이익</div>
              <div className="text-xl text-green-700">
                {formatCurrency(result.potentialGain)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">추천 전략 절세액</div>
              <div className="text-xl text-blue-700">
                {formatCurrency(
                  Math.max(
                    ...result.scenarios.map((s) => s.totalEstimatedTax)
                  ) -
                    (result.scenarios.find((s) => s.isRecommended)?.totalEstimatedTax || 0)
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 메인 콘텐츠 */}
      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">시나리오 비교</TabsTrigger>
          <TabsTrigger value="timeline">양도 타임라인</TabsTrigger>
          <TabsTrigger value="detail">세금 상세</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <ScenarioComparison
            scenarios={result.scenarios}
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={setSelectedScenarioId}
            properties={properties}
          />
        </TabsContent>

        <TabsContent value="timeline">
          {selectedScenario && (
            <TimelineView scenario={selectedScenario} properties={properties} />
          )}
        </TabsContent>

        <TabsContent value="detail">
          {selectedScenario && (
            <TaxDetailView scenario={selectedScenario} properties={properties} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
