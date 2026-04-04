export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  },
  app: {
    name: 'Go-Push',
    description: 'Cinematic Self-Discovery Execution Game',
  },
  onboarding: {
    microActionDurationSec: 30,
  },
  animation: {
    breatheDuration: 3,
    floatDuration: 8,
    pulseDuration: 4,
    transitionMs: 300,
  },
} as const;
