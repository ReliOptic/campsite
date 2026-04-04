# Chapter 6: 프로젝트 설계

## 6.1 Agent SDK 선택 이유

하네스 구현의 런타임 선택지는 세 가지가 있었다.

| 선택지 | 장점 | 단점 |
|--------|------|------|
| Claude Agent SDK (TypeScript) | 공식 SDK, agent() 원시 지원, 도구 조합 자연스러움 | SDK API 미확정 구간 존재 |
| LangChain / LangGraph | 성숙한 생태계, 다중 모델 지원 | 추상화 과다, 하네스 특화 부적합 |
| 직접 구현 (HTTP API) | 완전한 제어 | 도구 관리, 대화 관리 직접 구현 필요 |

Agent SDK를 선택한 근거는 세 가지다.

첫째, **agent() 원시 함수의 존재**. Agent SDK의 agent() 함수는 시스템 프롬프트, 사용자 프롬프트, 허용 도구를 지정하여 에이전트를 1회 호출하는 원시(primitive)다. 하네스의 각 에이전트(Planner, Generator, Evaluator)는 정확히 이 원시에 대응한다. LangChain에서는 이 단순한 호출을 위해 Chain, Agent, Tool의 3중 추상화를 통과해야 한다.

둘째, **도구 조합의 자연스러움**. Agent SDK는 파일 읽기, 파일 쓰기, 셸 실행, 웹 검색 등의 도구를 내장하며, agent() 호출 시 허용 도구를 배열로 지정한다. 에이전트별로 다른 도구 집합을 부여하는 것이 설정 한 줄로 가능하다.

셋째, **기술서의 실전 예제로서의 적합성**. 이 책의 독자가 Claude 기반 에이전트 시스템을 구축할 때 가장 자연스러운 도구가 Agent SDK이므로, SDK를 직접 사용하는 구현이 교육적 가치가 높다.

## 6.2 Monolith CLI 아키텍처

프로젝트 구조 결정에서 두 가지 선택지가 있었다.

**마이크로서비스**: 각 에이전트를 독립 프로세스로 분리하고 메시지 큐(Redis, RabbitMQ)로 통신.
**모놀리스 CLI**: 단일 Node.js 프로세스에서 모든 에이전트를 순차 호출.

모놀리스 CLI를 선택한 근거:

1. 에이전트 간 통신이 순차적이다. Planner → Generator → Evaluator는 파이프라인이지 병렬 실행이 아니다. 메시지 큐의 비동기 이점이 없다.
2. 상태 관리가 단순하다. CostTracker, 라운드 이력, 현재 스펙 등의 상태를 단일 프로세스 메모리에 유지할 수 있다.
3. 배포가 단순하다. `npx harness-eng "Build a DAW"`로 즉시 실행 가능하다.
4. 디버깅이 단순하다. 단일 프로세스의 스택 트레이스로 문제를 추적할 수 있다.

## 6.3 프로젝트 구조

```
harness-project/
├── package.json                    # 패키지 정의, CLI 엔트리
├── tsconfig.json                   # TypeScript 엄격 모드
├── .harness.yaml.example           # 설정 파일 예시
│
├── bin/
│   └── harness.ts                  # CLI 파서, 설정 로딩
│
├── src/
│   ├── orchestrator.ts             # GAN 루프 제어기
│   ├── cost-tracker.ts             # 예산 추적/제한
│   │
│   ├── agents/                     # 에이전트 모듈
│   │   ├── planner.ts
│   │   ├── generator.ts
│   │   └── evaluator.ts
│   │
│   ├── prompts/                    # 프롬프트 텍스트 파일
│   │   ├── planner-system.md
│   │   ├── generator-system.md
│   │   ├── evaluator-system.md
│   │   ├── design-skill.md
│   │   └── ai-weaving.md
│   │
│   ├── schemas/                    # Zod 스키마 정의
│   │   ├── spec.schema.ts
│   │   ├── handoff.schema.ts
│   │   ├── evaluation.schema.ts
│   │   └── contract.schema.ts
│   │
│   ├── presets/                    # 기술 스택 프리셋
│   │   └── full-stack-web.yaml
│   │
│   └── types/                      # 공유 타입
│       └── harness.types.ts
│
├── tests/
│   ├── unit/                       # 단위 테스트
│   │   ├── orchestrator.test.ts
│   │   ├── cost-tracker.test.ts
│   │   └── evaluator.test.ts
│   │
│   ├── fixtures/                   # 테스트 픽스처
│   │   ├── transcripts/
│   │   └── handoffs/
│   │
│   └── e2e/                        # 통합 테스트
│       └── loop.test.ts
│
└── docs/                           # 문서
    ├── book-chapter-outline.md
    └── chapters/
```

### 6.3.1 코드 구성요소와 프롬프트 구성요소의 분리

이 프로젝트의 구성요소는 두 범주로 분류된다.

