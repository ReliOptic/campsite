import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { InfoTooltip } from '../ui/info-tooltip';
import { AddressSearch } from '../ui/address-search';
import { RealEstateSearch } from '../ui/real-estate-search';
import type { Property, Household, PropertyType, AcquisitionType } from '../../types';
import { tooltipData } from '../../lib/tooltipData';
import { Sparkles } from 'lucide-react';

interface PropertyFormProps {
  property: Property | null;
  household: Household | null;
  onSave: (property: Property) => void;
  onCancel: () => void;
}

export function PropertyForm({ property, household, onSave, onCancel }: PropertyFormProps) {
  const [formData, setFormData] = useState<Property>(
    property || {
      id: `prop-${Date.now()}`,
      nickname: '',
      address: '',
      propertyType: 'APARTMENT',
      exclusiveArea: 85,
      landArea: undefined,
      isRegulatedAreaAtAcq: false,
      isRegulatedAreaNow: false,
      acquisitionDate: new Date(),
      acquisitionPrice: 500000000,
      acquisitionType: 'PURCHASE',
      acquisitionTax: 10000000,
      necessaryExpenses: 5000000,
      inheritedHoldingPeriod: undefined,
      estimatedMarketPrice: 700000000,
      officialPrice: 650000000,
      standardPrice: 620000000,
      isCurrentResidence: false,
      residencePeriods: [],
      totalResidenceMonths: 0,
      rental: {
        isRegistered: false
      },
      coexistence: {
        isCoexistenceRental: false
      },
      specialConditions: {
        isMarriageMergeProperty: false,
        isElderlyCareMerge: false,
        isInheritedProperty: false,
        isRuralProperty: false,
        isDepopulationArea: false,
        isUnsoldNewProperty: false,
        isSmallNewProperty: false
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const propertyTypeLabels: Record<PropertyType, string> = {
    APARTMENT: '아파트',
    VILLA: '빌라/연립',
    MULTI_FAMILY: '다세대',
    OFFICETEL: '오피스텔',
    DETACHED: '단독주택',
    MULTI_HOUSE: '다가구주택'
  };

  const acquisitionTypeLabels: Record<AcquisitionType, string> = {
    PURCHASE: '매매',
    INHERITANCE: '상속',
    GIFT: '증여',
    NEW_BUILD: '신축',
    PRE_SALE: '분양'
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-xl border-2 border-indigo-100">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="text-indigo-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {property ? '주택 정보 수정' : '새 주택 추가'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">기본정보</TabsTrigger>
              <TabsTrigger value="acquisition">취득정보</TabsTrigger>
              <TabsTrigger value="rental">임대정보</TabsTrigger>
              <TabsTrigger value="special">특수상황</TabsTrigger>
            </TabsList>

            {/* 기본정보 탭 */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">주택 별칭 *</Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="예: 분당 아파트, 강남 오피스텔"
                    required
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="propertyType">주택 유형 *</Label>
                    <InfoTooltip {...tooltipData.propertyType} />
                  </div>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value: PropertyType) =>
                      setFormData({ ...formData, propertyType: value })
                    }
                  >
                    <SelectTrigger className="text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(propertyTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">주소 *</Label>
                  <AddressSearch
                    value={formData.address}
                    onChange={(address) => setFormData({ ...formData, address })}
                    placeholder="주소 검색 버튼을 눌러주세요"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="exclusiveArea">전용면적 (㎡) *</Label>
                    <InfoTooltip {...tooltipData.exclusiveArea} />
                  </div>
                  <div className="relative">
                    <Input
                      id="exclusiveArea"
                      type="number"
                      value={formData.exclusiveArea}
                      onChange={(e) =>
                        setFormData({ ...formData, exclusiveArea: parseFloat(e.target.value) })
                      }
                      step="0.01"
                      required
                      className="text-lg pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">㎡</span>
                  </div>
                  {formData.exclusiveArea <= 60 && (
                    <p className="text-xs text-green-700 bg-green-50 p-2 rounded">
                      ✓ 소형주택: 임대사업자 취득세 감면 혜택 대상
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="estimatedMarketPrice">예상 시세 (원) *</Label>
                  </div>
                  <Input
                    id="estimatedMarketPrice"
                    type="number"
                    value={formData.estimatedMarketPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedMarketPrice: parseFloat(e.target.value)
                      })
                    }
                    required
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="officialPrice">공시가격 (원) *</Label>
                    <InfoTooltip {...tooltipData.officialPrice} />
                  </div>
                  <Input
                    id="officialPrice"
                    type="number"
                    value={formData.officialPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, officialPrice: parseFloat(e.target.value) })
                    }
                    required
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="standardPrice">기준시가 (원)</Label>
                  <Input
                    id="standardPrice"
                    type="number"
                    value={formData.standardPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, standardPrice: parseFloat(e.target.value) })
                    }
                    className="text-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow">
                <div>
                  <Label>현재 실거주 여부</Label>
                  <p className="text-xs text-gray-500">이 주택에 현재 거주 중인가요?</p>
                </div>
                <Switch
                  checked={formData.isCurrentResidence}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isCurrentResidence: checked })
                  }
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center">
                      <Label>취득 당시 조정지역</Label>
                      <InfoTooltip {...tooltipData.isRegulatedAreaAtAcq} />
                    </div>
                    <p className="text-xs text-gray-500">취득 시점 조정대상지역</p>
                  </div>
                  <Switch
                    checked={formData.isRegulatedAreaAtAcq}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isRegulatedAreaAtAcq: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center">
                      <Label>현재 조정지역</Label>
                      <InfoTooltip {...tooltipData.isRegulatedAreaNow} />
                    </div>
                    <p className="text-xs text-gray-500">현재 조정대상지역 여부</p>
                  </div>
                  <Switch
                    checked={formData.isRegulatedAreaNow}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isRegulatedAreaNow: checked })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* 취득정보 탭 */}
            <TabsContent value="acquisition" className="space-y-4">
              {formData.address && (
                <div className="mb-4">
                  <RealEstateSearch
                    address={formData.address}
                    onSelect={(transaction) => {
                      setFormData({
                        ...formData,
                        acquisitionDate: new Date(transaction.transactionDate),
                        acquisitionPrice: transaction.price,
                        exclusiveArea: transaction.area
                      });
                    }}
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="acquisitionDate">취득일 *</Label>
                    <InfoTooltip {...tooltipData.acquisitionDate} />
                  </div>
                  <Input
                    id="acquisitionDate"
                    type="date"
                    value={formData.acquisitionDate.toISOString().split('T')[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, acquisitionDate: new Date(e.target.value) })
                    }
                    required
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acquisitionType">취득 유형 *</Label>
                  <Select
                    value={formData.acquisitionType}
                    onValueChange={(value: AcquisitionType) =>
                      setFormData({ ...formData, acquisitionType: value })
                    }
                  >
                    <SelectTrigger className="text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(acquisitionTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="acquisitionPrice">취득가액 (원) *</Label>
                    <InfoTooltip {...tooltipData.acquisitionPrice} />
                  </div>
                  <Input
                    id="acquisitionPrice"
                    type="number"
                    value={formData.acquisitionPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, acquisitionPrice: parseFloat(e.target.value) })
                    }
                    required
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acquisitionTax">취득세 및 부대비용 (원)</Label>
                  <Input
                    id="acquisitionTax"
                    type="number"
                    value={formData.acquisitionTax}
                    onChange={(e) =>
                      setFormData({ ...formData, acquisitionTax: parseFloat(e.target.value) })
                    }
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="necessaryExpenses">필요경비 (원)</Label>
                    <InfoTooltip {...tooltipData.necessaryExpenses} />
                  </div>
                  <Input
                    id="necessaryExpenses"
                    type="number"
                    value={formData.necessaryExpenses}
                    onChange={(e) =>
                      setFormData({ ...formData, necessaryExpenses: parseFloat(e.target.value) })
                    }
                    className="text-lg"
                  />
                  <p className="text-xs text-gray-500">중개수수료, 인테리어 등</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="totalResidenceMonths">총 거주기간 (개월)</Label>
                    <InfoTooltip {...tooltipData.totalResidenceMonths} />
                  </div>
                  <Input
                    id="totalResidenceMonths"
                    type="number"
                    value={formData.totalResidenceMonths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalResidenceMonths: parseInt(e.target.value)
                      })
                    }
                    className="text-lg"
                  />
                </div>
              </div>

              {formData.totalResidenceMonths >= 24 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in">
                  <p className="text-sm text-green-800">
                    ✓ 2년 이상 거주: 1주택 비과세 거주요건 충족
                  </p>
                </div>
              )}
            </TabsContent>

            {/* 임대정보 탭 */}
            <TabsContent value="rental" className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-shadow">
                <div>
                  <Label>지자체 임대등록 여부</Label>
                  <p className="text-xs text-gray-500">민간임대주택 등록 상태</p>
                </div>
                <Switch
                  checked={formData.rental?.isRegistered || false}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      rental: { ...formData.rental, isRegistered: checked }
                    })
                  }
                />
              </div>

              {formData.rental?.isRegistered && (
                <div className="space-y-4 animate-in slide-in-from-top">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label>임대 유형</Label>
                        <InfoTooltip {...tooltipData.rentalType} />
                      </div>
                      <Select
                        value={formData.rental.rentalType || 'LONG_10Y'}
                        onValueChange={(value: any) =>
                          setFormData({
                            ...formData,
                            rental: { ...formData.rental!, rentalType: value }
                          })
                        }
                      >
                        <SelectTrigger className="text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LONG_10Y">10년 장기민간임대</SelectItem>
                          <SelectItem value="PUBLIC_SUPPORT_10Y">10년 공공지원</SelectItem>
                          <SelectItem value="SHORT_6Y">6년 단기민간임대</SelectItem>
                          <SelectItem value="OLD_SHORT_4Y">4년 단기(구)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>건설/매입 구분</Label>
                      <Select
                        value={formData.rental.constructionOrPurchase || 'PURCHASE'}
                        onValueChange={(value: any) =>
                          setFormData({
                            ...formData,
                            rental: { ...formData.rental!, constructionOrPurchase: value }
                          })
                        }
                      >
                        <SelectTrigger className="text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSTRUCTION">건설형</SelectItem>
                          <SelectItem value="PURCHASE">매입형</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>임대등록일</Label>
                      <Input
                        type="date"
                        value={
                          formData.rental.registrationDate
                            ? formData.rental.registrationDate.toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rental: {
                              ...formData.rental!,
                              registrationDate: new Date(e.target.value)
                            }
                          })
                        }
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>임대개시일</Label>
                      <Input
                        type="date"
                        value={
                          formData.rental.rentalStartDate
                            ? formData.rental.rentalStartDate.toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rental: {
                              ...formData.rental!,
                              rentalStartDate: new Date(e.target.value)
                            }
                          })
                        }
                        className="text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center">
                        <Label>5% 임대료 제한 준수</Label>
                        <InfoTooltip {...tooltipData.rentCompliance} />
                      </div>
                      <p className="text-xs text-gray-500">직전 대비 5% 이내 증액</p>
                    </div>
                    <Switch
                      checked={formData.rental.rentCompliance || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          rental: { ...formData.rental!, rentCompliance: checked }
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 특수상황 탭 */}
            <TabsContent value="special" className="space-y-3">
              {[
                {
                  key: 'isMarriageMergeProperty',
                  label: '혼인합가 주택',
                  desc: '5년→10년 특례',
                  tooltip: tooltipData.isMarriageMergeProperty
                },
                {
                  key: 'isElderlyCareMerge',
                  label: '동거봉양 합가',
                  desc: '10년 주택수 제외',
                  tooltip: tooltipData.elderlyParents
                },
                {
                  key: 'isInheritedProperty',
                  label: '상속주택',
                  desc: '5년 주택수 제외',
                  tooltip: tooltipData.isInheritedProperty
                },
                {
                  key: 'isRuralProperty',
                  label: '농어촌주택',
                  desc: '주택수 제외',
                  tooltip: tooltipData.isRuralProperty
                },
                {
                  key: 'isDepopulationArea',
                  label: '인구감소지역',
                  desc: '공시가 4억↓'
                },
                {
                  key: 'isUnsoldNewProperty',
                  label: '비수도권 미분양',
                  desc: '주택수 제외'
                },
                {
                  key: 'isSmallNewProperty',
                  label: '신축소형주택',
                  desc: '60㎡↓, 6/3억↓'
                }
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center">
                      <Label>{item.label}</Label>
                      {item.tooltip && <InfoTooltip {...item.tooltip} />}
                    </div>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Switch
                    checked={
                      formData.specialConditions[
                        item.key as keyof typeof formData.specialConditions
                      ]
                    }
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        specialConditions: {
                          ...formData.specialConditions,
                          [item.key]: checked
                        }
                      })
                    }
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button type="button" onClick={onCancel} variant="outline" size="lg">
          취소
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          size="lg"
        >
          {property ? '수정 완료' : '주택 추가'}
        </Button>
      </div>
    </form>
  );
}
