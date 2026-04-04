# Chapter 7: 스키마 설계 — 에이전트 간 계약

## 7.1 고정 스키마의 필요성

에이전트 간 데이터 교환에서 가장 흔한 실수는 "JSON이면 충분하다"는 가정이다. JSON은 직렬화 형식이지 계약(contract)이 아니다. "JSON으로 출력하라"는 지시는 구조를 보장하지 않는다.

비정형 출력이 다중 라운드 루프를 파괴하는 메커니즘은 세 단계로 진행된다.

**1단계: 구조 편차.** Evaluator에게 "JSON으로 피드백을 작성하라"고 지시하면, Round 1에서는 `{score: 7, issues: [...]}` 형식을, Round 2에서는 `{rating: "good", problems: [...]}` 형식을 생성할 수 있다. 키 이름, 중첩 구조, 값 표현이 라운드마다 다르다.

**2단계: 파싱 실패.** Generator가 Round 1의 구조를 기대하고 `handoff.scores.design_quality`에 접근하면, Round 2의 출력에서는 해당 경로가 존재하지 않는다. 프로그래밍 방식의 처리가 불가능해진다.

**3단계: 침묵적 오해.** 파싱 실패가 하드 에러가 아닌 경우(예: 선택적 필드로 처리), Generator가 잘못된 데이터를 기반으로 수정을 수행한다. 이 오류는 다음 라운드까지 전파되어야 발견된다.

고정 스키마는 이 3단계를 1단계에서 차단한다. Zod 스키마 검증이 구조 편차를 즉시 거부하므로, 잘못된 데이터가 파이프라인에 진입하지 못한다.

## 7.2 Zod 스키마 4종

하네스에서 사용하는 스키마는 4종이다. 각 스키마가 특정 에이전트 간 접점의 계약으로 기능한다.

```
Planner ──[ProductSpec]──► Orchestrator
Orchestrator ──[AcceptanceContract]──► Evaluator
Evaluator ──[Evaluation]──► Orchestrator
Orchestrator ──[Handoff]──► Generator
```

### 7.2.1 ProductSpec: Planner의 출력

ProductSpec은 Planner가 생성하는 제품 스펙의 구조를 정의한다. 전체 실행 동안 불변이며, Generator와 Evaluator 모두에게 참조 문서로 제공된다.

```typescript
// src/schemas/spec.schema.ts

const featureSchema = z.object({
  name: z.string(),
  description: z.string(),
  acceptance_criteria: z.array(z.string()),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
})

const designLanguageSchema = z.object({
  color_palette: z.array(z.string()),
  typography: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  layout_principles: z.array(z.string()),
  anti_patterns: z.array(z.string()),
})

const techArchitectureSchema = z.object({
  frontend: z.object({
    framework: z.string(),
    bundler: z.string(),
    styling: z.string(),
  }),
  backend: z.object({
    framework: z.string(),
    language: z.string(),
  }),
  database: z.object({
    engine: z.string(),
    orm: z.string(),
  }),
})

const aiIntegrationSchema = z.object({
  feature_name: z.string(),
  capability: z.string(),
  tools: z.array(z.string()),
  app_apis: z.array(z.string()),
  fallback_behavior: z.string(),
})

const productSpecSchema = z.object({
  overview: z.string(),
  features: z.array(featureSchema).min(1),
  design_language: designLanguageSchema,
  tech_architecture: techArchitectureSchema,
  ai_integrations: z.array(aiIntegrationSchema),
  acceptance_criteria: z.array(z.string()),
})
```

설계 결정의 근거:

- **features.min(1)**: 빈 기능 목록은 스펙으로서 무의미하다. 최소 1개 기능을 강제한다.
- **priority enum**: 문자열이 아닌 열거형으로 제한하여, Generator가 우선순위를 프로그래밍 방식으로 해석할 수 있도록 한다.
- **anti_patterns 배열**: 디자인 스킬(Chapter 8)에서 정의한 AI slop 패턴을 스펙 수준에서 명시한다.
- **fallback_behavior**: AI 통합이 실패할 때의 대체 동작을 강제한다. "AI가 없으면 동작하지 않는 앱"을 방지한다.

### 7.2.2 Evaluation: Evaluator의 출력

Evaluation은 Evaluator가 각 라운드에서 생성하는 평가 결과의 구조를 정의한다. Orchestrator가 이 출력을 기반으로 루프 종료, 계속, Handoff 생성을 결정한다.

