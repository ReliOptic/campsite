# Chapter 12: 테스트 전략

## 12.1 에이전트 시스템 테스트의 고유한 도전

에이전트 시스템의 테스트는 전통적 소프트웨어 테스트와 본질적으로 다른 도전에 직면한다.

**비결정성.** 동일 입력에 대해 에이전트의 출력이 매 실행마다 다르다. 온도(temperature) 파라미터를 0으로 설정해도, 모델의 내부 상태에 따라 미세한 차이가 발생한다. 전통적 단위 테스트의 "동일 입력 → 동일 출력" 가정이 성립하지 않는다.

**비용.** 테스트 1회 실행이 실제 API 호출을 수반하므로 비용이 발생한다. 하네스 전체 루프의 테스트 1회에 $124.70이 소요된다. CI/CD에서 매 커밋마다 이 비용을 감수할 수 없다.

**시간.** 하네스 1회 실행에 3시간 50분이 소요된다. 피드백 루프가 4시간이면 개발 속도가 수용 불가능한 수준으로 저하된다.

**출력 품질의 주관성.** "디자인 품질 7점"이 올바른 출력인지를 기계적으로 판별할 수 없다. 에이전트의 평가 품질 자체를 평가하는 메타 평가 문제에 직면한다.

이러한 도전에 대응하는 테스트 전략을 3계층으로 설계한다.

## 12.2 테스트 피라미드

```
          ╱╲
         ╱  ╲        Mock E2E (비용: 0, 시간: <1초)
        ╱    ╲       전체 루프를 mock agent로 검증
       ╱──────╲
      ╱        ╲     Transcript Fixtures (비용: 0, 시간: <1초)
     ╱          ╲    agent() 호출의 입출력을 고정 기록 replay
    ╱────────────╲
   ╱              ╲   Unit Tests (비용: 0, 시간: <1초)
  ╱                ╲  순수 함수 테스트
 ╱──────────────────╲
```

모든 테스트의 비용이 0이고 시간이 1초 미만이다. 실제 API를 호출하는 테스트는 이 피라미드에 포함하지 않는다. 실제 API 테스트는 벤치마크(Chapter 13)의 영역이다.

## 12.3 Unit Tests: 순수 함수

### 12.3.1 테스트 대상

Unit test의 대상은 에이전트 호출 없이 동작하는 순수 함수다:

- `isPlateauing()`: 점수 이력에서 plateau 판단
- `estimateCost()`: 토큰 수에서 비용 추정
- `CostTracker`: 예산 추적, 경고, 초과 감지
- 스키마 검증: 유효/무효 입력에 대한 파싱 결과

### 12.3.2 isPlateauing() 테스트

```typescript
// tests/unit/orchestrator.test.ts

describe('isPlateauing', () => {
  it('returns false for empty history', () => {
    expect(isPlateauing([])).toBe(false)
  })

  it('returns false for single evaluation', () => {
    expect(isPlateauing([makeEval({ dq: 5, o: 5, c: 5, f: 5 })])).toBe(false)
  })

  it('detects plateau when scores barely change', () => {
    const history = [
      makeEval({ dq: 6, o: 6, c: 6, f: 6 }),  // avg: 6.0
      makeEval({ dq: 6, o: 6, c: 7, f: 6 }),  // avg: 6.25
    ]
    expect(isPlateauing(history, 0.5)).toBe(true)  // 0.25 < 0.5
  })

  it('returns false when significant improvement', () => {
    const history = [
      makeEval({ dq: 5, o: 5, c: 5, f: 5 }),  // avg: 5.0
      makeEval({ dq: 7, o: 7, c: 7, f: 7 }),  // avg: 7.0
    ]
    expect(isPlateauing(history, 0.5)).toBe(false)  // 2.0 >= 0.5
  })

  it('detects plateau on declining scores', () => {
    const history = [
      makeEval({ dq: 7, o: 7, c: 7, f: 7 }),  // avg: 7.0
      makeEval({ dq: 6, o: 6, c: 6, f: 6 }),  // avg: 6.0
    ]
    expect(isPlateauing(history, 0.5)).toBe(true)  // -1.0 < 0.5
  })

  it('only considers last two evaluations', () => {
    const history = [
      makeEval({ dq: 3, o: 3, c: 3, f: 3 }),  // 무시됨
      makeEval({ dq: 5, o: 5, c: 5, f: 5 }),  // avg: 5.0
      makeEval({ dq: 7, o: 7, c: 7, f: 7 }),  // avg: 7.0
    ]
    expect(isPlateauing(history, 0.5)).toBe(false)  // 2.0 >= 0.5
  })
})
```

이 테스트가 검증하는 것: isPlateauing()의 경계 조건(빈 이력, 단일 이력), 정상 동작(plateau 감지, 개선 감지), 부수적 행동(하락 시 plateau 감지, 마지막 2개만 사용).