**코드 구성요소** (7개 TypeScript 파일):
- `orchestrator.ts`: GAN 루프 제어, 라운드 관리, 수렴 판단
- `cost-tracker.ts`: 토큰/비용 추적, 예산 제한, 리포트 생성
- `agents/planner.ts`: Agent SDK 호출, 스펙 스키마 검증
- `agents/generator.ts`: Agent SDK 호출, handoff 파싱
- `agents/evaluator.ts`: Agent SDK 호출, 평가 스키마 검증
- `schemas/*.ts`: Zod 스키마 4종
- `types/harness.types.ts`: 공유 인터페이스, 에러 클래스

**프롬프트 구성요소** (5개 텍스트 파일):
- `planner-system.md`: Planner 시스템 프롬프트
- `generator-system.md`: Generator 시스템 프롬프트
- `evaluator-system.md`: Evaluator 시스템 프롬프트
- `design-skill.md`: 디자인 원칙 참조
- `ai-weaving.md`: AI 기능 직조 지시문

이 분리가 중요한 이유는 두 범주의 변경 빈도와 변경 주체가 다르기 때문이다. 코드 구성요소는 아키텍처 변경 시에만 수정되며, TypeScript 컴파일러로 검증된다. 프롬프트 구성요소는 산출물 품질 조정 시 빈번하게 수정되며, 실행 결과로만 검증된다. 두 범주를 디렉토리 수준에서 분리함으로써, 프롬프트 수정이 코드 변경 없이 가능하다.

## 6.4 의존성

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.82.0",
    "yaml": "^2.4.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^25.5.2",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

의존성을 최소화한 이유:

- **@anthropic-ai/sdk**: Agent SDK. 에이전트 호출의 유일한 런타임 의존성.
- **yaml**: `.harness.yaml` 설정 파일 파싱. JSON보다 가독성이 높고, 주석을 지원한다.
- **zod**: 런타임 스키마 검증. 에이전트 출력의 구조적 정합성을 보장한다.

3개의 런타임 의존성만 사용한다. 프레임워크(Express, Fastify)가 없다. 상태 관리 라이브러리가 없다. 로깅 라이브러리가 없다(console.log + JSON 직렬화로 충분). 이 최소주의는 의도적이다. 하네스의 복잡도는 에이전트 조합과 프롬프트 설계에 있지, 인프라 코드에 있지 않다.

## 6.5 CLI 인터페이스

실행 형식:

```bash
npx harness-eng "Build a DAW application" --budget 150 --max-rounds 3
```

### 6.5.1 CLI 인자

| 인자 | 기본값 | 설명 |
|------|--------|------|
| (positional) | 없음 (필수) | 사용자 프롬프트 |
| `--preset` | `full-stack-web` | 스택 프리셋 |
| `--budget` | `150` | 예산 상한 (USD) |
| `--max-rounds` | `3` | 최대 반복 횟수 |
| `--output` | `./artifacts` | 산출물 디렉토리 |

### 6.5.2 설정 계층

설정은 4계층의 우선순위로 결정된다:

```
환경변수 (최우선)
  → CLI 인자
    → .harness.yaml
      → 기본값 (최하위)
```

환경변수가 최우선인 이유는 CI/CD 환경에서의 유연성이다. `.harness.yaml`이 리포지토리에 커밋되어 있어도, 환경변수로 특정 실행의 설정을 오버라이드할 수 있다.

지원하는 환경변수:
- `ANTHROPIC_API_KEY`: API 키 (필수)
- `HARNESS_BUDGET_USD`: 예산 오버라이드
- `HARNESS_MAX_ROUNDS`: 최대 라운드 오버라이드

### 6.5.3 .harness.yaml 설정 파일

```yaml
preset: full-stack-web
budget_usd: 150
max_rounds: 3

evaluation:
  design_quality_threshold: 7
  originality_threshold: 6
  craft_threshold: 6
  functionality_threshold: 8
  plateau_threshold: 0.5
```

설정 파일에서 평가 임계값을 조정할 수 있다. 프로젝트의 특성에 따라 임계값을 높이거나 낮출 수 있다. 예를 들어 디자인 품질이 중요한 소비자 앱에서는 `design_quality_threshold`를 8로 높이고, 내부 도구에서는 6으로 낮출 수 있다.

## 6.6 실행 흐름 요약

`npx harness-eng "Build a DAW"` 실행 시의 전체 흐름:

1. `bin/harness.ts`가 CLI 인자를 파싱하고, `.harness.yaml`을 로드하고, 환경변수를 확인한다.
2. 설정 계층에 따라 `HarnessConfig` 객체를 구성한다.
3. `ANTHROPIC_API_KEY` 존재를 검증한다.
4. `runHarness(config)`를 호출한다.
5. Orchestrator가 Plan → Contract → Build-QA Loop → Report 순서로 실행한다.
6. 결과를 출력한다: 기능 수, 라운드 수, 최종 verdict, 총비용.

```
[harness-eng] Starting with budget $150, max 3 rounds
[harness-eng] Prompt: "Build a DAW application"
[harness-eng] Preset: full-stack-web

... (실행 로그) ...

[harness-eng] Complete.
  Features: 16
  Rounds: 3
  Final verdict: PASS
  Total cost: $124.70
```

---

다음 장에서는 에이전트 간 계약으로 기능하는 4가지 Zod 스키마의 설계를 다룬다.
