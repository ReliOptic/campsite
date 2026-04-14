export interface TreeTheme {
  id: string;
  name: string;
  emoji: string;
  foliage: string[];
  trunk: string[];
  finder: string;
  qrDark: string;
  qrLight: string;
  canopyDensity: number;  // 0..1
  canopyShape: 'round' | 'cone' | 'spread';
}

export const THEMES: TreeTheme[] = [
  {
    id: 'sakura',
    name: 'Sakura',
    emoji: '\u{1F338}',
    foliage: ['#F2A6C2', '#E87BA4', '#D45B8E', '#F4C2D7', '#C94A7A', '#F7D1E1'],
    trunk: ['#6B4423', '#8B5E34', '#5C3A1E'],
    finder: '#2A9D2A',
    qrDark: '#3D3D3D',
    qrLight: '#F5F0E8',
    canopyDensity: 0.55,
    canopyShape: 'round',
  },
  {
    id: 'pine',
    name: 'Pine',
    emoji: '\u{1F332}',
    foliage: ['#2D5A27', '#3B7A33', '#1E4D1A', '#4A8B42', '#2E6B28', '#569E4E'],
    trunk: ['#5C3A1E', '#4A2E16', '#6B4423'],
    finder: '#1A6B1A',
    qrDark: '#2C2C2C',
    qrLight: '#F0F0E8',
    canopyDensity: 0.7,
    canopyShape: 'cone',
  },
  {
    id: 'maple',
    name: 'Maple',
    emoji: '\u{1F341}',
    foliage: ['#D4421E', '#E8652A', '#C23616', '#F09040', '#B83012', '#E87840'],
    trunk: ['#5C3A1E', '#7A4E2E', '#4A2E16'],
    finder: '#D4421E',
    qrDark: '#3D3D3D',
    qrLight: '#FFF8F0',
    canopyDensity: 0.5,
    canopyShape: 'round',
  },
  {
    id: 'wisteria',
    name: 'Wisteria',
    emoji: '\u{1FAB7}',
    foliage: ['#9B72CF', '#B48AE0', '#7B52BF', '#C9A8F0', '#6A42A8', '#D4B8F5'],
    trunk: ['#5C4A3E', '#7A6252', '#4A3A2E'],
    finder: '#7B52BF',
    qrDark: '#2E2E3E',
    qrLight: '#F5F0FA',
    canopyDensity: 0.6,
    canopyShape: 'spread',
  },
];

export function getThemeById(id: string): TreeTheme {
  return THEMES.find(t => t.id === id) || THEMES[0];
}