```typescript
// src/schemas/evaluation.schema.ts

const findingSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'high', 'medium']),
  category: z.enum(['design', 'functionality', 'performance', 'accessibility']),
  description: z.string(),
  location: z.string(),
  evidence: z.string(),
})

const evaluationSchema = z.object({
  round: z.number().int().positive(),
  verdict: z.enum(['PASS', 'FAIL', 'PARTIAL']),
  scores: z.object({
    design_quality: z.number().min(1).max(10),
    originality: z.number().min(1).max(10),
    craft: z.number().min(1).max(10),
    functionality: z.number().min(1).max(10),
  }),
  threshold_failures: z.array(z.string()),
  findings: z.array(findingSchema),
  strategic_direction: z.enum(['REFINE', 'PIVOT']),
  direction_rationale: z.string(),
})
```

설계 결정의 근거:

- **scores.min(1).max(10)**: 점수 범위를 강제한다. 0점이나 11점이 생성되면 스키마 검증에서 거부된다.
- **verdict enum**: 3가지 값만 허용한다. PASS(합격), FAIL(불합격), PARTIAL(부분 합격). "MOSTLY_PASS"나 "CONDITIONAL" 같은 모호한 verdict를 차단한다.
- **threshold_failures**: 어떤 축이 임계값 미달인지를 명시한다. Orchestrator가 특정 축의 개선 추이를 추적할 수 있다.
- **findings.evidence**: 발견 사항의 근거를 강제한다. "디자인이 좋지 않다"는 판단만으로는 부족하고, 구체적 증거(스크린샷 참조, 명령 실행 결과)를 요구한다.

### 7.2.3 Handoff: 라운드 간 전달

Handoff는 Evaluation을 기반으로 Orchestrator가 생성하여 Generator에 전달하는 구조화된 피드백이다. Chapter 4에서 설계 원칙을 다루었으므로, 여기서는 스키마 구현의 세부를 다룬다.

```typescript
// src/schemas/handoff.schema.ts

const handoffSchema = z.object({
  round: z.number().int().positive(),
  verdict: z.enum(['PASS', 'FAIL', 'PARTIAL']),
  scores: z.object({
    design_quality: z.number().min(1).max(10),
    originality: z.number().min(1).max(10),
    craft: z.number().min(1).max(10),
    functionality: z.number().min(1).max(10),
  }),
  thresholds_met: z.boolean(),
  must_fix: z.array(z.object({
    id: z.string(),
    description: z.string(),
    severity: z.enum(['critical', 'high', 'medium']),
  })),
  preserve: z.array(z.object({
    id: z.string(),
    description: z.string(),
  })),
  strategic_direction: z.enum(['REFINE', 'PIVOT']),
  direction_rationale: z.string(),
  cost_so_far: z.object({
    total_usd: z.number(),
    rounds_remaining: z.number().int(),
    budget_remaining_usd: z.number(),
  }),
})
```

Evaluation과 Handoff의 관계에 주목해야 한다. 두 스키마는 유사하지만 동일하지 않다. Handoff에는 Evaluation에 없는 필드가 있다:

- **thresholds_met**: 모든 임계값 충족 여부를 불리언으로 요약한다.
- **must_fix / preserve**: Evaluation의 findings를 Generator 행동으로 변환한 것이다.
- **cost_so_far**: CostTracker에서 추출한 비용 현황이다.

반대로 Evaluation에는 Handoff에 없는 필드가 있다:

- **threshold_failures**: 어떤 축이 미달인지의 상세 목록이다.
- **findings**: 위치, 증거를 포함한 상세 발견 사항이다.

이 차이는 의도적이다. Evaluation은 Orchestrator의 판단 자료이고, Handoff는 Generator의 행동 지시다. 같은 정보라도 소비자에 따라 다른 형식이 필요하다.

### 7.2.4 AcceptanceContract: 완료 기준

AcceptanceContract는 ProductSpec에서 파생되는 완료 기준 목록이다. Planner가 생성하는 것이 아니라 Orchestrator가 스펙 기반으로 자동 생성한다.

```typescript
// src/schemas/contract.schema.ts

const criterionSchema = z.object({
  id: z.string(),
  description: z.string(),
  testable: z.boolean(),
  test_command: z.string().optional(),
  category: z.enum(['functionality', 'design', 'performance', 'accessibility']),
})

const acceptanceContractSchema = z.object({
  generated_from_spec: z.string(),
  criteria: z.array(criterionSchema).min(1),
  generated_at: z.string().datetime(),
})
```

설계 결정의 근거:

