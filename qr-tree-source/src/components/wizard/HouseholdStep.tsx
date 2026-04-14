import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { InfoTooltip } from '../ui/info-tooltip';
import type { Household } from '../../types';
import { Users, Building, Save } from 'lucide-react';
import { tooltipData } from '../../lib/tooltipData';

interface HouseholdStepProps {
  initialData: Household | null;
  onComplete: (data: Household) => void;
}

export function HouseholdStep({ initialData, onComplete }: HouseholdStepProps) {
  const [formData, setFormData] = useState<Household>(
    initialData || {
      householdHeadAge: 45,
      hasSpouse: true,
      householdMembers: 4,
      separableChildren: 0,
      elderlyParents: false,
      currentResidenceId: '',
      rentalBusinessRegistered: false,
      businessRegistrationDate: undefined
    }
  );

  const [saved, setSaved] = useState(false);

  // 자동 저장
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('household_data', JSON.stringify(formData));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const updateField = <K extends keyof Household>(key: K, value: Household[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 저장 표시 */}
      {saved && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right z-50">
          <Save className="w-4 h-4" />
          자동 저장됨
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* 세대 구성 */}
        <Card className="shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Users className="w-5 h-5" />
              세대 구성
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="householdHeadAge">세대주 연령</Label>
                <InfoTooltip {...tooltipData.householdHeadAge} />
              </div>
              <div className="relative">
                <Input
                  id="householdHeadAge"
                  type="number"
                  value={formData.householdHeadAge}
                  onChange={(e) => updateField('householdHeadAge', parseInt(e.target.value))}
                  min={0}
                  max={120}
                  className="text-lg pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">세</span>
              </div>
              {formData.householdHeadAge >= 60 && (
                <p className="text-xs text-green-700 bg-green-50 p-2 rounded animate-in fade-in">
                  ✓ 고령자 우대: 1주택 비과세 거주기간 요건 완화 가능
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center">
                  <Label htmlFor="hasSpouse">배우자 유무</Label>
                  <InfoTooltip {...tooltipData.hasSpouse} />
                </div>
                <p className="text-xs text-gray-500 mt-1">배우자가 있는 경우 체크</p>
              </div>
              <Switch
                id="hasSpouse"
                checked={formData.hasSpouse}
                onCheckedChange={(checked) => updateField('hasSpouse', checked)}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="householdMembers">세대원 수</Label>
                <InfoTooltip {...tooltipData.householdMembers} />
              </div>
              <Input
                id="householdMembers"
                type="number"
                value={formData.householdMembers}
                onChange={(e) => updateField('householdMembers', parseInt(e.target.value))}
                min={1}
                max={20}
                className="text-lg"
              />
              <p className="text-xs text-gray-500">세대주 본인 포함 전체 구성원</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="separableChildren">분리 가능 자녀 수</Label>
                <InfoTooltip {...tooltipData.separableChildren} />
              </div>
              <Input
                id="separableChildren"
                type="number"
                value={formData.separableChildren}
                onChange={(e) => updateField('separableChildren', parseInt(e.target.value))}
                min={0}
                max={10}
                className="text-lg"
              />
              <p className="text-xs text-gray-500">30세 이상 또는 소득 있는 자녀</p>
              {formData.separableChildren > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800 animate-in fade-in">
                  <p className="font-semibold mb-1">💡 세대분리 전략 활용 가능</p>
                  <p>자녀와 세대를 분리하면 각각 1세대 1주택 비과세 혜택을 받을 수 있습니다.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center">
                  <Label htmlFor="elderlyParents">동거봉양 부모</Label>
                  <InfoTooltip {...tooltipData.elderlyParents} />
                </div>
                <p className="text-xs text-gray-500 mt-1">60세 이상 부모 동거 여부</p>
              </div>
              <Switch
                id="elderlyParents"
                checked={formData.elderlyParents}
                onCheckedChange={(checked) => updateField('elderlyParents', checked)}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
            {formData.elderlyParents && (
              <div className="bg-green-50 border border-green-200 rounded p-3 text-xs text-green-800 animate-in slide-in-from-top">
                <p className="font-semibold mb-1">✓ 동거봉양 합가 특례 적용 가능</p>
                <p>합가로 인한 주택은 10년간 주택 수에서 제외됩니다.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 임대사업자 정보 */}
        <Card className="shadow-lg border-2 border-purple-100 hover:border-purple-300 transition-all">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Building className="w-5 h-5" />
              임대사업자 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center">
                  <Label htmlFor="rentalBusinessRegistered">사업자 등록 여부</Label>
                  <InfoTooltip {...tooltipData.rentalBusinessRegistered} />
                </div>
                <p className="text-xs text-gray-500 mt-1">세무서 주택임대사업자 등록</p>
              </div>
              <Switch
                id="rentalBusinessRegistered"
                checked={formData.rentalBusinessRegistered}
                onCheckedChange={(checked) => updateField('rentalBusinessRegistered', checked)}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>

            {formData.rentalBusinessRegistered && (
              <div className="space-y-4 animate-in slide-in-from-top">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="businessRegistrationDate">사업자 등록일</Label>
                    <InfoTooltip {...tooltipData.businessRegistrationDate} />
                  </div>
                  <Input
                    id="businessRegistrationDate"
                    type="date"
                    value={
                      formData.businessRegistrationDate
                        ? formData.businessRegistrationDate.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      updateField('businessRegistrationDate', new Date(e.target.value))
                    }
                    className="text-lg"
                  />
                </div>

                <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-lg p-4">
                  <h4 className="text-sm text-purple-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <span className="font-semibold">임대사업자 핵심 혜택</span>
                  </h4>
                  <ul className="text-xs text-purple-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span><strong>10년 장기:</strong> 장특공제 70%, 거주주택 비과세</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span><strong>6년 단기:</strong> 중과배제, 종부세 합산배제</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span><strong>취득세:</strong> 60㎡↓ 최대 100% 감면</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">⚠️</span>
                      <span>의무기간 준수 + 5% 임대료 제한 필수</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {!formData.rentalBusinessRegistered && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-sm text-amber-900 mb-2">💡 임대사업자 등록 검토</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  다주택자의 경우 임대사업자 등록으로 수천만원의 세금을 절감할 수 있습니다. 
                  단, 의무기간 준수 등 요건을 반드시 확인하세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          size="lg" 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all px-8"
        >
          다음 단계: 보유 주택 입력
          <span className="ml-2">→</span>
        </Button>
      </div>
    </form>
  );
}
