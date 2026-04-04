# Go-Push — Cinematic Self-Discovery Execution Game

## Design Doc
Design reference: `~/.gstack/projects/ReliOptic-campsite/reliqbit_mac-main-design-20260404-180205.md`

## Stack
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind + Framer Motion + Zustand
- 3D Layer: React Three Fiber (@react-three/fiber) + Drei (@react-three/drei) — native React 컴포넌트
- Backend: LangGraph (Python) + FastAPI
- Database: Supabase PostgreSQL (memory shards + LangGraph PostgresSaver)
- Deployment: Vercel (frontend) + Railway (backend)

## 3D / R3F Context

### Directory Convention
- 3D Scenes: src/components/scenes/{SceneName}.tsx
- 3D Models: src/components/models/
- Shaders: src/shaders/
- R3F Helpers: src/utils/three/

### R3F Rules
- 모든 3D 컴포넌트는 <Canvas> 내부에서만 렌더링
- Zustand store로 상태 직접 공유 (브릿지 불필요)
- useFrame() 내에서 setState 금지 — ref로 직접 조작
- 무거운 geometry는 useMemo로 캐싱
- 로우폴리 아이소메트릭 스타일 유지 (Monument Valley 미학)
- OrbitControls 사용 시 enableZoom={false} 기본값

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
