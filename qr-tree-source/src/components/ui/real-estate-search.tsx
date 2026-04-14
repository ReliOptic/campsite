import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent } from './card';
import { Search, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

interface RealEstateTransaction {
  transactionDate: string;
  price: number;
  area: number;
  floor: string;
  buildingYear: string;
}

interface RealEstateSearchProps {
  address: string;
  onSelect: (transaction: RealEstateTransaction) => void;
}

export function RealEstateSearch({ address, onSelect }: RealEstateSearchProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<RealEstateTransaction[]>([]);

  // 실제 API 연동 시 사용할 함수
  const searchTransactions = async () => {
    setLoading(true);
    
    // TODO: 실제 국토부 실거래가 API 연동
    // 현재는 Mock 데이터 사용
    setTimeout(() => {
      const mockData: RealEstateTransaction[] = [
        {
          transactionDate: '2024-11',
          price: 700000000,
          area: 84.5,
          floor: '15층',
          buildingYear: '2015'
        },
        {
          transactionDate: '2024-10',
          price: 680000000,
          area: 84.5,
          floor: '12층',
          buildingYear: '2015'
        },
        {
          transactionDate: '2024-09',
          price: 695000000,
          area: 84.5,
          floor: '18층',
          buildingYear: '2015'
        }
      ];
      setTransactions(mockData);
      setLoading(false);
    }, 1000);
  };

  const handleOpen = () => {
    setOpen(true);
    if (address) {
      searchTransactions();
    }
  };

  function formatCurrency(amount: number): string {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
    if (eok > 0) return `${eok}억원`;
    return `${amount.toLocaleString()}원`;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
          onClick={handleOpen}
          disabled={!address}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          실거래가 조회
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>국토부 실거래가 조회</DialogTitle>
          <p className="text-sm text-gray-600">{address}</p>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">실거래가 정보를 조회중입니다...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    onSelect(transaction);
                    setOpen(false);
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">
                            거래일: {transaction.transactionDate}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xl text-green-700">
                            {formatCurrency(transaction.price)}
                          </span>
                        </div>

                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>면적: {transaction.area}㎡</span>
                          <span>층: {transaction.floor}</span>
                          <span>건축년도: {transaction.buildingYear}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(transaction);
                          setOpen(false);
                        }}
                      >
                        선택
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-600">주소를 먼저 입력해주세요.</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900">
            <p className="mb-2">
              <strong>안내사항:</strong>
            </p>
            <ul className="space-y-1">
              <li>• 국토교통부 실거래가 공개시스템 데이터 기준</li>
              <li>• 최근 3개월 거래내역 표시</li>
              <li>• 실제 취득가와 다를 수 있으니 참고용으로만 활용하세요</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
