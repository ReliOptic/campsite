import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export interface QRMatrix {
  modules: boolean[][];
  size: number;
}

/**
 * Generates a QR code matrix from a URL string with debouncing.
 * Returns a 2D boolean array where true = dark module.
 */
export function useQRMatrix(url: string, debounceMs = 300): QRMatrix | null {
  const [matrix, setMatrix] = useState<QRMatrix | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!url.trim()) {
      setMatrix(null);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        // Generate QR with error correction level H for max resilience
        const qr = QRCode.create(url, {
          errorCorrectionLevel: 'H',
        });
        const size = qr.modules.size;
        const data = qr.modules.data;

        const modules: boolean[][] = [];
        for (let row = 0; row < size; row++) {
          const rowArr: boolean[] = [];
          for (let col = 0; col < size; col++) {
            rowArr.push(data[row * size + col] === 1);
          }
          modules.push(rowArr);
        }

        setMatrix({ modules, size });
      } catch {
        // Invalid input - keep previous matrix
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [url, debounceMs]);

  return matrix;
}