### 12.3.3 CostTracker 테스트

```typescript
describe('CostTracker', () => {
  it('estimates cost correctly', () => {
    const cost = estimateCost(1_000_000, 1_000_000)
    expect(cost).toBe(15 + 75)  // $90
  })

  it('tracks budget utilization', () => {
    const tracker = new CostTracker(100, 3)
    tracker.enterPhase('building')
    tracker.recordUsage(1, 'generator', 100_000, 50_000, 1000)
    expect(tracker.getTotalUsd()).toBeGreaterThan(0)
  })

  it('throws BudgetExceededError at 100%', () => {
    const tracker = new CostTracker(1, 3)  // $1 budget
    tracker.enterPhase('building')
    expect(() => {
      tracker.recordUsage(1, 'generator', 1_000_000, 1_000_000, 1000)
    }).toThrow(BudgetExceededError)
  })
})
```

### 12.3.4 스키마 검증 테스트

```typescript
describe('evaluation schema', () => {
  it('accepts valid evaluation', () => {
    const valid = {
      round: 1,
      verdict: 'FAIL',
      scores: { design_quality: 5, originality: 6, craft: 7, functionality: 8 },
      threshold_failures: ['design_quality'],
      findings: [],
      strategic_direction: 'REFINE',
      direction_rationale: 'Scores trending up',
    }
    expect(evaluationSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects scores out of range', () => {
    const invalid = {
      round: 1,
      verdict: 'FAIL',
      scores: { design_quality: 11, originality: 0, craft: 7, functionality: 8 },
      threshold_failures: [],
      findings: [],
      strategic_direction: 'REFINE',
      direction_rationale: 'test',
    }
    expect(evaluationSchema.safeParse(invalid).success).toBe(false)
  })
})
```

## 12.4 Transcript Fixtures

### 12.4.1 개념

Transcript fixture는 agent() 호출의 입출력을 기록(record)하고, 테스트 시 재생(replay)하는 방식이다. 실제 API 호출 1회의 결과를 JSON 파일로 저장하고, 이후 테스트에서는 이 파일을 읽어 agent() 호출을 대체한다.

```
기록 단계 (1회, 비용 발생):
  agent(system, prompt, tools) → response
  → fixtures/transcripts/planner-daw.json 저장

재생 단계 (n회, 비용 0):
  test에서 planner-daw.json 로드 → response 반환
```

### 12.4.2 Conventional Mock과의 차이

| 측면 | Conventional Mock | Transcript Fixture |
|------|------------------|-------------------|
| 데이터 출처 | 개발자가 직접 작성 | 실제 API 응답을 기록 |
| 현실성 | 낮음 (이상적 응답) | 높음 (실제 모델 출력) |
| 유지 비용 | 스키마 변경 시 수동 갱신 | 재기록으로 갱신 |
| 엣지 케이스 | 개발자 상상력에 의존 | 실제 발생한 케이스만 포함 |

Conventional mock의 문제: 개발자가 "모델이 이렇게 응답할 것이다"라고 가정하여 mock을 작성하면, 실제 모델 응답의 구조, 길이, 형식과 차이가 발생할 수 있다. 특히 모델이 JSON을 생성할 때의 미묘한 형식 차이(필드 순서, 공백, 줄바꿈)가 mock에서는 반영되지 않는다.

Transcript fixture는 실제 모델 응답을 그대로 기록하므로, 이러한 현실성 문제가 없다.

### 12.4.3 Fixture 생성 워크플로

1. 환경변수 `HARNESS_RECORD=true`로 테스트를 실행한다.
2. 실제 API 호출이 수행되고, 입출력이 `tests/fixtures/transcripts/`에 JSON으로 저장된다.
3. 이후 테스트에서는 `HARNESS_RECORD`가 없으면 fixture를 재생한다.

fixture 파일 구조:

```json
{
  "agent": "planner",
  "system_prompt_hash": "a1b2c3",
  "user_prompt": "Build a DAW application",
  "response": {
    "overview": "A professional-grade digital audio workstation...",
    "features": [...],
    "design_language": {...}
  },
  "recorded_at": "2026-04-05T10:00:00Z",
  "model": "claude-opus-4-6"
}
```

### 12.4.4 Fixture 갱신 시점

Fixture를 재기록해야 하는 시점:
- 시스템 프롬프트 변경 시 (`system_prompt_hash`로 감지)
- 모델 버전 변경 시
- 스키마 변경 시
- 주기적 신선도 갱신 (월 1회 등)

## 12.5 Mock E2E

### 12.5.1 전체 루프 검증

Mock E2E 테스트는 Orchestrator의 전체 루프 논리를 mock agent로 검증한다. 각 에이전트를 deterministic mock으로 대체하고, Orchestrator의 제어 흐름이 올바른지 확인한다.

