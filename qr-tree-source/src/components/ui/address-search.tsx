import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Search, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

interface AddressSearchProps {
  value: string;
  onChange: (address: string, zonecode?: string) => void;
  placeholder?: string;
}

export function AddressSearch({ value, onChange, placeholder }: AddressSearchProps) {
  const [open, setOpen] = useState(false);

  const handleAddressSearch = () => {
    // Daum 우편번호 API 사용
    if (typeof window !== 'undefined' && (window as any).daum) {
      new (window as any).daum.Postcode({
        oncomplete: function (data: any) {
          // 도로명 주소 또는 지번 주소 선택
          const fullAddress = data.roadAddress || data.jibunAddress;
          const zonecode = data.zonecode;
          
          // 상세정보 조합
          let extraAddress = '';
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          
          const finalAddress = fullAddress + (extraAddress ? ` (${extraAddress})` : '');
          onChange(finalAddress, zonecode);
          setOpen(false);
        }
      }).open();
    } else {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '주소를 검색하세요'}
          readOnly
          className="pr-10 cursor-pointer"
          onClick={handleAddressSearch}
        />
        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
      <Button
        type="button"
        onClick={handleAddressSearch}
        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
      >
        <Search className="w-4 h-4" />
        주소검색
      </Button>
    </div>
  );
}
