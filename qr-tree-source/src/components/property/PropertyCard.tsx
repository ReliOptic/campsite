import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Property } from '../../types';
import { Edit, Trash2, Home, Calendar, Coins } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onEdit: () => void;
  onDelete: () => void;
}

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: '아파트',
  VILLA: '빌라',
  MULTI_FAMILY: '다세대',
  OFFICETEL: '오피스텔',
  DETACHED: '단독',
  MULTI_HOUSE: '다가구'
};

function formatCurrency(amount: number): string {
  const eok = Math.floor(amount / 100000000);
  const man = Math.floor((amount % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  if (man > 0) return `${man.toLocaleString()}만원`;
  return `${amount.toLocaleString()}원`;
}

function getHoldingPeriod(acquisitionDate: Date): string {
  const now = new Date();
  const months = Math.floor(
    (now.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0) return `${years}년 ${remainingMonths}개월`;
  return `${months}개월`;
}

export function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Home className="w-4 h-4 text-blue-600" />
                <h3 className="text-blue-900">{property.nickname}</h3>
              </div>
              <p className="text-sm text-gray-600">{property.address}</p>
            </div>
            <Badge variant={property.isCurrentResidence ? 'default' : 'secondary'}>
              {property.isCurrentResidence ? '거주중' : '보유'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-500 text-xs">유형</div>
              <div className="text-gray-900">{propertyTypeLabels[property.propertyType]}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-500 text-xs">면적</div>
              <div className="text-gray-900">{property.exclusiveArea}㎡</div>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                취득
              </span>
              <span className="text-gray-900">
                {property.acquisitionDate.toLocaleDateString('ko-KR')} (
                {getHoldingPeriod(property.acquisitionDate)})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                취득가
              </span>
              <span className="text-gray-900">{formatCurrency(property.acquisitionPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                현재시세
              </span>
              <span className="text-blue-900">
                {formatCurrency(property.estimatedMarketPrice)}
              </span>
            </div>
          </div>

          {property.rental?.isRegistered && (
            <div className="bg-purple-50 border border-purple-200 p-2 rounded">
              <div className="text-xs text-purple-900">
                🏠 임대등록: {property.rental.rentalType === 'LONG_10Y' ? '10년 장기' : '기타'}
              </div>
            </div>
          )}

          {property.isRegulatedAreaNow && (
            <Badge variant="destructive" className="text-xs">
              조정대상지역
            </Badge>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={onEdit} variant="outline" size="sm" className="flex-1">
              <Edit className="w-3 h-3 mr-1" />
              수정
            </Button>
            <Button onClick={onDelete} variant="outline" size="sm" className="text-red-600">
              <Trash2 className="w-3 h-3 mr-1" />
              삭제
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
