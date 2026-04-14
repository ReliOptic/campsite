import { useState } from 'react';
import { CalculationInputs } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface InputFormProps {
  onCalculate: (inputs: CalculationInputs) => void;
}

export function InputForm({ onCalculate }: InputFormProps) {
  const [formData, setFormData] = useState({
    salePrice: '500000000',
    purchasePrice: '300000000',
    expenses: '10000000',
    taxRate: '0.42',
    appraisal1: '420000000',
    appraisal2: '430000000',
    fee1: '500000',
    fee2: '500000'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate({
      salePrice: parseFloat(formData.salePrice) || 0,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
      expenses: parseFloat(formData.expenses) || 0,
      taxRate: parseFloat(formData.taxRate) || 0,
      appraisal1: parseFloat(formData.appraisal1) || 0,
      appraisal2: parseFloat(formData.appraisal2) || 0,
      fee1: parseFloat(formData.fee1) || 0,
      fee2: parseFloat(formData.fee2) || 0
    });
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-indigo-50">
        <CardTitle className="text-indigo-900">입력 정보</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salePrice">실거래가 (원)</Label>
            <Input
              id="salePrice"
              type="number"
              value={formData.salePrice}
              onChange={(e) => handleChange('salePrice', e.target.value)}
              placeholder="500000000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasePrice">취득가 (원)</Label>
            <Input
              id="purchasePrice"
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => handleChange('purchasePrice', e.target.value)}
              placeholder="300000000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenses">필요경비 (원)</Label>
            <Input
              id="expenses"
              type="number"
              value={formData.expenses}
              onChange={(e) => handleChange('expenses', e.target.value)}
              placeholder="10000000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRate">세율 (0~1 사이 소수)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              value={formData.taxRate}
              onChange={(e) => handleChange('taxRate', e.target.value)}
              placeholder="0.42"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-indigo-900 mb-3">감정 평가</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="appraisal1">감정가 1 (원)</Label>
                <Input
                  id="appraisal1"
                  type="number"
                  value={formData.appraisal1}
                  onChange={(e) => handleChange('appraisal1', e.target.value)}
                  placeholder="420000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee1">수수료 1 (원)</Label>
                <Input
                  id="fee1"
                  type="number"
                  value={formData.fee1}
                  onChange={(e) => handleChange('fee1', e.target.value)}
                  placeholder="500000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="appraisal2">감정가 2 (원)</Label>
                <Input
                  id="appraisal2"
                  type="number"
                  value={formData.appraisal2}
                  onChange={(e) => handleChange('appraisal2', e.target.value)}
                  placeholder="430000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee2">수수료 2 (원)</Label>
                <Input
                  id="fee2"
                  type="number"
                  value={formData.fee2}
                  onChange={(e) => handleChange('fee2', e.target.value)}
                  placeholder="500000"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
            계산하기
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
