# 하네스 엔지니어링 기술서 — 챕터 구조

## 서지 정보

- 제목: 하네스 엔지니어링: AI 에이전트 오케스트레이션의 설계와 구현
- 대상 독자: AI 엔지니어, 에이전트 시스템 개발자, 기술 리더
- Beta 데드라인: 2026-04-30
- 근거: Anthropic 공개 PDF + Claude Agent SDK + 독립 구현 프로젝트
- 법적 제약: 유출 코드 참조 불가. 공개 문서(PDF, Agent SDK, CLAUDE.md/AGENTS.md 사양)만 인용

---

## Part I: 이론 — 하네스 설계의 원리

### Chapter 1: 하네스란 무엇인가

- 에이전트 런타임 vs 하네스 응용 — 계층 분리 모델
- 단일 에이전트의 한계: 과소 범위 설정, 자기평가 편향, context anxiety
- 하네스가 해결하는 3가지 문제
  - 범위 확장 (Planner)
  - 품질 보증 (Evaluator)
  - 자율 반복 (Orchestrator)
- PDF 사례 연구: DAW 앱 — Solo($9) vs 하네스($124.70)

### Chapter 2: 3-에이전트 아키텍처

- Planner → Generator → Evaluator 데이터 흐름
- 각 에이전트의 역할과 경계
  - Planner: 1문장 → 16기능 스펙 확장
  - Generator: 스펙 → 실행 가능한 앱
  - Evaluator: 독립 평가 + 피드백 생성
- GAN에서 영감받은 피드백 루프
  - Generator-Discriminator 비유의 한계
  - 적대적이 아닌 협력적 반복
- 비용 구조 분석
  - Planner 0.4%, Generator 91.3%, Evaluator 8.3%
  - 오케스트레이션 오버헤드가 미미한 이유

### Chapter 3: 자기평가 편향과 Clean-Room 격리

- PDF 발견: "Claude is a poor QA agent"
- 자기합리화 패턴 분류
  - "코드를 읽어본 바로는 정확해 보인다"
  - "사소한 문제이므로 통과시키겠다"
  - "전반적으로 좋은 품질이다"
- Clean-room 해법: Evaluator 입력의 엄격한 제한
  - 수신하는 것: 스펙, 계약, 코드, 실행 중인 앱
  - 수신하지 않는 것: Generator 의도, 디버깅 로그, 설계 결정
- Anti-rationalization 프롬프트 설계
- Few-shot 캘리브레이션

### Chapter 4: Context Anxiety와 라운드 간 정보 전달

- Context anxiety 현상: 에이전트가 컨텍스트 한계에서 조기 종료
- Compaction vs Context Reset의 차이
  - Compaction: 요약하여 축소 (정보 손실)
  - Reset: clean slate + 구조화된 handoff (정보 선택적 전달)
- Structured handoff file 설계
  - 점수, 수정 항목, 보존 항목, 전략적 방향
  - 고정 스키마의 중요성 (JSON or Markdown 금지)
- Refine vs Pivot 결정 로직

### Chapter 5: V1→V2 진화에서 배우는 설계 원칙

- 원칙 1: 모델 능력 가정의 정기 재검증
  - 스프린트 구조의 등장과 퇴장 (Sonnet 4.5 → Opus 4.6)
  - Feature flag 기반 구성요소 제거 가능성
- 원칙 2: Evaluator 가치의 경계 비례
  - 작업 복잡도와 Evaluator 비용의 관계
- 원칙 3: 체계적 단순화 (ablation study)
  - 한 번에 하나만 제거하고 성능 변화 측정
  - "급진적 단순화 → 점진적 단순화" 실패에서의 교훈
- 원칙 4: 하네스 조합 공간의 이동
  - 모델 능력이 향상해도 하네스의 가치는 사라지지 않는다
  - 조합 가능한 구성요소 집합의 유지

---

## Part II: 실전 — Agent SDK 하네스 구현

### Chapter 6: 프로젝트 설계

- Agent SDK 선택 이유와 대안 비교
- Monolith CLI 아키텍처 결정
  - 프로젝트 구조: bin/, src/agents/, src/prompts/, src/schemas/
  - 코드 구성요소 (3 TS 파일) vs 프롬프트 구성요소 (4 텍스트 파일)
- 의존성: @anthropic-ai/sdk, zod, yaml
- CLI 인터페이스: `npx harness-eng "Build a DAW"` 
- 설정 계층: 환경변수 → CLI 인자 → .harness.yaml → 기본값

### Chapter 7: 스키마 설계 — 에이전트 간 계약

- 왜 고정 스키마인가 (Codex outside voice의 교훈)
  - "JSON or Markdown is not a design"
  - 비정형 출력이 멀티라운드 루프를 파괴하는 메커니즘
- Zod 스키마 4종
  - ProductSpec: Planner 출력
  - Evaluation: Evaluator 출력
  - Handoff: 라운드 간 전달
  - AcceptanceContract: 완료 기준
- 스키마 검증 실패 시 복구 전략
- 스키마 진화와 버전 관리

### Chapter 8: Planner 에이전트 구현

