import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQRMatrix } from './useQRMatrix';
import { generateVoxels } from './voxelGeometry';
import { IsometricCanvas } from './IsometricCanvas';
import { renderAnimated } from './renderVoxels';
import { useGifRecorder } from './useGifRecorder';
import { THEMES, getThemeById } from './themes';
import type { Voxel } from './voxelGeometry';

type ViewMode = 'preview' | 'scan';

export function App() {
  const [url, setUrl] = useState('https://example.com');
  const [mode, setMode] = useState<ViewMode>('preview');
  const [themeId, setThemeId] = useState('sakura');
  const [refreshKey, setRefreshKey] = useState(0);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const theme = getThemeById(themeId);
  const matrix = useQRMatrix(url, 250);

  const voxels = useMemo(() => {
    if (!matrix) return [];
    void refreshKey;
    return generateVoxels(matrix, theme);
  }, [matrix, refreshKey, theme]);

  useEffect(() => {
    const resize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // GIF recorder
  const sortedForGif = useRef<Voxel[]>([]);
  useEffect(() => {
    sortedForGif.current = [...voxels].sort((a, b) => {
      const da = a.x + a.y, db = b.x + b.y;
      return da !== db ? da - db : a.z - b.z;
    });
  }, [voxels]);
  const qrSizeRef = useRef(matrix?.size ?? 25);
  if (matrix) qrSizeRef.current = matrix.size;

  const drawGifFrame = useCallback(
    (_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, colorBlend: number, tilt: number, grow: number) => {
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;
      renderAnimated(ctx, sortedForGif.current, qrSizeRef.current, w, h, colorBlend, tilt, grow, '#FAFAFA');
    },
    [],
  );

  const { phase: recPhase, encodingProgress, record } = useGifRecorder(drawGifFrame, {
    width: 540, height: 540, quality: 10, fps: 10,
  });
  const recording = recPhase !== 'idle' && recPhase !== 'done';

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), []);
  const toggleMode = useCallback(() => setMode(m => (m === 'preview' ? 'scan' : 'preview')), []);

  return (
    <div style={{
      width: '100vw', height: '100dvh',
      background: '#FAFAFA',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Centered canvas */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {matrix ? (
          <IsometricCanvas
            voxels={voxels}
            qrSize={matrix.size}
            mode={mode}
            width={size.w}
            height={size.h}
          />
        ) : (
          <div style={{ color: '#aaa', textAlign: 'center', fontSize: 15 }}>
            Enter a URL to grow your tree
          </div>
        )}
      </div>

      {/* Top-right floating controls */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        display: 'flex', gap: 8, alignItems: 'center', zIndex: 10,
      }}>
        <button onClick={handleRefresh} style={{
          width: 40, height: 40, borderRadius: 20, border: 'none',
          background: 'rgba(0,0,0,0.06)',
          color: '#555', cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          ↻
        </button>
        <button onClick={toggleMode} style={{
          height: 40, borderRadius: 20, border: 'none',
          padding: '0 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          background: mode === 'scan' ? 'rgba(34,197,94,0.9)' : 'rgba(99,102,241,0.9)',
          color: '#fff',
        }}>
          {mode === 'scan' ? 'Scan' : '3D'}
        </button>
      </div>

      {/* Bottom panel */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, right: 16,
        zIndex: 10,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 20, padding: '14px 16px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.04)',
        }}>
          {/* Theme selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {THEMES.map(t => {
              const active = themeId === t.id;
              return (
                <button key={t.id} onClick={() => setThemeId(t.id)} style={{
                  height: 38, borderRadius: 19, border: 'none', padding: '0 14px',
                  fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: active ? 'rgba(0,0,0,0.08)' : 'transparent',
                  color: '#444', fontWeight: active ? 600 : 400, transition: 'background 0.2s',
                }}>
                  <span style={{ fontSize: 18 }}>{t.emoji}</span>
                  <span style={{
                    fontSize: 12, maxWidth: active ? 60 : 0,
                    overflow: 'hidden', transition: 'max-width 0.3s', whiteSpace: 'nowrap',
                  }}>{t.name}</span>
                </button>
              );
            })}
          </div>

          {/* URL input + GIF */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false}
              style={{
                flex: 1, height: 44, borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(0,0,0,0.03)',
                color: '#222', padding: '0 14px', fontSize: 16,
                outline: 'none',
              }}
            />
            <button
              onClick={() => !recording && record()}
              disabled={recording || !matrix}
              style={{
                width: 48, height: 44, borderRadius: 12, border: 'none',
                fontSize: 12, fontWeight: 700,
                cursor: recording ? 'default' : 'pointer',
                background: recPhase === 'done' ? '#22c55e' : recording ? '#999' : '#ef4444',
                color: '#fff', opacity: !matrix ? 0.4 : 1, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.3s',
              }}
            >
              {recPhase === 'idle' ? 'GIF' : recPhase === 'encoding' ? `${Math.round(encodingProgress * 100)}%` : recPhase === 'done' ? '✓' : 'Rec'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