- **generated_from_spec**: 어떤 스펙에서 파생되었는지를 기록한다. 스펙이 변경되면 계약을 재생성해야 함을 추적할 수 있다.
- **testable + test_command**: 기준이 자동 테스트 가능한지를 명시한다. `testable: true`이면 `test_command`에 실행 명령이 포함된다 (예: `npm test`, `curl http://localhost:3000/api/health`).
- **generated_at**: ISO 8601 형식의 생성 시점. 계약의 시간적 유효성을 추적한다.

PDF V2에서 스프린트 계약이 제거된 맥락과의 관계: 스프린트 계약은 스프린트 단위의 세부 완료 기준이었다. AcceptanceContract는 빌드 전체에 대한 완료 기준이다. 스프린트 구조가 제거되었으므로, 빌드 수준의 단일 계약이 적절하다.

## 7.3 스키마 검증 실패 시 복구 전략

에이전트의 출력이 스키마를 만족하지 않을 수 있다. 이 실패에 대한 복구 전략은 에이전트별로 다르다.

### 7.3.1 Planner 출력 검증 실패

Planner의 ProductSpec 출력이 스키마를 만족하지 않으면, 1회 재시도를 수행한다. 재시도 시 이전 시도의 오류 메시지를 포함하여 Planner에게 구체적 수정을 요청한다.

```
SchemaValidationError('planner', [
  'features: Array must contain at least 1 element(s)',
  'design_language.color_palette: Required'
])
```

이 오류 메시지를 Planner에게 전달하면, 모델은 높은 확률로 누락된 필드를 보완한다. 재시도에서도 실패하면 사용자에게 오류를 보고하고 종료한다.

### 7.3.2 Evaluator 출력 검증 실패

Evaluator의 Evaluation 출력이 스키마를 만족하지 않으면, PARTIAL verdict로 간주한다. 스키마 검증 실패 자체가 Evaluator의 문제이므로, 그 라운드의 평가를 불완전한 것으로 처리하고 다음 라운드에서 재평가한다.

이 전략의 근거: Evaluator 실패로 전체 루프를 중단하면, Generator가 이미 소비한 비용($30-70)이 낭비된다. PARTIAL 처리로 다음 라운드에서 재평가하는 것이 비용 효율적이다.

### 7.3.3 Handoff 생성 실패

Handoff는 Orchestrator가 Evaluation에서 파생 생성하므로, 스키마 검증 실패는 Orchestrator의 버그를 의미한다. 이 경우 하드 에러로 처리한다.

## 7.4 스키마 진화와 버전 관리

하네스가 버전을 갱신하면 스키마가 변경될 수 있다. 스키마 변경 시 고려해야 할 호환성 문제:

**하위 호환 변경 (안전):**
- 선택적 필드 추가 (`.optional()`)
- 열거형 값 추가 (기존 값은 유지)
- 문자열 필드의 패턴 완화

**비하위 호환 변경 (위험):**
- 필수 필드 추가
- 필드 제거
- 필드 타입 변경
- 열거형 값 제거

비하위 호환 변경은 저장된 fixture 파일(tests/fixtures/)과의 호환성을 파괴하므로, fixture 갱신이 수반되어야 한다. 실행 중인 하네스의 중간 산출물(handoff.json, evaluation.json)도 영향을 받으므로, 스키마 변경 후에는 새 실행을 처음부터 수행해야 한다.

현재 구현에서는 명시적 버전 번호를 스키마에 포함하지 않는다. 프로젝트의 package.json 버전이 암묵적 스키마 버전으로 기능한다. 스키마 변경 빈도가 높아지면 명시적 버전 필드의 도입을 검토해야 한다.

## 7.5 Zod 선택의 근거

TypeScript의 런타임 스키마 검증 라이브러리는 여러 선택지가 있다: Zod, Yup, io-ts, Joi 등. Zod를 선택한 근거:

1. **TypeScript 타입 추론.** `z.infer<typeof schema>`로 스키마에서 TypeScript 타입을 자동 생성한다. 스키마와 타입의 일관성이 컴파일 타임에 보장된다.
2. **간결한 API.** Zod의 체이닝 API(`z.string().min(1).max(100)`)가 스키마를 자기 문서화(self-documenting)한다.
3. **상세한 오류 메시지.** `safeParse()`의 실패 시 `error.issues` 배열이 경로, 메시지, 기대값을 포함하여, 에이전트에게 재시도 지시를 자동 구성할 수 있다.
4. **제로 의존성.** Zod 자체가 외부 의존성이 없으므로, 의존성 트리가 단순하다.

---

다음 장에서는 Planner 에이전트의 시스템 프롬프트 설계와 구현을 다룬다.