### 12.5.2 시나리오 1: FAIL → PARTIAL → PASS

```typescript
// tests/e2e/loop.test.ts

it('converges over 3 rounds', async () => {
  const mockPlanner = () => validSpec
  const mockGenerator = () => {}
  const mockEvaluator = (round: number) => {
    if (round === 1) return { verdict: 'FAIL', scores: { dq: 5, o: 5, c: 5, f: 5 } }
    if (round === 2) return { verdict: 'PARTIAL', scores: { dq: 7, o: 6, c: 6, f: 7 } }
    return { verdict: 'PASS', scores: { dq: 8, o: 7, c: 7, f: 9 } }
  }

  const result = await runHarnessWithMocks(config, mockPlanner, mockGenerator, mockEvaluator)

  expect(result.evaluations).toHaveLength(3)
  expect(result.evaluations[2].verdict).toBe('PASS')
})
```

이 테스트가 검증하는 것: Orchestrator가 FAIL 시 루프를 계속하고, PASS 시 루프를 종료하며, 각 라운드에서 handoff를 올바르게 생성하여 Generator에 전달하는지.

### 12.5.3 시나리오 2: Budget Exceeded

```typescript
it('stops when budget exceeded', async () => {
  const config = { ...defaultConfig, budgetUsd: 1 }  // $1 budget
  const mockGenerator = () => {
    // Simulate high cost
    tracker.recordUsage(round, 'generator', 1_000_000, 500_000, 5000)
  }

  const result = await runHarnessWithMocks(config, ...)

  expect(result.evaluations.length).toBeLessThan(config.maxRounds)
  expect(result.report.totalUsd).toBeLessThanOrEqual(config.budgetUsd)
})
```

이 테스트가 검증하는 것: 예산 초과 시 루프가 안전하게 종료되고, 총 비용이 예산을 초과하지 않으며, cost-report가 올바르게 생성되는지.

### 12.5.4 시나리오 3: Plateau Detection

```typescript
it('stops on score plateau', async () => {
  const mockEvaluator = () => ({
    verdict: 'FAIL',
    scores: { dq: 6, o: 6, c: 6, f: 6 },  // 매 라운드 동일
  })

  const result = await runHarnessWithMocks(config, ...)

  // Round 2에서 plateau 감지, Round 3 시작하지 않음
  expect(result.evaluations).toHaveLength(2)
})
```

이 테스트가 검증하는 것: 점수가 정체할 때 루프가 조기 종료되는지.

## 12.6 테스트가 검증하지 못하는 것

테스트 전략을 설계할 때, 테스트가 검증할 수 **없는** 영역을 명확히 인식하는 것이 중요하다.

### 12.6.1 실제 모델 출력 품질

Mock과 fixture는 모델의 실제 출력 품질을 검증하지 못한다. "Planner가 야심적인 스펙을 생성하는가?", "Generator가 anti-slop 패턴을 준수하는가?", "Evaluator가 자기합리화를 거부하는가?"는 실제 API 호출로만 검증 가능하다.

### 12.6.2 프롬프트 효과

프롬프트 변경이 산출물 품질에 미치는 영향은 자동화된 테스트로 측정할 수 없다. "anti-rationalization 프로토콜을 추가하면 Evaluator의 거부율이 얼마나 변하는가?"는 통제된 실험(벤치마크)의 영역이다.

### 12.6.3 비결정적 에이전트 행동

동일 입력에 대한 에이전트의 출력 변동성을 테스트로 포착할 수 없다. "10회 실행 중 9회는 올바른 스키마를 생성하지만 1회는 실패한다"는 확률적 현상은 통계적 방법(벤치마크 반복 실행)으로만 측정 가능하다.

### 12.6.4 검증 가능한 것과 불가능한 것의 경계

| 검증 가능 (테스트) | 검증 불가능 (벤치마크 필요) |
|-------------------|-------------------------|
| 스키마 파싱 정확성 | 모델 출력 품질 |
| plateau detection 논리 | 프롬프트 효과 |
| 비용 계산 정확성 | 실제 비용 예측 정확도 |
| 루프 제어 흐름 | 수렴 속도 |
| 에러 복구 동작 | 실제 에러 빈도 |
| Handoff 구조 정합성 | Handoff 내용의 유용성 |

이 경계를 인식하면, 테스트에 과도한 기대를 부여하지 않고 각 검증 방법을 적절한 영역에 적용할 수 있다. 테스트는 "코드가 의도대로 동작하는가"를 검증하고, 벤치마크는 "의도한 동작이 유효한 결과를 생성하는가"를 검증한다.

---

Part II의 구현 분석을 마친다. Part III에서는 하네스의 벤치마크, 모델 진화 대응, 응용 확장을 다룬다.