- 시스템 프롬프트 설계
  - 야심적 범위 vs 실현 가능한 범위의 균형
  - 제품 맥락 집중, 기술 상세 회피
- 디자인 스킬 참조 메커니즘
  - Anti-slop 패턴 삽입
  - 시각 디자인 언어 생성
- AI 기능 직조 (AI Weaving)
  - Tool-using agent 설계 지시
  - Fallback behavior 명시
- 스택 프리셋 통합
- 비용: ~$0.50/실행

### Chapter 9: Generator 에이전트 구현

- 시스템 프롬프트 설계
  - 스펙 완전 구현 원칙
  - Anti-slop 패턴 적용
- Handoff 수신 시 행동 분기
  - REFINE: 대상 수정, 보존 항목 유지
  - PIVOT: 미학적 접근 전체 재설계
- 허용 도구 설계 (읽기+쓰기)
- 비용 패턴: Round 1 ~$71 → Round 3 ~$6 (수렴)

### Chapter 10: Evaluator 에이전트 구현

- Clean-room 격리 구현
  - buildCleanRoomPrompt(): 입력 필터링
  - Generator 컨텍스트 완전 차단
- Anti-rationalization 프롬프트
- 평가 기준 4축
  - Design Quality, Originality, Craft, Functionality
  - Hard threshold 기반 PASS/FAIL
- Playwright MCP 통합 (선택적)
  - 능동적 페이지 탐색
  - Graceful degradation: Playwright 없으면 기능 테스트만
- 전략적 방향 결정: REFINE vs PIVOT

### Chapter 11: 오케스트레이터와 비용 제어

- GAN 루프 구현
  - Plan → Build → Evaluate → Handoff → Rebuild
  - 종료 조건 3가지: PASS, plateau, budget
- Plateau detection 알고리즘
  - 연속 2라운드 점수 비교
  - Threshold 설정 전략
- CostTracker 설계
  - Per-phase reservation (planning 2%, building 85%, evaluation 10%, reserve 3%)
  - 80% 경고, 100% 중단
  - Reserve: 현재 라운드 evaluation 완료 보장
- cost-report.json 출력
- 에러 복구 전략
  - Planner 실패: 1회 재시도 → 사용자 확인
  - Generator 실패: checkpoint 복구
  - Evaluator 실패: PARTIAL 간주
  - Rate limit: exponential backoff

### Chapter 12: 테스트 전략

- 테스트 피라미드: unit → transcript fixtures → mock E2E
- Unit tests: 순수 함수 (isPlateauing, estimateCost, 스키마 검증)
- Transcript fixtures: agent() 호출의 입출력을 고정 기록하고 replay
  - 왜 conventional mock보다 나은가
  - Fixture 생성 워크플로
- Mock E2E: 전체 루프를 mock agent로 검증
  - 3-round 시나리오: FAIL → PARTIAL → PASS
  - Budget exceeded 시나리오
  - Plateau detection 시나리오
- 테스트가 검증하지 못하는 것
  - 실제 모델 출력 품질
  - 프롬프트 효과
  - 비결정적 에이전트 행동

---

## Part III: 응용 — 하네스 활용과 진화

### Chapter 13: 벤치마크와 평가

- 하네스 성능 측정 방법
  - Solo vs 하네스 A/B 비교
  - 비용 대비 품질 곡선
- ablation study 실행
  - 구성요소별 제거 후 성능 변화
  - "이 구성요소가 보완하는 모델 한계는 무엇인가?"
- 벤치마크 앱 선정 기준
  - 프론트엔드 복잡도 변화
  - AI 통합 유무
  - 기능 수 변화

### Chapter 14: 모델 진화와 하네스 적응

- 모델 능력 향상이 하네스에 미치는 영향
  - 스프린트 구조 제거 사례 (Opus 4.6)
  - 다음에 불필요해질 구성요소는?
- Feature flag 기반 적응 전략
- 하네스 조합 공간의 탐색
  - 새 모델 출시 시 재검증 체크리스트
  - 구성요소 추가/제거 의사결정 프레임워크

### Chapter 15: 너머의 하네스

- 풀스택 앱 생성 너머의 적용 분야
  - 문서 생성 하네스
  - 코드 리뷰 하네스
  - 데이터 파이프라인 하네스
- 멀티 하네스 조합
- 하네스 엔지니어의 역할 정의
  - 프롬프트 엔지니어와의 차이
  - 시스템 설계 + 프롬프트 설계 + 평가 설계

---

## 부록

### Appendix A: 완성 프로젝트 코드 참조
- harness-project/ 전체 코드 구조
- 각 파일의 역할 요약

### Appendix B: 프롬프트 전문
- planner-system.md
- generator-system.md
- evaluator-system.md
- design-skill.md
- ai-weaving.md

### Appendix C: 스키마 레퍼런스
- spec.schema.ts
- evaluation.schema.ts
- handoff.schema.ts
- contract.schema.ts

### Appendix D: PDF 원문 핵심 인용 모음
- 원칙별 원문 인용 + 한국어 해설
- 비용 데이터 원문

### Appendix E: Eng Review + Codex Outside Voice 결정사항
- 11개 아키텍처 결정 요약
- Cross-model tension 분석
