import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PropertyForm } from './PropertyForm';
import { PropertyCard } from '../property/PropertyCard';
import type { Property, Household } from '../../types';
import { Plus, Home } from 'lucide-react';

interface PropertyListStepProps {
  initialData: Property[];
  household: Household | null;
  onComplete: (properties: Property[]) => void;
  onBack: () => void;
}

export function PropertyListStep({
  initialData,
  household,
  onComplete,
  onBack
}: PropertyListStepProps) {
  const [properties, setProperties] = useState<Property[]>(initialData);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleAddProperty = (property: Property) => {
    setProperties([...properties, property]);
    setIsAddingNew(false);
  };

  const handleUpdateProperty = (property: Property) => {
    setProperties(properties.map((p) => (p.id === property.id ? property : p)));
    setEditingProperty(null);
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id));
  };

  const handleSubmit = () => {
    if (properties.length === 0) {
      alert('최소 1개 이상의 주택을 등록해주세요.');
      return;
    }
    onComplete(properties);
  };

  if (isAddingNew || editingProperty) {
    return (
      <PropertyForm
        property={editingProperty}
        household={household}
        onSave={editingProperty ? handleUpdateProperty : handleAddProperty}
        onCancel={() => {
          setIsAddingNew(false);
          setEditingProperty(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-green-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Home className="w-5 h-5" />
              보유 주택 목록 ({properties.length}개)
            </CardTitle>
            <Button
              onClick={() => setIsAddingNew(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              주택 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">등록된 주택이 없습니다</p>
              <Button
                onClick={() => setIsAddingNew(true)}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                첫 번째 주택 추가하기
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onEdit={() => setEditingProperty(property)}
                  onDelete={() => handleDeleteProperty(property.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {properties.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-amber-900 mb-2">📋 다음 단계 안내</h4>
          <p className="text-sm text-amber-800">
            보유 주택 정보를 모두 입력했다면, 양도 조건을 설정하여 최적의 양도 전략을
            분석받으세요.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          이전 단계
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={properties.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          다음 단계: 양도 조건 설정
        </Button>
      </div>
    </div>
  );
}
