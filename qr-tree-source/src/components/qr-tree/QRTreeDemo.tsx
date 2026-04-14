import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQRMatrix } from './useQRMatrix';
import { generateVoxels } from './voxelGeometry';
import { IsometricCanvas } from './IsometricCanvas';
import { renderAnimated } from './renderVoxels';
import { useGifRecorder } from './useGifRecorder';
import { THEMES, getThemeById } from './themes';
import type { Voxel } from './voxelGeometry';

type ViewMode = 'preview' | 'scan';

const S = (obj: Record<string, string | number | undefined>): React.CSSProperties =>
  obj as React.CSSProperties;

export function QRTreeDemo() {
  const [url, setUrl] = useState('https://enzo.fyi');
  const [mode, setMode] = useState<ViewMode>('preview');
  const [themeId, setThemeId] = useState('sakura');
  const [refreshKey, setRefreshKey] = useState(0);
  const [size, setSize] = useState({ w: 390, h: 844 });

  const theme = getThemeById(themeId);
  const matrix = useQRMatrix(url, 250);

  const voxels = useMemo(() => {
    if (!matrix) return [];
    void refreshKey;
    return generateVoxels(matrix, theme);
  }, [matrix, refreshKey, theme]);

  useEffect(() => {
    const resize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    resize();
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
    (_c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, colorBlend: number, tilt: number, grow: number) => {
      const w = ctx.canvas.width, h = ctx.canvas.height;
      renderAnimated(ctx, sortedForGif.current, qrSizeRef.current, w, h, colorBlend, tilt, grow, '#FAFAFA');
    }, [],
  );

  const { phase: recPhase, encodingProgress, record } = useGifRecorder(drawGifFrame, {
    width: 540, height: 540, flatSeconds: 1.5, transitionSeconds: 3, holdSeconds: 2, fps: 15,
  });
  const recording = recPhase !== 'idle';

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), []);
  const toggleMode = useCallback(() => setMode(m => (m === 'preview' ? 'scan' : 'preview')), []);

  return (
    <div style={S({
      width: '100vw', height: '100dvh',
      background: '#FAFAFA',
      position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      WebkitTapHighlightColor: 'transparent',
    })}>

      {/* Full-bleed canvas */}
      <div style={S({
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      })}>
        {matrix ? (
          <IsometricCanvas
            voxels={voxels}
            qrSize={matrix.size}
            mode={mode}
            width={size.w}
            height={size.h}
          />
        ) : (
          <div style={S({ color: '#aaa', textAlign: 'center', fontSize: 15 })}>
            Enter a URL to grow your tree
          </div>
        )}
      </div>

      {/* Top-right floating controls */}
      <div style={S({
        position: 'absolute', top: 0, right: 0,
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
        display: 'flex', gap: 8, alignItems: 'center', zIndex: 10,
      })}>
        <button onClick={handleRefresh} style={S({
          width: 36, height: 36, borderRadius: 18, border: 'none',
          background: 'rgba(0,0,0,0.06)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: '#555', cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        })}>
          &#x21bb;
        </button>
        <button onClick={toggleMode} style={S({
          height: 36, borderRadius: 18, border: 'none',
          padding: '0 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          background: mode === 'scan' ? 'rgba(34,197,94,0.9)' : 'rgba(99,102,241,0.9)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: '#fff',
        })}>
          {mode === 'scan' ? 'Scan' : '3D'}
        </button>
      </div>

      {/* Bottom panel */}
      <div style={S({
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
        zIndex: 10,
      })}>
        <div style={S({
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20, padding: '14px 16px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.04)',
        })}>
          {/* Theme selector */}
          <div style={S({ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12 })}>
            {THEMES.map(t => {
              const active = themeId === t.id;
              return (
                <button key={t.id} onClick={() => setThemeId(t.id)} style={S({
                  height: 36, borderRadius: 18, border: 'none', padding: '0 12px',
                  fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: active ? 'rgba(0,0,0,0.08)' : 'transparent',
                  color: '#444', fontWeight: active ? 600 : 400, transition: 'background 0.2s',
                })}>
                  <span style={S({ fontSize: 16 })}>{t.emoji}</span>
                  <span style={S({
                    fontSize: 11, maxWidth: active ? 60 : 0,
                    overflow: 'hidden', transition: 'max-width 0.3s', whiteSpace: 'nowrap',
                  })}>{t.name}</span>
                </button>
              );
            })}
          </div>

          {/* URL input + GIF */}
          <div style={S({ display: 'flex', gap: 8, alignItems: 'center' })}>
            <input
              type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false}
              style={S({
                flex: 1, height: 44, borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(0,0,0,0.03)',
                color: '#222', padding: '0 14px', fontSize: 16,
                outline: 'none', WebkitAppearance: 'none',
              })}
            />
            <button
              onClick={() => !recording && record()}
              disabled={recording || !matrix}
              style={S({
                width: 44, height: 44, borderRadius: 12, border: 'none',
                fontSize: 11, fontWeight: 700,
                cursor: recording ? 'default' : 'pointer',
                background: recording ? '#999' : '#ef4444',
                color: '#fff', opacity: !matrix ? 0.4 : 1, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              })}
            >
              {recPhase === 'idle' ? 'GIF' : recPhase === 'encoding' ? `${Math.round(encodingProgress * 100)}%` : 'Rec'}
            </button>
          </div>

          {recording && (
            <p style={S({
              margin: '8px 0 0', fontSize: 11, textAlign: 'center', color: '#999',
            })}>
              {recPhase === 'encoding' ? `Encoding ${Math.round(encodingProgress * 100)}%` : 'Recording...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
