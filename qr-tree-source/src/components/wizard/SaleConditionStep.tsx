import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InfoTooltip } from '../ui/info-tooltip';
import type { SaleCondition, Property, SaleGoal, SaleTimeframe } from '../../types';
import { Target, Clock, Sparkles } from 'lucide-react';
import { tooltipData } from '../../lib/tooltipData';

interface SaleConditionStepProps {
  properties: Property[];
  initialData: SaleCondition | null;
  onComplete: (data: SaleCondition) => void;
  onBack: () => void;
}

export function SaleConditionStep({
  properties,
  initialData,
  onComplete,
  onBack
}: SaleConditionStepProps) {
  const [formData, setFormData] = useState<SaleCondition>(
    initialData || {
      saleGoal: 'TAX_MINIMIZE',
      saleTimeframe: 'WITHIN_3Y',
      targetHouseCount: 1,
      cashNeededDate: undefined,
      cashNeededAmount: undefined,
      planNewAcquisition: false,
      planRentalRegistration: false,
      planHouseholdSeparation: false
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const saleGoalLabels: Record<SaleGoal, string> = {
    TAX_MINIMIZE: '세금 최소화 (AI 추천)',
    QUICK_CASH: '빠른 현금화',
    SPECIFIC_PROPERTY: '특정 주택 정리',
    ONE_HOUSE_EXEMPTION: '1주택 비과세 확보'
  };

  const saleTimeframeLabels: Record<SaleTimeframe, string> = {
    IMMEDIATE: '즉시 (6개월 이내)',
    WITHIN_1Y: '1년 이내',
    WITHIN_3Y: '3년 이내',
    WITHIN_5Y: '5년 이내',
    AFTER_MANDATORY: '의무기간 이후'
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid md:grid-cols-2 gap-6">
        {/* 양도 목표 */}
        <Card className="shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-all">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Target className="w-5 h-5" />
              양도 목표
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="saleGoal">우선 목표</Label>
                <InfoTooltip {...tooltipData.saleGoal} />
              </div>
              <Select
                value={formData.saleGoal}
                onValueChange={(value: SaleGoal) =>
                  setFormData({ ...formData, saleGoal: value })
                }
              >
                <SelectTrigger className="text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(saleGoalLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetHouseCount">최종 목표 주택 수</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="targetHouseCount"
                  type="number"
                  value={formData.targetHouseCount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetHouseCount: parseInt(e.target.value) })
                  }
                  min={0}
                  max={properties.length}
                  className="text-lg flex-1"
                />
                <span className="text-gray-600">채</span>
              </div>
              <p className="text-xs text-gray-500">
                현재 {properties.length}개 보유 중
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="text-sm text-blue-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">목표별 AI 전략</span>
              </h4>
              <ul className="text-xs text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>세금 최소화:</strong> 중과배제 활용, 비과세 극대화, 장특공제 우대</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>빠른 현금화:</strong> 고가주택 우선, 단기 양도 일정</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>1주택 비과세:</strong> 순차 정리 후 최종 비과세 확보</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 양도 시점 */}
        <Card className="shadow-lg border-2 border-teal-100 hover:border-teal-300 transition-all">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <Clock className="w-5 h-5" />
              양도 시점
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="saleTimeframe">양도 희망 시기</Label>
                <InfoTooltip {...tooltipData.saleTimeframe} />
              </div>
              <Select
                value={formData.saleTimeframe}
                onValueChange={(value: SaleTimeframe) =>
                  setFormData({ ...formData, saleTimeframe: value })
                }
              >
                <SelectTrigger className="text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(saleTimeframeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashNeededDate">자금 필요 시점 (선택)</Label>
              <Input
                id="cashNeededDate"
                type="date"
                value={
                  formData.cashNeededDate
                    ? formData.cashNeededDate.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cashNeededDate: e.target.value ? new Date(e.target.value) : undefined
                  })
                }
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashNeededAmount">필요 자금액 (선택)</Label>
              <div className="relative">
                <Input
                  id="cashNeededAmount"
                  type="number"
                  value={formData.cashNeededAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cashNeededAmount: e.target.value ? parseFloat(e.target.value) : undefined
                    })
                  }
                  placeholder="0"
                  className="text-lg pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm text-amber-900 mb-2">⏰ 중요 세법 데드라인</h4>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• <strong>2026.5.9:</strong> 다주택 중과배제 한시특례 종료</li>
                <li>• <strong>2026.12.31:</strong> 상생임대 특례 종료</li>
                <li>• 임대 의무기간 종료일 반드시 확인</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 추가 계획 */}
        <Card className="shadow-lg md:col-span-2 border-2 border-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-purple-900">추가 계획</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow">
                <div>
                  <Label>신규 주택 취득</Label>
                  <p className="text-xs text-gray-500">추가 매수 계획</p>
                </div>
                <Switch
                  checked={formData.planNewAcquisition}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, planNewAcquisition: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-shadow">
                <div>
                  <Label>임대등록 변경</Label>
                  <p className="text-xs text-gray-500">추가/말소 검토</p>
                </div>
                <Switch
                  checked={formData.planRentalRegistration}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, planRentalRegistration: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:shadow-md transition-shadow">
                <div>
                  <Label>세대분리</Label>
                  <p className="text-xs text-gray-500">자녀 분리 등</p>
                </div>
                <Switch
                  checked={formData.planHouseholdSeparation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, planHouseholdSeparation: checked })
                  }
                />
              </div>
            </div>

            {(formData.planNewAcquisition || formData.planRentalRegistration || formData.planHouseholdSeparation) && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 animate-in fade-in">
                <h4 className="text-sm text-blue-900 mb-2">💡 고려사항</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  {formData.planNewAcquisition && (
                    <li>• 신규 취득 시 일시적 2주택 특례 검토 필요</li>
                  )}
                  {formData.planRentalRegistration && (
                    <li>• 임대등록 말소 시 5년 이내 양도 시 특례 유지</li>
                  )}
                  {formData.planHouseholdSeparation && (
                    <li>• 세대분리는 양도 전 최소 2년 이상 유지 권장</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          ← 이전 단계
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl transition-all px-8"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          AI 분석 시작
        </Button>
      </div>
    </form>
  );
}
