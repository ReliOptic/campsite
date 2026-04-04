export const colors = {
  text: {
    primary: '#e8d4b0',
    secondary: '#6b6b7b',
  },
  accent: {
    warm: '#ffaa44',
    cool: '#44aacc',
  },
  card: {
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.06)',
  },
  card_active: {
    bg: 'rgba(255,170,68,0.12)',
    border: 'rgba(255,170,68,0.3)',
  },
  button: {
    warm: {
      bg: 'rgba(255,170,68,0.15)',
      border: 'rgba(255,170,68,0.3)',
    },
    cool: {
      bg: 'rgba(68,170,204,0.15)',
      border: 'rgba(68,170,204,0.3)',
    },
  },
  bg: {
    deep: '#0a0a2e',
  },
  glow: {
    warm: 'rgba(255,170,68,0.2)',
    bossOrb: 'radial-gradient(circle, rgba(255,170,68,0.3), rgba(10,10,46,0.8))',
    loading: 'radial-gradient(circle, #ffaa44, #1a0f3a)',
  },
} as const;
